// FR-TRN-01, FR-TRN-02, FR-BLV-02, FR-DOC-03: Transcript as a chapter document, with a braille download.
import { cuesToText, parseVtt } from "../blind/vtt.js";

const STYLE = `<style data-transcript>
.lh-panel{margin:0;padding:1rem;color:var(--lh-text,#1C1B18);background:var(--lh-surface,#fff);border-top:1px solid var(--lh-border,#8A8478)}
.lh-panel h2{margin:0 0 .5rem;font-size:1.125rem}
.lh-panel button,.lh-panel a{min-height:2.75rem;min-width:2.75rem;margin:.25rem .25rem 0 0;padding:.25rem .75rem;font:inherit;color:inherit;background:transparent;border:1px solid var(--lh-border,#8A8478);border-radius:8px}
.lh-panel button:focus-visible,.lh-panel a:focus-visible{outline:3px solid var(--lh-focus,#1C1B18);outline-offset:2px}
.lh-panel li[aria-current="true"] button{background:var(--lh-player-accent,#146C43);color:#fff}
.lh-panel ol,.lh-panel nav{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap}
.lh-panel h3{margin:1rem 0 .5rem;font-size:1.05rem}
.lh-panel time{font-variant-numeric:tabular-nums}
</style>`;

function clock(seconds) {
  const whole = Math.max(0, Math.floor(seconds || 0));
  return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
}

export function attachTranscript(player) {
  if (!player.shadow.querySelector("style[data-transcript]")) {
    player.shadow.append(document.createRange().createContextualFragment(STYLE));
  }
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", player.t("trn"));
  player.slots.panels.append(panel);
  let follow = true;
  let open = false;
  let chapters = [];
  const chapterUrl = player.host.getAttribute("chapters");
  if (chapterUrl) fetch(chapterUrl).then((response) => response.ok ? response.text() : "").then((text) => { chapters = parseVtt(text); if (open) render(); }).catch(() => {});

  function cues() {
    const lang = player.captions?.currentLang() || (player.host.getAttribute("lang") === "en" ? "en" : "am");
    const list = player.captions?.getCues(lang) || [];
    return list.length ? list : player.captions?.getCues(lang === "am" ? "en" : "am") || [];
  }

  function render() {
    const list = cues();
    const now = player.media.currentTime || 0;
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = player.t("trn");
    const followBtn = document.createElement("button");
    followBtn.type = "button";
    followBtn.setAttribute("aria-pressed", follow ? "true" : "false");
    followBtn.textContent = player.t("trn_follow");
    followBtn.addEventListener("click", () => {
      follow = !follow;
      followBtn.setAttribute("aria-pressed", follow ? "true" : "false");
    });
    const download = document.createElement("a");
    const file = new Blob([cuesToText(list)], { type: "text/plain" });
    download.href = URL.createObjectURL(file);
    download.download = "transcript.txt";
    download.textContent = player.t("trn_download");
    const braille = brailleLink();
    if (!list.length) {
      const empty = document.createElement("p");
      empty.textContent = player.t("trn_empty");
      panel.append(title, followBtn, download);
      if (braille) panel.append(braille);
      panel.append(empty);
      return;
    }
    const groups = group(list);
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", player.t("chapters"));
    const doc = document.createElement("div");
    groups.forEach((groupCue, index) => {
      const id = "ch-" + index;
      const jump = document.createElement("button");
      jump.type = "button";
      jump.textContent = groupCue.title;
      jump.addEventListener("click", () => doc.querySelector("#" + id)?.focus());
      nav.append(jump);
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      heading.id = id;
      heading.tabIndex = -1;
      heading.textContent = groupCue.title;
      const items = document.createElement("ol");
      for (const cue of groupCue.cues) {
        const item = document.createElement("li");
        const current = now >= cue.start && now < cue.end;
        if (current) item.setAttribute("aria-current", "true");
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.start = String(cue.start);
        button.dataset.end = String(cue.end);
        button.lang = player.captions.currentLang() || player.host.getAttribute("lang") || "am";
        const stamp = document.createElement("time");
        stamp.textContent = clock(cue.start);
        stamp.dateTime = "PT" + Math.round(cue.start) + "S";
        button.append(stamp, " ", (cue.speaker ? cue.speaker + ": " : "") + cue.text);
        if (cue.sounds?.length) button.append(" [" + cue.sounds.join(", ") + "]");
        button.addEventListener("click", () => {
          player.media.currentTime = cue.start;
          player.announce("trn");
        });
        item.append(button);
        items.append(item);
        if (current && follow && open && !panel.contains(player.shadow.activeElement)) item.scrollIntoView({ block: "nearest" });
      }
      section.append(heading, items);
      doc.append(section);
    });
    panel.append(title, followBtn, download);
    if (braille) panel.append(braille);
    panel.append(nav, doc);
  }

  function group(list) {
    if (!chapters.length) return [{ title: player.t("trn"), cues: list }];
    return chapters.map((chapter, index) => {
      const next = chapters[index + 1];
      return {
        title: chapter.text,
        cues: list.filter((cue) => cue.start >= chapter.start && (!next || cue.start < next.start))
      };
    }).filter((chapter) => chapter.cues.length);
  }

  function brailleLink() {
    const api = player.host.getAttribute("api");
    const lesson = player.host.getAttribute("lesson-id");
    if (!api || !lesson) return null;
    const link = document.createElement("a");
    link.href = api + "/lessons/" + lesson + "/document.brf";
    link.textContent = player.t("braille");
    return link;
  }

  function toggle(focus) {
    open = !open;
    panel.hidden = !open;
    player._paintAll();
    if (!open) return;
    render();
    if (focus) panel.querySelector("h2")?.focus();
  }

  player.addControl({
    id: "transcript", order: 72, toggle: true,
    pressed: () => open, labelKey: "trn", onClick: () => toggle(true)
  });
  player.registerShortcut("t", "key_t", () => toggle(true));
  function mark() {
    const now = player.media.currentTime || 0;
    for (const item of panel.querySelectorAll("li")) {
      const button = item.querySelector("button");
      const start = Number(button?.dataset.start);
      const end = Number(button?.dataset.end);
      const current = now >= start && now < end;
      if (current) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
      if (current && follow && open && !panel.contains(player.shadow.activeElement)) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }

  player.on("cue", () => { if (open) render(); });
  player.on("time", () => { if (open) mark(); });
}
