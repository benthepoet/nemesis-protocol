# tools/textures — p1 texture generators

Procedural generators for the `p1-visual-pass` structure texture sets (design pack v1, ruling R3 — procedural generation permitted for deck/structure surfaces when output conforms to visual_direction §5 and the generator is committed for reproducibility).

## Regenerate

```sh
python3 tools/textures/gen_p1_textures.py   # requires: python3 + numpy + Pillow
```

Deterministic (fixed seeds) — re-running emits byte-identical PNGs into `assets/textures/`:

| Asset | Set |
|-------|-----|
| `p1_hull_steel_trim_{albedo,metal,rough,normal}.png` | Trim sheet, 1K |
| `p1_deck_plate_{albedo,metal,rough,normal}.png` | Floor, 1K |
| `p1_wall_panel_{albedo,metal,rough,normal}.png` | Wall, 1K |
| `p1_ceiling_panel_{albedo,metal,rough,normal}.png` | Ceiling, 1K |
| `p1_wear_masks.png` | Authored wear channels |
| `p1_section_signage_atlas.png` | VD §3 signage, 8 plates |

## Wear-mask channel contract (TL binding, p1-visual-pass spec v1)

`p1_wear_masks.png`: **R** = hand-height band, **G** = threshold strip, **B** = door-frame edges. Placement is authored in `wear_zones()` — the single source of truth shared by the masks and the grime baked into the albedo/rough sets (VD §5 authored-wear rule: hand height, thresholds, door frames — never procedural-random).

## Inputs & license

No third-party inputs — pure numpy/Pillow synthesis from the VD §3 palette anchors. All emitted PNGs are original work, **CC BY 4.0** (`LICENSE-ASSETS`). Hero character/rifle materials are authored in Blender and embedded in the GLBs (design pack R3: hero textures are authored, not generated).

## Signage palette note

The atlas uses VD §3 section/function accents verbatim. The red `#ef5350` plate is **Engineering section identity** (deck-plan mockup v2.2) — section tint navigation per G6; it is not a hazard/decoration read and does not cross the VD §3 crossing rule.
