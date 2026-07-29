import { describe, expect, it } from 'vitest';
import { CommandBus } from '../../src/input/commandBus.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import { createWorld } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';
import { scriptedScaffoldSession } from '../helpers/commandFixtures.js';

describe('command pattern (G4)', () => {
  it('E4: device samples do not mutate world until applyCommands', () => {
    const world = createWorld();
    const before = { ...world.meta };
    const kbm = new FakeInputDevice('keyboard-mouse');
    kbm.pushSample('interact', 1);
    const bus = new CommandBus();
    bus.enqueueFromDevices([kbm]);
    expect(world.meta).toEqual(before);
    const cmds = bus.drainForTick(world.tick);
    expect(world.meta).toEqual(before);
    applyCommands(world, cmds);
    expect(world.meta.interactCount).toBe(1);
  });

  it('E5: scripted command fixture updates meta counters', () => {
    const world = createWorld();
    const tick0 = scriptedScaffoldSession.filter((c) => c.tick === 0);
    applyCommands(world, tick0);
    fixedStep(world);
    const tick1 = scriptedScaffoldSession.filter((c) => c.tick === 1);
    applyCommands(world, tick1);
    fixedStep(world);
    expect(world.meta.interactCount).toBe(1);
    expect(world.meta.cancelCount).toBe(1);
    expect(world.meta.interactHeld).toBe(false);
  });

  it('E11: ignores commands whose tick does not match state.tick', () => {
    const world = createWorld();
    applyCommands(world, [
      { tick: 5, sequence: 0, action: 'interact', value: 1 },
    ]);
    expect(world.meta.interactCount).toBe(0);
  });

  it('applyCommands and fixedStep accept no deltaTime parameter', () => {
    expect(applyCommands.length).toBe(2);
    expect(fixedStep.length).toBe(1);
  });
});
