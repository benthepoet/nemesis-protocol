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
import { createPlayerMeshFromTemplates } from '../../src/render/createPlayerMesh.js';
import { createStandInMeshFromTemplates } from '../../src/render/createStandInMesh.js';
import { preloadHeroAssets, getHeroFixtures } from '../../src/render/assets/preloadHeroAssets.js';
import { ALARM_LEVEL_AL0, ALARM_LEVEL_AL1 } from '../../src/config.js';
import { updatePlayerHeroPresentation } from '../../src/render/createPlayerMesh.js';
import { updateStandInHeroPresentation } from '../../src/render/createStandInMesh.js';
import { getEntity } from '../../src/sim/world.js';

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
    expect(deck.hullEnvelope?.name).toBe('hull-envelope');
    expect(deck.dressing?.name).toBe('dressing');
    const templates = await preloadHeroAssets();
    const fixtures = getHeroFixtures(templates);
    const lighting = createDeckLighting(deck.scene, graph, fixtures);
    lighting.update(0.016, ALARM_LEVEL_AL0);
    lighting.update(0.016, ALARM_LEVEL_AL1);
    const vfx = createCombatVfx(deck.scene);
    vfx.push([{ type: 'impact-wall', x: 1, y: 0.5, z: 2 }]);
    vfx.update(0.05);
    vfx.dispose();

    const playerMesh = createPlayerMeshFromTemplates(templates);
    const player = state.meta.playerId !== null ? getEntity(state, state.meta.playerId) : undefined;
    if (player) {
      for (let i = 0; i < 30; i++) {
        updatePlayerHeroPresentation(playerMesh, player, state.meta, 1 / 60);
      }
    }
    for (const crewId of state.meta.crewIds) {
      const mesh = createStandInMeshFromTemplates(templates);
      const entity = getEntity(state, crewId);
      const ai = state.crewAi.get(crewId);
      if (entity && ai) {
        for (let i = 0; i < 20; i++) {
          updateStandInHeroPresentation(mesh, entity, ai, 1 / 60);
        }
      }
    }

    lighting.dispose();
    deck.disposeMaterials();

    expect(await hashSimState(state)).toBe(hashBefore);
    expect(await hashDeckGraph(graph)).toBe(deckHashBefore);
  });
});
