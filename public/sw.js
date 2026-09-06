/* Service worker de Lotería Mexicana.
 *
 * Estrategia:
 *  - App shell (HTML): network-first, para que un deploy nuevo se vea al recargar.
 *  - Assets del juego (imágenes, audios, JS/CSS con hash): cache-first, son inmutables.
 *
 * Sube CACHE_VERSION en cada deploy que cambie assets estáticos de /public.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `loteria-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `loteria-assets-${CACHE_VERSION}`;

const SHELL_URLS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

const isCacheableAsset = (url) =>
  url.pathname.startsWith("/HDWEBP/") ||
  url.pathname.startsWith("/SDWEBP/") ||
  url.pathname.startsWith("/sounds/") ||
  url.pathname.startsWith("/assets/") ||
  /\.(?:png|svg|webp|mp3|woff2?)$/i.test(url.pathname);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones: red primero, caché como respaldo offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html").then((cached) => cached || Response.error()))
    );
    return;
  }

  if (!isCacheableAsset(url)) return;

  // Assets: caché primero, y si no está se guarda al vuelo.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
