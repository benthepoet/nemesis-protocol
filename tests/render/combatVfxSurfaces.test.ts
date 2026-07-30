import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCombatVfx } from '../../src/render/combatVfx.js';
import { IMPACT_VFX_MAX_CONCURRENT, HIT_FLASH_DURATION_SEC } from '../../src/config.js';

describe('combat VFX surfaces (G10, R7, R10)', () => {
  it('E6b: hit-flash on SkinnedMesh Basic materials', () => {
    const scene = new THREE.Scene();
    const vfx = createCombatVfx(scene);
    const actor = new THREE.Group();
    const skinned = new THREE.SkinnedMesh(
      new THREE.BoxGeometry(0.4, 1.6, 0.4),
      new THREE.MeshBasicMaterial({ color: '#888888', name: 'p1_crew_gear' }),
    );
    actor.add(skinned);
    scene.add(actor);
    (vfx as typeof vfx & { registerActorMesh(id: string, m: THREE.Object3D): void }).registerActorMesh('2', actor);

    vfx.push([{ type: 'hit-flash', targetId: 2 as import('../../src/sim/types.js').EntityId }]);
    expect((skinned.material as THREE.MeshBasicMaterial).color.getHex()).toBe(0xffffff);
    vfx.update(HIT_FLASH_DURATION_SEC + 0.05);
    expect((skinned.material as THREE.MeshBasicMaterial).color.getHex()).not.toBe(0xffffff);
    vfx.dispose();
  });

  it('E6: hit-flash traverses nested hero materials', () => {
    const scene = new THREE.Scene();
    const vfx = createCombatVfx(scene);
    const actor = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.6, 0.4),
      new THREE.MeshStandardMaterial({ color: '#888', emissiveIntensity: 0 }),
    );
    const pad = new THREE.Group();
    pad.add(body);
    actor.add(pad);
    scene.add(actor);
    (vfx as typeof vfx & { registerActorMesh(id: string, m: THREE.Object3D): void }).registerActorMesh('1', actor);

    vfx.push([{ type: 'hit-flash', targetId: 1 as import('../../src/sim/types.js').EntityId }]);
    expect((body.material as THREE.MeshStandardMaterial).emissiveIntensity).toBeGreaterThan(0.5);
    vfx.update(0.2);
    expect((body.material as THREE.MeshStandardMaterial).emissiveIntensity).toBeLessThan(0.5);
    vfx.dispose();
  });

  it('E7: impact-wall spawns metal + deck-plate groups respecting soft cap', () => {
    const scene = new THREE.Scene();
    const vfx = createCombatVfx(scene);
    for (let i = 0; i < IMPACT_VFX_MAX_CONCURRENT + 4; i++) {
      vfx.push([{ type: 'impact-wall', x: i * 0.1, y: 0.5, z: 0 }]);
    }
    let impactObjects = 0;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Points || (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.CircleGeometry)) {
        impactObjects += 1;
      }
    });
    expect(impactObjects).toBeLessThanOrEqual(IMPACT_VFX_MAX_CONCURRENT * 2 + 2);
    vfx.dispose();
  });
});
