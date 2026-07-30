/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { createHud } from '../../src/render/hud/createHud.js';
import { buildHudView } from '../../src/render/hud/buildHudView.js';
import { hashSimState } from '../../src/sim/hash.js';
import { cloneSimState } from '../../src/sim/world.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
  interactPress,
  interactRelease,
  moveAxis,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';

describe('hud determinism (G9)', () => {
  it('hash unchanged after buildHudView / update on cloned state', async () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    const cmds = new Map([
      [0, [moveAxis(0, 0, 0, 1)]],
      [1, [interactPress(1, 0)]],
      [2, [interactRelease(2, 0)]],
    ]);
    runMissionTicks(state, graph, collisionRef, 80, cmds);
    const before = await hashSimState(state);
    buildHudView(state);
    expect(await hashSimState(state)).toBe(before);
  });

  it('jsdom HUD update does not mutate sim hash', async () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    runMissionTicks(state, graph, collisionRef, 10);
    const hashBefore = await hashSimState(state);
    const host = document.createElement('div');
    const hud = createHud(host);
    hud.update(state);
    hud.update(cloneSimState(state));
    expect(await hashSimState(state)).toBe(hashBefore);
    hud.dispose();
  });

  it('different commands → different hash (control)', async () => {
    const a = createMissionTestWorld();
    const b = createMissionTestWorld();
    runMissionTicks(
      a.state,
      a.graph,
      a.collisionRef,
      3,
      new Map([
        [0, [interactPress(0, 0)]],
        [1, [interactRelease(1, 0)]],
      ]),
    );
    runMissionTicks(b.state, b.graph, b.collisionRef, 3);
    expect(await hashSimState(a.state)).not.toBe(await hashSimState(b.state));
  });
});
