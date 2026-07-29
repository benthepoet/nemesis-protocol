import * as THREE from 'three';

export interface PlaceholderScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function createPlaceholderScene(): PlaceholderScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05080f');

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(2.5, 2, 3.5);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight('#fff2e0', 1.0);
  key.position.set(4, 6, 2);
  scene.add(key);

  const fill = new THREE.HemisphereLight('#a8c0d8', '#05080f', 0.35);
  scene.add(fill);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: '#1f2a36',
    metalness: 0.65,
    roughness: 0.45,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return { scene, camera };
}
