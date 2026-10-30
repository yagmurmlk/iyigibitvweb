#!/usr/bin/env python3
"""Keşif haritası için ülke sınırlarını SVG path'e çevirir → assets/js/map.js

Kaynak: world-atlas@2.0.2 (Natural Earth, 1:50m), npm paketi.
  npm pack world-atlas@2.0.2 && tar xzf world-atlas-2.0.2.tgz
  python3 scripts/build_map.py package/countries-50m.json
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "js" / "map.js"

# Eşdikdörtgen projeksiyon, 39.5° enleme göre düzeltilmiş
LON0, LAT_TOP, K = 25.0, 43.6, 40.0
COS = math.cos(math.radians(39.5))
W = round((50.8 - LON0) * COS * K)
H = round((LAT_TOP - 35.6) * K)
CLAMP = (21.0, 55.0, 33.0, 47.0)  # görünür alanın dışını kenara yapıştır, path küçük kalsın

VISITED = {"Turkey": "TR", "Azerbaijan": "AZ", "Georgia": "GE"}
SHOW = ["Greece", "Bulgaria", "Cyprus", "N. Cyprus", "Syria", "Iraq", "Iran", "Armenia",
        "Russia", "Ukraine", "Kazakhstan", "Turkmenistan", "Turkey", "Azerbaijan", "Georgia"]


def proj(lon, lat):
    lon = min(max(lon, CLAMP[0]), CLAMP[1])
    lat = min(max(lat, CLAMP[2]), CLAMP[3])
    return ((lon - LON0) * COS * K, (LAT_TOP - lat) * K)


def main(src):
    t = json.load(open(src))
    sx, sy = t["transform"]["scale"]
    tx, ty = t["transform"]["translate"]
    arcs = []
    for arc in t["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(idx):
        pts = []
        for i in idx:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts.extend(a if not pts else a[1:])
        return pts

    countries = []
    for g in t["objects"]["countries"]["geometries"]:
        name = g["properties"]["name"]
        if name not in SHOW:
            continue
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        d = []
        for poly in polys:
            for r in poly:
                pts = [proj(*p) for p in ring(r)]
                simp = [pts[0]]
                for p in pts[1:]:
                    if abs(p[0] - simp[-1][0]) + abs(p[1] - simp[-1][1]) >= 1.2:
                        simp.append(p)
                if len(simp) < 4:
                    continue
                xs = [p[0] for p in simp]
                ys = [p[1] for p in simp]
                if max(xs) < -5 or min(xs) > W + 5 or max(ys) < -5 or min(ys) > H + 5:
                    continue
                d.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in simp) + "Z")
        if d:
            countries.append({"name": name, "code": VISITED.get(name), "d": "".join(d)})
    data = {"w": W, "h": H, "lon0": LON0, "latTop": LAT_TOP, "k": K, "cos": COS, "countries": countries}
    OUT.write_text("/* scripts/build_map.py ile üretildi. Harita: Natural Earth (kamu malı). */\nwindow.IGTV_MAP = "
                   + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("yazıldı", OUT, OUT.stat().st_size // 1024, "KB", W, "x", H)


if __name__ == "__main__":
    main(sys.argv[1])
