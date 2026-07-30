import { describe, expect, it } from 'vitest';
import { RIFLE_DAMAGE_PER_HIT } from '../../src/config.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import { confirmBreachAndSkipToActive, createMissionTestWorld, runMissionTicks } from '../helpers/missionTestUtils.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';

describe('fail flow (G7)', () => {
  it('death → FAILED score; no revive soak', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const playerId = state.meta.playerId!;
    for (let i = 0; i < 4; i += 1) {
      applyDamage(state, playerId, RIFLE_DAMAGE_PER_HIT);
    }
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.score?.outcome).toBe('FAILED');
    runMissionTicks(state, graph, collisionRef, 200);
    expect(state.entities.get(playerId)!.alive).toBe(false);
  });

  it('E-f: death beats engineering same tick', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    const player = state.entities.get(state.meta.playerId!)!;
    player.x = eng.x;
    player.z = eng.z;
    player.hp = 0;
    player.alive = false;
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.score?.outcome).toBe('FAILED');
  });
});
