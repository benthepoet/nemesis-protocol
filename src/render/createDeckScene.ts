import * as THREE from 'three';
import { ACCENT_HEX, BULKHEAD_THICKNESS_M, ROOM_HEIGHT_M, WALL_THICKNESS_M } from '../config.js';
import { getNode, listNodes, listWallSegments } from '../deck/graph.js';
import type { AccentId, DeckGraph, DeckNode, WallRole } from '../deck/types.js';

export interface DeckScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  roomGroups: ReadonlyMap<string, THREE.Group>;
}

function roomFloorMaterial(accentId: AccentId): THREE.MeshStandardMaterial {
  const hex = ACCENT_HEX[accentId as keyof typeof ACCENT_HEX];
  return new THREE.MeshStandardMaterial({
    color: '#1f2a36',
    emissive: new THREE.Color(hex),
    emissiveIntensity: 0.25,
    metalness: 0.65,
    roughness: 0.45,
  });
}

function wallMaterialForRole(role: WallRole, accentId?: AccentId): THREE.MeshStandardMaterial {
  if (role === 'bulkhead') {
    return new THREE.MeshStandardMaterial({
      color: '#2c3947',
      emissive: new THREE.Color('#5c7186'),
      emissiveIntensity: 0.2,
      metalness: 0.7,
      roughness: 0.4,
    });
  }
  if (role === 'partition') {
    return new THREE.MeshStandardMaterial({
      color: '#1f2a36',
      emissive: accentId ? new THREE.Color(ACCENT_HEX[accentId as keyof typeof ACCENT_HEX]) : new THREE.Color('#39434e'),
      emissiveIntensity: 0.3,
      metalness: 0.65,
      roughness: 0.45,
    });
  }
  if (role === 'hull') {
    return new THREE.MeshStandardMaterial({
      color: '#243040',
      emissive: new THREE.Color('#5c7186'),
      emissiveIntensity: 0.15,
      metalness: 0.75,
      roughness: 0.35,
    });
  }
  return hullSteelMaterial();
}

function addBox(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  name?: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function hullSteelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#1f2a36',
    metalness: 0.65,
    roughness: 0.45,
  });
}

function buildRectRoom(group: THREE.Group, node: DeckNode & { footprint: { kind: 'rect'; rect: { x: number; z: number; w: number; h: number } } }): void {
  const { x, z, w, h } = node.footprint.rect;
  const floorMat = roomFloorMaterial(node.accentId);
  addBox(group, x, 0, z, w, 0.05, h, floorMat, `floor:${node.id}`);
  addBox(group, x, ROOM_HEIGHT_M - 0.05, z, w, 0.05, h, floorMat.clone(), `ceiling:${node.id}`);
}

function buildPolygonRoom(group: THREE.Group, node: DeckNode & { footprint: { kind: 'polygon'; points: { x: number; z: number }[] } }): void {
  const points = node.footprint.points;
  if (points.length < 3) return;

  const shape = new THREE.Shape();
  shape.moveTo(points[0]!.x, points[0]!.z);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i]!.x, points[i]!.z);
  }
  shape.closePath();

  const floorMat = roomFloorMaterial(node.accentId);
  const floorGeo = new THREE.ShapeGeometry(shape);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.name = `floor:${node.id}`;
  group.add(floor);

  const ceiling = new THREE.Mesh(floorGeo.clone(), floorMat.clone());
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = ROOM_HEIGHT_M;
  ceiling.name = `ceiling:${node.id}`;
  group.add(ceiling);
}

function wallThicknessForRole(role: WallRole): number {
  return role === 'bulkhead' ? BULKHEAD_THICKNESS_M : WALL_THICKNESS_M;
}

function buildWalls(scene: THREE.Scene, graph: DeckGraph): void {
  for (const wall of listWallSegments(graph)) {
    const thickness = wallThicknessForRole(wall.role);
    const accentRoom = wall.rooms[0];
    const accentId = accentRoom ? getNode(graph, accentRoom).accentId : undefined;
    const mat = wallMaterialForRole(wall.role, accentId);
    const { x, z, w, h } = wall.rect;

    if (w >= h) {
      addBox(scene, x, 0, z, w, ROOM_HEIGHT_M, thickness, mat, wall.id);
    } else {
      addBox(scene, x, 0, z, thickness, ROOM_HEIGHT_M, h, mat, wall.id);
    }
  }
}

function computeMidshipsCameraTarget(graph: DeckGraph): THREE.Vector3 {
  const spine = getNode(graph, 'main-spine');
  if (spine.footprint.kind === 'rect') {
    const r = spine.footprint.rect;
    return new THREE.Vector3(r.x + r.w / 2, 0, r.z + r.h / 2);
  }
  return new THREE.Vector3(0, 0, 0);
}

export function createDeckScene(graph: DeckGraph): DeckScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05080f');

  const key = new THREE.DirectionalLight('#fff2e0', 1.0);
  key.position.set(4, 6, 2);
  scene.add(key);

  const fill = new THREE.HemisphereLight('#a8c0d8', '#05080f', 0.35);
  scene.add(fill);

  const roomGroups = new Map<string, THREE.Group>();

  for (const node of listNodes(graph)) {
    const group = new THREE.Group();
    group.name = `room:${node.id}`;
    if (node.footprint.kind === 'rect') {
      buildRectRoom(group, node as DeckNode & { footprint: { kind: 'rect'; rect: { x: number; z: number; w: number; h: number } } });
    } else {
      buildPolygonRoom(group, node as DeckNode & { footprint: { kind: 'polygon'; points: { x: number; z: number }[] } });
    }
    roomGroups.set(node.id, group);
    scene.add(group);
  }

  buildWalls(scene, graph);

  const target = computeMidshipsCameraTarget(graph);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(target.x, 80, target.z + 60);
  camera.lookAt(target);

  return { scene, camera, roomGroups };
}
