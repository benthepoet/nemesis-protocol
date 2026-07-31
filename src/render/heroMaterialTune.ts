import * as THREE from 'three';
import { HOSTILE_COLOR_HEX, PLAYER_COLOR_HEX } from '../config.js';
import { getHeroMaterialMode, initHeroMaterialMode } from './heroMaterialMode.js';

/** GLB material names (Blender MCP). */
const ALLIED_GLOW_MAT = 'p1_allied_glow';
const HOSTILE_GLOW_MAT = 'p1_hostile_glow';

const PLAYER_BASE_COLORS: Record<string, string> = {
  p1_armor_dark: '#5a6878',
  p1_armor_steel: '#728090',
  p1_suit_fabric: '#647282',
  p1_visor: '#384858',
  p1_rifle_body: '#4a5868',
  p1_rifle_accent: '#69f0ae',
  p1_rifle_allied: '#69f0ae',
  p1_rifle_gunmetal: '#4a5868',
  p1_rifle_steel: '#728090',
  p1_rifle_polymer: '#3a4858',
};

const CREW_BASE_COLORS: Record<string, string> = {
  p1_crew_gear: '#5a6878',
  p1_crew_dark: '#4a5868',
  p1_crew_coverall: '#647282',
  p1_crew_skin: '#9a8578',
  p1_hostile_glow: HOSTILE_COLOR_HEX,
};

const DEFAULT_PLAYER = '#5a6878';
const DEFAULT_CREW = '#5a6878';

function resolveHex(role: 'player' | 'crew', name: string, fallback: THREE.Color): string {
  const palette = role === 'player' ? PLAYER_BASE_COLORS : CREW_BASE_COLORS;
  if (palette[name]) return palette[name]!;
  if (name === ALLIED_GLOW_MAT) return PLAYER_COLOR_HEX;
  if (name === HOSTILE_GLOW_MAT) return HOSTILE_COLOR_HEX;
  if (name.startsWith('p1_')) return role === 'player' ? DEFAULT_PLAYER : DEFAULT_CREW;
  return `#${fallback.getHexString()}`;
}

function isHeroDrawMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  return obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh;
}

function tuneHeroMaterialsBasic(root: THREE.Object3D, role: 'player' | 'crew'): void {
  root.traverse((obj) => {
    if (!isHeroDrawMesh(obj)) return;
    const wasArray = Array.isArray(obj.material);
    const materials = wasArray ? [...obj.material] : [obj.material];

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i]!;
      const name = material.name ?? '';
      const fallback =
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial
          ? material.color
          : new THREE.Color(DEFAULT_PLAYER);
      const hex = resolveHex(role, name, fallback);
      materials[i] = new THREE.MeshBasicMaterial({
        color: hex,
        name: name || 'p1_unnamed',
        fog: false,
        toneMapped: false,
      });
    }

    obj.material = wasArray ? materials : materials[0]!;
  });
}

function tuneHeroMaterialsPbr(root: THREE.Object3D, role: 'player' | 'crew'): void {
  root.traverse((obj) => {
    if (!isHeroDrawMesh(obj)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      const name = material.name ?? '';
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial
      ) {
        if (name === ALLIED_GLOW_MAT) {
          material.emissive.set(PLAYER_COLOR_HEX);
          material.emissiveIntensity = 1;
          material.needsUpdate = true;
        } else if (name === HOSTILE_GLOW_MAT) {
          material.emissive.set(HOSTILE_COLOR_HEX);
          material.emissiveIntensity = 1;
          material.needsUpdate = true;
        } else if (name.startsWith('p1_') && role === 'crew') {
          material.fog = true;
        } else if (name.startsWith('p1_')) {
          material.fog = true;
        }
      }
    }
  });
}

/**
 * Hero GLBs: basic mode = tune-4 unlit palette (R15 Gate 1 anim).
 * PBR mode retains Standard/Physical maps (R15 pre–Gate 2).
 */
export function tuneHeroMaterials(
  root: THREE.Object3D,
  role: 'player' | 'crew',
  mode: 'basic' | 'pbr' = getHeroMaterialMode(),
): void {
  if (mode === 'pbr') {
    tuneHeroMaterialsPbr(root, role);
  } else {
    tuneHeroMaterialsBasic(root, role);
  }
}

/** Runtime downgrade when full-deck scene exceeds hero PBR texture-unit budget (S1). */
export function retuneHeroActorsBasic(
  actors: readonly { root: THREE.Object3D; role: 'player' | 'crew' }[],
): void {
  initHeroMaterialMode('basic');
  for (const { root, role } of actors) {
    tuneHeroMaterials(root, role, 'basic');
    root.traverse((obj) => {
      if (isHeroDrawMesh(obj)) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
  }
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

export function countHeroBasicMaterials(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (m instanceof THREE.MeshBasicMaterial && m.name?.startsWith('p1_')) n += 1;
    }
  });
  return n;
}

export function countHeroStandardBodyMaterials(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (
        (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) &&
        m.name?.startsWith('p1_') &&
        m.name !== ALLIED_GLOW_MAT &&
        m.name !== HOSTILE_GLOW_MAT
      ) {
        n += 1;
      }
    }
  });
  return n;
}

export function heroBodyHasAlbedoMap(root: THREE.Object3D): boolean {
  let found = false;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || found) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (
        (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) &&
        m.name?.startsWith('p1_') &&
        m.map
      ) {
        found = true;
      }
    }
  });
  return found;
}

/** Factor-only albedo on body Standard slots (rigged GLBs may ship without embedded `map`). */
export function heroBodyHasFactorAlbedo(root: THREE.Object3D): boolean {
  let found = false;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || found) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (
        (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) &&
        m.name?.startsWith('p1_') &&
        m.name !== ALLIED_GLOW_MAT &&
        m.name !== HOSTILE_GLOW_MAT &&
        !m.map &&
        m.color.getHex() !== 0xffffff
      ) {
        found = true;
      }
    }
  });
  return found;
}

/** Hit-flash for unlit hero Basic materials + Standard/Physical emissive (combat VFX). */
export function flashMaterialForHit(
  material: THREE.Material,
  active: boolean,
  basicColorStore: Map<THREE.Material, number>,
): void {
  if (material instanceof THREE.MeshBasicMaterial) {
    if (active) {
      if (!basicColorStore.has(material)) basicColorStore.set(material, material.color.getHex());
      material.color.setHex(0xffffff);
    } else {
      const prev = basicColorStore.get(material);
      if (prev !== undefined) material.color.setHex(prev);
    }
    return;
  }
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    if (active) {
      material.emissive.setHex(0xffffff);
      material.emissiveIntensity = 0.9;
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  }
}
