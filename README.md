# İyi Gibi TV — Web Sitesi

[@iyigibitv](https://www.youtube.com/@iyigibitv) YouTube kanalının tanıtım sitesi. Derleme gerektirmeyen statik bir site: GitHub Pages, Netlify ya da herhangi bir sunucuda çalışır.

## Sayfalar
| Sekme | Adres | İçerik |
|---|---|---|
| Ana Sayfa | `#anasayfa` | Son video, kanal rakamları, "Neden birlikte keşfediyoruz?", en çok izlenenler, keşif damgaları, Shorts, iş birliği çağrısı |
| Videolar | `#videolar` | 141 video: arama, konu/format filtresi, seriler, sıralama |
| Keşifler | `#kesifler` | Ülke ve yer bazında videolar (pasaport damgaları) |
| Radyoloji & MR | `#radyoloji` | Açık MR, MR güvenliği, bilim tarihi, meslek |
| Hakkımızda | `#hakkimizda` | Hüseyin ve Melike'nin tanıtımları, kanalın hikâyesi |
| İş Birliği | `#isbirligi` | Medya kiti rakamları, iş birliği türleri, iletişim formu |

## Dosyalar
- `index.html`, `assets/css/site.css`, `assets/js/app.js`: site
- `assets/js/data.js`: video verisi (üretilen dosya)
- `data/youtube.json`: YouTube API'den alınan ham veri
- `docs/kanal-analizi.md`: kanal analizi
- `scripts/build_data.py`: `data/youtube.json` → `assets/js/data.js`; konu ve yer eşleştirmeleri burada
- `scripts/build_preview.py`: tek dosyalık önizleme üretir

## Yerelde çalıştırma
```bash
python3 -m http.server 8000
```

## Ayarlar
- İletişim e-postası: `assets/js/app.js` içindeki `CONFIG.email`
- Fotoğraflar: `assets/img/` (bkz. oradaki README)
