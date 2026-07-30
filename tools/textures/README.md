# P1 deck texture generators (R3)

License-clean **original** procedural PNGs for `p1-visual-pass`. CC BY 4.0 (same as repo `LICENSE-ASSETS`).

## Regenerate

From repo root:

```bash
node tools/textures/generate-p1-textures.mjs
```

Outputs under `assets/textures/`:

- `p1_hull_steel_trim_{albedo,metal,rough,normal}.png`
- `p1_deck_plate_{albedo,metal,rough,normal}.png`
- `p1_wall_panel_{albedo,metal,rough,normal}.png`
- `p1_ceiling_panel_{albedo,metal,rough,normal}.png`
- `p1_wear_masks.png` — **R** hand-height wear band, **G** threshold scuffs, **B** door-frame emphasis
- `p1_section_signage_atlas.png` — section tint strips for trim/signage

No third-party inputs; all pixels are synthesized in-script.
