#!/usr/bin/env python3
"""Render cut-outs with height gridlines (fraction from the bottom) to measure `fit`."""
import json, os, sys
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.load(open(os.path.join(ROOT, "tools", "assets.json")))
out, ids = sys.argv[1], sys.argv[2:]
H, tiles = 360, []
for sid in ids:
    im = Image.open(os.path.join(ROOT, "public", meta[sid]["cut"])).convert("RGBA")
    w = max(1, round(im.width * H / im.height)); im = im.resize((w, H))
    t = Image.new("RGB", (w + 70, H + 30), (95, 140, 115)); t.paste(im, (35, 10), im)
    d = ImageDraw.Draw(t)
    for i in range(0, 21):
        y = 10 + H - H * i / 20
        d.line([(0, y), (w + 70, y)], fill=(255, 255, 0) if i % 2 == 0 else (200, 200, 120), width=1)
        if i % 2 == 0: d.text((2, y - 10), f"{i*5}", fill=(255, 255, 255))
    d.text((40, H + 14), sid, fill=(255, 255, 255)); tiles.append(t)
W = sum(t.width for t in tiles); sheet = Image.new("RGB", (W, H + 30)); x = 0
for t in tiles: sheet.paste(t, (x, 0)); x += t.width
sheet.save(out)
