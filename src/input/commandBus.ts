import type { InputCommand } from '../sim/commands.js';
import { mapSamplesToIntents } from './mapper.js';
import type { ActionIntent, DeviceKind, DeviceSample, InputChannel, InputDevice } from './types.js';
import { channelForAction } from './types.js';

interface BufferedIntent extends ActionIntent {
  synthetic: boolean;
}

function axisMagnitude(sample: DeviceSample): number {
  return Math.hypot(sample.axisX ?? 0, sample.axisZ ?? 0);
}

export class CommandBus {
  private buffer: BufferedIntent[] = [];
  private sequence = 0;
  private owner: Record<InputChannel, DeviceKind | null> = {
    move: null,
    aim: null,
    interact: null,
  };
  private deviceByKind = new Map<DeviceKind, InputDevice>();
  private axisPending: { move: BufferedIntent | null; aim: BufferedIntent | null } = {
    move: null,
    aim: null,
  };

  enqueueFromDevices(devices: InputDevice[]): void {
    this.axisPending = { move: null, aim: null };
    this.deviceByKind.clear();
    for (const device of devices) {
      this.deviceByKind.set(device.kind, device);
    }

    for (const device of devices) {
      const samples = device.poll();
      for (const sample of samples) {
        this.ingestSample(device, sample);
      }
    }
  }

  private ingestSample(device: InputDevice, sample: DeviceSample): void {
    const channel = channelForAction(sample.action);
    if (channel === 'move' || channel === 'aim') {
      this.ingestAxisSample(device, sample, channel);
      return;
    }

    const prevOwner = this.owner[channel];
    if (prevOwner !== null && prevOwner !== device.kind) {
      if (channel === 'interact') {
        const departing = this.deviceByKind.get(prevOwner);
        if (departing) {
          this.flushSyntheticReleases(departing);
        }
      }
    }
    this.owner[channel] = device.kind;

    const intents = mapSamplesToIntents([sample]);
    for (const intent of intents) {
      this.buffer.push({ ...intent, synthetic: false });
    }
  }

  private ingestAxisSample(
    device: InputDevice,
    sample: DeviceSample,
    channel: 'move' | 'aim',
  ): void {
    const mag = axisMagnitude(sample);
    const prevOwner = this.owner[channel];

    if (mag > 0) {
      this.owner[channel] = device.kind;
      const intents = mapSamplesToIntents([sample]);
      const intent = intents[0]!;
      this.axisPending[channel] = { ...intent, synthetic: false };
      return;
    }

    if (prevOwner !== device.kind) {
      return;
    }

    if (channel === 'aim') {
      return;
    }

    this.axisPending.move = {
      action: 'move',
      value: 0,
      axisX: 0,
      axisZ: 0,
      synthetic: false,
    };
  }

  notifyDeviceDeparting(device: InputDevice): void {
    this.flushSyntheticReleases(device);
    for (const ch of ['move', 'aim', 'interact'] as const) {
      if (this.owner[ch] === device.kind) {
        this.owner[ch] = null;
      }
    }
  }

  private flushSyntheticReleases(device: InputDevice): void {
    for (const action of device.getHeldActions()) {
      this.buffer.push({ action, value: 0, synthetic: true });
    }
    device.clearHeld();
  }

  drainForTick(tick: number): InputCommand[] {
    const intents: BufferedIntent[] = [...this.buffer];
    if (this.axisPending.move) intents.push(this.axisPending.move);
    if (this.axisPending.aim) intents.push(this.axisPending.aim);
    this.buffer = [];
    this.axisPending = { move: null, aim: null };

    const out: InputCommand[] = intents.map((intent) => {
      const cmd: InputCommand = {
        tick,
        sequence: this.sequence++,
        action: intent.action,
        value: intent.value,
      };
      if (intent.action === 'move' || intent.action === 'aim') {
        cmd.axisX = intent.axisX;
        cmd.axisZ = intent.axisZ;
      }
      return cmd;
    });
    return out;
  }

  getActiveDeviceKind(): DeviceKind | null {
    return this.owner.interact;
  }

  getChannelOwner(channel: InputChannel): DeviceKind | null {
    return this.owner[channel];
  }

  /** Test helper: reset stamping state without affecting devices. */
  resetSession(): void {
    this.buffer = [];
    this.sequence = 0;
    this.owner = { move: null, aim: null, interact: null };
    this.axisPending = { move: null, aim: null };
  }

  enqueueIntents(intents: ActionIntent[]): void {
    for (const intent of intents) {
      this.buffer.push({ ...intent, synthetic: false });
    }
  }

  enqueueSamples(samples: DeviceSample[]): void {
    this.axisPending = { move: null, aim: null };
    for (const sample of samples) {
      const kind = sample.kind;
      const device = this.deviceByKind.get(kind);
      if (device) {
        this.ingestSample(device, sample);
      } else {
        const intents = mapSamplesToIntents([sample]);
        for (const intent of intents) {
          this.buffer.push({ ...intent, synthetic: false });
        }
      }
    }
  }
}
