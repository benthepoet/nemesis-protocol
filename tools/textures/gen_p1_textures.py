#!/usr/bin/env python3
"""p1-visual-pass structure texture generators (design pack v1, ruling R3).

Emits the six contracted 1K PBR texture assets for the deck material uplift:
  - p1_hull_steel_trim_{albedo,metal,rough,normal}.png  (trim sheet)
  - p1_deck_plate_{albedo,metal,rough,normal}.png       (floor set)
  - p1_wall_panel_{albedo,metal,rough,normal}.png       (wall set)
  - p1_ceiling_panel_{albedo,metal,rough,normal}.png    (ceiling set)
  - p1_wear_masks.png                                   (authored wear channels)
  - p1_section_signage_atlas.png                        (VD §3 palette signage)

Conformance notes (binding):
  - VD §5: metallic/roughness PBR, no albedo-only cheats. Every surface ships
    albedo + metal + rough + normal. Trim-sheet strategy for paneling.
  - VD §5 authored-wear rule: grime is placed in AUTHORED zones, never
    procedural-random — hand height, thresholds, door frames. The same zones
    are encoded in p1_wear_masks.png for runtime blending:
      R = hand-height band, G = threshold strip, B = door-frame edges
    (TL binding, p1-visual-pass spec v1 — deck PBR row).
  - VD §3 palette: hull steel #1a232e-#2a3644 base metals; corridor-neutral
    #8b949e reserved for the spine; section accents only in the signage atlas
    (red #ef5350 appears ONLY as the Engineering section tint per the deck
    plan mockups — it is a section identity, never a decoration/hazard read).
  - Deterministic: fixed seeds; re-running emits byte-identical PNGs.
  - License: original procedural output, CC BY 4.0 (LICENSE-ASSETS).

Usage: python3 tools/textures/gen_p1_textures.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
OUT = Path(__file__).resolve().parents[2] / "assets" / "textures"

# VD §3 hull-steel family (linear 0-255 albedo anchors)
HULL_DARK = np.array([26, 35, 46])    # #1a232e
HULL_LIGHT = np.array([42, 54, 68])   # #2a3644
HULL_COLD = np.array([34, 48, 56])    # colder hull-adjacent tone (VD §5)
NEUTRAL = np.array([139, 148, 158])   # #8b949e corridor neutral (trim accents only)


# ---------------------------------------------------------------- utilities

def value_noise(cells: int, seed: int, size: int = SIZE) -> np.ndarray:
    """Bilinear value noise in [0,1]; deterministic per seed."""
    rng = np.random.default_rng(seed)
    grid = rng.random((cells, cells))
    img = np.array(
        Image.fromarray((grid * 255).astype(np.uint8)).resize(
            (size, size), Image.BILINEAR
        ),
        dtype=np.float64,
    ) / 255.0
    return img


def save(arr: np.ndarray, name: str) -> None:
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(OUT / name)
    print("wrote", OUT / name)


def height_to_normal(height: np.ndarray, strength: float = 2.0) -> np.ndarray:
    """Tangent-space normal map from a height field (OpenGL convention, Y+)."""
    gy, gx = np.gradient(height)
    nx = -gx * strength
    ny = gy * strength
    nz = np.ones_like(height)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    n = np.stack([nx * inv, ny * inv, nz * inv], axis=-1)
    return (n * 0.5 + 0.5) * 255.0


def band(profile_lo: float, profile_hi: float, size: int = SIZE,
         axis: str = "y", softness: float = 0.06) -> np.ndarray:
    """Smooth 0..1 mask band along an axis — authored wear placement helper."""
    t = np.linspace(0, 1, size)
    up = np.clip((t - profile_lo) / softness, 0, 1)
    dn = np.clip((profile_hi - t) / softness, 0, 1)
    line = np.minimum(up, dn)
    return np.tile(line[:, None], (1, size)) if axis == "y" else np.tile(line[None, :], (size, 1))


def grime(zones: list[np.ndarray], seed: int) -> np.ndarray:
    """Authored-zone grime: zone union modulated by fine noise (placement stays authored)."""
    u = np.zeros((SIZE, SIZE))
    for z in zones:
        u = np.maximum(u, z)
    fine = 0.5 + 0.5 * value_noise(96, seed)
    return u * fine


# ------------------------------------------------------------- wear channels

def wear_zones() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The three authored wear placements (VD §5). Single source of truth —
    consumed by both p1_wear_masks.png and the structure sets below."""
    hand = band(0.42, 0.58, axis="y", softness=0.10)          # hand-height band
    threshold = band(0.90, 1.02, axis="y", softness=0.08)     # thresholds / floor contact
    door_l = band(0.0, 0.06, axis="x", softness=0.05)         # door-frame edges
    door_r = band(0.94, 1.0, axis="x", softness=0.05)
    door = np.maximum(door_l, door_r)
    return hand, threshold, door


