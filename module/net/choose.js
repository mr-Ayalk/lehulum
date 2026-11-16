// FR-NET-02, FR-NET-03, FR-NET-04, FR-NET-05: Choose text, light, or video before the large file plays.
import { savePrefs } from "../core/prefs.js";
import { chooseVariant } from "./light-lesson.js";

export function attachChoice(player) {
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  const title = document.createElement("h2");
  title.tabIndex = -1;
  title.textContent = player.t("lesson_size");
  panel.append(title);
  player.slots.below.prepend(panel);

  function apply(kind) {
    player.prefs = { ...player.prefs, ...savePrefs({ lessonSize: kind }) };
    const frame = player.shadow.querySelector("[data-slides]");
    if (frame) frame.hidden = kind !== "light";
    if (kind === "text") {
      player.media.removeAttribute("src");
      player.media.load();
      return;
    }
    if (kind === "full") {
      player.setSource(player.host.getAttribute("src") || "", player.host.getAttribute("poster") || "");
      return;
    }
    const src = player.host.getAttribute("src") || "";
    const audio = src.replace(/lesson[^/]*\.mp4.*/i, "lesson-audio.m4a");
    if (audio && audio !== src) player.setSource(audio, player.host.getAttribute("poster") || "");
    slides(player);
    const shown = player.shadow.querySelector("[data-slides]");
    if (shown) shown.hidden = false;
  }

  async function paint(picked) {
    const body = await packSizes(player);
    panel.replaceChildren(title);
    for (const [kind, key, bytes] of [["text", "size_text", body.text], ["light", "size_light", body.light], ["full", "size_video", body.full]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = player.t(key) + (bytes ? " (" + Math.max(1, Math.round(bytes / 1024)) + " KB)" : "");
      button.setAttribute("aria-pressed", kind === picked ? "true" : "false");
      button.addEventListener("click", () => { apply(kind); paint(kind); });
      panel.append(button);
    }
  }

  const saved = player.prefs.lessonSize;
  if (saved) { apply(saved); paint(saved); return; }
  recommend(player).then((kind) => paint(kind));
}

async function packSizes(player) {
  const api = player.host.getAttribute("api");
  const lesson = player.host.getAttribute("lesson-id");
  if (!api || !lesson) return {};
  try {
    const response = await fetch(api.replace(/\/$/, "") + "/lessons/" + lesson + "/packs");
    return response.ok ? await response.json() : {};
  } catch (error) {
    return {};
  }
}

async function recommend(player) {
  if (navigator.connection) return chooseVariant(navigator.connection);
  const src = player.host.getAttribute("src");
  if (!src) return "full";
  const start = performance.now();
  try {
    await fetch(new URL(src, location.href), { headers: { Range: "bytes=0-20479" }, cache: "no-store" });
  } catch (error) {
    return "text";
  }
  const ms = performance.now() - start;
  if (ms > 2000) return "text";
  if (ms > 700) return "light";
  return "full";
}

function slides(player) {
  if (player.shadow.querySelector("[data-slides]")) return;
  const img = document.createElement("img");
  img.dataset.slides = "1";
  img.alt = player.t("onscreen");
  img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000";
  player.slots.overlay.append(img);
  const poster = player.host.getAttribute("poster");
  if (poster) img.src = new URL(poster, location.href).href;
  let items = [];
  const screen = player.host.getAttribute("screen");
  if (screen) fetch(screen).then((response) => response.ok ? response.json() : []).then((data) => { items = data || []; }).catch(() => {});
  player.on("time", () => {
    const time = player.media.currentTime || 0;
    const item = items.find((row) => time >= row.start && time < row.end);
    const next = items.find((row) => row.start > time);
    const slide = (row) => row?.src || (screen && row ? screen.replace(/[^/]+$/, "slides/" + (items.indexOf(row) + 1) + ".webp") : "");
    if (item) img.alt = (item.title ? item.title + ". " : "") + (item.content || "");
    const here = slide(item);
    const ahead = slide(next);
    if (here) img.src = new URL(here, location.href).href;
    if (ahead) { const pre = new Image(); pre.src = new URL(ahead, location.href).href; }
  });
}
