import type { InputCommand } from '../sim/commands.js';
import { mapSamplesToIntents } from './mapper.js';
import type { ActionIntent, DeviceKind, DeviceSample, InputDevice } from './types.js';

interface BufferedIntent extends ActionIntent {
  synthetic: boolean;
}

export class CommandBus {
  private buffer: BufferedIntent[] = [];
  private sequence = 0;
  private activeDeviceKind: DeviceKind | null = null;
  private deviceByKind = new Map<DeviceKind, InputDevice>();

  enqueueFromDevices(devices: InputDevice[]): void {
    this.deviceByKind.clear();
    for (const device of devices) {
      this.deviceByKind.set(device.kind, device);
    }

    for (const device of devices) {
      const samples = device.poll();
      if (samples.length === 0) continue;

      const sampleKind = samples[0]!.kind;
      if (this.activeDeviceKind !== null && sampleKind !== this.activeDeviceKind) {
        const departing = this.deviceByKind.get(this.activeDeviceKind);
        if (departing) {
          this.flushSyntheticReleases(departing);
        }
      }

      for (const sample of samples) {
        this.activeDeviceKind = sample.kind;
        this.buffer.push({
          action: sample.action,
          value: sample.value,
          synthetic: false,
        });
      }
    }
  }

  notifyDeviceDeparting(device: InputDevice): void {
    this.flushSyntheticReleases(device);
    if (this.activeDeviceKind === device.kind) {
      this.activeDeviceKind = null;
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
    const out: InputCommand[] = intents.map((intent) => ({
      tick,
      sequence: this.sequence++,
      action: intent.action,
      value: intent.value,
    }));
    return out;
  }

  getActiveDeviceKind(): DeviceKind | null {
    return this.activeDeviceKind;
  }

  /** Test helper: reset stamping state without affecting devices. */
  resetSession(): void {
    this.buffer = [];
    this.sequence = 0;
    this.activeDeviceKind = null;
  }

  enqueueIntents(intents: ActionIntent[]): void {
    for (const intent of intents) {
      this.buffer.push({ ...intent, synthetic: false });
    }
  }

  enqueueSamples(samples: DeviceSample[]): void {
    const intents = mapSamplesToIntents(samples);
    if (samples.length > 0) {
      const kind = samples[0]!.kind;
      if (this.activeDeviceKind !== null && kind !== this.activeDeviceKind) {
        const departing = this.deviceByKind.get(this.activeDeviceKind);
        if (departing) this.flushSyntheticReleases(departing);
      }
      this.activeDeviceKind = kind;
    }
    for (const intent of intents) {
      this.buffer.push({ ...intent, synthetic: false });
    }
  }
}
