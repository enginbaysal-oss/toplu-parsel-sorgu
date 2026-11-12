// Kullanım: node tools/kod-ekle.js "Ad Soyad" [BİTİŞ-TARİHİ yyyy-aa-gg]
// Yeni bir erişim kodu üretir, özetini api/_codes.json'a ekler ve kodu ekrana yazar (yalnızca bir kez görünür).
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const [name, until] = process.argv.slice(2);
if (!name) { console.error('Kullanım: node tools/kod-ekle.js "Ad Soyad" [yyyy-aa-gg]'); process.exit(1); }
const f = path.join(__dirname, '..', 'api', '_codes.json');
const list = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let code = ''; const b = crypto.randomBytes(16);
for (let i = 0; i < 16; i++) { code += A[b[i] % A.length]; if (i % 4 === 3 && i < 15) code += '-'; }
const h = crypto.createHash('sha256').update(code).digest('hex');
list.push(until ? {name, h, until} : {name, h});
fs.writeFileSync(f, JSON.stringify(list, null, 2) + '\n');
console.log(code);
