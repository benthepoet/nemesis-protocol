import { describe, expect, it } from 'vitest';
import { resolveDeckVisualMode } from '../../src/render/deckVisualMode.js';

describe('resolveDeckVisualMode (G4, R-BM4)', () => {
  it('defaults to blender when omit or invalid', () => {
    expect(resolveDeckVisualMode({ searchParams: new URLSearchParams('') })).toBe('blender');
    expect(resolveDeckVisualMode({ searchParams: new URLSearchParams('deckVisual=nope') })).toBe(
      'blender',
    );
  });

  it('honors procedural and blender URL overrides', () => {
    expect(
      resolveDeckVisualMode({ searchParams: new URLSearchParams('deckVisual=procedural') }),
    ).toBe('procedural');
    expect(
      resolveDeckVisualMode({ searchParams: new URLSearchParams('deckVisual=blender') }),
    ).toBe('blender');
  });
});

describe('P1_NEMESIS_DECK03_GLB path hygiene (G7)', () => {
  it('uses phase-prefixed models path under assets/models', async () => {
    const { P1_NEMESIS_DECK03_GLB } = await import('../../src/render/assets/urls.js');
    expect(P1_NEMESIS_DECK03_GLB).toContain('/assets/models/p1_nemesis_deck03.glb');
    expect(P1_NEMESIS_DECK03_GLB).not.toContain('references/');
  });
});
