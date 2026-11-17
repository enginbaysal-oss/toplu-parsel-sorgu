// New version: do not keep serving an old application after a successful update.
const V = 'parsel-v3-1227';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(V).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names =>
    Promise.all(names.filter(name => name.startsWith('parsel-v') && name !== V)
      .map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const own = url.origin === self.location.origin;
  const lib = ['cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname);
  if (!own && !lib) return;
  // Always ask the network for the latest app HTML; only use the current
  // version's offline copy if the network is genuinely unavailable.
  const isPage = own && (event.request.mode === 'navigate' || /\.html$/.test(url.pathname) || /\/$/.test(url.pathname));
  event.respondWith(
    fetch(event.request, own ? {cache:'no-store'} : undefined).then(response => {
      if (response.ok && response.type !== 'opaque') {
        const copy = response.clone();
        caches.open(V).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(V);
      const match = await cache.match(event.request);
      if (match) return match;
      if (isPage) {
        return new Response(
          '<!doctype html><meta charset="utf-8"><title>Çevrimdışı</title><p>Güncel Parsel Haritası sayfası indirilemedi. İnternet bağlantınızı kontrol edip yeniden deneyin.</p>',
          {status:503, headers:{'Content-Type':'text/html; charset=utf-8'}}
        );
      }
      return Response.error();
    })
  );
});