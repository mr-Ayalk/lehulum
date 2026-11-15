// FR-CAP-01, FR-CAP-03, FR-CAP-04, FR-HOH-10, FR-HOH-11, FR-CORE-11: Draw WebVTT cues ourselves.
import { layoutChip } from "./caption-place.js";
import { t } from "./i18n.js";

const ORDER = ["off", "am", "en"];
const PALETTE = ["#FFE38A", "#9BE7FF", "#C6F6D2", "#FFC7B8"];
const STYLE = `<style data-captions>
.captions{position:absolute;margin:0;padding:.5rem 1rem;border-radius:6px;text-align:center;pointer-events:none;background:var(--cap-bg,var(--lh-cap-bg,rgb(0 0 0 / .88)));color:var(--cap-color,var(--lh-cap-text,#fff));font-size:max(1.125rem,var(--cap-size,1.625rem));line-height:1.4;font-family:var(--lh-font-latin,"Atkinson Hyperlegible",system-ui,sans-serif)}
.captions[data-pos="below"]{position:static;left:auto;max-width:90%;margin:.5rem auto 0}
.captions p{margin:0}
.captions .who{font-weight:700}
.captions .low,.captions .term{text-decoration:underline dotted 2px;text-underline-offset:.3rem}
.captions[lang="am"]{font-family:var(--lh-font-ethiopic,"Noto Sans Ethiopic",sans-serif);line-height:1.7;letter-spacing:normal;text-transform:none}
[data-id="captions"]::before{content:"CC"}
</style>`;

export function parseCueText(input) {
  const src = String(input || "").replace(/\r\n/g, "\n");
  const parts = [];
  const sounds = [];
  let speaker = "";
  let low = false;
  let i = 0;
  const push = (type, text) => {
    if (!text) return;
    const prev = parts[parts.length - 1];
    if (prev && prev.type === type) prev.text += text;
    else parts.push({ type, text });
  };
  while (i < src.length) {
    if (src[i] === "<") {
      const end = src.indexOf(">", i);
      if (end < 0) { push(low ? "low" : "text", src.slice(i)); break; }
      const tag = src.slice(i + 1, end).trim();
      const voice = /^v(?:\.\S+)?(?:\s+(.+))?$/i.exec(tag);
      if (voice) speaker = speaker || (voice[1] || "").trim();
      else if (/^c\.low\b/i.test(tag)) low = true;
      else if (/^\/c\b/i.test(tag)) low = false;
      i = end + 1;
      continue;
    }
    if (src[i] === "[") {
      const end = src.indexOf("]", i);
      if (end > i) {
        const sound = src.slice(i + 1, end).trim();
        if (sound) { sounds.push(sound); push("sound", sound); }
        i = end + 1;
        continue;
      }
    }
    let next = src.length;
    for (const mark of ["<", "["]) {
      const at = src.indexOf(mark, i);
      if (at >= 0 && at < next) next = at;
    }
    push(low ? "low" : "text", src.slice(i, next));
    i = next;
  }
  return { speaker, sounds, parts };
}
function plain(parsed) {
  return parsed.parts.filter((part) => part.type !== "sound").map((part) => part.text).join("").replace(/\s+/g, " ").trim();
}
function langOf(url) { return (/\.([a-z]{2})\.vtt(?:$|\?)/i.exec(url || "") || [])[1]?.toLowerCase() || ""; }

