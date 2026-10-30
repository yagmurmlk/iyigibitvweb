# İyi Gibi TV — Web Sitesi

[@iyigibitv](https://www.youtube.com/@iyigibitv) YouTube kanalının tanıtım sitesi. Derleme gerektirmeyen statik bir site: GitHub Pages, Netlify ya da herhangi bir sunucuda çalışır.

## Sayfalar
| Sekme | Adres | İçerik |
|---|---|---|
| Ana Sayfa | `#anasayfa` | Durakları birbirine bağlayan, kaydırdıkça çizilen rota çizgisi: son yolculuk, keşif haritası, en çok izlenenler, üç kural, kısa videolar, biz, iş birliği |
| Videolar | `#videolar` | 141 video: arama, konu/format filtresi, seriler, sıralama. Altında Radyoloji köşesi (`#radyoloji` bağlantısı buraya gelir) |
| Keşfettiğimiz Yerler | `#kesifler` | Gerçek harita üzerinde gidilen yerler, ülke ve yer bazında videolar |
| Hakkımızda | `#hakkimizda` | İkisini birlikte anlatan sayfa: ortak giriş, yan yana iki ses, birlikte fotoğraf albümü, ortak yetenekler, hikâye |
| İş Birliği | `#isbirligi` | Medya kiti rakamları, iş birliği türleri, iletişim formu |

## Dosyalar
- `index.html`, `assets/css/site.css`, `assets/js/app.js`: site
- `assets/js/data.js`: video verisi (üretilen dosya)
- `data/youtube.json`: YouTube API'den alınan ham veri
- `docs/kanal-analizi.md`: kanal analizi
- `scripts/build_data.py`: `data/youtube.json` → `assets/js/data.js`; konu ve yer eşleştirmeleri burada
- `scripts/build_map.py`: keşif haritasını üretir (`assets/js/map.js`, Natural Earth verisi)
- `scripts/build_preview.py`: tek dosyalık önizleme üretir

## Yerelde çalıştırma
```bash
python3 -m http.server 8000
```

## Ayarlar
- İletişim e-postası: `assets/js/app.js` içindeki `CONFIG.email`
- Fotoğraflar: `assets/img/` (bkz. oradaki README). Şimdiki portreler video kapaklarından kırpılmış geçici görsellerdir.
