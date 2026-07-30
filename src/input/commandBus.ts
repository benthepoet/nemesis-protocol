import type { InputCommand } from '../sim/commands.js';
import { mapSamplesToIntents } from './mapper.js';
import type { ActionIntent, DeviceKind, DeviceSample, InputChannel, InputDevice } from './types.js';
import { channelForAction } from './types.js';

interface BufferedIntent extends ActionIntent {
  synthetic: boolean;
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

  enqueueFromDevices(devices: InputDevice[]): void {
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
    const intents = [...this.buffer];
    this.buffer = [];
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
  }

  enqueueIntents(intents: ActionIntent[]): void {
    for (const intent of intents) {
      this.buffer.push({ ...intent, synthetic: false });
    }
  }

  enqueueSamples(samples: DeviceSample[]): void {
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
