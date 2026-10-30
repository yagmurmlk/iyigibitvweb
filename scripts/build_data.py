#!/usr/bin/env python3
"""data/youtube.json dosyasından sitenin kullandığı assets/js/data.js dosyasını üretir.

Her videoya bir konu (topic) ve varsa bir yer (place) atar.
Yeni video eklendiğinde: data/youtube.json güncellenir, sonra bu betik çalıştırılır.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "youtube.json"
OUT = ROOT / "assets" / "js" / "data.js"

# Yerler: Keşifler sayfasındaki "pasaport damgaları". Sıra önemli: ilk eşleşen kazanır.
PLACES = [
    # id, ad, ülke, koordinat, regex
    ("lenkeran", "Lənkəran", "AZ", "38.75°K 48.85°D", r"lenkeran|lənkəran|talysh"),
    ("seki", "Şəki", "AZ", "41.19°K 47.17°D", r"şeki qala|şəki qala"),
    ("qobustan", "Qobustan", "AZ", "40.08°K 49.40°D", r"qobustan"),
    ("goygol", "Göygöl & kamp rotaları", "AZ", "40.41°K 46.32°D", r"göygöl|maralgöl|camping|azerbaycan kampı"),
    ("baku", "Bakü", "AZ", "40.41°K 49.87°D",
     r"bak[uüı]|bakı|içərişəhər|sederek|vasmoy|christmas market|nevruz|papaq|marathon|honey expo|"
     r"cars & coffee|araba fiyat|bilgi yarışma|hərbi|hayat pahalı|ateshgah|antep mutfağı|"
     r"şaxta|narnumru|qələbə|azerbaijan|azerbaycan"),
    ("tiflis", "Tiflis", "GE", "41.72°K 44.79°D", r"tiflis|tbilisi|georgia|gürcistan"),
    ("ayvalik", "Ayvalık & Cunda", "TR", "39.32°K 26.69°D", r"ayvalık|cunda|karavan|tımarhane|macaron|boşnak"),
    ("ankara", "Ankara & çevresi", "TR", "39.93°K 32.86°D", r"ankara|kızılcahamam|beypazarı|ayaş"),
    ("sakarya", "Sakarya", "TR", "40.78°K 30.40°D", r"sakarya|hendek"),
    ("duzce", "Düzce", "TR", "40.84°K 31.16°D", r"binef|düzce"),
    ("kayseri", "Kayseri → Antalya", "TR", "38.72°K 35.49°D", r"kayseri’de başladı|kayseri'de başladı"),
    ("deprem", "Kahramanmaraş & Hatay", "TR", "37.37°K 37.05°D", r"deprem|pazarcık|kahramanmaraş|hatay|antakya|unutmadık"),
]

# Konular: Videolar sayfasındaki filtreler. Sıra önemli.
TOPICS = [
    ("radyoloji", r"radyoloji|radiology|\bmr\b|\bmri\b|emar|tomografi"),
    ("unutmadik", r"deprem|pazarcık|kahramanmaraş|hatay|antakya|unutmadık|kızılay"),
    ("mutfak", r"tarif|donut|waffle|pide|kaşar|peynir|yağlama|karpatka|cookie|kurabiye|çikolatadan|"
               r"osmanlı mutfağı|kavundan|narnumru|macaron"),
]

# Elle düzeltmeler (regex'in yanıldığı videolar).
TOPIC_OVERRIDE = {
    "mBT6HYNxPh8": "radyoloji",   # Azerbaycan'da Radyoloji Teknikeri Olmak
    "-D4IWs3zmGg": "gezi",        # Azerbaycan'da Antep Mutfağı (mekân videosu)
    "noCjfivVk_4": "gezi",        # Şeki Qala Restoran
    "74a9Eel7UOE": "gezi",        # Kayseri'den Antalya'ya yol vlogu
    "LL6EIkXvAgs": "gezi",        # Ayvalık sokakları
    "QaKc06kt6Aw": "mutfak", "va_J-yggi14": "mutfak", "D43vkoYW8tU": "mutfak",
    "rvaUVMl1gwc": "gunluk",      # saç örgüsü
    "9KuWghAfRVw": "gunluk", "ivY8jWpcT4I": "gunluk", "KZJeAWuJoeg": "gunluk",
    "W5-eJk3R66E": "gunluk",
}
PLACE_OVERRIDE = {
    "Mdn7ekYogXY": None, "QaKc06kt6Aw": None, "va_J-yggi14": None, "D43vkoYW8tU": None,
    "rvaUVMl1gwc": None, "78HhZgIAYcM": None, "J5sSP9gIJJU": None, "9KuWghAfRVw": None,
    "ivY8jWpcT4I": None, "KZJeAWuJoeg": None, "W5-eJk3R66E": None,
    "mBT6HYNxPh8": "baku",
    "6j44c8nRdMA": "goygol",      # Azerbaycan kampı
    "uco80SPFpIc": "baku",        # Honey Expo (Bakü)
    "0yXwv-g_nAI": "baku",        # At çiftliği (Azerbaycan)
    "82yYXFIBT38": "baku",        # Sederek kamp alışverişi
    "r5AI-ofMY3I": "baku", "YvXmo_7_YM0": "baku", "QNPH1XS7bCM": "baku",
    "ravHRDHMXGE": "baku", "VFfqTQIedFY": "baku", "RT-3-xwQ-pA": "baku",
    "5gteLZxCRFc": "ayvalik",     # Ayvalık'ta Karavan Hayatı
    "kyvzNTmrvd0": "ayvalik",
    "QNxegHZiuXk": "ayvalik", "oNYMpmm1DDs": "ayvalik", "hwKIuoN__go": "ayvalik",
    "Gql7ExX0NV0": "ayvalik",     # Boşnak köyü (Ayvalık Küçükköy)
    "iD3hJnDvDqU": "ankara",
    "csCY2Lm1JGI": "duzce",
    "74a9Eel7UOE": "kayseri",
    "MlODV3RT370": "sakarya",
    "QaM8xSZizZs": "tiflis", "r4_E1h4j6_Q": "tiflis", "l40yrBS7qIU": "tiflis", "HfETaukPkL8": "tiflis",
    "k9ORN5b7nJs": "deprem",
}

COUNTRY = {"AZ": "Azerbaycan", "TR": "Türkiye", "GE": "Gürcistan"}


def text_of(v):
    # Önce başlık: açıklamalardaki genel etiketler (#AzerbaycanMutfak vb.) yanıltıcı.
    return v["title"].lower()


def find_place(v):
    if v["id"] in PLACE_OVERRIDE:
        return PLACE_OVERRIDE[v["id"]]
    t = text_of(v)
    for pid, *_rest, rx in PLACES:
        if re.search(rx, t):
            return pid
    return None


def find_topic(v, place):
    if v["id"] in TOPIC_OVERRIDE:
        return TOPIC_OVERRIDE[v["id"]]
    t = text_of(v)
    for tid, rx in TOPICS:
        if re.search(rx, t):
            return tid
    if place:
        return "gezi"
    return "gunluk"


def main():
    d = json.loads(SRC.read_text(encoding="utf-8"))
    videos = []
    for v in d["videos"]:
        place = find_place(v)
        topic = find_topic(v, place)
        if topic in ("radyoloji", "gunluk") and v["id"] not in PLACE_OVERRIDE:
            place = None
        country = next((p[2] for p in PLACES if p[0] == place), None)
        desc = re.split(r"\n\s*\n|#", v["description"].strip())[0].strip()
        videos.append({
            "id": v["id"],
            "title": v["title"].strip(),
            "date": v["publishedAt"][:10],
            "sec": v["durationSec"],
            "short": v["isShort"],
            "views": v["views"],
            "likes": v["likes"],
            "comments": v["comments"],
            "topic": topic,
            "place": place,
            "country": country,
            "desc": desc[:280],
        })
    data = {
        "channel": {
            **{k: d["channel"][k] for k in ("id", "title", "handle", "description", "publishedAt")},
            "subscribers": int(d["channel"]["stats"]["subscriberCount"]),
            "views": int(d["channel"]["stats"]["viewCount"]),
            "videoCount": int(d["channel"]["stats"]["videoCount"]),
            "updated": "2026-10-30",
        },
        "places": [{"id": p[0], "name": p[1], "country": p[2], "countryName": COUNTRY[p[2]],
                    "lat": float(p[3].split("°")[0]), "lon": float(p[3].split(" ")[1].split("°")[0])} for p in PLACES],
        "playlists": [{"id": p["id"], "title": p["title"], "description": p["description"], "videoIds": p["videoIds"]} for p in d["playlists"]],
        "videos": videos,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("/* scripts/build_data.py ile üretildi, elle düzenlemeyin. */\nwindow.IGTV_DATA = "
                   + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    # Kontrol çıktısı
    from collections import Counter
    print("konu:", Counter(v["topic"] for v in videos))
    print("yer:", Counter(v["place"] for v in videos))


if __name__ == "__main__":
    main()
