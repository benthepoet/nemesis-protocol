import { describe, expect, it } from 'vitest';
import { AIRLOCK_ENTRY_CYCLE_TICKS, RIFLE_DAMAGE_PER_HIT } from '../../src/config.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { CommandBus } from '../../src/input/commandBus.js';
import { getEntity } from '../../src/sim/world.js';
import { setEntityPose } from '../../src/sim/world.js';
import {
  confirmBreachAndSkipToActive,
  createMissionTestWorld,
  runMissionTicks,
} from '../helpers/missionTestUtils.js';
import {
  RecordingGamepadDevice,
  runMissionSliceWithDevices,
  runMissionTicksWithDevices,
} from '../helpers/gamepadLoopUtils.js';

describe('gamepad-only mission loop (G7)', () => {
  it('E17: full loop with zero keyboard-mouse samples', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    const pad = new RecordingGamepadDevice();
    const bus = new CommandBus();
    const devices = [pad];

    pad.pushAxisSample('move', 0, -1);
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
    pad.pushSample('interact', 1);
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
    pad.pushSample('interact', 0);
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);

    expect(state.meta.missionPhase).toBe('INSERTION');
    runMissionTicksWithDevices(
      state,
      graph,
      collisionRef,
      bus,
      devices,
      AIRLOCK_ENTRY_CYCLE_TICKS,
    );
    expect(state.meta.missionPhase).toBe('ACTIVE');

    const playerId = state.meta.playerId!;
    const crewId = state.meta.crewIds[2]!;
    const crew = getEntity(state, crewId)!;
    const player = getEntity(state, playerId)!;
    player.x = crew.x - 1.5;
    player.z = crew.z;
    player.yaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    const aimYaw = player.yaw;
    pad.pushAxisSample('aim', Math.sin(aimYaw), Math.cos(aimYaw));
    pad.pushSample('fire', 1);
    pad.setHeld('fire', true);

    let ticks = 0;
    while (crew.alive && ticks < 200) {
      if (ticks > 0) {
        pad.pushSample('fire', 1);
      }
      runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
      ticks += 1;
    }
    expect(crew.alive).toBe(false);
    expect(crew.hp).toBeLessThanOrEqual(100 - RIFLE_DAMAGE_PER_HIT);

    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, playerId, eng.x, 0, eng.z);
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
    expect(state.meta.missionPhase).toBe('SCORE');
    expect(state.meta.score?.outcome).toBe('COMPLETE');

    state.meta.interactHeld = false;
    state.meta.shellInteractPrev = false;
    pad.pushSample('interact', 1);
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
    pad.pushSample('interact', 0);
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
    expect(state.meta.missionPhase).toBe('BRIEFING');

    expect(pad.recordedKinds.every((k) => k === 'gamepad')).toBe(true);
    expect(pad.recordedKinds.length).toBeGreaterThan(0);
  });

  it('KBM-only regression still reaches SCORE', () => {
    const { graph, state, collisionRef } = createMissionTestWorld();
    confirmBreachAndSkipToActive(state, graph, collisionRef);
    const eng = footprintCenter(getNode(graph, 'engineering'));
    setEntityPose(state, state.meta.playerId!, eng.x, 0, eng.z);
    runMissionTicks(state, graph, collisionRef, 1, undefined, { aimAssist: false });
    expect(state.meta.missionPhase).toBe('SCORE');
  });
});
