# TKGM aracı sunucu (Cloudflare Worker) kurulumu — ~5 dakika, ücretsiz

1. https://dash.cloudflare.com adresinde ücretsiz hesap açın.
2. Sol menü: **Workers & Pages → Create → Create Worker** → ad: `tkgm-proxy` → **Deploy**.
3. **Edit code** deyin, içindekileri silin, `worker.js` içeriğini yapıştırın → **Deploy**.
4. Çıkan adres (örn. `https://tkgm-proxy.KULLANICI.workers.dev`) tarayıcıda açılınca "TKGM proxy calisiyor" yazmalı.
5. Uygulamada **Ayarlar → Servis adresi** alanına bu adresi yazın (sonunda / olmadan). Eşzamanlı: 1 veya 2.
Not: İlk sorgu TKGM'ye gider, sonrakiler önbellekten gelir (il/ilçe/mahalle 30 gün, parsel 7 gün).