def gen_wear_masks() -> None:
    hand, threshold, door = wear_zones()
    rgb = np.stack([hand * 255, threshold * 255, door * 255], axis=-1)
    save(rgb, "p1_wear_masks.png")


# --------------------------------------------------------------- trim sheet

def gen_hull_steel_trim() -> None:
    # Height: horizontal trim rails + groove lines + rivet rows (trim-sheet layout)
    rails = (band(0.10, 0.16, softness=0.012) + band(0.46, 0.54, softness=0.012)
             + band(0.84, 0.90, softness=0.012))
    grooves = (band(0.20, 0.215, softness=0.004) + band(0.60, 0.615, softness=0.004))
    riv_y = np.zeros((SIZE, SIZE))
    for cy in (0.13, 0.50, 0.87):
        row = np.zeros(SIZE)
        for cx in np.arange(0.05, 1.0, 0.1):
            row += np.exp(-((np.arange(SIZE) / SIZE - cx) ** 2) / (2 * 0.006 ** 2))
        riv_y += np.tile(row[None, :], (SIZE, 1)) * band(cy - 0.012, cy + 0.012, softness=0.006)
    height = np.clip(0.55 + 0.30 * rails - 0.35 * grooves + 0.25 * np.clip(riv_y, 0, 1)
                     + 0.06 * value_noise(64, 11), 0, 1)

    base = HULL_DARK + (HULL_LIGHT - HULL_DARK) * (0.35 + 0.4 * value_noise(32, 12))[..., None]
    hand, threshold, door = wear_zones()
    g = grime([hand, threshold, door], 13)
    albedo = base * (1 - 0.35 * g[..., None])                 # grime darkens in authored zones
    # brushed-metal streaks
    albedo *= (1 + 0.05 * (value_noise(8, 14) - 0.5))[..., None]

    metal = np.full((SIZE, SIZE), 235.0)                      # bare steel trim
    rough = 105 + 90 * g + 40 * value_noise(48, 15)           # wear roughens
    save(albedo, "p1_hull_steel_trim_albedo.png")
    save(metal, "p1_hull_steel_trim_metal.png")
    save(rough, "p1_hull_steel_trim_rough.png")
    save(height_to_normal(height, 3.0), "p1_hull_steel_trim_normal.png")


# ---------------------------------------------------------------- deck plate

