import { describe, expect, it } from 'vitest';
import { ACTOR_PROXY_RADIUS_M, FIXED_DT, PLAYER_MOVE_SPEED_MPS, TICK_HZ } from '../../src/config.js';
import { circleHitsWalls } from '../../src/deck/collision.js';
import { listDoorEdges } from '../../src/deck/graph.js';
import type { DoorEdge } from '../../src/deck/types.js';
import type { InputCommand } from '../../src/sim/commands.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { getEntity } from '../../src/sim/world.js';
import { createPlayerTestHarness } from '../helpers/playerTestUtils.js';

function tickMove(
  state: ReturnType<typeof createPlayerTestHarness>['state'],
  collisionWorld: ReturnType<typeof createPlayerTestHarness>['collisionWorld'],
  axisX: number,
  axisZ: number,
): void {
  applyCommands(state, [
    {
      tick: state.tick,
      sequence: 0,
      action: 'move',
      value: 0,
      axisX,
      axisZ,
    },
  ]);
  integratePlayerMotion(state, collisionWorld);
  fixedStep(state);
}

/** Half-span for centerline sweep inset from opening edges by actor radius. */
function doorTraverseHalfSpan(door: DoorEdge): number {
  const r = ACTOR_PROXY_RADIUS_M;
  const passage = Math.max(door.opening.w, door.opening.h);
  if (passage <= 2 * r) return 0;
  return Math.min(passage / 2 - r, passage / 4);
}

function slideThroughDoorOpening(
  state: ReturnType<typeof createPlayerTestHarness>['state'],
  collisionWorld: ReturnType<typeof createPlayerTestHarness>['collisionWorld'],
  door: DoorEdge,
): void {
  const id = state.meta.playerId!;
  const entity = getEntity(state, id)!;
  const { x, z, w, h } = door.opening;
  const cx = x + w / 2;
  const cz = z + h / 2;
  const axis = w >= h ? 'x' : 'z';
  const halfSpan = doorTraverseHalfSpan(door);
  const traverseM = halfSpan > 0 ? halfSpan * 2 : Math.max(w, h) * 0.25;
  const r = ACTOR_PROXY_RADIUS_M;

  entity.x = cx;
  entity.z = cz;
  expect(circleHitsWalls(collisionWorld, entity.x, entity.z, r)).toBe(false);

  const runLeg = (moveX: number, moveZ: number, ticks: number): void => {
    for (let i = 0; i < ticks; i += 1) {
      tickMove(state, collisionWorld, moveX, moveZ);
      expect(circleHitsWalls(collisionWorld, entity.x, entity.z, r)).toBe(false);
    }
  };

  const ticksFor = (distanceM: number) =>
    Math.ceil(distanceM / (PLAYER_MOVE_SPEED_MPS * FIXED_DT)) + 5;

  if (axis === 'x') {
    runLeg(-1, 0, ticksFor(traverseM / 2));
    entity.x = cx;
    entity.z = cz;
    runLeg(1, 0, ticksFor(traverseM));
  } else {
    runLeg(0, -1, ticksFor(traverseM / 2));
    entity.x = cx;
    entity.z = cz;
    runLeg(0, 1, ticksFor(traverseM));
  }
}

describe('player motion (G2, G4)', () => {
  function placeInOpenRoom(state: ReturnType<typeof createPlayerTestHarness>['state'], graph: ReturnType<typeof createPlayerTestHarness>['graph']): void {
    const cargo = graph.nodes.get('cargo-hold')!;
    if (cargo.footprint.kind !== 'rect') return;
    const r = cargo.footprint.rect;
    const id = state.meta.playerId!;
    const e = getEntity(state, id)!;
    e.x = r.x + r.w * 0.25;
    e.z = r.z + r.h * 0.25;
  }

  it('E2: cardinal move (1,0) for 60 ticks ≈ 6 m in X', () => {
    const harness = createPlayerTestHarness();
    placeInOpenRoom(harness.state, harness.graph);
    const { state, collisionWorld } = harness;
    const id = state.meta.playerId!;
    const start = getEntity(state, id)!;
    const x0 = start.x;
    for (let i = 0; i < TICK_HZ; i += 1) {
      tickMove(state, collisionWorld, 1, 0);
    }
    const end = getEntity(state, id)!;
    expect(end.x - x0).toBeCloseTo(PLAYER_MOVE_SPEED_MPS * 1.0, 1);
    expect(Math.abs(end.z - start.z)).toBeLessThan(0.05);
  });

  it('E3: diagonal (1,1) same speed as cardinal (no √2 boost)', () => {
    const harness = createPlayerTestHarness();
    const { state, collisionWorld, graph } = harness;
    const cargo = graph.nodes.get('cargo-hold')!;
    if (cargo.footprint.kind === 'rect') {
      const r = cargo.footprint.rect;
      const id = state.meta.playerId!;
      const e = getEntity(state, id)!;
      e.x = r.x + r.w / 2;
      e.z = r.z + r.h / 2;
    }
    const id = state.meta.playerId!;
    const start = getEntity(state, id)!;
    const x0 = start.x;
    const z0 = start.z;
    for (let i = 0; i < TICK_HZ; i += 1) {
      tickMove(state, collisionWorld, 1, 1);
    }
    const end = getEntity(state, id)!;
    const dist = Math.hypot(end.x - x0, end.z - z0);
    expect(dist / 1.0).toBeCloseTo(PLAYER_MOVE_SPEED_MPS, 1);
  });

  it('E7: final pose not inside walls after driving into partition', () => {
    const { state, collisionWorld } = createPlayerTestHarness();
    const id = state.meta.playerId!;
    for (let i = 0; i < TICK_HZ * 2; i += 1) {
      tickMove(state, collisionWorld, 0, 1);
    }
    const end = getEntity(state, id)!;
    expect(circleHitsWalls(collisionWorld, end.x, end.z, ACTOR_PROXY_RADIUS_M)).toBe(false);
  });

  it('E8: scripted slide through all 17 door openings at actor radius', () => {
    const { state, collisionWorld, graph } = createPlayerTestHarness();
    for (const door of listDoorEdges(graph)) {
      slideThroughDoorOpening(state, collisionWorld, door);
    }
  });
});

describe('command parity motion (E4)', () => {
  it('identical axis command streams produce identical pose', () => {
    const run = (cmds: InputCommand[]) => {
      const { state, collisionWorld } = createPlayerTestHarness();
      for (const cmd of cmds) {
        applyCommands(state, [{ ...cmd, tick: state.tick }]);
        integratePlayerMotion(state, collisionWorld);
        fixedStep(state);
      }
      const id = state.meta.playerId!;
      const e = getEntity(state, id)!;
      return { x: e.x, z: e.z };
    };

    const stream = (seq: number): InputCommand[] =>
      Array.from({ length: 30 }, (_, i) => ({
        tick: i,
        sequence: seq + i,
        action: 'move' as const,
        value: 0 as const,
        axisX: 1,
        axisZ: 0,
      }));

    expect(run(stream(0))).toEqual(run(stream(100)));
  });
});
