#!/usr/bin/env python3
"""
Fetch, cut out and export images for every subject in subjects.py.

  python3 tools/build_assets.py [ids...]           # build (cached)
  python3 tools/build_assets.py --force id1 id2     # rebuild given ids

Outputs
  public/img/ref/<hash>.webp   reference photo (opaque)
  public/img/cut/<hash>.webp   transparent cut-out, trimmed to the subject
  tools/assets.json            per-subject image metadata + credits
File names are hashes so they never leak anything about the answer.
"""
import hashlib, io, json, os, re, sys, time, urllib.parse, urllib.request

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from subjects import SUBJECTS  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get("SG_CACHE", "/tmp/claude-0/sg/cache")
OUT_REF = os.path.join(ROOT, "public", "img", "ref")
OUT_CUT = os.path.join(ROOT, "public", "img", "cut")
META = os.path.join(ROOT, "tools", "assets.json")
UA = "SizeGuessGame/1.0 (https://github.com/k5wrrb57zf-star/quran-counter; educational)"
for d in (CACHE, OUT_REF, OUT_CUT):
    os.makedirs(d, exist_ok=True)

_last = [0.0]


def http(url, binary=False, tries=80):
    url = url.replace("://thumb.wikimedia.org/", "://upload.wikimedia.org/")
    if "upload.wikimedia.org" in url:
        url = url.split("?")[0]  # utm_* params bypass the CDN cache and get throttled
    for i in range(tries):
        wait = 0.8 - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504):
                ra = e.headers.get("Retry-After")
                w = min(120, float(ra) if ra and ra.isdigit() else 10) + (5 if i > 6 else 0)
                print(f"    … {e.code} wait {w}s {url[:90]}", flush=True)
                time.sleep(w)
                continue
            raise
        except Exception:
            time.sleep(3 * (i + 1))
    raise RuntimeError("failed: " + url)


STD_WIDTHS = (960, 500, 330, 250, 120)


def std_thumb(info):
    """Wikimedia only serves bots standard thumbnail widths; never fetch originals."""
    url, w = info["url"], info["w"]
    if "/thumb/" in url:
        return url
    m = re.match(r"(https://upload\.wikimedia\.org/wikipedia/[^/]+)/(\w/\w\w/)([^/?]+)", url)
    if not m:
        return url
    width = next((x for x in STD_WIDTHS if x <= w), None)
    if not width:
        return url
    name = m.group(3)
    suffix = ".png" if name.lower().endswith((".svg", ".tif", ".tiff")) else ""
    return f"{m.group(1)}/thumb/{m.group(2)}{name}/{width}px-{name}{suffix}"


def api(host, **p):
    p.setdefault("format", "json")
    p.setdefault("formatversion", "2")
    return http(f"https://{host}/w/api.php?" + urllib.parse.urlencode(p))


def cached_json(key, fn):
    path = os.path.join(CACHE, "q_" + hashlib.sha1(key.encode()).hexdigest() + ".json")
    if os.path.exists(path):
        return json.load(open(path))
    v = fn()
    json.dump(v, open(path, "w"))
    return v


