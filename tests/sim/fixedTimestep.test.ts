import { describe, expect, it } from 'vitest';
import { FIXED_DT, MAX_FRAME_DELTA_SEC, TICK_HZ } from '../../src/config.js';
import { CommandBus } from '../../src/input/commandBus.js';
import { runFixedTimestepSlice } from '../../src/render/frameLoop.js';
import { createWorld } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';

describe('fixed timestep (G3)', () => {
  it('E1: at 30 FPS sim advances 60 ticks per simulated second', () => {
    const world = createWorld();
    const bus = new CommandBus();
    const devices = [new FakeInputDevice('keyboard-mouse')];
    let acc = 0;
    const dt = 1 / 30;
    let totalTicks = 0;
    for (let frame = 0; frame < 30; frame += 1) {
      const result = runFixedTimestepSlice({
        world,
        bus,
        devices,
        dtSec: dt,
        accumulator: acc,
      });
      acc = result.accumulator;
      totalTicks += result.ticksAdvanced;
    }
    expect(totalTicks).toBe(TICK_HZ);
  });

  it('E2: at 144 FPS sim advances 60 ticks per second with leftover accumulator', () => {
    const world = createWorld();
    const bus = new CommandBus();
    const devices = [new FakeInputDevice('keyboard-mouse')];
    let acc = 0;
    const dt = 1 / 144;
    let totalTicks = 0;
    let simulatedSec = 0;
    while (simulatedSec < 1) {
      const result = runFixedTimestepSlice({
        world,
        bus,
        devices,
        dtSec: dt,
        accumulator: acc,
      });
      acc = result.accumulator;
      totalTicks += result.ticksAdvanced;
      simulatedSec += dt;
    }
    expect(totalTicks).toBe(TICK_HZ);
    expect(acc).toBeGreaterThan(0);
    expect(acc).toBeLessThan(FIXED_DT);
  });

  it('E3: clamps dt spikes to MAX_FRAME_DELTA_SEC', () => {
    const world = createWorld();
    const bus = new CommandBus();
    const devices = [new FakeInputDevice('keyboard-mouse')];
    const maxTicks = Math.floor(MAX_FRAME_DELTA_SEC / FIXED_DT);
    const result = runFixedTimestepSlice({
      world,
      bus,
      devices,
      dtSec: 1,
      accumulator: 0,
    });
    expect(result.ticksAdvanced).toBe(maxTicks);
  });
});
