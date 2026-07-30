import { describe, expect, it } from 'vitest';
import { PROJECTILE_KIND, PROJECTILE_SPEED_MPS, FIXED_DT } from '../../src/config.js';
import { circleHitsWalls } from '../../src/deck/collision.js';
import { hashDeckGraph } from '../../src/deck/hashDeck.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import type { WallSegment } from '../../src/deck/types.js';
import { earliestSegmentHit } from '../../src/combat/projectileCollision.js';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { getEntity, createWorld, spawnEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

const WALL_SHOT_CASES: { label: string; wallId: string; roomId: string }[] = [
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

function aimYawToward(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

function placePlayerFacingWall(
  harness: ReturnType<typeof createCombatTestHarness>,
  wall: WallSegment,
  roomId: string,
): void {
  const player = getEntity(harness.state, harness.state.meta.playerId!)!;
  const roomCenter = footprintCenter(getNode(harness.graph, roomId));
  const wcx = wall.rect.x + wall.rect.w / 2;
  const wcz = wall.rect.z + wall.rect.h / 2;
  const dx = wcx - roomCenter.x;
  const dz = wcz - roomCenter.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  player.x = wcx - ux * 0.55;
  player.z = wcz - uz * 0.55;
  player.yaw = aimYawToward(ux, uz);
}

describe('projectiles (G2)', () => {
  it('E26: owner skipped — muzzle spawn does not hit firer same tick', () => {
    const harness = createCombatTestHarness();
    const playerId = harness.state.meta.playerId!;
    const cmds = new Map<number, InputCommand[]>([[0, [fireHeldOn(0, 0)]]]);
    runTicks(harness, 1, cmds);
    expect(getEntity(harness.state, playerId)!.hp).toBe(100);
  });

  it('E4: projectile travels 1 m/tick and despawns at max range', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.yaw = 0;
    const cmds = new Map<number, InputCommand[]>();
    cmds.set(0, [fireHeldOn(0, 0)]);
    cmds.set(1, [{ tick: 1, sequence: 0, action: 'fire', value: 0 }]);
    runTicks(harness, 2, cmds);
    expect([...harness.state.entities.values()].filter((e) => e.kind === PROJECTILE_KIND).length).toBe(1);
    runTicks(harness, 60);
    expect([...harness.state.entities.values()].filter((e) => e.kind === PROJECTILE_KIND).length).toBe(0);
  });

  it.each(WALL_SHOT_CASES)('E5: point-blank into $label removes projectile with impact-wall', async ({ wallId, roomId }) => {
    const harness = createCombatTestHarness();
    const deckHashBefore = await hashDeckGraph(harness.graph);
    const wall = findWall(harness.graph, wallId);
    placePlayerFacingWall(harness, wall, roomId);
    const cmds = new Map<number, InputCommand[]>([[0, [fireHeldOn(0, 0)]]]);
    const events = runTicks(harness, 8, cmds, { collectEvents: true });
    expect([...harness.state.entities.values()].filter((e) => e.kind === PROJECTILE_KIND).length).toBe(0);
    expect(events.some((e) => e.type === 'impact-wall')).toBe(true);
    expect(await hashDeckGraph(harness.graph)).toBe(deckHashBefore);
  });

  it('E6: segment sweep hits thin wall when endpoints lie outside collider', () => {
    const stepDist = PROJECTILE_SPEED_MPS * FIXED_DT;
    const thinWall = { x: 10, z: 0, w: 0.15, h: 2 };
    const collisionWorld = { aabbs: [thinWall], polyEdges: [] as const };
    const ax = 10 - stepDist / 2;
    const az = 1;
    const bx = 10 + stepDist / 2;
    const bz = 1;
    expect(circleHitsWalls(collisionWorld, bx, bz, 0.05)).toBe(false);
    expect(circleHitsWalls(collisionWorld, ax, az, 0.05)).toBe(false);

    const state = createWorld();
    state.meta.playerId = spawnEntity(state, 'player', ax, 0, az);
    const ownerId = state.meta.playerId;
    const hit = earliestSegmentHit(state, ax, az, bx, bz, ownerId, collisionWorld);
    expect(hit?.kind).toBe('wall');

    const projId = spawnEntity(state, PROJECTILE_KIND, ax, 0, az);
    const proj = getEntity(state, projId)!;
    proj.yaw = aimYawToward(bx - ax, bz - az);
    proj.ownerId = ownerId;
    proj.alive = true;
    state.projectileTraveledM.set(projId, 0);
    const graph = loadTestDeck03();
    const events = integrateCombat(state, collisionWorld, graph);
    expect(getEntity(state, projId)).toBeUndefined();
    expect(events.some((e) => e.type === 'impact-wall')).toBe(true);
  });
});
