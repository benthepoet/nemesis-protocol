import * as THREE from 'three';
import { getNode } from '../deck/graph.js';
import type { DeckGraph } from '../deck/types.js';
import { attachEngineSignage } from './attachEngineSignage.js';
import {
  assertBlenderDeckNodeContract,
  buildRoomGroupsFromGltf,
  normalizeImportedDeckNames,
  resolveHullEnvelope,
  stripImportedLights,
} from './blenderDeckBindings.js';
import {
  absorbRoomOverheadIntoCeilings,
  flattenRoomCeilingMeshes,
  stripBlenderCutawayOccluders,
} from './blenderDeckCutawayFixups.js';
import { buildInterstitialCeilingMesh } from './deckHullGeometry.js';
import type { DeckMaterialSet } from './deckMaterials.js';
import { retuneBlenderDeckMaterials } from './blenderDeckMaterialRetune.js';
import type { DeckScene } from './createDeckScene.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';

function computeMidshipsCameraTarget(graph: DeckGraph): THREE.Vector3 {
  const spine = getNode(graph, 'main-spine');
  if (spine.footprint.kind === 'rect') {
    const r = spine.footprint.rect;
    return new THREE.Vector3(r.x + r.w / 2, 0, r.z + r.h / 2);
  }
  return new THREE.Vector3(0, 0, 0);
}

function disposeOwnedMaterials(materials: THREE.Material[]): void {
  for (const m of materials) m.dispose();
}

export interface CreateBlenderDeckSceneOptions {
  glbRoot: THREE.Group;
  materials: DeckMaterialSet;
}

export function createBlenderDeckScene(
  graph: DeckGraph,
  options: CreateBlenderDeckSceneOptions,
): DeckScene {
  const architecture = cloneGltfTemplate(options.glbRoot);
  // glTF plan Y → Three −Z; flip root so deck XZ matches sim / deck03 (R-BM6).
  architecture.scale.z = -1;
  architecture.updateMatrixWorld(true);
  normalizeImportedDeckNames(architecture, graph);
  stripBlenderCutawayOccluders(architecture);
  flattenRoomCeilingMeshes(architecture, graph);
  absorbRoomOverheadIntoCeilings(architecture, graph);

  const hullEnvelope = resolveHullEnvelope(architecture);
  const interstitialCeiling = buildInterstitialCeilingMesh(graph, options.materials);
  hullEnvelope.add(interstitialCeiling);

  assertBlenderDeckNodeContract(architecture, graph);
  stripImportedLights(architecture);

  const ownedMaterials = retuneBlenderDeckMaterials(architecture, options.materials);
  ownedMaterials.push(interstitialCeiling.material as THREE.MeshStandardMaterial);
  const roomGroups = buildRoomGroupsFromGltf(architecture, graph);

  attachEngineSignage(roomGroups, graph, options.materials);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05080f');
  scene.add(architecture);

  const target = computeMidshipsCameraTarget(graph);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(target.x, 80, target.z + 60);
  camera.lookAt(target);

  return {
    scene,
    camera,
    roomGroups,
    hullEnvelope,
    collisionRoot: architecture,
    disposeMaterials() {
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        if (!obj.name.startsWith('signage:')) return;
        obj.geometry?.dispose();
        const material = obj.material;
        if (Array.isArray(material)) {
          for (const m of material) m.dispose();
        } else {
          material?.dispose();
        }
      });
      disposeOwnedMaterials(ownedMaterials);
    },
  };
}

/** Count meshes under a deck scene root (presentation proxy for G5). */
export function countSceneMeshes(scene: THREE.Scene): number {
  let n = 0;
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) n += 1;
  });
  return n;
}
