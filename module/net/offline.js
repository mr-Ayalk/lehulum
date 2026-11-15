// FR-NET-07, FR-NET-11, FR-NET-12, FR-NET-13: Save a text lesson, and cache the files for this page.
import { cuesToText } from "../blind/vtt.js";

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
  bar.append(save, light, cache, note);
  player.slots.below.append(bar);

  function files() {
    const host = player.host;
    return [host.getAttribute("src"), host.getAttribute("poster"), ...(host.getAttribute("captions") || "").split(","), host.getAttribute("sign"), host.getAttribute("glossary"), host.getAttribute("describe"), host.getAttribute("screen"), host.getAttribute("chapters")]
      .flatMap((item) => String(item || "").split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  save.addEventListener("click", () => pack("text"));
  light.addEventListener("click", () => pack("light"));

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
    }).catch(() => {});
  }

  cache.addEventListener("click", async () => {
    if (!window.caches) { note.textContent = player.t("hearing_unavailable"); return; }
    const box = await caches.open("lehulum-lesson");
    let count = 0;
    for (const url of files()) {
      try { await box.add(new URL(url, location.href).href); count += 1; } catch (error) { /* skip missing */ }
    }
    if (navigator.serviceWorker) navigator.serviceWorker.register("/module/sw.js").catch(() => {});
    note.textContent = player.t("offline_ready") + " " + count;
  });

  const link = navigator.connection;
  if (link && (link.saveData || link.effectiveType === "2g" || link.effectiveType === "slow-2g")) {
    note.textContent = player.t("slow_link");
  }
}
