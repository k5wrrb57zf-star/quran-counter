#!/usr/bin/env python3
"""Render review sheets of cut-outs: python3 tools/contact_sheet.py OUTDIR [ids...]"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.load(open(os.path.join(ROOT, "tools", "assets.json")))
out = sys.argv[1]; ids = sys.argv[2:] or list(meta)
os.makedirs(out, exist_ok=True)
T, COLS, PER = 230, 6, 24
font = ImageFont.load_default()
for p in range(0, len(ids), PER):
    chunk = ids[p:p + PER]
    rows = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * T, rows * (T + 16)), (90, 140, 110))
    d = ImageDraw.Draw(sheet)
    for i, sid in enumerate(chunk):
        m = meta.get(sid)
        x, y = (i % COLS) * T, (i // COLS) * (T + 16)
        if m:
            im = Image.open(os.path.join(ROOT, "public", m["cut"])).convert("RGBA")
            im.thumbnail((T - 8, T - 8))
            sheet.paste(im, (x + (T - im.width) // 2, y + (T - im.height) // 2), im)
            d.rectangle([x + (T - im.width) // 2, y + (T - im.height) // 2, x + (T + im.width) // 2, y + (T + im.height) // 2], outline=(255, 255, 0))
        d.text((x + 3, y + T), f"{sid} {'' if not m else m['score']}", fill=(255, 255, 255), font=font)
    sheet.save(os.path.join(out, f"sheet_{p // PER:02d}.jpg"), quality=80)
print("ok")
