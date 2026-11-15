// FR-BLV-08, FR-BLV-09, FR-BLV-10: Descriptions by screen reader. The lesson waits when a line would be covered.
import { savePrefs } from "../core/prefs.js";
import { parseVtt } from "./vtt.js";

export function attachDescriptions(player) {
  const urls = (player.host.getAttribute("describe") || "").split(",").map((item) => item.trim()).filter(Boolean);
  const tracks = new Map();
  let on = player.prefs.describe !== false;
  let spoken = "";
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("aria-live", "assertive");
  player.shadow.append(live);

  function langOf(url) { return (/\.([a-z]{2})\.vtt/i.exec(url) || [])[1] || ""; }
  function active() {
    const prefer = player.host.getAttribute("lang") === "en" ? "en" : "am";
    return tracks.get(prefer) || tracks.values().next().value || [];
  }

  Promise.all(urls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) return;
    tracks.set(langOf(url) || "am", parseVtt(await response.text()));
  })).catch(() => {});

  function due(time) {
    return active().find((cue) => time >= cue.start && time < cue.end);
  }

  player.on("seek", () => { spoken = ""; });
  player.on("time", () => {
    if (!on) return;
    const cue = due(player.media.currentTime || 0);
    if (!cue || cue.id === spoken) return;
    spoken = cue.id || String(cue.start);
    live.textContent = "";
    live.textContent = cue.text;
    player.emit("describe");
    const next = player.captions?.getCues?.().find((line) => line.start > cue.start);
    const overlaps = next && cue.end > next.start;
    if (!overlaps || player.media.paused) return;
    player._quiet = true;
    player.media.pause();
    player._quiet = false;
    const wait = Math.min(8000, Math.max(1200, cue.text.split(/\s+/).length * 380));
    window.setTimeout(() => {
      if (player.isHeld?.()) return;
      player._quiet = true;
      player.media.play().catch(() => {});
      player._quiet = false;
    }, wait);
  });

  player.addControl({
    id: "describe", order: 74, toggle: true,
    pressed: () => on,
    labelKey: "describe",
    onClick: () => {
      on = !on;
      player.prefs = { ...player.prefs, ...savePrefs({ describe: on }) };
      player.announce(on ? "describe_on" : "describe_off");
      player._paintAll();
    }
  });
  player.registerShortcut("d", "key_d", () => player.shadow.querySelector("[data-id='describe']")?.click());
}
