#!/usr/bin/env python3
"""Merge subjects.py + assets.json into src/data/subjects.json for the app."""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from subjects import SUBJECTS  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.load(open(os.path.join(ROOT, "tools", "assets.json")))

NOTE_AR = {
    "live-action film version": "نسخة الأفلام الحيّة",
    "1954 original": "النسخة الأصلية 1954",
    "officially 'over 190 cm'": "رسميًا «أكثر من 190 سم»",
    "shoulder height, adult male": "الارتفاع عند الكتف، ذكر بالغ",
    "shoulder height": "الارتفاع عند الكتف",
    "nose to tail tip": "من الأنف حتى طرف الذيل",
    "standing upright": "واقفًا منتصبًا",
    "head-body + tail ≈ 76 cm": "الجسم مع الذيل ≈ 76 سم",
    "height at the withers": "الارتفاع عند الحارك (أعلى الكتفين)",
    "wingspan": "باع الجناحين",
    "body length": "طول الجسم",
    "J300 generation": "الجيل J300",
    "city bus": "حافلة مدينة",
    "Super Heavy + Starship": "المعزّز + المركبة معًا",
    "ground to torch, incl. pedestal": "من الأرض حتى الشعلة مع القاعدة",
    "statue only": "التمثال وحده",
    "elevation above sea level": "الارتفاع عن سطح البحر",
    "height above surrounding plain": "الارتفاع عن السهل المحيط",
    "planet only — rings excluded": "الكوكب فقط دون الحلقات",
    "width between posts": "العرض بين القائمين",
    "rim height": "ارتفاع الحلقة",
    "width": "العرض",
    "screen width": "عرض الشاشة",
}

CONF_RANK = {"official": 0, "measured": 1, "typical": 2, "estimate": 3}

out = []
missing = []
for s in SUBJECTS:
    m = meta.get(s["id"])
    if not m or s.get("skip"):
        missing.append(s["id"])
        continue
    dims = {k: v for k, v in s["dims"].items()}
    fit = s.get("fit")
    if fit:
        axis, frac = fit[0], fit[1]
        key = fit[2] if len(fit) > 2 else ("h" if axis == "h" else "l")
        val = dims.get(key, dims.get("d"))
    elif "l" in dims:
        axis, frac, val = "w", 1.0, dims["l"]
    else:
        axis, frac, val = "h", 1.0, dims.get("h", dims.get("d"))
    span = val / frac  # metres covered by the full image axis
    mpp = span / (m["ch"] if axis == "h" else m["cw"])
    note = s.get("note")
    if note and note not in NOTE_AR:
        print("missing Arabic note:", note)
    out.append(dict(
        id=s["id"], cat=s["cat"], en=s["en"].split(" (")[0] if s["id"] not in ("steve",) else s["en"],
        ar=s["ar"], conf=s["conf"], src=s["src"], tier=s["tier"],
        note=note, noteAr=NOTE_AR.get(note) if note else None,
        dims=dims,
        w=round(m["cw"] * mpp, 9), h=round(m["ch"] * mpp, 9),  # world size of the full cut-out (m)
        cut=m["cut"], ref=m["ref"], cw=m["cw"], ch=m["ch"],
        credit=dict(file=m["file"].replace("File:", ""), page=m["page"], artist=m["artist"],
                    license=m["license"], nonfree=m["nonfree"]),
    ))

json.dump(out, open(os.path.join(ROOT, "src", "data", "subjects.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(f"exported {len(out)} subjects; missing {len(missing)}: {missing}")