def strip_html(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    return re.sub(r"\s+", " ", s).strip()


def file_info(host, title):
    """imageinfo (thumb url + credits) for a File: page on host."""
    def q():
        r = api(host, action="query", titles=title, prop="imageinfo",
                iiprop="url|size|extmetadata|mime", iiurlwidth=960)
        pages = r["query"]["pages"]
        if not pages or "imageinfo" not in pages[0]:
            return None
        ii = pages[0]["imageinfo"][0]
        em = ii.get("extmetadata", {})
        return dict(
            title=pages[0]["title"], url=ii.get("thumburl") or ii["url"],
            w=ii.get("thumbwidth") or ii["width"], h=ii.get("thumbheight") or ii["height"],
            mime=ii.get("mime"), page=ii.get("descriptionurl"),
            artist=strip_html(em.get("Artist", {}).get("value"))[:120],
            license=strip_html(em.get("LicenseShortName", {}).get("value"))[:60],
            nonfree=em.get("NonFree", {}).get("value") == "true" or "/wikipedia/en/" in ii["url"],
        )
    return cached_json(f"fi|{host}|{title}", q)


def candidates(spec):
    kind, _, arg = spec.partition(":")
    if kind == "w":
        def q():
            r = api("en.wikipedia.org", action="query", titles=arg, redirects=1,
                    prop="pageimages", piprop="name", pilicense="any")
            pages = r["query"]["pages"]
            return pages[0].get("pageimage") if pages else None
        name = cached_json(f"pi|{arg}", q)
        if not name:
            return []
        info = file_info("en.wikipedia.org", "File:" + name)
        return [info] if info else []
    if kind == "f":
        info = file_info("commons.wikimedia.org", "File:" + arg)
        return [info] if info else []
    if kind == "s":
        def q():
            r = api("commons.wikimedia.org", action="query", list="search",
                    srsearch=arg + " filetype:bitmap", srnamespace=6, srlimit=5)
            return [x["title"] for x in r["query"]["search"]]
        titles = [t for t in cached_json(f"cs|{arg}", q) if re.search(r"\.(jpe?g|png|webp)$", t, re.I)]
        need = [t for t in titles if not os.path.exists(os.path.join(
            CACHE, "q_" + hashlib.sha1(f"fi|commons.wikimedia.org|{t}".encode()).hexdigest() + ".json"))]
        if need:  # one batched imageinfo request for all results
            r = api("commons.wikimedia.org", action="query", titles="|".join(need), prop="imageinfo",
                    iiprop="url|size|extmetadata|mime", iiurlwidth=960)
            for pg in r["query"]["pages"]:
                if "imageinfo" not in pg:
                    continue
                ii = pg["imageinfo"][0]
                em = ii.get("extmetadata", {})
                info = dict(
                    title=pg["title"], url=ii.get("thumburl") or ii["url"],
                    w=ii.get("thumbwidth") or ii["width"], h=ii.get("thumbheight") or ii["height"],
                    mime=ii.get("mime"), page=ii.get("descriptionurl"),
                    artist=strip_html(em.get("Artist", {}).get("value"))[:120],
                    license=strip_html(em.get("LicenseShortName", {}).get("value"))[:60],
                    nonfree=em.get("NonFree", {}).get("value") == "true",
                )
                json.dump(info, open(os.path.join(CACHE, "q_" + hashlib.sha1(
                    f"fi|commons.wikimedia.org|{pg['title']}".encode()).hexdigest() + ".json"), "w"))
        out = []
        for t in titles:
            info = file_info("commons.wikimedia.org", t)
            if info:
                out.append(info)
        return out
    raise ValueError(spec)


_sessions = {}
HEAVY = {"nature", "landmarks"}


def segment(img, model):
    """Returns RGBA with alpha = subject mask. Uses existing alpha when present."""
    if img.mode in ("RGBA", "LA", "P"):
        rgba = img.convert("RGBA")
        a = np.asarray(rgba)[:, :, 3]
        if (a < 10).mean() > 0.05:  # already a cut-out
            return rgba, "alpha"
    if model not in _sessions:
        from rembg import new_session
        _sessions[model] = new_session(model)
    from rembg import remove
    out = remove(img.convert("RGB"), session=_sessions[model])
    return out.convert("RGBA"), "rembg"


def evaluate(rgba):
    a = np.asarray(rgba)[:, :, 3].astype(np.float32) / 255.0
    H, W = a.shape
    m = a > 0.5
    if m.sum() < 50:
        return None
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    tol_y, tol_x = max(2, H * 0.006), max(2, W * 0.006)
    touch = dict(top=y0 <= tol_y, bottom=y1 >= H - 1 - tol_y, left=x0 <= tol_x, right=x1 >= W - 1 - tol_x)
    # area of the largest blob vs everything: penalise many disconnected fragments
    cover = m.mean()
    bbox_fill = m[y0:y1 + 1, x0:x1 + 1].mean()
    return dict(touch=[k for k, v in touch.items() if v], cover=round(float(cover), 3),
                fill=round(float(bbox_fill), 3), bbox=[int(x0), int(y0), int(x1), int(y1)])


def score(ev, sub, how):
    if ev is None:
        return -99
    s = 0.0
    allowed = {"bottom", "left", "right"} if sub["cat"] == "nature" else set()
    if how == "alpha":  # artwork that is already cut out is normally trimmed tight
        allowed = {"top", "bottom", "left", "right"}
    bad = [t for t in ev["touch"] if t not in allowed]
    s -= 3 * len(bad)
    dims = sub["dims"]
    if "l" in dims and "h" in dims:  # side view check: aspect must match L/H
        x0, y0, x1, y1 = ev["bbox"]
        dev = abs(np.log(((x1 - x0 + 1) / (y1 - y0 + 1)) / (dims["l"] / dims["h"])))
        ev["aspect_dev"] = round(float(dev), 3)
        if dev > 0.12:
            s -= 2
        if dev > 0.25:
            s -= 3
    if ev["cover"] < 0.04:
        s -= 3
    if ev["cover"] > 0.92:
        s -= 4
    if ev["fill"] < 0.12:
        s -= 1
    return s


def trim(rgba, pad=0):
    a = np.asarray(rgba)[:, :, 3]
    # remove faint halo noise before computing bbox
    ys, xs = np.where(a > 40)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    return rgba.crop((max(0, x0 - pad), max(0, y0 - pad), x1 + 1 + pad, y1 + 1 + pad))


def fit_max(img, side):
    w, h = img.size
    k = min(1.0, side / max(w, h))
    return img.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS) if k < 1 else img


