// FR-NET-08: Serve a file from the offline cache when the network is gone.
const CACHE = "lehulum-lesson";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("sync", (event) => {
  if (event.tag === "lehulum-progress") event.waitUntil(flushProgress());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).catch(() => caches.match(request))));
});

self.addEventListener("backgroundfetchsuccess", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const records = await event.registration.matchAll();
    for (const record of records) cache.put(record.request, await record.responseReady);
  })());
});

function flushProgress() {
  return new Promise((resolve) => {
    const open = indexedDB.open("lehulum-progress", 1);
    open.onsuccess = () => {
      const db = open.result;
      const read = db.transaction("events").objectStore("events").getAll();
      read.onsuccess = async () => {
        for (const item of read.result || []) {
          try {
            const response = await fetch("/api/v1/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item)
            });
            if (response.ok) db.transaction("events", "readwrite").objectStore("events").delete(item.event_id);
          } catch (error) {
            resolve();
            return;
          }
        }
        resolve();
      };
      read.onerror = () => resolve();
    };
    open.onerror = () => resolve();
  });
}
