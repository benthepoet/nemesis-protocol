import { integrateMissionShell, type CollisionWorldRef } from '../../src/mission/integrateMissionShell.js';
import { integrateCombat } from '../../src/combat/integrateCombat.js';
import { integrateCrewAi } from '../../src/ai/integrateCrewAi.js';
import { integratePlayerMotion } from '../../src/sim/playerMotion.js';
import { applyCommands, fixedStep } from '../../src/sim/step.js';
import type { DeckGraph } from '../../src/deck/types.js';
import type { SimState } from '../../src/sim/types.js';
import { CommandBus } from '../../src/input/commandBus.js';
import type { InputDevice } from '../../src/input/types.js';
import { FakeInputDevice } from './fakeDevices.js';

export class RecordingGamepadDevice extends FakeInputDevice {
  readonly recordedKinds: ('keyboard-mouse' | 'gamepad')[] = [];

  constructor() {
    super('gamepad');
  }

  override pushSample(action: Parameters<FakeInputDevice['pushSample']>[0], value: 0 | 1): void {
    this.recordedKinds.push(this.kind);
    super.pushSample(action, value);
  }

  override pushAxisSample(
    action: 'move' | 'aim',
    axisX: number,
    axisZ: number,
  ): void {
    this.recordedKinds.push(this.kind);
    super.pushAxisSample(action, axisX, axisZ);
  }
}

export function runMissionSliceWithDevices(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  bus: CommandBus,
  devices: InputDevice[],
): void {
  bus.enqueueFromDevices(devices);
  const cmds = bus.drainForTick(state.tick);
  const aimAssist = bus.getChannelOwner('aim') === 'gamepad';
  applyCommands(
    state,
    cmds,
    aimAssist ? { collisionWorld: collisionRef.current, aimAssist: true } : undefined,
  );
  integrateMissionShell(state, graph, collisionRef);
  integratePlayerMotion(state, collisionRef.current);
  integrateCrewAi(state, collisionRef.current, graph);
  integrateCombat(state, collisionRef.current, graph);
  fixedStep(state);
}

export function runMissionTicksWithDevices(
  state: SimState,
  graph: DeckGraph,
  collisionRef: CollisionWorldRef,
  bus: CommandBus,
  devices: InputDevice[],
  ticks: number,
): void {
  for (let i = 0; i < ticks; i += 1) {
    runMissionSliceWithDevices(state, graph, collisionRef, bus, devices);
  }
}
