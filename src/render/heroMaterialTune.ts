import * as THREE from 'three';
import { HOSTILE_COLOR_HEX, PLAYER_COLOR_HEX } from '../config.js';

/** GLB material names (Blender MCP). */
const ALLIED_GLOW_MAT = 'p1_allied_glow';
const HOSTILE_GLOW_MAT = 'p1_hostile_glow';

const PLAYER_BASE_COLORS: Record<string, string> = {
  p1_armor_dark: '#4a5868',
  p1_armor_steel: '#657585',
  p1_suit_fabric: '#5c6d7a',
  p1_visor: '#2a3844',
};

const CREW_BASE_COLORS: Record<string, string> = {
  p1_crew_gear: '#4a5868',
  p1_crew_dark: '#3d4a58',
  p1_crew_coverall: '#556575',
  p1_crew_skin: '#8a7568',
};

function isStandardLike(
  material: THREE.Material,
): material is THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  return (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  );
}

function applyReadableStandard(
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  hex: string | undefined,
): void {
  if (hex) material.color.set(hex);
  material.metalness = Math.min(material.metalness, 0.28);
  material.roughness = Math.max(material.roughness, 0.62);
  material.envMapIntensity = 1.25;
  material.needsUpdate = true;
}

/**
 * Factor-only hero GLBs need strong readability tuning (G2/G3). Glow strips use
 * MeshBasicMaterial so allied/hostile reads survive lighting/IBL gaps (WebGPU, etc.).
 */
export function tuneHeroMaterials(root: THREE.Object3D, role: 'player' | 'crew'): void {
  const palette = role === 'player' ? PLAYER_BASE_COLORS : CREW_BASE_COLORS;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const wasArray = Array.isArray(obj.material);
    const materials = wasArray ? [...obj.material] : [obj.material];

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i]!;
      const name = material.name ?? '';

      if (role === 'player' && name === ALLIED_GLOW_MAT) {
        materials[i] = new THREE.MeshBasicMaterial({
          color: PLAYER_COLOR_HEX,
          name: ALLIED_GLOW_MAT,
        });
        continue;
      }
      if (role === 'crew' && name === HOSTILE_GLOW_MAT) {
        materials[i] = new THREE.MeshBasicMaterial({
          color: HOSTILE_COLOR_HEX,
          name: HOSTILE_GLOW_MAT,
        });
        continue;
      }

      if (!isStandardLike(material)) continue;
      applyReadableStandard(material, palette[name]);
    }

    obj.material = wasArray ? materials : materials[0]!;
  });
}

/** Reject Composer placeholder GLBs (no authored materials — render default white). */
export function assertHeroGlbLoaded(root: THREE.Object3D, label: string): void {
  let namedMats = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m.name && m.name.startsWith('p1_')) namedMats += 1;
    }
  });
  if (namedMats < 3) {
    throw new Error(
      `${label} GLB looks like a placeholder (found ${namedMats} p1_* materials). ` +
        'Restore assets/models from git; do not run tools/models/generate-p1-placeholders.mjs over Kimi heroes.',
    );
  }
}

/** Deep-clone materials so per-actor hit-flash does not mutate shared GLB templates. */
export function cloneHeroMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((m) => m.clone());
    } else {
      obj.material = obj.material.clone();
    }
  });
}

export function countHeroNamedMaterials(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m.name?.startsWith('p1_')) n += 1;
    }
  });
  return n;
}
