/**
 * Service Worker — Galerie Famille Zagou (photos + vidéos)
 *
 * Stratégies :
 *  - App shell (HTML/CSS/JS/JSON) : cache-first au PRECACHE, màj silencieuse en arrière-plan
 *  - Images .webp                 : cache-on-demand stale-while-revalidate
 *  - Google Fonts                 : network-first avec fallback cache
 *  - Tout le reste                : network-only (pas de cache)
 *
 * Pour forcer une mise à jour : incrémenter CACHE_VERSION
 */

const CACHE_VERSION = "v1";
const CACHE_SHELL = `zagou-shell-${CACHE_VERSION}`;
const CACHE_IMAGES = `zagou-images-${CACHE_VERSION}`;

// BASE : préfixe automatique selon l'emplacement du SW (ex: "/gonz_def" sur GitHub Pages)
const BASE = self.location.pathname.replace(/\/sw\.js$/, "");

/**
 * App-shell photos : précaché à l'installation → 0 requête réseau dès la 2e visite
 * Limité volontairement à photos.html pour éviter qu'un fichier manquant côté
 * vidéos ne fasse échouer toute l'installation du SW.
 * Les assets de index.html (vidéos) seront mis en cache automatiquement
 * lors de la 1ère visite de cette page (cache-on-demand).
 */
const PRECACHE_FILES = [
  `${BASE}/photos.html`,
  `${BASE}/photos.css`,
  `${BASE}/photos.js`,
  `${BASE}/xjson/photoImg.json`,
  `${BASE}/xjson/box.json`,
  `${BASE}/xfonctions/affimg.js`,
  `${BASE}/xfonctions/audio.js`,
  `${BASE}/xfonctions/diaporama.js`,
  `${BASE}/xfonctions/dom.js`,
  `${BASE}/xfonctions/events.js`,
  `${BASE}/xfonctions/fullScreen.js`,
  `${BASE}/xfonctions/managers.js`,
  `${BASE}/xfonctions/menubox.js`,
  `${BASE}/xfonctions/nav_os.js`,
  `${BASE}/xfonctions/navigation.js`,
  `${BASE}/xfonctions/ui.js`,
  `${BASE}/xfonctions/zoom.js`,
  `${BASE}/box_img/Zag_icon.png`,
];

/* ── INSTALL : précache de l'app-shell ──────────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting()), // activation immédiate sans attendre la fermeture des pages
  );
});

/* ── ACTIVATE : supprime les anciens caches ─────────────────────────────── */
self.addEventListener("activate", (event) => {
  const validCaches = [CACHE_SHELL, CACHE_IMAGES];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !validCaches.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()), // prend le contrôle immédiatement de toutes les pages
  );
});

/* ── FETCH : interception des requêtes ──────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne traiter que les requêtes GET
  if (request.method !== "GET") return;

  // ── Requêtes Range (audio/vidéo en streaming) : network-only ─────────
  if (request.headers.get("range")) return;

  // ── Google Fonts : network-first (CDN externe) ────────────────────────
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(networkFirstStrategy(request, CACHE_SHELL));
    return;
  }

  // ── Requêtes cross-origin autres (YouTube, etc.) : network-only ───────
  if (url.origin !== self.location.origin) return;

  // ── Images .webp : stale-while-revalidate ─────────────────────────────
  if (
    url.pathname.startsWith(`${BASE}/images/`) &&
    url.pathname.endsWith(".webp")
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
    return;
  }

  // ── App-shell (JS, CSS, JSON, HTML) : cache-first ────────────────────
  event.respondWith(cacheFirstStrategy(request, CACHE_SHELL));
});

/* ── Stratégies ─────────────────────────────────────────────────────────── */

/**
 * Cache-first : répond depuis le cache, sinon réseau (+ mise en cache du résultat)
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Contenu non disponible hors-ligne", { status: 503 });
  }
}

/**
 * Stale-while-revalidate : répond depuis le cache immédiatement
 * ET met à jour le cache en arrière-plan
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Lancement de la mise à jour réseau en arrière-plan (sans await)
  const networkFetch = fetch(request)
    .then((resp) => {
      if (resp.ok && resp.status !== 206) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => null);

  return cached || networkFetch;
}

/**
 * Network-first : réseau en priorité, cache en fallback
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response("Contenu non disponible hors-ligne", { status: 503 })
    );
  }
}
