// Erişim doğrulaması: api/_codes.json içinde yalnızca özetler tutulur.
//  - Eski tür: 16 karakterlik kod, SHA-256 (alan: h)
//  - Şifre/rumuz: scrypt + tuz (alanlar: s = tuz, p = özet)
const crypto = require('crypto');
const codes = require('./_codes.json');
const norm = s => String(s).trim().replace(/\s+/g, ' ').toUpperCase();
module.exports = function check(code) {
  if (!code || typeof code !== 'string' || code.length > 80) return null;
  const n = norm(code);
  if (!n) return null;
  let c = n.replace(/[^A-Z0-9]/g, '');
  if (c.length === 16) {
    c = c.match(/.{4}/g).join('-');
    const h = crypto.createHash('sha256').update(c).digest('hex');
    const hit = codes.find(x => x.h === h);
    if (hit) return ok(hit);
  }
  for (const x of codes) {
    if (!x.s) continue;
    const d = crypto.scryptSync(n, Buffer.from(x.s, 'hex'), 32, {N: 16384}).toString('hex');
    if (d === x.p) return ok(x);
  }
  return null;
};
function ok(hit) {
  if (hit.until && new Date(hit.until + 'T23:59:59+03:00') < new Date()) return null;
  return hit;
}
