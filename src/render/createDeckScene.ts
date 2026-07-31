import * as THREE from 'three';
import {
  ACCENT_HEX,
  BULKHEAD_THICKNESS_M,
  CORRIDOR_SPINE_NEUTRAL_HEX,
  PARTITION_ACCENT_STRIP_EMISSIVE,
  PARTITION_ACCENT_STRIP_WIDTH_M,
  ROOM_FLOOR_TOP_Y,
  ROOM_HEIGHT_M,
  SIGNAGE_PLANE_HEIGHT_M,
  SIGNAGE_PLANE_WIDTH_M,
  WALL_THICKNESS_M,
} from '../config.js';
import { getNode, listNodes, listWallSegments } from '../deck/graph.js';
import type { AccentId, DeckGraph, DeckNode, WallRole } from '../deck/types.js';
import { buildDeckDressing } from './deckDressing.js';
import { createFallbackDeckMaterials, type DeckMaterialSet } from './deckMaterials.js';
import { buildHullEnvelope } from './deckHullGeometry.js';

export interface DeckScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  roomGroups: ReadonlyMap<string, THREE.Group>;
  hullEnvelope?: THREE.Group;
  dressing?: THREE.Group;
  disposeMaterials(): void;
}

function disposeOwnedResources(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const material = obj.material;
      if (Array.isArray(material)) {
        for (const m of material) m.dispose();
      } else {
        material?.dispose();
      }
    }
  });
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
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
}

function partitionAccentStripMaterial(mats: DeckMaterialSet, accentId: AccentId): THREE.MeshStandardMaterial {
  const hex = accentId === 'corridor' ? CORRIDOR_SPINE_NEUTRAL_HEX : ACCENT_HEX[accentId as keyof typeof ACCENT_HEX];
  const mat = mats.hullSteel.clone();
  mat.emissive = new THREE.Color(hex);
  mat.emissiveIntensity = PARTITION_ACCENT_STRIP_EMISSIVE;
  return mat;
}

function buildRectRoom(
  group: THREE.Group,
  node: DeckNode & { footprint: { kind: 'rect'; rect: { x: number; z: number; w: number; h: number } } },
  mats: DeckMaterialSet,
): void {
  const { x, z, w, h } = node.footprint.rect;
  const floorMat = mats.floor.clone();
  addBox(group, x, 0, z, w, 0.05, h, floorMat, `floor:${node.id}`);
  const ceilingMat = mats.ceiling.clone();
  ceilingMat.transparent = true;
  ceilingMat.opacity = 1;
  ceilingMat.depthWrite = true;
  addBox(group, x, ROOM_HEIGHT_M - 0.05, z, w, 0.05, h, ceilingMat, `ceiling:${node.id}`);
  addSectionSign(group, node.id, node.accentId, x + w * 0.5, z + 0.15, w, mats);
}

function buildPolygonRoom(
  group: THREE.Group,
  node: DeckNode & { footprint: { kind: 'polygon'; points: { x: number; z: number }[] } },
  mats: DeckMaterialSet,
): void {
  const points = node.footprint.points;
  if (points.length < 3) return;

  // R-DP17: author shape with negated z — rotation.x = -PI/2 maps shape-y to
  // world -z; authoring negated yields world-correct, up-facing geometry.
  const shape = new THREE.Shape();
  shape.moveTo(points[0]!.x, -points[0]!.z);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i]!.x, -points[i]!.z);
  }
  shape.closePath();

  const floorMat = mats.floor.clone();
  const floorGeo = new THREE.ShapeGeometry(shape);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = ROOM_FLOOR_TOP_Y;
  floor.name = `floor:${node.id}`;
  floor.receiveShadow = true;
  group.add(floor);

  const ceilingMat = mats.ceiling.clone();
  ceilingMat.transparent = true;
  ceilingMat.opacity = 1;
  ceilingMat.depthWrite = true;
  const ceiling = new THREE.Mesh(floorGeo.clone(), ceilingMat);
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.y = ROOM_HEIGHT_M;
  ceiling.name = `ceiling:${node.id}`;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cz = points.reduce((s, p) => s + p.z, 0) / points.length;
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  addSectionSign(group, node.id, node.accentId, cx, cz - 0.2, maxX - minX, mats);
}

function addSectionSign(
  group: THREE.Group,
  nodeId: string,
  accentId: AccentId,
  cx: number,
  cz: number,
  width: number,
  mats: DeckMaterialSet,
): void {
  if (accentId === 'corridor') return;
  const bandIndex = Object.keys(ACCENT_HEX).indexOf(accentId);
  const vOffset = Math.max(0, bandIndex) / 12;
  const mat = new THREE.MeshBasicMaterial({
    map: mats.signageAtlas,
    transparent: true,
    depthWrite: false,
  });
  if (mat.map) {
    mat.map.offset.set(0, vOffset);
    mat.map.repeat.set(1, 1 / 12);
  }
  const planeW = Math.min(SIGNAGE_PLANE_WIDTH_M, width * 0.35);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, SIGNAGE_PLANE_HEIGHT_M),
    mat,
  );
  plane.position.set(cx, 1.6, cz);
  plane.rotation.y = Math.PI;
  plane.name = `signage:${nodeId}`;
  plane.castShadow = false;
  plane.receiveShadow = false;
  group.add(plane);
}

