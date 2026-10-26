// Cloudflare Worker: TKGM Parsel Sorgu aracı sunucusu (önbellekli, CORS açık)
// Uygulamadaki "Servis adresi" = bu Worker'ın adresi (sonunda / olmadan).
const UPSTREAM = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};
export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const u = new URL(req.url);
    if (!/^\/(idariYapi|parsel)\//.test(u.pathname))
      return new Response('TKGM proxy calisiyor', { status: 200, headers: CORS });
    const cache = caches.default;
    const key = new Request(u.toString(), { method: 'GET' });
    let res = await cache.match(key);
    if (res) return withCors(res, 'HIT');
    const up = await fetch(UPSTREAM + u.pathname + u.search, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Origin': 'https://parselsorgu.tkgm.gov.tr',
        'Referer': 'https://parselsorgu.tkgm.gov.tr/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    });
    res = new Response(up.body, up);
    if (up.ok) {
      const ttl = u.pathname.startsWith('/idariYapi') ? 2592000 : 604800;
      const c = new Response(res.clone().body, res);
      c.headers.set('Cache-Control', 'public, max-age=' + ttl);
      ctx.waitUntil(cache.put(key, c));
    }
    return withCors(res, 'MISS');
  }
};
function withCors(r, s) {
  const h = new Headers(r.headers);
  for (const k in CORS) h.set(k, CORS[k]);
  h.set('X-Cache', s);
  return new Response(r.body, { status: r.status, headers: h });
}
