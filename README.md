# İyi Gibi TV — Web Sitesi

Canlı site: https://yagmurmlk.github.io/iyigibitvweb/

[@iyigibitv](https://www.youtube.com/@iyigibitv) YouTube kanalının tanıtım sitesi. Derleme gerektirmeyen statik bir site: GitHub Pages, Netlify ya da herhangi bir sunucuda çalışır.

## Sayfalar
| Sekme | Adres | İçerik |
|---|---|---|
| Ana Sayfa | `#anasayfa` | Durakları birbirine bağlayan, kaydırdıkça çizilen rota çizgisi: son yolculuk, keşif haritası, en çok izlenenler, üç kural, kısa videolar, biz, iş birliği |
| Videolar | `#videolar` | 141 video: arama, konu/format filtresi, seriler, sıralama. Altında Radyoloji köşesi (`#radyoloji` bağlantısı buraya gelir) |
| Keşfettiğimiz Yerler | `#kesifler` | Gerçek harita üzerinde gidilen yerler, ülke ve yer bazında videolar |
| Blog | `#blog`, `#blog-<yazı>` | Videolara bağlı yazılar: gezi rehberleri, yol hikâyeleri, tarih, radyoloji. Yazılar `assets/js/blog.js` dosyasında |
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

## Otomatik güncelleme
`.github/workflows/site.yml` her gün 09:17'de (Türkiye saati) çalışır:
1. `scripts/fetch_youtube.py` YouTube'dan kanal, video ve oynatma listesi verisini çeker (`data/youtube.json`).
2. `scripts/build_data.py` sitenin veri dosyasını üretir (`assets/js/data.js`).
3. Değişiklik varsa kaydedilir ve site yayına alınır.

Dala her kod gönderildiğinde de site yeniden yayınlanır. Actions sekmesinden "Run workflow" ile elle de çalıştırılabilir.

Kurulum (bir kez):
- **Settings → Secrets and variables → Actions → New repository secret:** ad `YOUTUBE_API_KEY`, değer YouTube Data API anahtarı.
- **Settings → Pages → Build and deployment → Source:** `GitHub Actions`.

Yeni bir videonun yanlış konu ya da yere düştüğünü görürseniz kurallar `scripts/build_data.py` içindeki `PLACES`, `TOPICS` ve elle düzeltme listelerindedir.
