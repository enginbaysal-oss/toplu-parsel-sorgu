// Kullanım: node tools/sifre-ekle.js "Ad Soyad" "şifre veya rumuz" [yyyy-aa-gg]
// Hatırlanabilir şifre ekler (scrypt+tuz). Büyük/küçük harf ve fazla boşluk önemsizdir.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const [name, pw, until] = process.argv.slice(2);
if (!name || !pw) { console.error('Kullanım: node tools/sifre-ekle.js "Ad" "şifre" [yyyy-aa-gg]'); process.exit(1); }
const f = path.join(__dirname, '..', 'api', '_codes.json');
const list = JSON.parse(fs.readFileSync(f, 'utf8'));
const n = pw.trim().replace(/\s+/g, ' ').toUpperCase();
const salt = crypto.randomBytes(16);
const p = crypto.scryptSync(n, salt, 32, {N: 16384}).toString('hex');
list.push(until ? {name, s: salt.toString('hex'), p, until} : {name, s: salt.toString('hex'), p});
fs.writeFileSync(f, JSON.stringify(list, null, 2) + '\n');
console.log('Eklendi:', name);
