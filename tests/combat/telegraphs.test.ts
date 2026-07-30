import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ACTOR_MAX_HP } from '../../src/config.js';
import { earliestSegmentHit, earliestWallHit } from '../../src/combat/projectileCollision.js';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { hashSimState } from '../../src/sim/hash.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { cloneSimState, getEntity } from '../../src/sim/world.js';
import {
  AIM_LINE_Y_M,
  PROJECTILE_MAX_RANGE_M,
  PROJECTILE_MUZZLE_OFFSET_M,
} from '../../src/config.js';
import {
  createCombatTelegraphs,
  getAimLineEndpointsForTest,
  getAimLineStateForTest,
  getTracerIdsForTest,
} from '../../src/render/combatTelegraphs.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('combat telegraphs (G10)', () => {
  it('earliestWallHit hits expanded wall AABB with t in [0,1]', () => {
    const wall = { x: 5, z: -1, w: 0.3, h: 2 };
    const world = { aabbs: [wall], polyEdges: [] as const };
    const ax = 0;
    const az = 0;
    const bx = 10;
    const bz = 0;
    const hit = earliestWallHit(ax, az, bx, bz, world);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBeGreaterThanOrEqual(0);
    expect(hit!.t).toBeLessThanOrEqual(1);
    const t = hit!.t;
    expect(Math.hypot(hit!.x - (ax + (bx - ax) * t), hit!.z - (az + (bz - az) * t))).toBeLessThan(1e-6);
  });

  it('earliestWallHit ignores actors on segment', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = 0;
    player.z = 0;
    player.yaw = 0;
    const ax = 0;
    const az = 0;
    const bx = 20;
    const bz = 0;
    const standInId = harness.state.meta.standInIds[0]!;
    const standIn = getEntity(harness.state, standInId)!;
    standIn.x = 8;
    standIn.z = 0;
    standIn.alive = true;
    standIn.hp = ACTOR_MAX_HP;

    const wallOnly = earliestWallHit(ax, az, bx, bz, harness.collisionWorld);
    const withActor = earliestSegmentHit(
      harness.state,
      ax,
      az,
      bx,
      bz,
      harness.state.meta.playerId!,
      harness.collisionWorld,
    );
    expect(withActor?.kind).toBe('actor');
    if (wallOnly) {
      const wallOnlyAgain = earliestWallHit(ax, az, bx, bz, harness.collisionWorld);
      expect(wallOnlyAgain?.t).toBe(wallOnly.t);
    }
    standIn.x = 100;
    standIn.z = 100;
    const wallAfterMove = earliestWallHit(ax, az, bx, bz, harness.collisionWorld);
    if (wallOnly) {
      expect(wallAfterMove?.t).toBe(wallOnly.t);
    } else {
      expect(wallAfterMove).toBeNull();
    }
  });

  it('tracer removed after projectile despawn on sync', () => {
    const harness = createCombatTestHarness();
    const scene = new THREE.Scene();
    const telegraphs = createCombatTelegraphs(scene);
    const cmds = new Map<number, InputCommand[]>([
      [0, [fireHeldOn(0, 0)]],
      [1, [{ tick: 1, sequence: 0, action: 'fire', value: 0 }]],
    ]);
    runTicks(harness, 2, cmds);
    telegraphs.sync(harness.state, harness.collisionWorld);
    expect(getTracerIdsForTest(telegraphs).length).toBe(1);
    runTicks(harness, 80);
    telegraphs.sync(harness.state, harness.collisionWorld);
    expect(getTracerIdsForTest(telegraphs).length).toBe(0);
    telegraphs.dispose();
  });

  it('aim line world endpoints span muzzle to wall hit', () => {
    const harness = createCombatTestHarness();
    const scene = new THREE.Scene();
    const telegraphs = createCombatTelegraphs(scene);
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.yaw = 0;

    telegraphs.sync(harness.state, harness.collisionWorld);
    scene.updateMatrixWorld(true);

    const dirX = Math.sin(player.yaw);
    const dirZ = Math.cos(player.yaw);
    const ox = player.x + dirX * PROJECTILE_MUZZLE_OFFSET_M;
    const oz = player.z + dirZ * PROJECTILE_MUZZLE_OFFSET_M;
    const ex = ox + dirX * PROJECTILE_MAX_RANGE_M;
    const ez = oz + dirZ * PROJECTILE_MAX_RANGE_M;
    const hit = earliestWallHit(ox, oz, ex, ez, harness.collisionWorld);
    const endX = hit ? hit.x : ex;
    const endZ = hit ? hit.z : ez;

    const endpoints = getAimLineEndpointsForTest(telegraphs);
    expect(endpoints.startX).toBeCloseTo(ox, 4);
    expect(endpoints.startY).toBeCloseTo(AIM_LINE_Y_M, 4);
    expect(endpoints.startZ).toBeCloseTo(oz, 4);
    expect(endpoints.endX).toBeCloseTo(endX, 3);
    expect(endpoints.endY).toBeCloseTo(AIM_LINE_Y_M, 4);
    expect(endpoints.endZ).toBeCloseTo(endZ, 3);

    telegraphs.dispose();
  });

  it('aim line FSM: dead hidden; rest dim; fireHeld bright', () => {
    const harness = createCombatTestHarness();
    const scene = new THREE.Scene();
    const telegraphs = createCombatTelegraphs(scene);
    const playerId = harness.state.meta.playerId!;

    harness.state.meta.fireHeld = false;
    telegraphs.sync(harness.state, harness.collisionWorld);
    let aim = getAimLineStateForTest(telegraphs);
    expect(aim.visible).toBe(true);
    expect(aim.opacity).toBeCloseTo(0.28, 2);

    harness.state.meta.fireHeld = true;
    telegraphs.sync(harness.state, harness.collisionWorld);
    aim = getAimLineStateForTest(telegraphs);
    expect(aim.visible).toBe(true);
    expect(aim.opacity).toBeCloseTo(0.9, 2);

    const player = getEntity(harness.state, playerId)!;
    player.alive = false;
    telegraphs.sync(harness.state, harness.collisionWorld);
    aim = getAimLineStateForTest(telegraphs);
    expect(aim.visible).toBe(false);

    telegraphs.dispose();
  });

  it('sync does not mutate SimState hash or entity fields', async () => {
    const harness = createCombatTestHarness();
    const scene = new THREE.Scene();
    const telegraphs = createCombatTelegraphs(scene);
    const cmds = new Map<number, InputCommand[]>();
    for (let t = 0; t < 15; t += 1) {
      cmds.set(t, [fireHeldOn(t, t)]);
    }
    runTicks(harness, 20, cmds);
    const before = cloneSimState(harness.state);
    const hashBefore = await hashSimState(before);
    telegraphs.sync(harness.state, harness.collisionWorld);
    const hashAfter = await hashSimState(harness.state);
    expect(hashAfter).toBe(hashBefore);
    expect(harness.state.tick).toBe(before.tick);
    for (const [id, entity] of before.entities) {
      const live = harness.state.entities.get(id);
      expect(live?.x).toBe(entity.x);
      expect(live?.hp).toBe(entity.hp);
      expect(live?.alive).toBe(entity.alive);
    }
    telegraphs.dispose();
  });

  it('no Math.random / Date.now in combatTelegraphs module', () => {
    const modules = import.meta.glob('../../src/render/combatTelegraphs.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    for (const text of Object.values(modules)) {
      expect(text).not.toMatch(/Math\.random/);
      expect(text).not.toMatch(/Date\.now/);
    }
  });
});

