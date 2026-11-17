// Parcels shared as public, unguessable links; server-side transport avoids Safari CORS issues.
const STORE = 'https://jsonblob.com/api/jsonBlob';
const MAX_BODY = 1500000;
const MAX_ITEMS = 1000;
const ID = /^[a-zA-Z0-9-]{8,100}$/;

function send(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
module.exports = async function (req, res) {
  // Public share links are read-only for recipients. No cookies or session tokens are used.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, {error: 'Yöntem desteklenmiyor'});
  try {
    if (req.method === 'POST') {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!data || typeof data !== 'object' || !Array.isArray(data.items) ||
          !data.items.length || data.items.length > MAX_ITEMS || !data.items.every(
            it => it && it.g && (it.g.type === 'Polygon' || it.g.type === 'MultiPolygon') &&
              typeof it.ada === 'string' && typeof it.parsel === 'string')) {
        return send(res, 400, {error: 'Geçersiz parsel listesi'});
      }
      const body = JSON.stringify(data);
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY) return send(res, 413, {error: 'Paylaşım boyutu çok büyük'});
      const response = await fetch(STORE, {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body, signal: AbortSignal.timeout(15000)
      });
      const location = response.headers.get('location') || '';
      const id = location.match(/\/([a-zA-Z0-9-]{8,100})\/?(?:\?.*)?$/)?.[1];
      if (!response.ok || !id || !ID.test(id)) return send(res, 502, {error: 'Paylaşım kaydı alınamadı'});
      return send(res, 201, {id});
    }
    const id = String(req.query && req.query.id || '');
    if (!ID.test(id)) return send(res, 400, {error: 'Geçersiz paylaşım kodu'});
    const response = await fetch(STORE + '/' + id, {
      headers: {'Accept': 'application/json'}, signal: AbortSignal.timeout(15000)
    });
    if (response.status === 404) return send(res, 404, {error: 'Paylaşım bulunamadı'});
    if (!response.ok) return send(res, 502, {error: 'Paylaşım okunamadı'});
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY) return send(res, 413, {error: 'Paylaşım boyutu çok büyük'});
    const parsed = JSON.parse(body);
    if (!parsed || !Array.isArray(parsed.items)) return send(res, 502, {error: 'Paylaşım verisi bozuk'});
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
    return send(res, 200, parsed);
  } catch (err) {
    return send(res, 502, {error: 'Paylaşım servisine bağlanılamadı'});
  }
};