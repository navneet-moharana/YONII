// YONII minimal service worker — makes the site installable and shell-cacheable.
const CACHE = "yonii-shell-v1";
const SHELL = ["/", "/manifest.json", "/yonii-logo.png", "/yonii-icon-192.png", "/yonii-icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache API calls — always go to network.
  if (url.pathname.startsWith("/api/")) return;

  // For navigations, try network first, fall back to cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/") || new Response("Offline", { status: 503 }))
    );
    return;
  }

  // For same-origin static, cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req)
          .then((resp) => {
            const clone = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
            return resp;
          })
          .catch(() => hit)
      )
    );
  }
});
