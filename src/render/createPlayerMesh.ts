import * as THREE from 'three';
import {
  PLAYER_COLOR_HEX,
  PLAYER_MESH_HEIGHT_M,
  PLAYER_MESH_RADIUS_M,
  PLAYER_WEDGE_LENGTH_M,
} from '../config.js';

export function createPlayerMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'player';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: PLAYER_COLOR_HEX,
    metalness: 0.4,
    roughness: 0.55,
  });
  const wedgeMat = new THREE.MeshStandardMaterial({
    color: '#43a047',
    emissive: new THREE.Color('#2e7d32'),
    emissiveIntensity: 0.35,
    metalness: 0.35,
    roughness: 0.5,
  });

  const capsuleGeo = new THREE.CapsuleGeometry(
    PLAYER_MESH_RADIUS_M,
    PLAYER_MESH_HEIGHT_M - 2 * PLAYER_MESH_RADIUS_M,
    8,
    16,
  );
  const capsule = new THREE.Mesh(capsuleGeo, bodyMat);
  capsule.position.y = PLAYER_MESH_HEIGHT_M / 2;
  capsule.name = 'player-body';
  group.add(capsule);

  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, 0);
  wedgeShape.lineTo(PLAYER_WEDGE_LENGTH_M, -PLAYER_MESH_RADIUS_M * 0.6);
  wedgeShape.lineTo(PLAYER_WEDGE_LENGTH_M, PLAYER_MESH_RADIUS_M * 0.6);
  wedgeShape.closePath();
  const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.08, bevelEnabled: false });
  const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
  wedge.rotation.x = -Math.PI / 2;
  wedge.rotation.z = -Math.PI / 2;
  wedge.position.set(0, PLAYER_MESH_HEIGHT_M * 0.55, PLAYER_MESH_RADIUS_M);
  wedge.name = 'player-wedge';
  group.add(wedge);

  return group;
}

export function syncPlayerMeshPose(
  mesh: THREE.Group,
  player: { x: number; y: number; z: number; yaw: number },
): void {
  mesh.position.set(player.x, player.y, player.z);
  mesh.rotation.y = player.yaw;
}
