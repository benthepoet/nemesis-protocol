import * as THREE from 'three';
import type { DeckMaterialSet } from './deckMaterials.js';

function pickTemplate(name: string, mats: DeckMaterialSet): THREE.MeshStandardMaterial {
  const n = name.toLowerCase();
  if (n.startsWith('floor:') || n.startsWith('floor_')) return mats.floor;
  if (n.startsWith('ceiling:') || n.startsWith('ceiling_') || n === 'hull-interstitial:ceiling') {
    return mats.ceiling;
  }
  if (n.startsWith('aperture:')) return mats.hullWall;
  if (n.includes('bulkhead') || n.startsWith('wall_bb') || n.startsWith('wall-bb')) {
    return mats.bulkheadWall;
  }
  if (n.startsWith('wall') || n.startsWith('door') || n.startsWith('bay_')) return mats.partitionWall;
  if (
    n.startsWith('hull') ||
    n.startsWith('deckhead') ||
    n.startsWith('nose_') ||
    n.startsWith('maint_') ||
    n.startsWith('plate_') ||
    n.startsWith('eng_house') ||
    n.startsWith('nozzle') ||
    n.startsWith('interstitial')
  ) {
    return mats.hullSteel;
  }
  return mats.hullSteel;
}

function needsCutawayFade(name: string): boolean {
  return name.startsWith('ceiling:') || name === 'hull-interstitial:ceiling';
}

/** M5 — remap GLB surfaces to engine `p1_*` PBR sets (Blender export has no shipped textures). */
export function retuneBlenderDeckMaterials(
  root: THREE.Object3D,
  mats: DeckMaterialSet,
): THREE.Material[] {
  const owned: THREE.Material[] = [];

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const template = pickTemplate(obj.name, mats);
    const mat = template.clone();
    if (needsCutawayFade(obj.name)) {
      mat.transparent = true;
      mat.opacity = 1;
      mat.depthWrite = true;
    }
    // Parent deck root uses scale.z = −1; flipped normals otherwise read as unlit white.
    mat.side = THREE.DoubleSide;
    obj.material = mat;
    owned.push(mat);
  });

  return owned;
}
