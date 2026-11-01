/* Schätzung — Service Worker
   Strategie:
   - index.html: Netzwerk zuerst, Cache als Rückfall. Dadurch reicht es,
     index.html im Repo zu ersetzen; beim nächsten Öffnen mit Netz ist die
     neue Version da.
   - vendor/ (Texterkennung, ~9 MB): wird beim Installieren einmal geladen und
     danach nur noch aus dem Cache bedient. Ändert sich dort etwas, VERSION
     hochzählen.
   - Icons, Manifest, Schriften: Cache zuerst, im Hintergrund aufgefrischt.
   - Motorworld-Events laufen am Service Worker vorbei; die Seite merkt sich
     die letzte Liste selbst.
*/
const VERSION = "schaetzung-v1";
const SHELL   = VERSION + "-shell";
const VENDOR  = VERSION + "-vendor";
const ASSETS  = VERSION + "-assets";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png"
];
const PRECACHE_VENDOR = [
  "./vendor/tesseract.min.js",
  "./vendor/worker.min.js",
  "./vendor/tesseract-core-simd-lstm.wasm.js",
  "./vendor/tesseract-core-lstm.wasm.js",
  "./vendor/deu.traineddata.gz"
];

self.addEventListener("install", e => {
  e.waitUntil(
    Promise.all([
      caches.open(SHELL).then(c => c.addAll(PRECACHE)),
      /* Schlägt das fehl (schwaches Netz), holt sich die Seite die Dateien
         beim ersten Foto und sie landen dann über den fetch-Zweig im Cache. */
      caches.open(VENDOR).then(c => c.addAll(PRECACHE_VENDOR)).catch(() => {})
    ])
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  const eigen      = url.origin === self.location.origin;
  const istSchrift = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const istSeite   = req.mode === "navigate" || req.destination === "document";
  if(!eigen && !istSchrift) return;

  /* Seite: Netzwerk zuerst */
  if(istSeite){
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  /* Texterkennung: Cache zuerst, sonst laden und ablegen */
  if(eigen && url.pathname.includes("/vendor/")){
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
        if(res.ok){ const copy = res.clone(); caches.open(VENDOR).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  /* Rest: Cache zuerst, im Hintergrund auffrischen */
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if(res.ok || res.type === "opaque"){
          const copy = res.clone();
          caches.open(ASSETS).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
