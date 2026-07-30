import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FOLLOW_AIM_BIAS_M, FOLLOW_CAMERA_PITCH_DEG } from '../../src/config.js';
import { CommandBus } from '../../src/input/commandBus.js';
import {
  createFollowCamera,
  followCameraPitchFromHorizontal,
} from '../../src/render/createFollowCamera.js';
import { runFixedTimestepSlice } from '../../src/render/frameLoop.js';
import { hashSimState } from '../../src/sim/hash.js';
import { cloneSimState } from '../../src/sim/world.js';
import { FakeInputDevice } from '../helpers/fakeDevices.js';
import { createPlayerTestHarness } from '../helpers/playerTestUtils.js';

function cameraLookAtGround(camera: THREE.PerspectiveCamera): THREE.Vector3 {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const t = -camera.position.y / dir.y;
  return camera.position.clone().add(dir.multiplyScalar(t));
}

describe('follow camera (G5)', () => {
  it('E9: perspective rig pitch 60±0.1° and aim bias within cap', () => {
    const rig = createFollowCamera();
    expect(rig.camera.isPerspectiveCamera).toBe(true);

    const player = { x: 10, y: 0, z: 20, yaw: Math.PI / 4 };
    for (let i = 0; i < 180; i += 1) {
      rig.update(1 / 60, player);
    }

    const pitchDeg = (followCameraPitchFromHorizontal(rig.camera) * 180) / Math.PI;
    expect(pitchDeg).toBeCloseTo(FOLLOW_CAMERA_PITCH_DEG, 0);

    const lookGround = cameraLookAtGround(rig.camera);
    const bias = Math.hypot(lookGround.x - player.x, lookGround.z - player.z);
    expect(bias).toBeLessThanOrEqual(FOLLOW_AIM_BIAS_M + 1e-3);
  });

  it('E11: follow camera update does not change sim tick or hash', async () => {
    const harness = createPlayerTestHarness();
    const base = cloneSimState(harness.state);

    const advance = (withFollowUpdate: boolean) => {
      const world = cloneSimState(base);
      const bus = new CommandBus();
      const dev = new FakeInputDevice('keyboard-mouse');
      let acc = 0;
      const rig = createFollowCamera();
      for (let i = 0; i < 40; i += 1) {
        dev.pushAxisSample('move', 1, 0);
        const slice = runFixedTimestepSlice({
          world,
          bus,
          devices: [dev],
          collisionRef: { current: harness.collisionWorld },
          graph: harness.graph,
          dtSec: 1 / 60,
          accumulator: acc,
        });
        acc = slice.accumulator;
        if (withFollowUpdate) {
          const id = world.meta.playerId!;
          const e = world.entities.get(id)!;
          rig.update(1 / 60, e);
        }
      }
      return world;
    };

    const a = advance(true);
    const b = advance(false);
    expect(a.tick).toBe(b.tick);
    expect(await hashSimState(a)).toBe(await hashSimState(b));
  });
});
