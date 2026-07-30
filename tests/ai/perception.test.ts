import { describe, expect, it } from 'vitest';
import {
  ALARM_LEVEL_AL0,
  CREW_DETECTION_DELAY_TICKS,
  CREW_SIGHT_RANGE_M,
} from '../../src/config.js';
import { canSeePlayer } from '../../src/ai/perception.js';
import { buildCollisionWorld } from '../../src/deck/collision.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import type { WallSegment } from '../../src/deck/types.js';
import { getEntity } from '../../src/sim/world.js';
import { createCombatTestHarness, runTicks } from '../helpers/combatTestUtils.js';

const WALL_LOS_CASES: { label: string; wallId: string; roomId: string }[] = [
  { label: 'Class A partition', wallId: 'wall-a-cargo-armory', roomId: 'cargo-hold' },
  { label: 'Class B interior', wallId: 'wall-b-cargo-spine-l', roomId: 'cargo-hold' },
  { label: 'Class B bulkhead', wallId: 'wall-b-mid-aft-above', roomId: 'engineering' },
  { label: 'Class C hull', wallId: 'wall-c-port-engine-left', roomId: 'port-engine' },
];

function findWall(graph: ReturnType<typeof createCombatTestHarness>['graph'], wallId: string): WallSegment {
  const wall = graph.wallSegments.find((w) => w.id === wallId);
  if (!wall) throw new Error(`missing wall ${wallId}`);
  return wall;
}

function placeCrewAndPlayerFiveMetersThroughWall(
  harness: ReturnType<typeof createCombatTestHarness>,
  wall: WallSegment,
  roomId: string,
): { crewId: ReturnType<typeof createCombatTestHarness>['state']['meta']['crewIds'][number] } {
  const crewId = harness.state.meta.crewIds[0]!;
  const crew = getEntity(harness.state, crewId)!;
  const player = getEntity(harness.state, harness.state.meta.playerId!)!;
  const roomCenter = footprintCenter(getNode(harness.graph, roomId));
  const wcx = wall.rect.x + wall.rect.w / 2;
  const wcz = wall.rect.z + wall.rect.h / 2;
  const dx = wcx - roomCenter.x;
  const dz = wcz - roomCenter.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  crew.x = wcx - ux * 2;
  crew.z = wcz - uz * 2;
  player.x = wcx + ux * 3;
  player.z = wcz + uz * 3;
  crew.yaw = Math.atan2(player.x - crew.x, player.z - crew.z);
  expect(Math.hypot(player.x - crew.x, player.z - crew.z)).toBeCloseTo(5, 0);
  return { crewId };
}

describe('perception (G3)', () => {
  it('E4: leave cone before delay completes — no trip; losTicks reset', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    player.x = crew.x + 12;
    player.z = crew.z + 0.5;
    crew.yaw = Math.atan2(player.x - crew.x, player.z - crew.z);
    runTicks(harness, CREW_DETECTION_DELAY_TICKS - 5);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL0);
    expect(harness.state.crewAi.get(crewId)!.losTicks).toBeGreaterThan(0);
    player.x = 500;
    player.z = 500;
    runTicks(harness, 1);
    expect(harness.state.crewAi.get(crewId)!.losTicks).toBe(0);
    runTicks(harness, CREW_DETECTION_DELAY_TICKS + 10);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL0);
  });

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

  it.each(WALL_LOS_CASES)('E6: player 5 m behind $label — no detection', ({ wallId, roomId }) => {
    const harness = createCombatTestHarness();
    const wall = findWall(harness.graph, wallId);
    const { crewId } = placeCrewAndPlayerFiveMetersThroughWall(harness, wall, roomId);
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const world = buildCollisionWorld(harness.graph);
    expect(canSeePlayer(crew, player, world)).toBe(false);
    runTicks(harness, CREW_DETECTION_DELAY_TICKS + 5);
    expect(harness.state.meta.alarmLevel).toBe(ALARM_LEVEL_AL0);
  });
});