def build(sub, force=False, prev=None):
    sid = sub["id"]
    if prev and not force and os.path.exists(os.path.join(ROOT, "public", prev["cut"])):
        return prev
    tried = []
    best = None
    specs = list(sub["img"])
    if "l" in sub["dims"] and "h" in sub["dims"]:
        specs.append(f"s:{sub['en']} side view")
    model = sub.get("model") or ("birefnet-general-lite" if sub["cat"] in HEAVY else "isnet-general-use")
    for spec in specs:
        try:
            cands = candidates(spec)
        except Exception as e:
            print(f"  ! {sid} {spec}: {e}")
            continue
        for info in cands:
            raw_path = os.path.join(CACHE, "img_" + hashlib.sha1(info["url"].encode()).hexdigest())
            if not os.path.exists(raw_path):
                try:
                    blob = http(std_thumb(info), binary=True)
                    with open(raw_path + ".part", "wb") as fh:
                        fh.write(blob)
                    os.replace(raw_path + ".part", raw_path)
                except Exception as e:
                    print(f"  ! download {info['url']}: {e}")
                    continue
            try:
                img = Image.open(raw_path)
                img.load()
            except Exception:
                continue
            crop = sub.get("crop")
            if crop:  # fractional (x0, y0, x1, y1) crop of the source before cutting out
                W0, H0 = img.size
                img = img.crop((int(crop[0] * W0), int(crop[1] * H0), int(crop[2] * W0), int(crop[3] * H0)))
            cut_cache = f"{raw_path}.{model}{'.c' + '_'.join(map(str, crop)) if crop else ''}.png"
            how_cache = cut_cache + ".how"
            if os.path.exists(cut_cache) and os.path.exists(how_cache):
                rgba, how = Image.open(cut_cache).convert("RGBA"), open(how_cache).read()
            else:
                rgba, how = segment(img, model)
                rgba.save(cut_cache)
                open(how_cache, "w").write(how)
            ev = evaluate(rgba)
            sc = score(ev, sub, how)
            tried.append(dict(title=info["title"], score=sc, ev=ev, how=how))
            if best is None or sc > best[0]:
                best = (sc, info, img, rgba, ev)
            if sc >= 0:
                break
        if best and best[0] >= 0:
            break
    if not best:
        print(f"  ✗ {sid}: no image")
        return None
    sc, info, img, rgba, ev = best
    h = hashlib.sha1(("sg-v1|" + sid).encode()).hexdigest()[:12]
    cut = fit_max(trim(rgba), 900)
    ref = fit_max(img.convert("RGB") if img.mode != "RGBA" else img, 720)
    if ref.mode == "RGBA":  # flatten transparent art onto a neutral card colour
        bg = Image.new("RGBA", ref.size, (238, 236, 232, 255))
        bg.alpha_composite(ref)
        ref = bg.convert("RGB")
    cut_rel, ref_rel = f"img/cut/{h}.webp", f"img/ref/{h}.webp"
    cut.save(os.path.join(ROOT, "public", cut_rel), "WEBP", quality=84, method=6)
    ref.save(os.path.join(ROOT, "public", ref_rel), "WEBP", quality=78, method=6)
    flag = "" if sc >= 0 else f"  ⚠ score {sc} {ev}"
    print(f"  ✓ {sid}: {info['title']} [{cut.size[0]}x{cut.size[1]}]{flag}", flush=True)
    return dict(cut=cut_rel, ref=ref_rel, cw=cut.size[0], ch=cut.size[1], rw=ref.size[0], rh=ref.size[1],
                file=info["title"], page=info["page"], artist=info["artist"], license=info["license"],
                nonfree=info["nonfree"], score=sc, ev=ev, tried=tried)