describe('combat telegraphs coupling (G10e)', () => {
  it('enabled sync vs disabled sync yields identical sim hash after same ticks', async () => {
    const harness = createCombatTestHarness();
    const byTick = new Map<number, InputCommand[]>();
    for (let t = 0; t < 40; t += 1) {
      byTick.set(t, [fireHeldOn(t, t)]);
    }

    const sceneA = new THREE.Scene();
    const sceneB = new THREE.Scene();
    const tgOn = createCombatTelegraphs(sceneA);
    const tgOff = createCombatTelegraphs(sceneB, { enabled: false });

    const stateA = cloneSimState(harness.state);
    const stateB = cloneSimState(harness.state);
    for (let i = 0; i < 45; i += 1) {
      const t = stateA.tick;
      const tickCmds = byTick.get(t) ?? [];
      for (const s of [stateA, stateB]) {
        applyCommands(s, tickCmds);
        integratePlayerMotion(s, harness.collisionWorld);
        integrateCombat(s, harness.collisionWorld, harness.graph);
        fixedStep(s);
      }
      tgOn.sync(stateA, harness.collisionWorld);
      tgOff.sync(stateB, harness.collisionWorld);
    }

    expect(await hashSimState(stateA)).toBe(await hashSimState(stateB));
    tgOn.dispose();
    tgOff.dispose();
  });
});
