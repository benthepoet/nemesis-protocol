import { describe, expect, it } from 'vitest';
import { ALARM_LEVEL_AL0, CREW_DETECTION_DELAY_TICKS, CREW_SIGHT_RANGE_M } from '../../src/config.js';
import { canSeePlayer } from '../../src/ai/perception.js';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { getEntity } from '../../src/sim/world.js';
import { createCombatTestHarness, runTicks } from '../helpers/combatTestUtils.js';

describe('perception (G3)', () => {
  it('E5: out of range no detect', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const crew = getEntity(harness.state, harness.state.meta.crewIds[0]!)!;
    crew.yaw = 0;
    player.x = crew.x + CREW_SIGHT_RANGE_M + 5;
    player.z = crew.z;
    const world = buildCollisionWorld(harness.graph);
    expect(canSeePlayer(crew, player, world)).toBe(false);
    runTicks(harness, CREW_DETECTION_DELAY_TICKS + 5);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL0);
  });
});
