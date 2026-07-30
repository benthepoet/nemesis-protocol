import type { CollisionWorld } from '../deck/collision.js';
import type { DeckGraph } from '../deck/types.js';
import { FIXED_DT, MAX_FRAME_DELTA_SEC } from '../config.js';
import { integrateCombat } from '../combat/integrateCombat.js';
import { CommandBus } from '../input/commandBus.js';
import type { InputDevice } from '../input/types.js';
import { integratePlayerMotion } from '../sim/playerMotion.js';
import { applyCommands, fixedStep } from '../sim/step.js';
import type { SimState } from '../sim/types.js';
import type { AppRenderer } from './createRenderer.js';
import { maybeLogFps } from './fpsOverlay.js';
import type * as THREE from 'three';
import type { CombatEvent } from '../combat/types.js';

export interface FixedTimestepSliceArgs {
  world: SimState;
  bus: CommandBus;
  devices: InputDevice[];
  collisionWorld: CollisionWorld;
  graph: DeckGraph;
  dtSec: number;
  accumulator: number;
  onCombatEvents?: (events: readonly CombatEvent[]) => void;
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
    integratePlayerMotion(args.world, args.collisionWorld);
    const events = integrateCombat(args.world, args.collisionWorld, args.graph);
    args.onCombatEvents?.(events);
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
  collisionWorld: CollisionWorld;
  graph: DeckGraph;
  scene: THREE.Scene;
  camera: THREE.Camera;
  appRenderer: AppRenderer;
  fpsOverlay: { update(dtSec: number): void };
  onFrame?: (dtSec: number) => void;
  onBeforeSim?: () => void;
  onCombatEvents?: (events: readonly CombatEvent[]) => void;
}): () => void {
  let last = performance.now();
  let accumulator = 0;
  let rafId = 0;
  let running = true;

  const tick = (now: number) => {
    if (!running) return;
    const dtSec = (now - last) / 1000;
    last = now;

    args.onBeforeSim?.();

    const slice = runFixedTimestepSlice({
      world: args.world,
      bus: args.bus,
      devices: args.devices,
      collisionWorld: args.collisionWorld,
      graph: args.graph,
      dtSec,
      accumulator,
      onCombatEvents: args.onCombatEvents,
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
