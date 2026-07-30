/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { ACTION_BINDINGS } from '../../src/input/bindings.js';
import { createMissionShellUi } from '../../src/render/missionShellUi.js';
import {
  createMissionTestWorld,
  interactPress,
  moveAxis,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { setEntityPose } from '../../src/sim/world.js';
import { confirmBreachAndSkipToActive } from '../helpers/missionTestUtils.js';

const EXPECTED_BINDINGS = [
  { action: 'fire', mouseButton: 0, gamepadButton: 7 },
  { action: 'reload', keyboard: 'KeyR', gamepadButton: 2 },
  { action: 'interact', keyboard: 'KeyE', gamepadButton: 0 },
  { action: 'cancel', keyboard: 'Escape', gamepadButton: 1 },
] as const;

describe('shell focus (G7, M7)', () => {
  it('BRIEFING focus follows breachSelectIndex with UI_FOCUS_HEX', () => {
    const host = document.createElement('div');
    const ui = createMissionShellUi(host);
    const { state } = createMissionTestWorld();
    state.meta.breachSelectIndex = 1;
    ui.update(state);
    const focused = host.querySelector('[data-focused="true"]') as HTMLElement;
    expect(focused).toBeTruthy();
    expect(focused.textContent).toContain('Starboard');
    expect(focused.style.color.toLowerCase()).toBe('rgb(255, 213, 79)');
    ui.dispose();
  });

  it('SCORE restart line focused', () => {
    const host = document.createElement('div');
    const ui = createMissionShellUi(host);
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    expect(state.meta.missionPhase).toBe('SCORE');
    ui.update(state);
    const focused = host.querySelector('[data-focused="true"]') as HTMLElement;
    expect(focused?.textContent).toContain('Interact to restart');
    expect(focused!.style.color.toLowerCase()).toBe('rgb(255, 213, 79)');
    ui.dispose();
  });

  it('identical breachSelectIndex from equivalent move streams', () => {
    const a = createMissionTestWorld();
    const b = createMissionTestWorld();
    const cmds = new Map([[0, [moveAxis(0, 0, 0, -1)]]]);
    runMissionTicks(a.state, a.graph, a.collisionRef, 1, cmds);
    runMissionTicks(b.state, b.graph, b.collisionRef, 1, cmds);
    expect(a.state.meta.breachSelectIndex).toBe(b.state.meta.breachSelectIndex);
    expect(a.state.meta.breachSelectIndex).toBe(1);
  });

  it('ACTION_BINDINGS unchanged', () => {
    expect(ACTION_BINDINGS).toHaveLength(EXPECTED_BINDINGS.length);
    expect([...ACTION_BINDINGS]).toEqual([...EXPECTED_BINDINGS]);
  });
});

describe('SCORE restart parity', () => {
  it('interact press advances restart from SCORE', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1);
    runMissionTicks(
      state,
      graph,
      collisionRef,
      1,
      new Map([[state.tick, [interactPress(state.tick, 0)]]]),
    );
    expect(state.meta.missionPhase).toBe('BRIEFING');
  });
});