def prefetch(subs):
    """Batch-resolve all "w:" lead images and their file info (50 per request)."""
    titles = []
    for sub in subs:
        for spec in sub["img"]:
            if spec.startswith("w:"):
                key = os.path.join(CACHE, "q_" + hashlib.sha1(f"pi|{spec[2:]}".encode()).hexdigest() + ".json")
                if not os.path.exists(key):
                    titles.append(spec[2:])
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        r = api("en.wikipedia.org", action="query", titles="|".join(chunk), redirects=1,
                prop="pageimages", piprop="name", pilicense="any")
        q = r["query"]
        alias = {t: t for t in chunk}
        for n in q.get("normalized", []):
            alias[n["from"]] = n["to"]
        redir = {x["from"]: x["to"] for x in q.get("redirects", [])}
        found = {p["title"]: p.get("pageimage") for p in q["pages"]}
        for t in chunk:
            tt = alias[t]
            tt = redir.get(tt, tt)
            key = os.path.join(CACHE, "q_" + hashlib.sha1(f"pi|{t}".encode()).hexdigest() + ".json")
            json.dump(found.get(tt), open(key, "w"))
    files = []
    for sub in subs:
        for spec in sub["img"]:
            if spec.startswith("w:"):
                key = os.path.join(CACHE, "q_" + hashlib.sha1(f"pi|{spec[2:]}".encode()).hexdigest() + ".json")
                name = json.load(open(key))
                if name:
                    fk = os.path.join(CACHE, "q_" + hashlib.sha1(f"fi|en.wikipedia.org|File:{name}".encode()).hexdigest() + ".json")
                    if not os.path.exists(fk):
                        files.append("File:" + name)
    files = list(dict.fromkeys(files))
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        r = api("en.wikipedia.org", action="query", titles="|".join(chunk), prop="imageinfo",
                iiprop="url|size|extmetadata|mime", iiurlwidth=960)
        q = r["query"]
        back = {}
        for n in q.get("normalized", []):
            back[n["to"]] = n["from"]
        for pg in q["pages"]:
            if "imageinfo" not in pg:
                continue
            ii = pg["imageinfo"][0]
            em = ii.get("extmetadata", {})
            info = dict(
                title=pg["title"], url=ii.get("thumburl") or ii["url"],
                w=ii.get("thumbwidth") or ii["width"], h=ii.get("thumbheight") or ii["height"],
                mime=ii.get("mime"), page=ii.get("descriptionurl"),
                artist=strip_html(em.get("Artist", {}).get("value"))[:120],
                license=strip_html(em.get("LicenseShortName", {}).get("value"))[:60],
                nonfree=em.get("NonFree", {}).get("value") == "true" or "/wikipedia/en/" in ii["url"],
            )
            orig = back.get(pg["title"], pg["title"])
            for t in {orig, pg["title"]}:
                fk = os.path.join(CACHE, "q_" + hashlib.sha1(f"fi|en.wikipedia.org|{t}".encode()).hexdigest() + ".json")
                json.dump(info, open(fk, "w"))
    print("prefetched", len(titles), "titles,", len(files), "files", flush=True)


def main():
    args = sys.argv[1:]
    force = "--force" in args
    ids = [a for a in args if not a.startswith("--")]
    meta = json.load(open(META)) if os.path.exists(META) else {}
    prefetch([x for x in SUBJECTS if not ids or x["id"] in ids])
    for sub in SUBJECTS:
        if (ids and sub["id"] not in ids) or sub.get("skip"):
            continue
        heavy = (sub.get("model") or ("birefnet-general-lite" if sub["cat"] in HEAVY else "")) .startswith("birefnet")
        if os.environ.get("SG_PASS") == "light" and heavy or os.environ.get("SG_PASS") == "heavy" and not heavy:
            continue
        r = build(sub, force=force and (not ids or sub["id"] in ids), prev=meta.get(sub["id"]))
        if r:
            meta[sub["id"]] = r
        json.dump(meta, open(META, "w"), indent=1, ensure_ascii=False)
    print("done", len(meta))


if __name__ == "__main__":
    main()
