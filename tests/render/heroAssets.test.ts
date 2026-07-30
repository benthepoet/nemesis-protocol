/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { PROJECTILE_MUZZLE_OFFSET_M } from '../../src/config.js';
import { loadGltf } from '../../src/render/assets/loadGltf.js';
import { preloadHeroAssets } from '../../src/render/assets/preloadHeroAssets.js';
import { createPlayerMeshFromTemplates, playerHasDebugWedge } from '../../src/render/createPlayerMesh.js';
import { getMuzzleWorldXZ } from '../../src/render/createRifleBlockout.js';

describe('hero assets (G1, M1–M3, R5, R6)', () => {
  it('E1: missing GLB rejects with path in error', async () => {
    await expect(loadGltf('/assets/models/does-not-exist.glb')).rejects.toThrow(/does-not-exist\.glb/);
  });

  it('loads contracted player + rifle and has no debug wedge', async () => {
    const templates = await preloadHeroAssets();
    const player = createPlayerMeshFromTemplates(templates);
    expect(player.name).toBe('player');
    expect(playerHasDebugWedge(player)).toBe(false);
    player.position.set(2, 0, 3);
    player.rotation.y = 0.4;
    player.updateMatrixWorld(true);
    const { x, z } = getMuzzleWorldXZ(player);
    const expectedX = 2 + Math.sin(0.4) * PROJECTILE_MUZZLE_OFFSET_M;
    const expectedZ = 3 + Math.cos(0.4) * PROJECTILE_MUZZLE_OFFSET_M;
    expect(Math.hypot(x - expectedX, z - expectedZ)).toBeLessThanOrEqual(0.02);
  });
});
