// Erişim kodu doğrulaması: api/_codes.json içinde yalnızca SHA-256 özetleri tutulur.
const crypto = require('crypto');
const codes = require('./_codes.json');
module.exports = function check(code) {
  if (!code || typeof code !== 'string' || code.length < 12 || code.length > 80) return null;
  const h = crypto.createHash('sha256').update(code.trim()).digest('hex');
  const hit = codes.find(c => c.h === h);
  if (!hit) return null;
  if (hit.until && new Date(hit.until + 'T23:59:59+03:00') < new Date()) return null;
  return hit;
};
