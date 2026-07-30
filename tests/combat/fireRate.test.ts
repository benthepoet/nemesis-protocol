import { describe, expect, it } from 'vitest';
import { FIRE_INTERVAL_TICKS, MAGAZINE_SIZE, PROJECTILE_KIND } from '../../src/config.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('fire rate (G1)', () => {
  it('E1: hold fire 60 ticks → exactly 10 shots; magazine 20', () => {
    const harness = createCombatTestHarness();
    const cmds = new Map<number, InputCommand[]>();
    for (let t = 0; t < 60; t += 1) {
      cmds.set(t, [fireHeldOn(t, 0)]);
    }
    const events = runTicks(harness, 60, cmds, { collectEvents: true });
    expect(harness.state.meta.magazine).toBe(MAGAZINE_SIZE - 10);
    expect(FIRE_INTERVAL_TICKS).toBe(6);
    expect(events.filter((e) => e.type === 'muzzle').length).toBe(10);
  });

  it('E2: fire during reload spawns zero shots', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.magazine = 0;
    harness.state.meta.reloadTicksRemaining = 60;
    const cmds = new Map<number, InputCommand[]>();
    for (let t = 0; t < 10; t += 1) {
      cmds.set(t, [fireHeldOn(t, 0)]);
    }
    const magBefore = harness.state.meta.magazine;
    runTicks(harness, 10, cmds);
    expect(harness.state.meta.magazine).toBe(magBefore);
    const live = [...harness.state.entities.values()].filter(
      (e) => e.kind === PROJECTILE_KIND && e.alive,
    );
    expect(live.length).toBe(0);
  });
});
