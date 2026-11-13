#!/usr/bin/env python3
"""YouTube Data API v3'ten kanal, video ve oynatma listesi verisini çeker → data/youtube.json

Anahtar ortam değişkeninden okunur, dosyaya yazılmaz:
  YOUTUBE_API_KEY=... python3 scripts/fetch_youtube.py

Kota: tüm kanal için yaklaşık 15-20 birim (günlük ücretsiz kota 10.000).
Altyazı listesi kotayı çok harcadığı için çekilmez; önceki dosyadaki bilgi korunur.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "youtube.json"
HANDLE = "iyigibitv"
API = "https://www.googleapis.com/youtube/v3/"


def api(key, endpoint, **params):
    params["key"] = key
    url = API + endpoint + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        # Anahtar hata mesajına karışmasın diye yalnızca API'nin cevabı yazdırılır
        sys.exit(f"YouTube API hatası ({endpoint}): {e.code} {e.read().decode()[:500]}")


def paged(key, endpoint, **params):
    items, token = [], None
    while True:
        r = api(key, endpoint, maxResults=50, **({"pageToken": token} if token else {}), **params)
        items += r.get("items", [])
        token = r.get("nextPageToken")
        if not token:
            return items


def seconds(iso):
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    d, h, mi, s = (int(g or 0) for g in m.groups()) if m else (0, 0, 0, 0)
    return d * 86400 + h * 3600 + mi * 60 + s


def main():
    key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not key:
        sys.exit("YOUTUBE_API_KEY tanımlı değil.")

    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"videos": []}
    old_caps = {v["id"]: v.get("captionTracks", []) for v in old.get("videos", [])}

    ch = api(key, "channels", part="snippet,statistics,contentDetails", forHandle=HANDLE)["items"][0]
    uploads = ch["contentDetails"]["relatedPlaylists"]["uploads"]
    ids = [i["contentDetails"]["videoId"] for i in paged(key, "playlistItems", part="contentDetails", playlistId=uploads)]

    videos = []
    for i in range(0, len(ids), 50):
        videos += api(key, "videos", part="snippet,statistics,contentDetails", id=",".join(ids[i:i + 50]))["items"]

    playlists = paged(key, "playlists", part="snippet", channelId=ch["id"])
    for p in playlists:
        p["videoIds"] = [i["contentDetails"]["videoId"] for i in paged(key, "playlistItems", part="contentDetails", playlistId=p["id"])]

    def thumb(sn):
        t = sn.get("thumbnails", {})
        return (t.get("maxres") or t.get("high") or t.get("medium") or t.get("default") or {}).get("url", "")

    out = {
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "channel": {
            "id": ch["id"],
            "title": ch["snippet"]["title"],
            "handle": ch["snippet"].get("customUrl"),
            "description": ch["snippet"]["description"],
            "publishedAt": ch["snippet"]["publishedAt"],
            "stats": ch["statistics"],
            "thumbnail": ch["snippet"]["thumbnails"]["high"]["url"],
        },
        "playlists": [{"id": p["id"], "title": p["snippet"]["title"], "description": p["snippet"]["description"], "videoIds": p["videoIds"]} for p in playlists],
        "videos": [],
    }
    for v in sorted(videos, key=lambda v: v["snippet"]["publishedAt"], reverse=True):
        sec = seconds(v["contentDetails"].get("duration"))
        st = v.get("statistics", {})
        out["videos"].append({
            "id": v["id"],
            "title": v["snippet"]["title"],
            "publishedAt": v["snippet"]["publishedAt"],
            "durationSec": sec,
            "isShort": sec < 180,
            "views": int(st.get("viewCount", 0)),
            "likes": int(st.get("likeCount", 0)),
            "comments": int(st.get("commentCount", 0)),
            "tags": v["snippet"].get("tags", []),
            "description": v["snippet"]["description"],
            "thumbnail": thumb(v["snippet"]),
            "captionTracks": old_caps.get(v["id"], []),
        })

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    new = [v["id"] for v in out["videos"] if v["id"] not in old_caps]
    print(f"{len(out['videos'])} video, {len(out['playlists'])} oynatma listesi. Yeni: {len(new)} {new}")


if __name__ == "__main__":
    main()
