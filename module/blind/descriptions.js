// FR-BLV-08, FR-BLV-09, FR-BLV-10: Pause for a description, play voice or the screen reader, with two volumes.
import { savePrefs } from "../core/prefs.js";
import { parseVtt } from "./vtt.js";

export function attachDescriptions(player) {
  const urls = (player.host.getAttribute("describe") || "").split(",").map((item) => item.trim()).filter(Boolean);
  const mixes = urls.filter((url) => !/\.vtt$/i.test(url));
  const vttUrls = urls.filter((url) => /\.vtt$/i.test(url));
  const tracks = new Map();
  let on = player.prefs.describe !== false;
  let spoken = "";
  let busy = false;
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("aria-live", "assertive");
  player.shadow.append(live);
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let options = false;

  function langOf(url) { return (/\.([a-z]{2})\.vtt/i.exec(url) || [])[1] || ""; }
  function active() {
    const prefer = player.host.getAttribute("lang") === "en" ? "en" : "am";
    return tracks.get(prefer) || tracks.values().next().value || [];
  }
  function due(time) { return active().find((cue) => time >= cue.start && time < cue.end); }

  Promise.all(vttUrls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) return;
    const absolute = new URL(url, location.href);
    const cues = parseVtt(await response.text());
    for (const cue of cues) {
      if (cue.audio) cue.audio = new URL(cue.audio, absolute).href;
    }
    tracks.set(langOf(url) || "am", cues);
  })).catch(() => {});

  let mix = null;
  if (mixes[0]) {
    mix = new Audio(new URL(mixes[0], location.href).href);
    player.on("play", () => {
      if (!on || player.prefs.describeMode === "reader") { mix.pause(); return; }
      player.media.muted = true;
      mix.currentTime = player.media.currentTime || 0;
      mix.volume = Number(player.prefs.describeVol ?? 1);
      mix.play().catch(() => {});
    });
    player.on("pause", () => mix.pause());
    player.on("seek", () => { mix.currentTime = player.media.currentTime || 0; });
  }
  function remember(patch) { player.prefs = { ...player.prefs, ...savePrefs(patch) }; }

  function speak(cue) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        live.textContent = cue.text;
        window.setTimeout(resolve, 1200);
        return;
      }
      const utter = new SpeechSynthesisUtterance(cue.text);
      utter.lang = player.host.getAttribute("lang") === "en" ? "en" : "am-ET";
      utter.volume = Number(player.prefs.describeVol ?? 1);
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });
  }

  function playFile(cue) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(cue.audio);
      audio.volume = Number(player.prefs.describeVol ?? 1);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("audio"));
      audio.play().catch(reject);
    });
  }

  function hear(cue) {
    const mode = player.prefs.describeMode || "voice";
    if (mode === "reader") {
      live.textContent = "";
      live.textContent = cue.text;
      const wait = Math.min(8000, Math.max(1200, cue.text.split(/\s+/).length * 380));
      return new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    if (cue.audio) return playFile(cue).catch(() => speak(cue));
    return speak(cue);
  }

  async function run(cue) {
    busy = true;
    player._describing = true;
    player.emit("describe");
    const extended = player.prefs.duck === false || (cue.end - cue.start) >= 2.5;
    const playing = !player.media.paused;
    let ducked = null;
    if (playing && extended) {
      player._quiet = true;
      player.media.pause();
      player._quiet = false;
    } else if (playing) {
      ducked = player.media.volume;
      player.media.volume = Math.min(ducked, Number(player.prefs.lessonVol ?? 1) * 0.3);
    }
    await hear(cue);
    if (ducked != null) player.media.volume = Number(player.prefs.lessonVol ?? ducked);
    if (playing && extended && !player.isHeld?.()) {
      player._quiet = true;
      player.media.play().catch(() => {});
      player._quiet = false;
    }
    player._describing = false;
    busy = false;
  }

  player.on("seek", () => { spoken = ""; });
  player.on("time", () => {
    if (!on || busy || mix) return;
    const cue = due(player.media.currentTime || 0);
    if (!cue || cue.id === spoken) return;
    spoken = cue.id || String(cue.start);
    run(cue);
  });

  function slider(key, pref, apply) {
    const label = document.createElement("label");
    label.textContent = player.t(key) + " ";
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "1";
    input.step = "0.05";
    input.value = String(player.prefs[pref] ?? 1);
    input.addEventListener("input", () => {
      remember({ [pref]: Number(input.value) });
      apply(Number(input.value));
    });
    label.append(input);
    return label;
  }

  function paintOptions() {
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.tabIndex = -1;
    title.textContent = player.t("desc_how");
    const voice = document.createElement("button");
    voice.type = "button";
    voice.setAttribute("aria-pressed", (player.prefs.describeMode || "voice") === "voice" ? "true" : "false");
    voice.textContent = player.t("desc_voice");
    const reader = document.createElement("button");
    reader.type = "button";
    reader.setAttribute("aria-pressed", player.prefs.describeMode === "reader" ? "true" : "false");
    reader.textContent = player.t("desc_reader");
    voice.addEventListener("click", () => { remember({ describeMode: "voice" }); paintOptions(); });
    reader.addEventListener("click", () => { remember({ describeMode: "reader" }); paintOptions(); });
    const duck = document.createElement("button");
    duck.type = "button";
    duck.setAttribute("aria-pressed", player.prefs.duck === false ? "false" : "true");
    duck.textContent = player.t("duck");
    duck.addEventListener("click", () => { remember({ duck: player.prefs.duck === false }); paintOptions(); });
    panel.append(
      title, voice, reader,
      slider("lesson_volume", "lessonVol", (value) => { player.media.volume = value; }),
      slider("desc_volume", "describeVol", () => {}),
      duck
    );
  }

  player.addControl({
    id: "describe", order: 74, toggle: true,
    pressed: () => on, labelKey: "describe",
    onClick: () => {
      on = !on;
      remember({ describe: on });
      player.announce(on ? "describe_on" : "describe_off");
      player._paintAll();
    }
  });
  player.addControl({
    id: "describe-how", order: 74.5, toggle: true,
    pressed: () => options, labelKey: "desc_how",
    onClick: () => {
      options = !options;
      panel.hidden = !options;
      if (options) { paintOptions(); panel.querySelector("h2")?.focus(); }
      player._paintAll();
    }
  });
  player.registerShortcut("d", "key_d", () => player.shadow.querySelector("[data-id='describe']")?.click());
  player.slots.panels.append(panel);
  if (player.prefs.lessonVol != null) player.media.volume = Number(player.prefs.lessonVol);
}
