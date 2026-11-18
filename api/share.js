// Public-by-link parcel viewer storage. Never put service secrets in the client.
const {validData, unpack} = require('./_share_format');
const STORES = [
  {key: 's', url: 'https://superjsonblob.com/api/jsonBlob'},
  {key: 'j', url: 'https://jsonblob.com/api/jsonBlob'}
];
const MAX_BODY = 1500000;
const MAX_ITEMS = 1000;
const VALID_ID = /^[A-Za-z0-9-]{8,100}$/;

function send(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
// JavaScript transport for public links viewed on other domains (e.g. GitHub Pages).
// A script element can load cross-origin without requiring the browser's fetch/CORS API.
function sendScript(res, payload) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const safe = JSON.stringify(payload).replace(/</g, '\\u003c')
    .replace(/\\u2028/g, '\\u2028').replace(/\\u2029/g, '\\u2029');
  res.end('if(window.__parselShareReceive){window.__parselShareReceive(' + safe + ');}');
}
function deliver(res, code, data, asScript) {
  if (asScript && code === 200) return sendScript(res, data);
  // Never expose an HTML or JSON error as a JavaScript success.
  return send(res, code, data);
}
function getId(r, body) {
  let loc = r.headers.get('location') || '';
  let id = loc.match(/\/([A-Za-z0-9-]{8,100})\/?(?:\?.*)?$/)?.[1] || '';
  if (!id) id = r.headers.get('x-jsonblob') || '';
  if (!id && body) {
    try {
      const j = JSON.parse(body);
      id = typeof j.id === 'string' ? j.id : (typeof j.blobId === 'string' ? j.blobId : '');
    } catch (_) {}
  }
  return VALID_ID.test(id) ? id : null;
}
async function saveToStore(store, body) {
  const response = await fetch(store.url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    body,
    signal: AbortSignal.timeout(15000)
  });
  // Different versions of the storage API return the id in Location, x-jsonblob or JSON.
  const resultBody = await response.text();
  if (!response.ok) throw new Error(store.key + ': HTTP ' + response.status);
  const id = getId(response, resultBody);
  if (!id) throw new Error(store.key + ': servis kayıt kodu göndermedi');
  return store.key + '-' + id;
}
async function readFromStore(store, id) {
  const response = await fetch(store.url + '/' + encodeURIComponent(id), {
    headers: {'Accept': 'application/json'}, signal: AbortSignal.timeout(15000)
  });
  if (response.status === 404) return {notFound: true};
  if (!response.ok) throw new Error(store.key + ': HTTP ' + response.status);
  const body = await response.text();
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY) throw new Error('Paylaşım boyutu çok büyük');
  const parsed = unpack(JSON.parse(body));
  if (!validData(parsed)) throw new Error('Parsel paylaşımı geçersiz');
  return {data: parsed};
}
module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, {error: 'Yöntem desteklenmiyor'});
  try {
    if (req.method === 'POST') {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let expanded;
      try { expanded = unpack(data); }
      catch (e) { return send(res, 400, {error: e.message}); }
      if (!validData(expanded)) return send(res, 400, {error: 'Geçersiz parsel listesi'});
      const body = JSON.stringify(data);
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY) return send(res, 413, {error: 'Paylaşım boyutu çok büyük'});
      let errors = [];
      for (const store of STORES) {
        try {
          const id = await saveToStore(store, body);
          // Verify that the saved link can actually be opened before returning it.
          const result = await readFromStore(store, id.slice(2));
          if (result.data) return send(res, 201, {id});
          errors.push(store.key + ': kayıt tekrar okunamadı');
        } catch (error) {
          errors.push(error.message);
        }
      }
      return send(res, 502, {error: 'Kayıt servisleri yanıt vermedi (' + errors.join('; ').slice(0, 180) + '). Lütfen yeniden deneyin.'});
    }
    const raw = String(req.query && req.query.id || '');
    const asScript = String(req.query && req.query.transport || '') === 'script';
    const prefix = /^([sj])-/.exec(raw);
    const id = prefix ? raw.slice(2) : raw;
    if (!VALID_ID.test(id)) return send(res, 400, {error: 'Geçersiz paylaşım kodu'});
    // Unprefixed ids are legacy links and used the old jsonblob service.
    const stores = prefix ? STORES.filter(s => s.key === prefix[1]) : [STORES[1], STORES[0]];
    let lastError = null;
    for (const store of stores) {
      try {
        const result = await readFromStore(store, id);
        if (result.data) return deliver(res, 200, result.data, asScript);
      } catch (error) { lastError = error; }
    }
    return send(res, lastError ? 502 : 404, {
      error: lastError ? 'Paylaşım servisine ulaşılamadı: ' + lastError.message : 'Paylaşım bulunamadı'
    });
  } catch (error) {
    return send(res, 502, {error: 'Paylaşım sunucusu hatası: ' + (error && error.message || 'bilinmeyen hata').slice(0, 150)});
  }
};