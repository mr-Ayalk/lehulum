// FR-NET-08: Serve a file from the offline cache when the network is gone.
const CACHE = "lehulum-lesson";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).catch(() => caches.match(request))));
});
