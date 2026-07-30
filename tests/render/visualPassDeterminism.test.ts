/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { hashDeckGraph } from '../../src/deck/hashDeck.js';
import { hashSimState } from '../../src/sim/hash.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { createHud } from '../../src/render/hud/createHud.js';
import { createCombatVfx } from '../../src/render/combatVfx.js';
import { createDeckLighting } from '../../src/render/createDeckLighting.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { preloadHeroAssets, getHeroFixtures } from '../../src/render/assets/preloadHeroAssets.js';
import { ALARM_LEVEL_AL0, ALARM_LEVEL_AL1 } from '../../src/config.js';

describe('visual pass determinism (G15)', () => {
  it('E8: presentation modules do not change hashSimState or hashDeckGraph', async () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    runMissionTicks(state, graph, collisionRef, 40);
    const hashBefore = await hashSimState(state);
    const deckHashBefore = await hashDeckGraph(graph);

    const hud = createHud(document.body);
    hud.update(state);
    hud.dispose();

    const deck = createDeckScene(graph);
    const fixtures = getHeroFixtures(await preloadHeroAssets());
    const lighting = createDeckLighting(deck.scene, graph, fixtures);
    lighting.update(0.016, ALARM_LEVEL_AL0);
    lighting.update(0.016, ALARM_LEVEL_AL1);
    const vfx = createCombatVfx(deck.scene);
    vfx.push([{ type: 'impact-wall', x: 1, y: 0.5, z: 2 }]);
    vfx.update(0.05);
    vfx.dispose();
    lighting.dispose();
    deck.disposeMaterials();

    expect(await hashSimState(state)).toBe(hashBefore);
    expect(await hashDeckGraph(graph)).toBe(deckHashBefore);
  });
});