def gen_deck_plate() -> None:
    # 4x4 plate grid with seams + anti-slip tread dots per plate
    n = 4
    t = np.linspace(0, 1, SIZE)
    gx = np.minimum.reduce([np.abs((t * n) % 1 - 0.5) for _ in (0,)])[0]
    seamline = (np.abs((t * n) % 1 - 0.5) > 0.47)
    seams = np.tile(seamline[:, None], (1, SIZE)) | np.tile(seamline[None, :], (SIZE, 1))
    tread = np.zeros((SIZE, SIZE))
    yy, xx = np.mgrid[0:SIZE, 0:SIZE] / SIZE
    cell = 32  # tread pitch in px
    tread = (((xx * SIZE // cell) + (yy * SIZE // cell)) % 2).astype(float)
    tread *= band(0.0, 1.0, softness=1.0)  # keep full range; shaped below
    tread_h = np.sin(xx * np.pi * SIZE / cell) * np.sin(yy * np.pi * SIZE / cell)
    height = np.clip(0.5 + 0.18 * tread_h - 0.45 * seams + 0.05 * value_noise(64, 21), 0, 1)

    base = HULL_DARK + (HULL_LIGHT - HULL_DARK) * (0.45 + 0.3 * value_noise(24, 22))[..., None]
    _, threshold, _ = wear_zones()
    # deck wear: thresholds + walking lanes (authored horizontal lanes)
    lane = band(0.30, 0.42, softness=0.10) + band(0.58, 0.70, softness=0.10)
    g = grime([threshold, np.clip(lane, 0, 1)], 23)
    albedo = base * (1 - 0.30 * g[..., None])
    albedo *= (1 + 0.10 * (tread_h > 0.6))[..., None]         # tread tops polished by traffic

    metal = np.full((SIZE, SIZE), 225.0)
    rough = 120 + 80 * g + 35 * value_noise(48, 24) - 25 * (tread_h > 0.6)
    save(albedo, "p1_deck_plate_albedo.png")
    save(metal, "p1_deck_plate_metal.png")
    save(rough, "p1_deck_plate_rough.png")
    save(height_to_normal(height, 3.5), "p1_deck_plate_normal.png")


# ---------------------------------------------------------------- wall panel

def gen_wall_panel() -> None:
    # 2x4 panel grid, seams, a vent strip, colder hull-adjacent base course (VD §5)
    t = np.linspace(0, 1, SIZE)
    seam_v = np.abs((t * 4) % 1 - 0.5) > 0.48
    seam_h = np.abs((t * 2) % 1 - 0.5) > 0.47
    seams = np.tile(seam_h[:, None], (1, SIZE)) | np.tile(seam_v[None, :], (SIZE, 1))
    vent = band(0.70, 0.80, softness=0.01) * (np.sin(t * np.pi * 40)[None, :] * 0.5 + 0.5)
    height = np.clip(0.55 - 0.4 * seams - 0.25 * vent + 0.04 * value_noise(64, 31), 0, 1)

    base = HULL_DARK + (HULL_LIGHT - HULL_DARK) * (0.40 + 0.35 * value_noise(20, 32))[..., None]
    # colder tones hull-adjacent: bottom base course + edges shift cold
    hull_adj = np.maximum(band(0.86, 1.0, softness=0.10), band(0.0, 0.05, softness=0.04))
    cold = HULL_COLD + (HULL_LIGHT - HULL_COLD) * 0.3
    base = base * (1 - hull_adj[..., None]) + cold * hull_adj[..., None]

    hand, threshold, door = wear_zones()
    g = grime([hand, threshold, door], 33)
    albedo = base * (1 - 0.38 * g[..., None])

    metal = np.full((SIZE, SIZE), 210.0)
    metal -= 60 * (g > 0.35)                                  # grimy paint over steel
    rough = 115 + 85 * g + 40 * value_noise(40, 34)
    save(albedo, "p1_wall_panel_albedo.png")
    save(np.clip(metal, 0, 255), "p1_wall_panel_metal.png")
    save(rough, "p1_wall_panel_rough.png")
    save(height_to_normal(height, 3.0), "p1_wall_panel_normal.png")


# ------------------------------------------------------------- ceiling panel

def gen_ceiling_panel() -> None:
    # 4x4 service tiles, seams, recessed light-slot channels + vent grille tile
    t = np.linspace(0, 1, SIZE)
    seam = (np.abs((t * 4) % 1 - 0.5) > 0.475)
    seams = np.tile(seam[:, None], (1, SIZE)) | np.tile(seam[None, :], (SIZE, 1))
    slot = band(0.46, 0.54, axis="x", softness=0.01) * (np.abs((t * 4) % 1 - 0.5) < 0.30)[:, None]
    grille = band(0.10, 0.40, axis="x", softness=0.02) * band(0.10, 0.40, axis="y", softness=0.02)
    grille *= (np.sin(t * np.pi * 60)[:, None] * 0.5 + 0.5)
    height = np.clip(0.6 - 0.35 * seams - 0.30 * slot - 0.35 * grille
                     + 0.04 * value_noise(64, 41), 0, 1)

    base = HULL_DARK + (HULL_LIGHT - HULL_DARK) * (0.30 + 0.25 * value_noise(16, 42))[..., None]
    # ceilings stay cleaner (VD §5: wear at hand height/thresholds, not overhead)
    g = grime([band(0.0, 1.0, softness=1.0) * 0.15], 43)      # faint uniform dust only
    albedo = base * (1 - 0.25 * g[..., None])

    metal = np.full((SIZE, SIZE), 205.0)
    rough = 130 + 60 * g + 35 * value_noise(40, 44)
    save(albedo, "p1_ceiling_panel_albedo.png")
    save(metal, "p1_ceiling_panel_metal.png")
    save(rough, "p1_ceiling_panel_rough.png")
    save(height_to_normal(height, 3.0), "p1_ceiling_panel_normal.png")


# ------------------------------------------------------------- signage atlas

def gen_signage_atlas() -> None:
    """8 plates (512x256 each, 2x4 grid). VD §3 palette, deck-plan v2.2
    typography: bold industrial caps, accent strip + section label.
    Palette crossing rule held: red tile is Engineering section identity
    (deck plan v2.2), never a hazard/decoration read."""
    plates = [
        ("ENGINEERING", "#ef5350"),
        ("COMMAND", "#7986cb"),
        ("OPS", "#ffb74d"),
        ("LIFE SUPPORT", "#4dd0e1"),
        ("CREW", "#ce93d8"),
        ("HYDRO", "#81c784"),
        ("ARMORY", "#ff8a65"),
        ("MEDICAL", "#80cbc4"),
    ]
    atlas = Image.new("RGB", (SIZE, SIZE), (10, 15, 22))      # void-dark plate bg #0a0f16
    draw = ImageDraw.Draw(atlas)
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]
    font_big = font_small = None
    for p in font_paths:
        if Path(p).exists():
            font_big = ImageFont.truetype(p, 56)
            font_small = ImageFont.truetype(p, 26)
            break
    if font_big is None:
        font_big = font_small = ImageFont.load_default()

    def hex_rgb(h: str) -> tuple[int, int, int]:
        h = h.lstrip("#")
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

    for i, (label, color) in enumerate(plates):
        ox, oy = (i % 2) * 512, (i // 2) * 256
        # plate frame
        draw.rectangle([ox + 6, oy + 6, ox + 506, oy + 250], outline=hex_rgb("#39424d"), width=4)
        # accent strip (left) + header rule
        draw.rectangle([ox + 20, oy + 28, ox + 44, oy + 228], fill=hex_rgb(color))
        draw.rectangle([ox + 64, oy + 150, ox + 480, oy + 156], fill=hex_rgb(color))
        # section label + deck sublabel (neutral, deck-plan style)
        draw.text((ox + 72, oy + 60), label, font=font_big, fill=hex_rgb(color))
        draw.text((ox + 72, oy + 176), "ISV NEMESIS - DECK 03", font=font_small,
                  fill=hex_rgb("#8b949e"))
    save(np.array(atlas), "p1_section_signage_atlas.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    gen_wear_masks()
    gen_hull_steel_trim()
    gen_deck_plate()
    gen_wall_panel()
    gen_ceiling_panel()
    gen_signage_atlas()
    print("done — 18 PNGs emitted to", OUT)


if __name__ == "__main__":
    main()
