import { describe, expect, it } from 'vitest';
import {
  ACTOR_MAX_HP,
  HUD_LOW_HEALTH_HP,
  MAGAZINE_SIZE,
  OBJECTIVE_BANNER_TEXT,
  RELOAD_DURATION_TICKS,
  RESERVE_AMMO_START,
  TICK_HZ,
} from '../../src/config.js';
import { ALARM_LEVEL_LABELS } from '../../src/render/hud/alarmLabels.js';
import { buildHudView } from '../../src/render/hud/buildHudView.js';
import { formatMissionClock } from '../../src/render/hud/formatMissionClock.js';
import { getEntity } from '../../src/sim/world.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { setEntityPose } from '../../src/sim/world.js';
import {
  confirmBreachAndSkipToActive,
  confirmBreachInsertion,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { createCombatTestHarness, fireHeldOn, runTicks } from '../helpers/combatTestUtils.js';

describe('formatMissionClock (G6, M5)', () => {
  it('M:SS from sim ticks', () => {
    expect(formatMissionClock(0)).toBe('0:00');
    expect(formatMissionClock(TICK_HZ)).toBe('0:01');
    expect(formatMissionClock(60 * TICK_HZ)).toBe('1:00');
    expect(formatMissionClock(61 * TICK_HZ)).toBe('1:01');
  });

  it('clamps negative ticks to 0:00', () => {
    expect(formatMissionClock(-10)).toBe('0:00');
  });
});

describe('buildHudView visibility (G1, M6)', () => {
  it('null for BRIEFING', () => {
    const { state } = createMissionTestWorld();
    expect(buildHudView(state)).toBeNull();
  });

  it('null for SCORE', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.missionPhase).toBe('SCORE');
    expect(buildHudView(state)).toBeNull();
  });

  it('visible for INSERTION and ACTIVE', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    expect(state.meta.missionPhase).toBe('INSERTION');
    expect(buildHudView(state)).not.toBeNull();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    expect(buildHudView(state)).not.toBeNull();
  });
});

describe('buildHudView health (G2, M1)', () => {
  it('lowHealth at 25 and clears at 26', () => {
    const harness = createCombatTestHarness();
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.hp = HUD_LOW_HEALTH_HP;
    expect(buildHudView(harness.state)!.health.lowHealth).toBe(true);
    player.hp = HUD_LOW_HEALTH_HP + 1;
    expect(buildHudView(harness.state)!.health.lowHealth).toBe(false);
  });

  it('hp 0 without player entity', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.playerId = null;
    expect(buildHudView(harness.state)!.health.hp).toBe(0);
  });
});

describe('buildHudView ammo (G3, M2)', () => {
  it('magazine / reserve idle', () => {
    const harness = createCombatTestHarness();
    const view = buildHudView(harness.state)!;
    expect(view.ammo.magazine).toBe(MAGAZINE_SIZE);
    expect(view.ammo.reserve).toBe(RESERVE_AMMO_START);
    expect(view.ammo.reloading).toBe(false);
    expect(view.ammo.reloadProgress).toBe(0);
  });

  it('reload progress while reloading', () => {
    const harness = createCombatTestHarness();
    harness.state.meta.magazine = 0;
    harness.state.meta.reloadTicksRemaining = RELOAD_DURATION_TICKS;
    const view = buildHudView(harness.state)!;
    expect(view.ammo.reloading).toBe(true);
    expect(view.ammo.reloadProgress).toBe(0);
    harness.state.meta.reloadTicksRemaining = RELOAD_DURATION_TICKS / 2;
    expect(buildHudView(harness.state)!.ammo.reloadProgress).toBeCloseTo(0.5, 2);
  });

  it('seven rounds fired updates mag within one tick window', () => {
    const harness = createCombatTestHarness();
    const cmds = new Map<number, ReturnType<typeof fireHeldOn>[]>();
    for (let t = 0; t < 7 * 6; t += 6) {
      cmds.set(t, [fireHeldOn(t, 0)]);
    }
    runTicks(harness, 7 * 6, cmds);
    expect(buildHudView(harness.state)!.ammo.magazine).toBe(MAGAZINE_SIZE - 7);
  });
});

describe('buildHudView objective (G4, M3)', () => {
  it('empty until issued', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    expect(buildHudView(state)!.objective.text).toBe('');
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    expect(buildHudView(state)!.objective.text).toBe(OBJECTIVE_BANNER_TEXT);
  });
});

describe('buildHudView alarm (G5, M4)', () => {
  it('AL0 then AL1 labels', () => {
    const harness = createCombatTestHarness();
    expect(buildHudView(harness.state)!.alarm.label).toBe('AL0 UNAWARE');
    expect(buildHudView(harness.state)!.alarm.hazardous).toBe(false);
    harness.state.meta.alarmLevel = 1;
    const view = buildHudView(harness.state)!;
    expect(view.alarm.label).toBe('AL1 ALERTED');
    expect(view.alarm.hazardous).toBe(true);
  });

  it('alarm table forward-compat keys 0..4', () => {
    for (let i = 0; i <= 4; i += 1) {
      expect(ALARM_LEVEL_LABELS[i]).toBeDefined();
    }
  });
});

describe('buildHudView clock (G6, M5)', () => {
  it('advances with tick', () => {
    const harness = createCombatTestHarness();
    harness.state.tick = 120;
    const view = buildHudView(harness.state)!;
    expect(view.clock.text).toBe(formatMissionClock(120));
    expect(view.clock.text).toBe(formatMissionClock(view.clock.ticks));
  });

  it('mission end tick matches score clock source', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    runMissionTicks(state, graph, collisionRef, 100);
    const activeView = buildHudView(state)!;
    expect(activeView.clock.text).toBe(formatMissionClock(state.tick));
  });
});

describe('INSERTION baseline (E-b)', () => {
  it('start readouts', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    const view = buildHudView(state)!;
    expect(view.health.hp).toBe(ACTOR_MAX_HP);
    expect(view.ammo.magazine).toBe(MAGAZINE_SIZE);
    expect(view.ammo.reserve).toBe(RESERVE_AMMO_START);
    expect(view.alarm.label).toBe('AL0 UNAWARE');
    expect(view.objective.text).toBe('');
  });
});
