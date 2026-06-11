#!/usr/bin/env python3
"""contact.py — build labelled contact-sheet montages for verification.

For each property under screenshots/<prop>/ produce one or more montage pages
under _verify/contact/<prop>[.N].png. Every value of the property becomes a
labelled cell so a multimodal reviewer can judge correctness + distinctness of
all values at a glance (no byte comparison). Temporal values (frame-*.png dirs)
become a 3-frame filmstrip cell; static values use their PNG(s).

  python3 contact.py                 # all properties
  python3 contact.py display flex    # only these properties
Idempotent: overwrites pages it regenerates.
"""
import os, sys, glob, json, re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")
OUT = os.path.join(HERE, "_verify", "contact")
VALUES = json.load(open(os.path.join(HERE, "generated", "values.json")))

BG = (16, 17, 22)
CARD = (26, 26, 46)
FG = (232, 232, 240)
SUB = (150, 152, 168)
COLS = 4
ROWS = 5                      # 20 cells per page
CELL_W, IMG_H, LABEL_H = 340, 250, 56
PAD = 10

def font(sz, bold=False):
    cands = [
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for c in cands:
        if os.path.exists(c):
            try: return ImageFont.truetype(c, sz)
            except Exception: pass
    return ImageFont.load_default()

F_VAL = font(15)
F_IDX = font(13)

def frames(d):
    fs = sorted(glob.glob(os.path.join(d, "frame-*.png")))
    if not fs: return []
    if len(fs) <= 3: return fs
    return [fs[0], fs[len(fs)//2], fs[-1]]

def panels_for(propdir, idx):
    """Return (list of PIL images, is_temporal) for value index idx."""
    pre = f"{idx:02d}-"
    imgs, temporal = [], False
    # static png(s) for this index (may be 1-2 permutation variants)
    pngs = sorted(p for p in glob.glob(os.path.join(propdir, pre + "*.png"))
                  if os.path.isfile(p))
    for p in pngs[:2]:
        try: imgs.append(Image.open(p).convert("RGB"))
        except Exception: pass
    if not imgs:
        # temporal: a NN-slug/ frame dir
        dirs = [d for d in glob.glob(os.path.join(propdir, pre + "*")) if os.path.isdir(d)]
        if dirs:
            temporal = True
            for fr in frames(dirs[0]):
                try: imgs.append(Image.open(fr).convert("RGB"))
                except Exception: pass
    return imgs, temporal

def compose_cell(imgs, temporal, idx, val):
    cell = Image.new("RGB", (CELL_W, IMG_H + LABEL_H), CARD)
    if imgs:
        # lay panels side by side, scaled to common height, fit into CELL_W
        h = IMG_H - 2 * PAD
        scaled = []
        for im in imgs:
            w = max(1, int(im.width * h / im.height))
            scaled.append(im.resize((w, h)))
        gap = 6
        tot = sum(s.width for s in scaled) + gap * (len(scaled) - 1)
        if tot > CELL_W - 2 * PAD:
            f = (CELL_W - 2 * PAD) / tot
            scaled = [s.resize((max(1, int(s.width * f)), max(1, int(s.height * f)))) for s in scaled]
            tot = sum(s.width for s in scaled) + gap * (len(scaled) - 1)
        x = (CELL_W - tot) // 2
        y0 = PAD + (h - (scaled[0].height if scaled else h)) // 2
        for s in scaled:
            cell.paste(s, (x, PAD + (h - s.height) // 2))
            x += s.width + gap
    else:
        d = ImageDraw.Draw(cell)
        d.text((PAD, IMG_H // 2), "(no image)", fill=SUB, font=F_VAL)
    d = ImageDraw.Draw(cell)
    tag = f"[{idx}]" + ("  ~temporal" if temporal else "")
    d.text((PAD, IMG_H + 6), tag, fill=SUB, font=F_IDX)
    s = val if len(val) <= 44 else val[:43] + "…"
    d.text((PAD, IMG_H + 24), s, fill=FG, font=F_VAL)
    return cell

def num_values(propdir, vals):
    # highest index present on disk (handles permutation variants & frame dirs)
    mx = -1
    for p in glob.glob(os.path.join(propdir, "[0-9][0-9]-*")):
        m = re.match(r"(\d+)-", os.path.basename(p))
        if m: mx = max(mx, int(m.group(1)))
    return max(mx + 1, len(vals))

def write_values_sidecar(prop, vals, n):
    vdir = os.path.join(HERE, "_verify", "values")
    os.makedirs(vdir, exist_ok=True)
    with open(os.path.join(vdir, prop + ".txt"), "w") as f:
        f.write(f"{prop} — {n} values (index: value)\n")
        for i in range(n):
            v = vals[i] if i < len(vals) else "(unknown)"
            f.write(f"{i:2d}: {v}\n")

def build(prop):
    propdir = os.path.join(SHOTS, prop)
    if not os.path.isdir(propdir): return 0
    vals = VALUES.get(prop, [])
    n = num_values(propdir, vals)
    write_values_sidecar(prop, vals, n)
    cells = []
    for i in range(n):
        imgs, temporal = panels_for(propdir, i)
        val = vals[i] if i < len(vals) else f"(value {i})"
        cells.append(compose_cell(imgs, temporal, i, val))
    if not cells: return 0
    per = COLS * ROWS
    pages = (len(cells) + per - 1) // per
    os.makedirs(OUT, exist_ok=True)
    for pg in range(pages):
        chunk = cells[pg * per:(pg + 1) * per]
        rows = (len(chunk) + COLS - 1) // COLS
        W = COLS * CELL_W + (COLS + 1) * PAD
        title_h = 34
        H = title_h + rows * (IMG_H + LABEL_H) + (rows + 1) * PAD
        page = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(page)
        ttl = f"{prop}  —  {len(cells)} values"
        if pages > 1: ttl += f"  (page {pg+1}/{pages})"
        d.text((PAD, 8), ttl, fill=FG, font=font(18))
        for j, cell in enumerate(chunk):
            r, c = divmod(j, COLS)
            x = PAD + c * (CELL_W + PAD)
            y = title_h + PAD + r * (IMG_H + LABEL_H + PAD)
            page.paste(cell, (x, y))
        name = prop + (f".{pg+1}" if pages > 1 else "") + ".png"
        page.save(os.path.join(OUT, name))
    return pages

if __name__ == "__main__":
    props = sys.argv[1:] or sorted(
        d for d in os.listdir(SHOTS) if os.path.isdir(os.path.join(SHOTS, d)))
    total = 0
    for p in props:
        try:
            total += build(p)
        except Exception as e:
            print(f"  ! {p}: {e}", file=sys.stderr)
    print(f"Wrote contact sheets for {len(props)} properties ({total} pages) -> {OUT}")
