import { describe, expect, it } from 'vitest';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import type { CombatEvent } from '../../src/combat/types.js';
import { hashSimState } from '../../src/sim/hash.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { replay } from '../../src/sim/replay.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import type { SimState } from '../../src/sim/types.js';
import { cloneSimState } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

function advanceCombatTicks(
  initial: SimState,
  byTick: Map<number, InputCommand[]>,
  ticks: number,
  collisionWorld: ReturnType<typeof createCombatTestHarness>['collisionWorld'],
  graph: ReturnType<typeof createCombatTestHarness>['graph'],
  collectEvents: boolean,
): { state: SimState; events: CombatEvent[] } {
  const state = cloneSimState(initial);
  const events: CombatEvent[] = [];
  for (let i = 0; i < ticks; i += 1) {
    const t = state.tick;
    const tickCmds = byTick.get(t) ?? [];
    applyCommands(state, tickCmds);
    integratePlayerMotion(state, collisionWorld);
    const tickEvents = integrateCombat(state, collisionWorld, graph);
    if (collectEvents) events.push(...tickEvents);
    fixedStep(state);
  }
  return { state, events };
}

describe('combat determinism (G8)', () => {
  it('E19: identical fire streams → identical hash', async () => {
    const harness = createCombatTestHarness();
    const cmds: InputCommand[] = [];
    for (let t = 0; t < 30; t += 1) {
      cmds.push(fireHeldOn(t, t));
    }
    const a = replay(cloneSimState(harness.state), cmds, harness.collisionWorld, harness.graph);
    const b = replay(cloneSimState(harness.state), cmds, harness.collisionWorld, harness.graph);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
  });

  it('E20: different fire streams → different hash', async () => {
    const harness = createCombatTestHarness();
    const short: InputCommand[] = [fireHeldOn(0, 0)];
    const long: InputCommand[] = [];
    for (let t = 0; t < 20; t += 1) {
      long.push(fireHeldOn(t, t));
    }
    const a = replay(cloneSimState(harness.state), short, harness.collisionWorld, harness.graph);
    const b = replay(cloneSimState(harness.state), long, harness.collisionWorld, harness.graph);
    expect(await hashSimState(a)).not.toBe(await hashSimState(b));
  });

  it('E21: collecting vs discarding combat VFX events does not change sim', async () => {
    const harness = createCombatTestHarness();
    const byTick = new Map<number, InputCommand[]>();
    for (let t = 0; t < 40; t += 1) {
      byTick.set(t, [fireHeldOn(t, t)]);
    }

    const discarded = advanceCombatTicks(
      harness.state,
      byTick,
      45,
      harness.collisionWorld,
      harness.graph,
      false,
    );
    const collected = advanceCombatTicks(
      harness.state,
      byTick,
      45,
      harness.collisionWorld,
      harness.graph,
      true,
    );

    expect(collected.events.length).toBeGreaterThan(0);
    expect(collected.state.tick).toBe(discarded.state.tick);
    expect(await hashSimState(collected.state)).toBe(await hashSimState(discarded.state));
  });

  it('E28: no Math.random / Date.now in src/combat', () => {
    const modules = import.meta.glob('../../src/combat/*.ts', {
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
