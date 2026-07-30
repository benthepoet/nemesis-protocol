import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { integrateCrewAi } from '../../src/ai/integrateCrewAi.js';
import { integrateMissionShell } from '../../src/mission/integrateMissionShell.js';
import type { CombatEvent } from '../../src/combat/types.js';
import { createCombatTelegraphs } from '../../src/render/combatTelegraphs.js';
import { hashSimState } from '../../src/sim/hash.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { replay } from '../../src/sim/replay.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import type { SimState } from '../../src/sim/types.js';
import { cloneSimState, getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

function advanceCombatTicks(
  initial: SimState,
  byTick: Map<number, InputCommand[]>,
  ticks: number,
  harness: ReturnType<typeof createCombatTestHarness>,
  collectEvents: boolean,
): { state: SimState; events: CombatEvent[] } {
  const state = cloneSimState(initial);
  const events: CombatEvent[] = [];
  for (let i = 0; i < ticks; i += 1) {
    const t = state.tick;
    const tickCmds = byTick.get(t) ?? [];
    applyCommands(state, tickCmds);
    integrateMissionShell(state, harness.graph, harness.collisionRef);
    integratePlayerMotion(state, harness.collisionRef.current);
    integrateCrewAi(state, harness.collisionRef.current, harness.graph);
    const tickEvents = integrateCombat(state, harness.collisionRef.current, harness.graph);
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
    const a = replay(cloneSimState(harness.state), cmds, harness.collisionRef, harness.graph);
    const b = replay(cloneSimState(harness.state), cmds, harness.collisionRef, harness.graph);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
  });

  it('E20: different fire streams → different hash', async () => {
    const harness = createCombatTestHarness();
    const short: InputCommand[] = [fireHeldOn(0, 0)];
    const long: InputCommand[] = [];
    for (let t = 0; t < 20; t += 1) {
      long.push(fireHeldOn(t, t));
    }
    const a = replay(cloneSimState(harness.state), short, harness.collisionRef, harness.graph);
    const b = replay(cloneSimState(harness.state), long, harness.collisionRef, harness.graph);
    expect(await hashSimState(a)).not.toBe(await hashSimState(b));
  });

  it('E21: collecting vs discarding combat VFX events does not change sim', async () => {
    const harness = createCombatTestHarness();
    const byTick = new Map<number, InputCommand[]>();
    for (let t = 0; t < 40; t += 1) {
      byTick.set(t, [fireHeldOn(t, t)]);
    }

    const discarded = advanceCombatTicks(harness.state, byTick, 45, harness, false);
    const collected = advanceCombatTicks(harness.state, byTick, 45, harness, true);

    expect(collected.events.length).toBeGreaterThan(0);
    expect(collected.state.tick).toBe(discarded.state.tick);
    expect(await hashSimState(collected.state)).toBe(await hashSimState(discarded.state));
  });

  it('G10(e): telegraphs sync does not change sim hash', async () => {
    const harness = createCombatTestHarness();
    const byTick = new Map<number, InputCommand[]>();
    for (let t = 0; t < 40; t += 1) {
      byTick.set(t, [fireHeldOn(t, t)]);
    }

    const synced = advanceCombatTicks(harness.state, byTick, 45, harness, false);
    const plain = advanceCombatTicks(harness.state, byTick, 45, harness, false);

    const scene = new THREE.Scene();
    const tgOn = createCombatTelegraphs(scene);
    const tgOff = createCombatTelegraphs(scene, { enabled: false });
    const hashBefore = await hashSimState(synced.state);
    tgOn.sync(synced.state, harness.collisionWorld);
    tgOff.sync(plain.state, harness.collisionWorld);
    expect(await hashSimState(synced.state)).toBe(hashBefore);
    expect(await hashSimState(plain.state)).toBe(await hashSimState(synced.state));
    tgOn.dispose();
    tgOff.dispose();
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

  it('E18: gamepad aimAssist replay → identical yaw series and hash', async () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const aimYaw = Math.atan2(crew.x - player.x, crew.z - player.z) - 0.05;
    const cmds: InputCommand[] = [];
    for (let t = 0; t < 20; t += 1) {
      cmds.push({
        tick: t,
        sequence: t,
        action: 'aim',
        value: 0,
        axisX: Math.sin(aimYaw),
        axisZ: Math.cos(aimYaw),
      });
    }
    const opts = { aimAssist: true as const };
    const a = replay(cloneSimState(harness.state), cmds, harness.collisionRef, harness.graph, opts);
    const b = replay(cloneSimState(harness.state), cmds, harness.collisionRef, harness.graph, opts);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
    const playerA = getEntity(a, a.meta.playerId!)!.yaw;
    const playerB = getEntity(b, b.meta.playerId!)!.yaw;
    expect(playerA).toBe(playerB);

    const cmds2 = cmds.map((c) =>
      c.tick >= 10
        ? { ...c, axisX: Math.sin(aimYaw + 0.5), axisZ: Math.cos(aimYaw + 0.5) }
        : c,
    );
    const c = replay(cloneSimState(harness.state), cmds2, harness.collisionRef, harness.graph, opts);
    expect(await hashSimState(c)).not.toBe(await hashSimState(a));
  });
});
