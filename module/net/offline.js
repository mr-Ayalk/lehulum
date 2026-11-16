// FR-NET-07, FR-NET-11, FR-NET-12, FR-NET-13: Save a lesson, cache it, and share one file.
import { cuesToText } from "../blind/vtt.js";
import { saveFile, shareLesson } from "./downloads.js";

export function attachOffline(player) {
  const bar = document.createElement("div");
  bar.className = "lh-panel";
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = player.t("offline_text");
  const cache = document.createElement("button");
  cache.type = "button";
  cache.textContent = player.t("offline_save");
  const note = document.createElement("p");
  note.setAttribute("role", "status");
  const light = document.createElement("button");
  light.type = "button";
  light.textContent = player.t("offline_light");
  const full = document.createElement("button");
  full.type = "button";
  full.textContent = player.t("size_video");
  const share = document.createElement("button");
  share.type = "button";
  share.textContent = player.t("share");
  bar.append(save, light, full, share, cache, note);
  player.slots.below.append(bar);

  function files() {
    const host = player.host;
    const src = host.getAttribute("src") || "";
    const audio = src.replace(/lesson[^/]*\.mp4.*/i, "lesson-audio.m4a");
    const screen = host.getAttribute("screen") || "";
    const slides = [1, 2, 3, 4].map((n) => screen.replace(/[^/]+$/, "slides/" + n + ".webp"));
    return [src, audio, ...slides, host.getAttribute("poster"), ...(host.getAttribute("captions") || "").split(","), host.getAttribute("sign"), host.getAttribute("glossary"), host.getAttribute("describe"), screen, host.getAttribute("chapters")]
      .flatMap((item) => String(item || "").split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  save.addEventListener("click", () => pack("text"));
  light.addEventListener("click", () => pack("light"));
  full.addEventListener("click", () => saveFile(player, player.host.getAttribute("src"), "video"));
  share.addEventListener("click", async () => {
    const api = player.host.getAttribute("api");
    const lesson = player.host.getAttribute("lesson-id");
    const href = api && lesson ? api.replace(/\/$/, "") + "/lessons/" + lesson + "/offline-pack?level=text" : location.href;
    const fallback = await shareLesson(player, href);
    if (fallback) note.textContent = fallback;
  });

  function pack(level) {
    const api = player.host.getAttribute("api");
    const lesson = player.host.getAttribute("lesson-id");
    if (api && lesson) {
      const link = document.createElement("a");
      link.href = api.replace(/\/$/, "") + "/lessons/" + lesson + "/offline-pack?level=" + level;
      link.download = "lesson.html";
      link.click();
      note.textContent = player.t("offline_ready");
      return;
    }
    const lang = player.host.getAttribute("lang") === "en" ? "en" : "am";
    const cues = player.captions?.getCues(lang) || [];
    const html = "<!DOCTYPE html><html lang=\"" + lang + "\"><head><meta charset=\"utf-8\"><title>"
      + player.t("title") + "</title></head><body><h1>" + player.t("title") + "</h1><pre>"
      + cuesToText(cues).replace(/</g, "") + "</pre></body></html>";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    link.download = "lesson.html";
    link.click();
    note.textContent = player.t("offline_ready");
  }

  const api = player.host.getAttribute("api");
  const lesson = player.host.getAttribute("lesson-id");
  if (api && lesson) {
    fetch(api.replace(/\/$/, "") + "/lessons/" + lesson + "/packs").then((response) => response.json()).then((sizes) => {
      const kb = (n) => Math.max(1, Math.round((n || 0) / 1024));
      save.textContent = player.t("offline_text") + " (" + kb(sizes.text) + " KB)";
      light.textContent = player.t("offline_light") + " (" + kb(sizes.light) + " KB)";
      full.textContent = player.t("size_video") + " (" + kb(sizes.full) + " KB)";
    }).catch(() => {});
  }

  cache.addEventListener("click", async () => {
    if (!window.caches) { note.textContent = player.t("hearing_unavailable"); return; }
    const box = await caches.open("lehulum-lesson");
    let count = 0;
    for (const url of files()) {
      try { await box.add(new URL(url, location.href).href); count += 1; } catch (error) { /* skip missing */ }
    }
    if (navigator.serviceWorker) navigator.serviceWorker.register("/module/sw.js", { scope: "/" }).catch(() => {});
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    note.textContent = player.t("offline_ready") + " " + count;
  });

  const link = navigator.connection;
  if (link && (link.saveData || link.effectiveType === "2g" || link.effectiveType === "slow-2g")) {
    note.textContent = player.t("slow_link");
  }
}
