import * as THREE from 'three';
import { OBJECTIVE_BEACON_HEX } from '../config.js';
import { objectives } from '../deck/graph.js';
import type { DeckGraph } from '../deck/types.js';
import type { SimState } from '../sim/types.js';

export interface ObjectiveBeacon {
  sync(state: SimState): void;
  dispose(): void;
}

export function createObjectiveBeacon(scene: THREE.Scene, graph: DeckGraph): ObjectiveBeacon {
  const primary = objectives(graph).find((o) => o.id === 'obj-primary-reactor');
  if (!primary) {
    throw new Error('obj-primary-reactor missing');
  }
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(OBJECTIVE_BEACON_HEX),
      emissive: new THREE.Color(OBJECTIVE_BEACON_HEX),
      emissiveIntensity: 1.2,
    }),
  );
  mesh.position.set(primary.position.x, 0.8, primary.position.z);
  mesh.visible = false;
  scene.add(mesh);

  return {
    sync(state: SimState): void {
      const show = state.meta.objectiveIssued && !state.meta.objectiveComplete;
      mesh.visible = show;
    },
    dispose(): void {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
  };
}
