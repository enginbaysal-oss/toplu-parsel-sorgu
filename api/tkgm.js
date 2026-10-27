// Vercel fonksiyonu: TKGM aracı sunucusu (CDN önbellekli, CORS açık)
const UPSTREAM = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api/';
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  let p = req.query && req.query.p;
  if (Array.isArray(p)) p = p.join('/');
  if (!p || !/^(idariYapi|parsel)\/[\w\-\/.%]+$/.test(p) || p.includes('..')) {
    res.statusCode = 200; return res.end('TKGM proxy calisiyor');
  }
  try {
    const up = await fetch(UPSTREAM + p, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Origin': 'https://parselsorgu.tkgm.gov.tr',
        'Referer': 'https://parselsorgu.tkgm.gov.tr/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    });
    const body = await up.text();
    res.statusCode = up.status;
    res.setHeader('Content-Type', up.headers.get('content-type') || 'application/json');
    if (up.ok) {
      const ttl = p.startsWith('idariYapi') ? 2592000 : 604800;
      res.setHeader('Cache-Control', 'public, s-maxage=' + ttl + ', max-age=3600');
    }
    res.end(body);
  } catch (e) {
    res.statusCode = 502; res.end('Upstream hatasi: ' + e.message);
  }
};
