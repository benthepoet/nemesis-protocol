import * as THREE from 'three';
import {
  HIT_FLASH_DURATION_SEC,
  MUZZLE_FLASH_DURATION_SEC,
  MUZZLE_FLASH_INTENSITY,
  MUZZLE_FLASH_RANGE_M,
} from '../config.js';
import type { CombatEvent } from '../combat/types.js';
import { HOSTILE_COLOR_HEX, PLAYER_COLOR_HEX } from '../config.js';

interface FlashEntry {
  mesh: THREE.Object3D;
  untilSec: number;
  restore?: () => void;
}

export interface CombatVfx {
  push(events: readonly CombatEvent[]): void;
  update(dtSec: number): void;
  dispose(): void;
}

export function createCombatVfx(scene: THREE.Scene): CombatVfx {
  const lights: { light: THREE.PointLight; untilSec: number }[] = [];
  const sparks: { points: THREE.Points; untilSec: number }[] = [];
  const flashes: FlashEntry[] = [];
  const actorMeshes = new Map<string, THREE.Object3D>();
  let clockSec = 0;

  const registerActorMesh = (id: string, mesh: THREE.Object3D): void => {
    actorMeshes.set(id, mesh);
  };

  const vfx: CombatVfx & { registerActorMesh(id: string, mesh: THREE.Object3D): void } = {
    registerActorMesh,

    push(events: readonly CombatEvent[]): void {
      for (const ev of events) {
        if (ev.type === 'muzzle') {
          const light = new THREE.PointLight(0xffe082, MUZZLE_FLASH_INTENSITY, MUZZLE_FLASH_RANGE_M);
          light.position.set(ev.x, 1.2, ev.z);
          scene.add(light);
          lights.push({ light, untilSec: clockSec + MUZZLE_FLASH_DURATION_SEC });
        } else if (ev.type === 'impact-wall') {
          const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(ev.x, 0.5, ev.z),
            new THREE.Vector3(ev.x + 0.05, 0.55, ev.z + 0.05),
          ]);
          const mat = new THREE.PointsMaterial({ color: 0xb0bec5, size: 0.12 });
          const points = new THREE.Points(geo, mat);
          scene.add(points);
          sparks.push({ points, untilSec: clockSec + 0.08 });
        } else if (ev.type === 'hit-flash') {
          const mesh = actorMeshes.get(String(ev.targetId));
          if (!mesh) continue;
          const body = mesh.children[0] as THREE.Mesh | undefined;
          if (body?.material instanceof THREE.MeshStandardMaterial) {
            const mat = body.material;
            const prev = mat.emissive.getHex();
            const prevI = mat.emissiveIntensity;
            mat.emissive.setHex(0xffffff);
            mat.emissiveIntensity = 0.9;
            flashes.push({
              mesh,
              untilSec: clockSec + HIT_FLASH_DURATION_SEC,
              restore: () => {
                mat.emissive.setHex(prev);
                mat.emissiveIntensity = prevI;
              },
            });
          }
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
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const entry = sparks[i]!;
        if (clockSec >= entry.untilSec) {
          scene.remove(entry.points);
          entry.points.geometry.dispose();
          (entry.points.material as THREE.Material).dispose();
          sparks.splice(i, 1);
        }
      }
      for (let i = flashes.length - 1; i >= 0; i -= 1) {
        const entry = flashes[i]!;
        if (clockSec >= entry.untilSec) {
          entry.restore?.();
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
      for (const entry of sparks) {
        scene.remove(entry.points);
        entry.points.geometry.dispose();
        (entry.points.material as THREE.Material).dispose();
      }
      sparks.length = 0;
      for (const entry of flashes) {
        entry.restore?.();
      }
      flashes.length = 0;
      actorMeshes.clear();
    },
  };

  return vfx;
}

export { PLAYER_COLOR_HEX, HOSTILE_COLOR_HEX };
