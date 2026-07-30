import * as THREE from 'three';

/** Optional kit-bash rifle blockout attached to player group. */
export function attachRifleBlockout(playerGroup: THREE.Group): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.08, 0.08, 0.55);
  const mat = new THREE.MeshStandardMaterial({ color: '#455a64', metalness: 0.5, roughness: 0.45 });
  const rifle = new THREE.Mesh(geo, mat);
  rifle.position.set(0.22, 0.85, 0.35);
  rifle.name = 'rifle-blockout';
  playerGroup.add(rifle);
  return rifle;
}