function wallThicknessForRole(role: WallRole): number {
  return role === 'bulkhead' ? BULKHEAD_THICKNESS_M : WALL_THICKNESS_M;
}

function buildPartitionWall(
  parent: THREE.Object3D,
  x: number,
  z: number,
  w: number,
  h: number,
  thickness: number,
  accentId: AccentId | undefined,
  name: string,
  mats: DeckMaterialSet,
): void {
  const capHeight = 0.08;
  const stripWidth = PARTITION_ACCENT_STRIP_WIDTH_M;
  const bodyMat = mats.hullSteel.clone();
  const capMat = mats.hullSteel.clone();
  capMat.emissive = new THREE.Color('#39434e');
  capMat.emissiveIntensity = 0.35;
  const stripMat = partitionAccentStripMaterial(mats, accentId ?? 'corridor');

  if (w >= h) {
    addBox(parent, x, 0, z, w, ROOM_HEIGHT_M - capHeight, thickness, bodyMat, `${name}:body`);
    addBox(parent, x, ROOM_HEIGHT_M - capHeight, z, w, capHeight, thickness, capMat, `${name}:cap`);
    addBox(parent, x, 0, z, w, ROOM_HEIGHT_M, stripWidth, stripMat, `${name}:accent`);
  } else {
    addBox(parent, x, 0, z, thickness, ROOM_HEIGHT_M - capHeight, h, bodyMat, `${name}:body`);
    addBox(parent, x, ROOM_HEIGHT_M - capHeight, z, thickness, capHeight, h, capMat, `${name}:cap`);
    addBox(parent, x, 0, z, stripWidth, ROOM_HEIGHT_M, h, stripMat, `${name}:accent`);
  }
}

function buildWalls(scene: THREE.Scene, graph: DeckGraph, mats: DeckMaterialSet): void {
  for (const wall of listWallSegments(graph)) {
    const thickness = wallThicknessForRole(wall.role);
    const accentRoom = wall.rooms[0];
    const accentId = accentRoom ? getNode(graph, accentRoom).accentId : undefined;
    const { x, z, w, h } = wall.rect;

    if (wall.role === 'partition') {
      buildPartitionWall(scene, x, z, w, h, thickness, accentId, wall.id, mats);
      continue;
    }

    let mat: THREE.MeshStandardMaterial;
    if (wall.role === 'bulkhead') mat = mats.bulkheadWall.clone();
    else if (wall.role === 'hull') mat = mats.hullWall.clone();
    else mat = mats.partitionWall.clone();

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

export function createDeckScene(graph: DeckGraph, materials?: DeckMaterialSet): DeckScene {
  const mats = materials ?? createFallbackDeckMaterials();
  const ownsMaterials = !materials;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05080f');

  const roomGroups = new Map<string, THREE.Group>();

  for (const node of listNodes(graph)) {
    const group = new THREE.Group();
    group.name = `room:${node.id}`;
    if (node.footprint.kind === 'rect') {
      buildRectRoom(
        group,
        node as DeckNode & { footprint: { kind: 'rect'; rect: { x: number; z: number; w: number; h: number } } },
        mats,
      );
    } else {
      buildPolygonRoom(
        group,
        node as DeckNode & { footprint: { kind: 'polygon'; points: { x: number; z: number }[] } },
        mats,
      );
    }
    roomGroups.set(node.id, group);
    scene.add(group);
  }

  buildWalls(scene, graph, mats);

  const hullEnvelope = buildHullEnvelope(graph, mats);
  scene.add(hullEnvelope);

  const dressing = buildDeckDressing(graph, mats);
  scene.add(dressing);

  const target = computeMidshipsCameraTarget(graph);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(target.x, 80, target.z + 60);
  camera.lookAt(target);

  return {
    scene,
    camera,
    roomGroups,
    hullEnvelope,
    dressing,
    disposeMaterials() {
      disposeOwnedResources(hullEnvelope);
      disposeOwnedResources(dressing);
      if (ownsMaterials) mats.dispose();
    },
  };
}

export function meshUsesPbrMaps(mesh: THREE.Mesh): boolean {
  const mat = mesh.material;
  if (!(mat instanceof THREE.MeshStandardMaterial)) return false;
  return Boolean(mat.map && mat.metalnessMap && mat.roughnessMap && mat.normalMap);
}
