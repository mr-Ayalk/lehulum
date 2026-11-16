// FR-NET-14, FR-NET-15: Queue progress in IndexedDB and send it when the network returns.
const DB = "lehulum-progress";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("events", { keyPath: "event_id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestDone(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function read(db) {
  return requestDone(db.transaction("events").objectStore("events").getAll());
}

export function attachProgress(player) {
  const api = player.host.getAttribute("api");
  if (!api || !window.indexedDB) return;
  const lesson = player.host.getAttribute("lesson-id") || "python-01";
  const seen = new Set();
  let dbPromise = openDb();

  function note(text) {
    const line = player.slots.below.querySelector("[data-progress]") || document.createElement("p");
    line.dataset.progress = "1";
    line.setAttribute("role", "status");
    line.textContent = text;
    if (!line.isConnected) player.slots.below.append(line);
  }

  async function send() {
    const db = await dbPromise;
    const items = await read(db);
    for (const item of items) {
      try {
        const response = await fetch(api.replace(/\/$/, "") + "/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        });
        if (response.ok) db.transaction("events", "readwrite").objectStore("events").delete(item.event_id);
      } catch (error) {
        note(player.t("saved_phone"));
        return;
      }
    }
    const left = await read(db);
    note(left.length ? player.t("saved_phone") : "");
  }

  async function queue(kind, extra) {
    const item = {
      event_id: crypto.randomUUID(),
      lesson_id: lesson,
      learner_ref: "learner-demo",
      kind,
      at: new Date().toISOString(),
      ...extra
    };
    const db = await dbPromise;
    await requestDone(db.transaction("events", "readwrite").objectStore("events").put(item));
    note(player.t("saved_phone"));
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then((reg) => reg.sync?.register("lehulum-progress")).catch(() => {});
    }
    send();
  }

  player.on("time", () => {
    const time = player.media.currentTime || 0;
    for (const chapter of player.chapters || []) {
      if (time < chapter.end || seen.has(chapter.id)) continue;
      seen.add(chapter.id);
      queue("chapter", { chapter: chapter.id });
    }
  });
  player.host.addEventListener("db-player:complete", () => {
    queue("complete", {});
    fetch(api.replace(/\/$/, "") + "/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lesson, learner_ref: "learner-demo" })
    }).then((response) => response.ok ? response.json() : null).then((body) => {
      if (!body?.id) return;
      const link = document.createElement("a");
      link.href = api.replace(/\/$/, "") + "/certificates/" + String(body.id).split("/").pop() + "/page";
      link.textContent = player.t("cert_ready");
      player.slots.below.append(link);
    }).catch(() => {});
  });
  window.addEventListener("online", () => send());
}
