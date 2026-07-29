import { FIXED_DT, MAX_FRAME_DELTA_SEC } from '../config.js';
import { CommandBus } from '../input/commandBus.js';
import type { InputDevice } from '../input/types.js';
import { applyCommands, fixedStep } from '../sim/step.js';
import type { SimState } from '../sim/types.js';
import type { AppRenderer } from './createRenderer.js';
import { maybeLogFps } from './fpsOverlay.js';
import type * as THREE from 'three';

export interface FixedTimestepSliceArgs {
  world: SimState;
  bus: CommandBus;
  devices: InputDevice[];
  dtSec: number;
  accumulator: number;
}

export interface FixedTimestepSliceResult {
  accumulator: number;
  ticksAdvanced: number;
}

export function runFixedTimestepSlice(args: FixedTimestepSliceArgs): FixedTimestepSliceResult {
  const dt = Math.min(args.dtSec, MAX_FRAME_DELTA_SEC);
  let accumulator = args.accumulator + dt;
  let ticksAdvanced = 0;

  while (accumulator >= FIXED_DT) {
    args.bus.enqueueFromDevices(args.devices);
    const cmds = args.bus.drainForTick(args.world.tick);
    applyCommands(args.world, cmds);
    fixedStep(args.world);
    accumulator -= FIXED_DT;
    ticksAdvanced += 1;
  }

  return { accumulator, ticksAdvanced };
}

export function startFrameLoop(args: {
  world: SimState;
  bus: CommandBus;
  devices: InputDevice[];
  scene: THREE.Scene;
  camera: THREE.Camera;
  appRenderer: AppRenderer;
  fpsOverlay: { update(dtSec: number): void };
  onFrame?: (dtSec: number) => void;
}): () => void {
  let last = performance.now();
  let accumulator = 0;
  let rafId = 0;
  let running = true;

  const tick = (now: number) => {
    if (!running) return;
    const dtSec = (now - last) / 1000;
    last = now;

    const slice = runFixedTimestepSlice({
      world: args.world,
      bus: args.bus,
      devices: args.devices,
      dtSec,
      accumulator,
    });
    accumulator = slice.accumulator;

    args.onFrame?.(dtSec);

    args.appRenderer.render(args.scene, args.camera);
    args.fpsOverlay.update(dtSec);
    maybeLogFps(dtSec);

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
  };
}
