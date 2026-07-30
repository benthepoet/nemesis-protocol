import { buildCollisionWorld } from '../../src/deck/collision.js';
import { spawnDeckEntities } from '../../src/deck/spawnDeckEntities.js';
import { spawnStandIns } from '../../src/combat/spawnStandIns.js';
import { spawnPlayer } from '../../src/player/spawnPlayer.js';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { createWorld } from '../../src/sim/world.js';
import type { CollisionWorld } from '../../src/deck/collision.js';
import type { DeckGraph } from '../../src/deck/types.js';
import type { InputCommand } from '../../src/sim/commands.js';
import type { SimState } from '../../src/sim/types.js';
import { loadTestDeck03 } from './deckTestUtils.js';

export interface CombatTestHarness {
  graph: DeckGraph;
  state: SimState;
  collisionWorld: CollisionWorld;
}

export function createCombatTestHarness(): CombatTestHarness {
  const graph = loadTestDeck03();
  const state = createWorld();
  spawnDeckEntities(state, graph);
  spawnPlayer(state, graph);
  spawnStandIns(state, graph);
  const collisionWorld = buildCollisionWorld(graph);
  return { graph, state, collisionWorld };
}

export function runTicks(
  harness: CombatTestHarness,
  ticks: number,
  commandsByTick?: Map<number, InputCommand[]>,
): void {
  for (let i = 0; i < ticks; i += 1) {
    const t = harness.state.tick;
    const cmds = commandsByTick?.get(t) ?? [];
    applyCommands(harness.state, cmds);
    integratePlayerMotion(harness.state, harness.collisionWorld);
    integrateCombat(harness.state, harness.collisionWorld, harness.graph);
    fixedStep(harness.state);
  }
}

export function countProjectiles(state: SimState): number {
  let n = 0;
  for (const e of state.entities.values()) {
    if (e.kind === 'projectile' && e.alive) n += 1;
  }
  return n;
}

export function fireHeldOn(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'fire', value: 1 };
}

export function fireHeldOff(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'fire', value: 0 };
}

export function reloadPress(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'reload', value: 1 };
}

export function debugDamagePress(tick: number, sequence: number): InputCommand {
  return { tick, sequence, action: 'debugDamage', value: 1 };
}

export function aimToward(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  tick: number,
  sequence: number,
): InputCommand {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const len = Math.hypot(dx, dz) || 1;
  return { tick, sequence, action: 'aim', value: 0, axisX: dx / len, axisZ: dz / len };
}
