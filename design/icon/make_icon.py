#!/usr/bin/env python3
"""Builds Delt.icon, delt's Liquid Glass icon in the blueprint "developer tool" style.

A glass pyramid stands on drafting paper. It is drawn as one rounded silhouette and then cut along its
near edge into a lit face and a shaded face (the same glass at half opacity), so it reads as a solid in
every appearance, including the monochrome Clear and Tinted ones.

    python3 make_icon.py             rewrite Delt.icon beside this script
    python3 make_icon.py --render    also export Default and Dark PNGs to exports/ (needs Xcode 27 or later)

Needs Pillow (pip install pillow). Change the constants below, rerun, and open Delt.icon in Icon Composer.
"""
import json
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ICON = HERE / "Delt.icon"                 # the folder name is the icon name
SIZE = 1024                               # Icon Composer canvas, in points
CELLS = 12                                # drafting-paper grid
CELL = SIZE / CELLS

# The pyramid, as a parallel projection of a square pyramid seen from the front left. Its corners sit on
# grid lines: the apex on the centre line, the base corners on lines 2 and 10, the near corner on line 7.
APEX_Y = 160
NEAR_Y = 828                              # lowest point: the base corner closest to the viewer
HALF_WIDTH = 4 * CELL
NEAR_SHIFT = 1 * CELL                     # how far the near corner sits right of centre (0 = corner-on view)
SQUASH = 0.27                             # foreshortening of the base (0 = seen from eye level)
RADII = (20, 26, 22, 26)                  # corner rounding: apex, right, near, left
SEAM = 3                                  # gap between the two faces

TRANSLUCENCY = 0.35                       # how much of the paper shows through the glass
SHADE_OPACITY = 0.5                       # the shaded face, relative to the lit one
GRID_IN_DARK, GRID_IN_TINTED = 0.7, 0.6   # the grid stays sparse enough to survive Clear and Tinted


def p3(r, g, b):
    return f"display-p3:{r:.5f},{g:.5f},{b:.5f},1.00000"


WHITE = "extended-gray:1.00000,1.00000"
PAPER = [p3(0.17, 0.46, 0.95), p3(0.05, 0.20, 0.60)]           # blueprint blue, top to bottom
PAPER_DARK = [p3(0.05, 0.14, 0.38), p3(0.01, 0.04, 0.14)]

# ----------------------------------------------------------------------------------------- geometry
# Screen coordinates: y points down, and polygons run clockwise.

def unit(dx, dy):
    length = math.hypot(dx, dy)
    return dx / length, dy / length


def pyramid():
    """Apex, right, near and left corners."""
    cx = SIZE / 2
    base_y = NEAR_Y - HALF_WIDTH * SQUASH                       # height of the base's centre on screen
    return [(cx, APEX_Y),
            (cx + HALF_WIDTH, base_y - NEAR_SHIFT * SQUASH),
            (cx + NEAR_SHIFT, NEAR_Y),
            (cx - HALF_WIDTH, base_y + NEAR_SHIFT * SQUASH)]


def fillet(corners, radii, step=2.0):
    """Outline of a clockwise polygon with every corner rounded; arcs are sampled every `step` degrees."""
    outline = []
    for i, (vx, vy) in enumerate(corners):
        px, py = corners[i - 1]
        nx, ny = corners[(i + 1) % len(corners)]
        (ax, ay), (bx, by) = unit(vx - px, vy - py), unit(nx - vx, ny - vy)     # directions in and out
        turn = math.acos(max(-1.0, min(1.0, ax * bx + ay * by)))
        r = radii[i]
        reach = r * math.tan(turn / 2)                                           # corner to tangent point
        sx, sy = vx - ax * reach, vy - ay * reach
        cx, cy = sx - ay * r, sy + ax * r                                        # arc centre, on the inside
        start = math.atan2(sy - cy, sx - cx)
        n = max(2, math.ceil(math.degrees(turn) / step))
        outline += [(cx + r * math.cos(start + turn * k / n), cy + r * math.sin(start + turn * k / n))
                    for k in range(n + 1)]
    return outline


def split(outline, top, bottom, gap):
    """Cut a convex outline along the line top -> bottom. Returns the part left of the cut and the part
    right of it, each pulled back gap / 2 from the line."""
    dx, dy = unit(bottom[0] - top[0], bottom[1] - top[1])
    parts = []
    for nx, ny in ((-dy, dx), (dy, -dx)):                       # normals pointing left, then right
        ox, oy = top[0] + nx * gap / 2, top[1] + ny * gap / 2
        depth = [(x - ox) * nx + (y - oy) * ny for x, y in outline]
        part = []
        for i, (x, y) in enumerate(outline):
            j = (i + 1) % len(outline)
            if depth[i] >= 0:
                part.append((x, y))
            if (depth[i] >= 0) != (depth[j] >= 0):              # this edge crosses the cut
                t = depth[i] / (depth[i] - depth[j])
                part.append((x + (outline[j][0] - x) * t, y + (outline[j][1] - y) * t))
        parts.append(part)
    return parts


