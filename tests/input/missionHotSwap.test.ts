import { describe, expect, it } from 'vitest';
import { AIRLOCK_ENTRY_CYCLE_TICKS } from '../../src/config.js';
import { CommandBus } from '../../src/input/commandBus.js';
import { getEntity } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';
import {
  confirmBreachAndSkipToActive,
  confirmBreachInsertion,
  createMissionTestWorld,
} from '../helpers/missionTestUtils.js';
import {
  runMissionSliceWithDevices,
  runMissionTicksWithDevices,
} from '../helpers/gamepadLoopUtils.js';

function slice(
  state: ReturnType<typeof createMissionTestWorld>['state'],
  graph: ReturnType<typeof createMissionTestWorld>['graph'],
  collisionRef: ReturnType<typeof createMissionTestWorld>['collisionRef'],
  bus: CommandBus,
  kbm: FakeInputDevice,
  pad: FakeInputDevice,
): void {
  runMissionSliceWithDevices(state, graph, collisionRef, bus, [kbm, pad]);
}

describe('mission hot-swap (G5)', () => {
  it('E14: BRIEFING swap — no phase reset; synthetic releases', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    expect(state.meta.missionPhase).toBe('BRIEFING');
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();
    kbm.pushSample('interact', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    kbm.setHeld('interact', true);
    pad.pushSample('cancel', 1);
    const phaseBefore = state.meta.missionPhase;
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.missionPhase).toBe(phaseBefore);
    expect(state.meta.cancelHeld).toBe(true);
  });

  it('E14: INSERTION swap with verbs locked', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    expect(state.meta.missionPhase).toBe('INSERTION');
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();
    kbm.pushSample('fire', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.fireHeld).toBe(false);
    pad.pushSample('fire', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.fireHeld).toBe(false);
    expect(state.meta.missionPhase).toBe('INSERTION');
  });

  it('E14: ACTIVE mid-fight fire held — swap clears RT without stuck autofire', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();
    pad.pushSample('fire', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.fireHeld).toBe(true);
    pad.setHeld('fire', true);
    kbm.pushSample('fire', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.fireHeld).toBe(true);
    kbm.setHeld('fire', true);
    pad.pushSample('fire', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.fireHeld).toBe(true);
  });

  it('E15: facing unchanged across aim swap with no new aim sample', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const playerId = state.meta.playerId!;
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();
    kbm.pushAxisSample('aim', 1, 0);
    slice(state, graph, collisionRef, bus, kbm, pad);
    const yawAtSwap = getEntity(state, playerId)!.yaw;
    pad.pushSample('fire', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(getEntity(state, playerId)!.yaw).toBeCloseTo(yawAtSwap, 10);
  });

  it('E14: SCORE swap — no menu reset on channel change', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    state.meta.missionPhase = 'SCORE';
    state.meta.score = {
      outcome: 'COMPLETE',
      breachRoomId: 'port-airlock',
      missionEndTick: 100,
      alarmTripped: false,
      alarmTripTick: null,
      crewNeutralized: 0,
    };
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();
    kbm.pushSample('cancel', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    pad.pushSample('cancel', 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(state.meta.missionPhase).toBe('SCORE');
  });

  it('receiving device next aim sample owns aim channel', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const playerId = state.meta.playerId!;
    const kbm = new FakeInputDevice('keyboard-mouse');
    const pad = new FakeInputDevice('gamepad');
    const bus = new CommandBus();
    kbm.pushAxisSample('aim', 0, 1);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(bus.getChannelOwner('aim')).toBe('keyboard-mouse');
    pad.pushAxisSample('aim', 1, 0);
    slice(state, graph, collisionRef, bus, kbm, pad);
    expect(bus.getChannelOwner('aim')).toBe('gamepad');
    expect(getEntity(state, playerId)!.yaw).toBeCloseTo(Math.atan2(1, 0), 5);
  });
});

describe('mission hot-swap helpers', () => {
  it('full insertion cycle length unchanged after empty device ticks', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachInsertion(state, graph, collisionRef);
    const t0 = state.meta.insertionTicksRemaining;
    runMissionTicksWithDevices(
      state,
      graph,
      collisionRef,
      new CommandBus(),
      [],
      AIRLOCK_ENTRY_CYCLE_TICKS,
    );
    expect(state.meta.missionPhase).toBe('ACTIVE');
    expect(t0).toBe(AIRLOCK_ENTRY_CYCLE_TICKS);
  });
});
