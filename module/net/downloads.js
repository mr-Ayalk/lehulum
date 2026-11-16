// FR-NET-08, FR-NET-09, FR-NET-10, FR-NET-13: Resume a download, list it, and share the file.
const DB = "lehulum-downloads";
const CHUNK = 256 * 1024;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("chunks")) db.createObjectStore("chunks", { keyPath: "id" });
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFile(player, url, name) {
  if (!url || !window.indexedDB) return;
  const absolute = new URL(url, location.href).href;
  const lesson = player.host.getAttribute("lesson-id") || "lesson";
  const id = lesson + ":" + name;
  const db = await openDb();
  const head = await fetch(absolute, { method: "HEAD" }).catch(() => null);
  const size = Number(head?.headers.get("content-length") || 0);
  let offset = 0;
  const known = await done(db.transaction("chunks").objectStore("chunks").getAll());
  offset = known.filter((row) => row.file === id).reduce((sum, row) => sum + (row.bytes?.byteLength || 0), 0);
  if (offset === 0 && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.backgroundFetch) reg.backgroundFetch.fetch(id, [absolute]).catch(() => {});
    }).catch(() => {});
  }
  while (!size || offset < size) {
    const response = await fetch(absolute, { headers: { Range: "bytes=" + offset + "-" + (offset + CHUNK - 1) } });
    if (!response.ok) break;
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) break;
    await done(db.transaction("chunks", "readwrite").objectStore("chunks").put({ id: id + ":" + offset, file: id, bytes }));
    offset += bytes.byteLength;
    if (response.status !== 206) break;
  }
  await done(db.transaction("files", "readwrite").objectStore("files").put({ id, lesson, name, size: offset }));
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  const note = player.slots.below.querySelector("[data-downloads]");
  if (note) note.textContent = player.t("offline_ready");
}

export function attachDownloads(player) {
  const panel = document.createElement("section");
  panel.className = "lh-panel";
  panel.hidden = true;
  let open = false;
  player.addControl({
    id: "downloads", order: 78, toggle: true, labelKey: "downloads",
    pressed: () => open,
    onClick: async () => {
      open = !open;
      panel.hidden = !open;
      if (!open) return;
      panel.replaceChildren();
      const title = document.createElement("h2");
      title.tabIndex = -1;
      title.textContent = player.t("downloads");
      panel.append(title);
      const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {};
      const used = document.createElement("p");
      used.dataset.downloads = "1";
      used.textContent = player.t("storage_used", { n: String(Math.round((estimate.usage || 0) / 1024)) });
      panel.append(used);
      const db = await openDb().catch(() => null);
      const rows = db ? await done(db.transaction("files").objectStore("files").getAll()) : [];
      for (const row of rows) {
        const line = document.createElement("p");
        line.textContent = row.lesson + " " + row.name + " " + Math.round((row.size || 0) / 1024) + " KB";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = player.t("delete_download");
        remove.addEventListener("click", async () => {
          const box = await openDb();
          await new Promise((resolve, reject) => {
            const tx = box.transaction(["chunks", "files"], "readwrite");
            const read = tx.objectStore("chunks").getAll();
            read.onsuccess = () => {
              for (const chunk of read.result) if (chunk.file === row.id) tx.objectStore("chunks").delete(chunk.id);
              tx.objectStore("files").delete(row.id);
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
          line.remove();
        });
        line.append(remove);
        panel.append(line);
      }
      title.focus();
    }
  });
  player.slots.panels.append(panel);
}

export async function shareLesson(player, href) {
  try {
    const response = await fetch(href);
    const blob = await response.blob();
    const file = new File([blob], "lesson.html", { type: "text/html" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: player.t("title") });
      return;
    }
  } catch (error) { /* fall through to a link */ }
  if (navigator.share) {
    await navigator.share({ title: player.t("title"), url: href }).catch(() => {});
    return;
  }
  return href;
}
