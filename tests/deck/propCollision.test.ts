/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { ACTOR_PROXY_RADIUS_M } from '../../src/config.js';
import { buildCollisionWorld, circleHitsWalls } from '../../src/deck/collision.js';
import { buildPropCollisionAABBs } from '../../src/deck/propCollision.js';
import { earliestWallHit } from '../../src/combat/projectileCollision.js';
import { createBlenderDeckScene } from '../../src/render/createBlenderDeckScene.js';
import { loadGltf } from '../../src/render/assets/loadGltf.js';
import { P1_NEMESIS_DECK03_GLB } from '../../src/render/assets/urls.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const GLB_PATH = join(process.cwd(), 'assets/models/p1_nemesis_deck03.glb');
const hasDeckGlb = existsSync(GLB_PATH);

describe.skipIf(!hasDeckGlb)('prop collision (Blender deck)', () => {
  it('extracts room prop AABBs and blocks actor circles', async () => {
    const graph = loadTestDeck03();
    const mats = createFallbackDeckMaterials();
    const glbRoot = await loadGltf(P1_NEMESIS_DECK03_GLB);
    const deck = createBlenderDeckScene(graph, { glbRoot, materials: mats });
    const props = buildPropCollisionAABBs(deck.collisionRoot!, graph);
    deck.disposeMaterials();
    mats.dispose();

    expect(props.length).toBeGreaterThan(8);

    const wallsOnly = buildCollisionWorld(graph);
    const sample = props[0]!;
    const cx = sample.x + sample.w / 2;
    const cz = sample.z + sample.h / 2;
    expect(circleHitsWalls(wallsOnly, cx, cz, ACTOR_PROXY_RADIUS_M)).toBe(false);

    const withProps = { ...wallsOnly, propAabbs: Object.freeze(props) };
    expect(circleHitsWalls(withProps, cx, cz, ACTOR_PROXY_RADIUS_M)).toBe(true);

    const span = Math.max(sample.w, sample.h) * 0.6;
    const hit = earliestWallHit(cx - span, cz, cx + span, cz, withProps);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBeGreaterThan(0);
    expect(hit!.t).toBeLessThan(1);
  });
});

describe('prop collision (graph-only)', () => {
  it('buildCollisionWorld has empty propAabbs by default', () => {
    const graph = loadTestDeck03();
    expect(buildCollisionWorld(graph).propAabbs).toEqual([]);
  });
});
