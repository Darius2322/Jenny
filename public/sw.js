/* Jenny service worker.
 * Safety rules: only static brand assets are cached. HTML, API, auth and any personalised
 * response are NEVER cached, so one account's data can't be served to another.
 * Navigations that fail offline get the generic /offline page. */
const VERSION = "jenny-v1";
const STATIC_ASSETS = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/jenny-logo-light.svg",
  "/brand/jenny-logo-dark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch Supabase or other origins

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }

  const isBrandAsset = url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/");
  if (isBrandAsset) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
