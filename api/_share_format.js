'use strict';
const zlib = require('node:zlib');
const PACK_FORMAT = 'parsel-gzip-v1';
const MAX_PACKED_BYTES = 1400000;
const MAX_UNPACKED_BYTES = 12000000;
function validData(data){
  return !!(data && typeof data === 'object' && Array.isArray(data.items) &&
    data.items.length > 0 && data.items.length <= 1000 &&
    data.items.every(it=>it && it.g &&
      (it.g.type === 'Polygon' || it.g.type === 'MultiPolygon') &&
      String(it.ada || '') && String(it.parsel || '')));
}
function unpack(data){
  if (!data || data.format !== PACK_FORMAT) return data;
  if (typeof data.payload !== 'string' ||
      data.payload.length > Math.ceil(MAX_PACKED_BYTES * 4/3) + 32 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(data.payload)) {
    throw new Error('Sıkıştırılmış parsel dosyası geçersiz veya çok büyük');
  }
  const encoded = Buffer.from(data.payload,'base64');
  if (encoded.length > MAX_PACKED_BYTES) throw new Error('Sıkıştırılmış veri boyutu sınırı aşıldı');
  const json = zlib.gunzipSync(encoded,{maxOutputLength:MAX_UNPACKED_BYTES});
  const result = JSON.parse(json.toString('utf8'));
  if (!validData(result)) throw new Error('Sıkıştırılmış parsel verisi okunamadı');
  return result;
}
module.exports = {PACK_FORMAT,validData,unpack,MAX_PACKED_BYTES,MAX_UNPACKED_BYTES};
