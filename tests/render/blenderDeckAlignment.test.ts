/** @vitest-environment jsdom */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { loadGltf } from '../../src/render/assets/loadGltf.js';
import { P1_NEMESIS_DECK03_GLB } from '../../src/render/assets/urls.js';
import { assertBlenderDeckAlignment, normalizeImportedDeckNames } from '../../src/render/blenderDeckBindings.js';

const GLB_PATH = join(process.cwd(), 'assets/models/p1_nemesis_deck03.glb');
const hasDeckGlb = existsSync(GLB_PATH);

describe.skipIf(!hasDeckGlb)('blender deck alignment (R-BM6)', () => {
  it('room footprint AABB drift ≤ DECK_GLB_ALIGN_EPSILON_M', async () => {
    const graph = loadTestDeck03();
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    normalizeImportedDeckNames(glbRoot, graph);
    expect(() => assertBlenderDeckAlignment(glbRoot, graph)).not.toThrow();
  });
});
