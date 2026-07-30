/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { PROJECTILE_MUZZLE_OFFSET_M, MUZZLE_ANCHOR_TOLERANCE_M } from '../../src/config.js';
import { preloadHeroAssets } from '../../src/render/assets/preloadHeroAssets.js';
import { createPlayerMeshFromTemplates, updatePlayerHeroPresentation } from '../../src/render/createPlayerMesh.js';
import { getMuzzleWorldXZ } from '../../src/render/createRifleBlockout.js';
import type { Entity } from '../../src/sim/types.js';

const SAMPLE_TIMES = [0.15, 0.5, 0.85];

function expectedMuzzleXZ(px: number, pz: number, yaw: number): { x: number; z: number } {
  return {
    x: px + Math.sin(yaw) * PROJECTILE_MUZZLE_OFFSET_M,
    z: pz + Math.cos(yaw) * PROJECTILE_MUZZLE_OFFSET_M,
  };
}

describe('hero muzzle parity through animation (G4, M11, R6)', () => {
  it('muzzle XZ within tolerance across idle/move/aim_fire samples', async () => {
    const templates = await preloadHeroAssets();
    const player = createPlayerMeshFromTemplates(templates);
    const px = 4;
    const pz = -2;
    const yaw = 0.75;
    const entity = {
      x: px,
      y: 0,
      z: pz,
      yaw,
      moveIntentX: 0,
      moveIntentZ: 0,
    } as Entity;

    const clipSets: { inputs: { moveIntentX: number; moveIntentZ: number; fireHeld: boolean } }[] = [
      { inputs: { moveIntentX: 0, moveIntentZ: 0, fireHeld: false } },
      { inputs: { moveIntentX: 1, moveIntentZ: 0, fireHeld: false } },
      { inputs: { moveIntentX: 0, moveIntentZ: 0, fireHeld: true } },
    ];

    for (const { inputs } of clipSets) {
      entity.moveIntentX = inputs.moveIntentX;
      entity.moveIntentZ = inputs.moveIntentZ;
      for (let f = 0; f < 90; f++) {
        updatePlayerHeroPresentation(player, entity, { fireHeld: inputs.fireHeld }, 1 / 60);
        if (!SAMPLE_TIMES.some((t) => Math.abs(f / 90 - t) < 0.02)) continue;
        const { x, z } = getMuzzleWorldXZ(player);
        const exp = expectedMuzzleXZ(px, pz, yaw);
        expect(Math.hypot(x - exp.x, z - exp.z)).toBeLessThanOrEqual(MUZZLE_ANCHOR_TOLERANCE_M);
      }
    }
  });
});