def write_svg(path, points):
    """One white shape on the canvas; Icon Composer turns it into glass."""
    d = "M " + " L ".join(f"{x:.2f} {y:.2f}" for x, y in points) + " Z"
    path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                    f'<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">\n'
                    f'  <path fill="#FFFFFF" d="{d}"/>\n</svg>\n')

# ----------------------------------------------------------------------------------------- drafting paper

def write_grid(path, line=(3, 64), major=(5, 104), major_every=3, glow=0.12, glow_radius=0.85):
    """Transparent PNG of white grid lines, as (width, alpha), with heavier quarter lines and a soft glow in
    the middle. It stays sparse so the monochrome appearances show faint lines instead of a grey square."""
    falloff = Image.radial_gradient("L").resize((SIZE, SIZE), Image.BICUBIC)     # 0 in the centre, 181 mid-edge
    halo = falloff.point([round(255 * glow * max(0.0, 1 - (v / 181 / glow_radius) ** 2)) for v in range(256)])
    paper = Image.merge("RGBA", [Image.new("L", (SIZE, SIZE), 255)] * 3 + [halo])
    lines = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(lines)
    for heavy in (False, True):                                 # quarter lines go on top
        for i in range(1, CELLS):
            if (i % major_every == 0) != heavy:
                continue
            width, alpha = major if heavy else line
            at = round(i * CELL) - width // 2
            draw.rectangle([at, 0, at + width - 1, SIZE - 1], fill=(255, 255, 255, alpha))
            draw.rectangle([0, at, SIZE - 1, at + width - 1], fill=(255, 255, 255, alpha))
    Image.alpha_composite(paper, lines).save(path, optimize=True)

# ----------------------------------------------------------------------------------------- icon.json
# Icon Composer's format is strict: a property that varies by appearance is written as
# "<name>-specializations" (never beside the plain key), and the appearances are "dark" and "tinted".

def per_appearance(default, **overrides):
    return [{"value": default}] + [{"appearance": name, "value": value} for name, value in overrides.items()]


def placed():
    return {"scale": 1, "translation-in-points": [0, 0]}


def glass_face(name, image, opacity=None):
    face = {"glass": True, "image-name": image, "name": name, "position": placed(),
            # without this, Dark recolours glass with the background blues
            "fill-specializations": per_appearance("automatic", dark={"solid": WHITE})}
    if opacity is not None:
        face["opacity"] = opacity
    return face


def document():
    grid = {"glass": False, "fill": "none", "image-name": "grid.png", "name": "Grid", "position": placed(),
            "opacity-specializations": per_appearance(1, dark=GRID_IN_DARK, tinted=GRID_IN_TINTED)}
    return {
        "fill-specializations": per_appearance({"linear-gradient": PAPER}, dark={"linear-gradient": PAPER_DARK}),
        "groups": [                                             # front to back
            {"layers": [glass_face("Lit Face", "lit.svg"), glass_face("Shaded Face", "shade.svg", SHADE_OPACITY)],
             "shadow": {"kind": "neutral", "opacity": 0.5},
             "translucency": {"enabled": True, "value": TRANSLUCENCY}},
            {"layers": [grid],                                  # drawn flat, exactly as painted
             "shadow": {"kind": "none", "opacity": 0.5}, "specular": False,
             "translucency": {"enabled": False, "value": 0.5}},
        ],
        "supported-platforms": {"circles": ["watchOS"], "squares": "shared"},
    }

# ----------------------------------------------------------------------------------------- output

def build():
    assets = ICON / "Assets"
    assets.mkdir(parents=True, exist_ok=True)
    corners = pyramid()
    apex, near = corners[0], corners[2]
    lit, shade = split(fillet(corners, RADII), apex, near, SEAM)
    write_svg(assets / "lit.svg", lit)
    write_svg(assets / "shade.svg", shade)
    write_grid(assets / "grid.png")
    (ICON / "icon.json").write_text(json.dumps(document(), indent=2, sort_keys=True) + "\n")
    print("wrote", ICON)


def render(renditions=("Default", "Dark"), size=1024):
    """PNG exports from ictool, the headless exporter inside Icon Composer."""
    xcode = Path(subprocess.run(["xcode-select", "-p"], capture_output=True, text=True).stdout.strip())
    ictool = xcode.parent / "Applications/Icon Composer.app/Contents/Executables/ictool"
    if not ictool.exists():
        raise SystemExit(f"{ictool} not found; --render needs Xcode 27 or later")
    exports = HERE / "exports"
    exports.mkdir(exist_ok=True)
    for name in renditions:
        png = exports / f"{ICON.stem}-{name}.png"
        subprocess.run([ictool, ICON, "--export-image", "--output-file", png, "--platform", "iOS", "--rendition", name,
                        "--width", str(size), "--height", str(size), "--scale", "1"], check=True, capture_output=True)
        # ictool tags its output Display P3; convert so the blues survive viewers that ignore colour profiles
        subprocess.run(["sips", "-m", "/System/Library/ColorSync/Profiles/sRGB Profile.icc", png, "--out", png],
                       check=True, capture_output=True)
        print("wrote", png)


if __name__ == "__main__":
    build()
    if "--render" in sys.argv[1:]:
        render()
