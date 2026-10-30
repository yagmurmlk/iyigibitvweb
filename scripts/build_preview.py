#!/usr/bin/env python3
"""Siteyi tek bir HTML dosyasına gömer (CSS + veri + JS). Önizleme paylaşımı için.
Kullanım: python3 scripts/build_preview.py <çıktı.html> [kapak_klasörü/]"""
import re, sys
from pathlib import Path
R = Path(__file__).resolve().parent.parent
html = (R / "index.html").read_text(encoding="utf-8")
css = (R / "assets/css/site.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="assets/css/site.css">', f"<style>{css}</style>")
for js in ("assets/js/data.js", "assets/js/map.js", "assets/js/blog.js", "assets/js/app.js"):
    html = html.replace(f'<script src="{js}"></script>', "<script>" + (R / js).read_text(encoding="utf-8") + "</script>")
# Önizlemede kapaklar ve fotoğraflar yanında yayımlanan dosyalardan gelir
if len(sys.argv) > 2:
    html = html.replace("<script>window.IGTV_DATA", f'<script>window.IGTV_THUMB_BASE = "{sys.argv[2]}";</script>\n<script>window.IGTV_DATA', 1)
html = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>|</head>\s*<body>|</body>\s*</html>", "", html, flags=re.I)
html = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', "", html)
html = '<meta name="claude:viewport-fit-sides" content="cover">\n' + html
Path(sys.argv[1]).write_text(html, encoding="utf-8")
print("yazıldı:", sys.argv[1], len(html) // 1024, "KB")
