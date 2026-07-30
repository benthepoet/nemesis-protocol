import * as THREE from 'three';
import {
  DECK_IMPACT_DURATION_SEC,
  HIT_FLASH_DURATION_SEC,
  IMPACT_VFX_MAX_CONCURRENT,
  METAL_IMPACT_DURATION_SEC,
  MUZZLE_FLASH_DURATION_SEC,
  MUZZLE_FLASH_INTENSITY,
  MUZZLE_FLASH_RANGE_M,
  MUZZLE_LIGHT_MAX_CONCURRENT,
} from '../config.js';
import type { CombatEvent } from '../combat/types.js';
import { flashMaterialForHit } from './heroMaterialTune.js';
import { HOSTILE_COLOR_HEX, PLAYER_COLOR_HEX } from '../config.js';

interface FlashEntry {
  roots: THREE.Object3D[];
  untilSec: number;
  restore: () => void;
}

interface ImpactEntry {
  objects: THREE.Object3D[];
  untilSec: number;
}

export interface CombatVfx {
  push(events: readonly CombatEvent[]): void;
  update(dtSec: number): void;
  dispose(): void;
}

function applyHitFlash(root: THREE.Object3D): { restore: () => void; touched: THREE.Object3D[] } {
  const touched: THREE.Object3D[] = [];
  const basicPrev = new Map<THREE.Material, number>();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      flashMaterialForHit(mat, true, basicPrev);
      touched.push(obj);
    }
  });
  return {
    touched,
    restore: () => {
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) flashMaterialForHit(mat, false, basicPrev);
      });
    },
  };
}

export function createCombatVfx(scene: THREE.Scene): CombatVfx {
  const lights: { light: THREE.PointLight; untilSec: number }[] = [];
  const impacts: ImpactEntry[] = [];
  const flashes: FlashEntry[] = [];
  const actorMeshes = new Map<string, THREE.Object3D>();
  let clockSec = 0;

  const registerActorMesh = (id: string, mesh: THREE.Object3D): void => {
    actorMeshes.set(id, mesh);
  };

  const spawnMetalWallImpact = (x: number, z: number): void => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.5, z),
      new THREE.Vector3(x + 0.08, 0.62, z + 0.06),
      new THREE.Vector3(x - 0.05, 0.58, z + 0.04),
    ]);
    const mat = new THREE.PointsMaterial({ color: 0xb0bec5, size: 0.14 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    impacts.push({ objects: [points], untilSec: clockSec + METAL_IMPACT_DURATION_SEC });
  };

  const spawnDeckPlateImpact = (x: number, z: number): void => {
    const dustGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.05, z),
      new THREE.Vector3(x + 0.04, 0.07, z - 0.03),
    ]);
    const dustMat = new THREE.PointsMaterial({ color: 0x6d4c41, size: 0.16, transparent: true, opacity: 0.75 });
    const dust = new THREE.Points(dustGeo, dustMat);

    const scorchMat = new THREE.MeshBasicMaterial({
      color: 0x212121,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const scorch = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(x, 0.051, z);

    scene.add(dust, scorch);
    impacts.push({ objects: [dust, scorch], untilSec: clockSec + DECK_IMPACT_DURATION_SEC });
  };

  const trimImpacts = (): void => {
    while (impacts.length > IMPACT_VFX_MAX_CONCURRENT) {
      const old = impacts.shift()!;
      for (const obj of old.objects) {
        scene.remove(obj);
        if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        } else if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      }
    }
  };

  const vfx: CombatVfx & { registerActorMesh(id: string, mesh: THREE.Object3D): void } = {
    registerActorMesh,

    push(events: readonly CombatEvent[]): void {
      for (const ev of events) {
        if (ev.type === 'muzzle') {
          while (lights.length >= MUZZLE_LIGHT_MAX_CONCURRENT) {
            const old = lights.shift()!;
            scene.remove(old.light);
            old.light.dispose();
          }
          const light = new THREE.PointLight(0xffe082, MUZZLE_FLASH_INTENSITY, MUZZLE_FLASH_RANGE_M);
          light.castShadow = false;
          light.position.set(ev.x, 1.2, ev.z);
          scene.add(light);
          lights.push({ light, untilSec: clockSec + MUZZLE_FLASH_DURATION_SEC });
        } else if (ev.type === 'impact-wall') {
          spawnMetalWallImpact(ev.x, ev.z);
          spawnDeckPlateImpact(ev.x, ev.z);
          trimImpacts();
        } else if (ev.type === 'hit-flash') {
          const mesh = actorMeshes.get(String(ev.targetId));
          if (!mesh) continue;
          const { touched, restore } = applyHitFlash(mesh);
          if (touched.length === 0) continue;
          flashes.push({
            roots: touched,
            untilSec: clockSec + HIT_FLASH_DURATION_SEC,
            restore,
          });
        }
      }
    },

    update(dtSec: number): void {
      clockSec += dtSec;
      for (let i = lights.length - 1; i >= 0; i -= 1) {
        const entry = lights[i]!;
        if (clockSec >= entry.untilSec) {
          scene.remove(entry.light);
          entry.light.dispose();
          lights.splice(i, 1);
        }
      }
      for (let i = impacts.length - 1; i >= 0; i -= 1) {
        const entry = impacts[i]!;
        if (clockSec >= entry.untilSec) {
          for (const obj of entry.objects) {
            scene.remove(obj);
            if (obj instanceof THREE.Points) {
              obj.geometry.dispose();
              (obj.material as THREE.Material).dispose();
            } else if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              (obj.material as THREE.Material).dispose();
            }
          }
          impacts.splice(i, 1);
        }
      }
      for (let i = flashes.length - 1; i >= 0; i -= 1) {
        const entry = flashes[i]!;
        if (clockSec >= entry.untilSec) {
          entry.restore();
          flashes.splice(i, 1);
        }
      }
    },

    dispose(): void {
      for (const entry of lights) {
        scene.remove(entry.light);
        entry.light.dispose();
      }
      lights.length = 0;
      for (const entry of impacts) {
        for (const obj of entry.objects) {
          scene.remove(obj);
          if (obj instanceof THREE.Points) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
          } else if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
          }
        }
      }
      impacts.length = 0;
      for (const entry of flashes) {
        entry.restore();
      }
      flashes.length = 0;
      actorMeshes.clear();
    },
  };

  return vfx;
}

export { PLAYER_COLOR_HEX, HOSTILE_COLOR_HEX };
