# index.html içindeki görüntüleyici şablonundan goruntule.html üretir. Şablon değişince çalıştırın:
#   python3 tools/goruntule-uret.py
import os
root = os.path.join(os.path.dirname(__file__), '..')
s = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
a = s.index('<script type="text/plain" id="viewerTpl">') + len('<script type="text/plain" id="viewerTpl">')
tpl = s[a:s.index('</script>', a)]
boot = r'''(async function(){
  try {
    var h = location.hash.replace(/^#g=/, ''); if (!h) throw 0;
    var k = h[0], bin = atob(h.slice(1).replace(/\.a/g, '+').replace(/\.b/g, '/').replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    if (k === 'z') u = new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    D = JSON.parse(new TextDecoder().decode(u));
  } catch (e) { document.body.innerHTML = '<p style="padding:24px;font:16px system-ui">Bağlantı geçersiz veya eksik. Gönderen kişiden linki yeniden isteyin.</p>'; return; }
  main();
})();'''
out = tpl.replace('/*BOOT*/', boot).replace('<\\/script>', '</script>')
open(os.path.join(root, 'goruntule.html'), 'w', encoding='utf-8').write(out)
print('goruntule.html', len(out))