export function attachCaptions(player) {
  if (!player.shadow.querySelector("style[data-captions]")) player.shadow.append(document.createRange().createContextualFragment(STYLE));
  const box = document.createElement("div");
  box.className = "captions";
  box.setAttribute("aria-hidden", "true");
  box.hidden = true;
  player.slots.overlay.append(box);
  const tracks = new Map();
  const speakers = new Map();
  let mode = "off";
  let pos = "bottom";
  let activeId = "";
  let stamp = 0;

  function urls() {
    return (player.host.getAttribute("captions") || "").split(",").map((item) => item.trim()).filter(Boolean);
  }
  function paint(cue) {
    box.replaceChildren();
    if (!cue || mode === "off") { box.hidden = true; return; }
    const parsed = parseCueText(cue.text);
    const line = document.createElement("p");
    if (parsed.speaker) {
      const who = document.createElement("strong");
      who.className = "who";
      if (!speakers.has(parsed.speaker)) speakers.set(parsed.speaker, speakers.size % PALETTE.length);
      who.style.color = PALETTE[speakers.get(parsed.speaker)];
      who.textContent = (/^teacher$/i.test(parsed.speaker) ? t("speaker_teacher") : parsed.speaker) + ":";
      line.append(who, " ");
    }
    const showLow = player.prefs.showUncertain !== false;
    for (const part of parsed.parts) {
      const node = document.createElement(part.type === "sound" ? "em" : "span");
      if (part.type === "low" && showLow) node.className = "low";
      node.textContent = part.text;
      line.append(node);
    }
    box.lang = mode;
    box.hidden = false;
    player.glossary?.mark?.(line);
    box.append(line);
    layoutChip(player, box);
  }
  function emitCue(cue) {
    const id = cue ? cue.id || String(cue.startTime) : "";
    if (id === activeId) return;
    activeId = id;
    player.emit("cue", { cue: cue ? pack(cue) : null, lang: mode === "off" ? "" : mode });
  }
  function pack(cue) {
    const parsed = parseCueText(cue.text);
    return { id: cue.id, start: cue.startTime, end: cue.endTime, text: plain(parsed), speaker: parsed.speaker, sounds: parsed.sounds };
  }
  function onChange() {
    const time = player.media.currentTime || 0;
    const list = mode === "off" ? null : tracks.get(mode)?.track?.cues;
    let cue = null;
    if (list) for (const item of list) if (time >= item.startTime && time < item.endTime) { cue = item; break; }
    paint(cue); emitCue(cue);
  }
  function frame() {
    const mine = ++stamp;
    onChange();
    const video = player.media;
    if (video.paused || video.ended) return;
    let saw = false;
    const again = () => { if (saw || mine !== stamp) return; saw = true; frame(); };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(again);
    requestAnimationFrame(() => again());
  }
  function apply(next, announce) {
    const usable = ORDER.filter((item) => item === "off" || tracks.has(item));
    mode = usable.includes(next) ? next : "off";
    for (const [code, track] of tracks) track.track.mode = "hidden";
    frame();
    if (mode === "off") { paint(null); emitCue(null); }
    else onChange();
    player._paintAll();
    if (!announce) return;
    if (mode === "off") player.announce("captions_off");
    else player.announce("captions_state", { lang: t(mode === "am" ? "lang_am" : "lang_en") });
  }
  function cycle() { const usable = ORDER.filter((item) => item === "off" || tracks.has(item)); apply(usable[(usable.indexOf(mode) + 1) % usable.length], true); }
  function mount() {
    for (const track of [...player.media.querySelectorAll("track[data-lh]")]) track.remove();
    tracks.clear();
    for (const url of urls()) {
      const code = langOf(url);
      if (!code || tracks.has(code)) continue;
      const track = document.createElement("track");
      track.kind = "captions";
      track.srclang = code;
      track.label = t(code === "am" ? "lang_am" : "lang_en");
      track.src = url;
      track.dataset.lh = code;
      player.media.append(track);
      track.track.mode = "hidden";
      tracks.set(code, track);
    }
    const prefer = player.host.getAttribute("lang") === "am" ? "am" : "en";
    apply(tracks.has(prefer) ? prefer : "off", false);
  }

  player.addControl({
    id: "captions", order: 45, toggle: true,
    pressed: () => mode !== "off",
    label: () => t(mode === "am" ? "captions_am" : mode === "en" ? "captions_en" : "captions_off"),
    onClick: () => cycle()
  });
  player.registerShortcut("c", "key_c", () => cycle());
  player.captions = {
    getCues(lang) {
      const track = tracks.get(lang || mode);
      if (!track || !track.track.cues) return [];
      return [...track.track.cues].map(pack);
    },
    cueAt(time, lang) {
      return this.getCues(lang).find((cue) => time >= cue.start && time < cue.end) || null;
    },
    currentLang: () => (mode === "off" ? "" : mode),
    setPosition(next) { pos = next === "below" ? "below" : "bottom"; box.dataset.force = pos === "below" ? "below" : ""; layoutChip(player, box); },
    relayout() { layoutChip(player, box); },
    refresh: () => frame(),
    reload: mount
  };
  const setSource = player.setSource.bind(player);
  player.setSource = (src, poster) => { setSource(src, poster); mount(); };
  player.media.addEventListener("play", () => frame(), true);
  player.media.addEventListener("seeked", () => onChange());
  layoutChip(player, box);
  mount();
}
