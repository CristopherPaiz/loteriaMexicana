/* Service worker de Lotería Mexicana.
 *
 * Estrategia:
 *  - App shell (HTML): red primero, para que un deploy nuevo se vea al recargar.
 *  - Assets del juego (imágenes, audios, JS/CSS con hash): caché primero.
 *
 * La versión NO se escribe a mano: scripts/estampar-sw.mjs la rellena tras el
 * build con un hash del propio build. Así cada deploy con cambios produce un
 * sw.js distinto, el navegador detecta la actualización y avisa; y un redeploy
 * sin cambios deja el mismo hash y no molesta a nadie.
 *
 * Tampoco se activa solo. Se queda esperando y la app pregunta antes de
 * recargar: si el gritón está a media partida, una recarga sorpresa le tira el
 * mazo a la basura.
 */

const BUILD_ID = "__BUILD_ID__";

// El shell se renueva en cada build. Los assets NO: las cartas y los audios
// pesan mucho y sus rutas no cambian nunca, así que sobreviven al deploy y la
// app sigue funcionando sin datos en la mesa.
const SHELL_CACHE = `loteria-shell-${BUILD_ID}`;
const ASSET_CACHE = "loteria-assets";

const SHELL_URLS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

const isBuildAsset = (pathname) => pathname.startsWith("/assets/");

const isCacheableAsset = (url) =>
  url.pathname.startsWith("/HDWEBP/") ||
  url.pathname.startsWith("/SDWEBP/") ||
  url.pathname.startsWith("/sounds/") ||
  url.pathname.startsWith("/sprites/") ||
  isBuildAsset(url.pathname) ||
  /\.(?:png|svg|webp|mp3|woff2?)$/i.test(url.pathname);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // cache: "reload" salta la caché HTTP del navegador: si no, el shell
      // "nuevo" podría guardarse ya rancio.
      cache.addAll(SHELL_URLS.map((url) => new Request(url, { cache: "reload" }))).catch(() => undefined)
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key)));

      // Los trozos JS/CSS del build anterior ya no los pide nadie (llevan hash
      // en el nombre): se tiran para que la caché no engorde deploy tras deploy.
      // Las cartas y los audios se quedan.
      const assets = await caches.open(ASSET_CACHE);
      const guardados = await assets.keys();
      await Promise.all(guardados.filter((request) => isBuildAsset(new URL(request.url).pathname)).map((request) => assets.delete(request)));

      await self.clients.claim();
    })()
  );
});

// La app pide el relevo cuando el usuario acepta actualizar.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones: red primero, caché como respaldo offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(new Request(request, { cache: "reload" }))
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
