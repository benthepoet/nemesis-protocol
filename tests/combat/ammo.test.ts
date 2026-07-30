import { describe, expect, it } from 'vitest';
import {
  FIXED_DT,
  MAGAZINE_SIZE,
  PROJECTILE_MAX_RANGE_M,
  PROJECTILE_SPEED_MPS,
  RELOAD_DURATION_TICKS,
  RESERVE_AMMO_START,
} from '../../src/config.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  reloadPress,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

describe('ammo (G5)', () => {
  it('E3: magazine 0 and reserve 0 → zero spawns on fire hold', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.magazine = 0;
    harness.state.meta.reserve = 0;
    const cmds = new Map<number, InputCommand[]>();
    for (let t = 0; t < 20; t += 1) {
      cmds.set(t, [fireHeldOn(t, 0)]);
    }
    runTicks(harness, 20, cmds);
    expect(harness.state.meta.magazine).toBe(0);
    expect(harness.state.meta.reloadTicksRemaining).toBe(0);
  });

  it('E12: empty mag + fire starts reload; completes at 120 ticks', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.magazine = 0;
    harness.state.meta.reserve = RESERVE_AMMO_START;
    const cmds = new Map<number, InputCommand[]>();
    cmds.set(0, [fireHeldOn(0, 0)]);
    runTicks(harness, 1, cmds);
    expect(harness.state.meta.reloadTicksRemaining).toBeGreaterThan(0);
    runTicks(harness, RELOAD_DURATION_TICKS);
    expect(harness.state.meta.magazine).toBe(MAGAZINE_SIZE);
    expect(harness.state.meta.reserve).toBe(RESERVE_AMMO_START - MAGAZINE_SIZE);
  });

  it('E13: reload with reserve 0 is no-op', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.magazine = 5;
    harness.state.meta.reserve = 0;
    const cmds = new Map<number, InputCommand[]>([[0, [reloadPress(0, 0)]]]);
    runTicks(harness, 1, cmds);
    expect(harness.state.meta.reloadTicksRemaining).toBe(0);
  });

  it('E14: explicit reload mid-mag starts and is uninterruptible', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.magazine = 10;
    const cmds = new Map<number, InputCommand[]>();
    cmds.set(0, [reloadPress(0, 0)]);
    for (let t = 0; t < 30; t += 1) {
      cmds.set(t, [...(cmds.get(t) ?? []), fireHeldOn(t, 1)]);
    }
    runTicks(harness, 30, cmds);
    expect(harness.state.meta.magazine).toBe(10);
    expect(harness.state.meta.reloadTicksRemaining).toBeGreaterThan(0);
  });
});

describe('projectile constants (G2 helper)', () => {
  it('E4: step distance equals 1 m per tick', () => {
    expect(PROJECTILE_SPEED_MPS * FIXED_DT).toBeCloseTo(1, 5);
    expect(PROJECTILE_MAX_RANGE_M).toBe(60);
  });
});
