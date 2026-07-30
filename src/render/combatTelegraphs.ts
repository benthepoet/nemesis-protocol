import * as THREE from 'three';
import { earliestWallHit } from '../combat/projectileCollision.js';
import type { CollisionWorld } from '../deck/collision.js';
import {
  AIM_LINE_BRIGHT_OPACITY,
  AIM_LINE_CORE_COLOR_HEX,
  AIM_LINE_CORE_RADIUS_M,
  AIM_LINE_DIM_OPACITY,
  AIM_LINE_HALO_COLOR_HEX,
  AIM_LINE_HALO_RADIUS_M,
  AIM_LINE_Y_M,
  PROJECTILE_KIND,
  PROJECTILE_MAX_RANGE_M,
  PROJECTILE_MUZZLE_OFFSET_M,
  TRACER_CORE_COLOR_HEX,
  TRACER_CORE_RADIUS_M,
  TRACER_HALO_COLOR_HEX,
  TRACER_HALO_RADIUS_M,
  TRACER_LENGTH_M,
  TRACER_MAX_CONCURRENT,
  TRACER_Y_M,
} from '../config.js';
import type { EntityId, SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';

export interface CombatTelegraphsOptions {
  /** Default true. When false, sync is a no-op (meshes hidden / not created). */
  enabled?: boolean;
}

export interface CombatTelegraphs {
  /** Read-only sync from sim + collision. Must not mutate SimState. */
  sync(state: SimState, collisionWorld: CollisionWorld): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _aimLocalStart = new THREE.Vector3();
const _aimLocalEnd = new THREE.Vector3();

function telegraphMaterial(colorHex: string, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createTracerGroup(): THREE.Group {
  const group = new THREE.Group();
  const coreGeo = new THREE.CylinderGeometry(
    TRACER_CORE_RADIUS_M,
    TRACER_CORE_RADIUS_M,
    TRACER_LENGTH_M,
    8,
  );
  const haloGeo = new THREE.CylinderGeometry(
    TRACER_HALO_RADIUS_M,
    TRACER_HALO_RADIUS_M,
    TRACER_LENGTH_M,
    8,
  );
  const core = new THREE.Mesh(coreGeo, telegraphMaterial(TRACER_CORE_COLOR_HEX, 1));
  const halo = new THREE.Mesh(haloGeo, telegraphMaterial(TRACER_HALO_COLOR_HEX, 0.85));
  group.add(halo);
  group.add(core);
  return group;
}

function orientHorizontalSegment(mesh: THREE.Mesh, sx: number, sy: number, sz: number, ex: number, ez: number): void {
  const dx = ex - sx;
  const dz = ez - sz;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mesh.position.set(sx, sy, sz);
  _dir.set(dx / len, 0, dz / len);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, _dir);
  mesh.scale.set(1, len, 1);
}

function createAimSegmentMesh(radius: number, colorHex: string): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 8);
  geo.translate(0, 0.5, 0);
  return new THREE.Mesh(geo, telegraphMaterial(colorHex, AIM_LINE_DIM_OPACITY));
}

interface CombatTelegraphsInternal extends CombatTelegraphs {
  tracerIds(): EntityId[];
  aimLineGroup: THREE.Group;
  aimCoreMesh: THREE.Mesh;
}

export function createCombatTelegraphs(
  scene: THREE.Scene,
  opts?: CombatTelegraphsOptions,
): CombatTelegraphs {
  let enabled = opts?.enabled !== false;
  const tracers = new Map<EntityId, THREE.Group>();
  const aimLine = new THREE.Group();
  const aimHalo = createAimSegmentMesh(AIM_LINE_HALO_RADIUS_M, AIM_LINE_HALO_COLOR_HEX);
  const aimCore = createAimSegmentMesh(AIM_LINE_CORE_RADIUS_M, AIM_LINE_CORE_COLOR_HEX);
  aimLine.add(aimHalo);
  aimLine.add(aimCore);
  scene.add(aimLine);

  const hideAll = (): void => {
    aimLine.visible = false;
    for (const group of tracers.values()) {
      group.visible = false;
    }
  };

  const removeTracer = (id: EntityId): void => {
    const group = tracers.get(id);
    if (!group) return;
    scene.remove(group);
    for (const child of group.children) {
      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    tracers.delete(id);
  };

  const syncTracer = (yaw: number, x: number, z: number, group: THREE.Group): void => {
    group.visible = true;
    group.position.set(x, TRACER_Y_M, z);
    _dir.set(Math.sin(yaw), 0, Math.cos(yaw));
    group.quaternion.setFromUnitVectors(Y_AXIS, _dir);
  };

  const internal: CombatTelegraphsInternal = {
    aimLineGroup: aimLine,
    aimCoreMesh: aimCore,

    sync(state: SimState, collisionWorld: CollisionWorld): void {
      if (!enabled) {
        hideAll();
        return;
      }

      const liveProjectileIds = new Set<EntityId>();
      for (const entity of state.entities.values()) {
        if (entity.kind === PROJECTILE_KIND && entity.alive) {
          liveProjectileIds.add(entity.id);
        }
      }

      if (import.meta.env.DEV && liveProjectileIds.size > TRACER_MAX_CONCURRENT) {
        console.warn(
          `[combatTelegraphs] tracer count ${liveProjectileIds.size} exceeds budget ${TRACER_MAX_CONCURRENT}`,
        );
      }

      for (const id of tracers.keys()) {
        if (!liveProjectileIds.has(id)) {
          removeTracer(id);
        }
      }

      for (const id of liveProjectileIds) {
        const entity = getEntity(state, id)!;
        let group = tracers.get(id);
        if (!group) {
          group = createTracerGroup();
          tracers.set(id, group);
          scene.add(group);
        }
        syncTracer(entity.yaw, entity.x, entity.z, group);
      }

      const playerId = state.meta.playerId;
      const player = playerId !== null ? getEntity(state, playerId) : undefined;
      if (!player || !player.alive) {
        aimLine.visible = false;
        return;
      }

      const yaw = player.yaw;
      const dirX = Math.sin(yaw);
      const dirZ = Math.cos(yaw);
      const ox = player.x + dirX * PROJECTILE_MUZZLE_OFFSET_M;
      const oz = player.z + dirZ * PROJECTILE_MUZZLE_OFFSET_M;
      const ex = ox + dirX * PROJECTILE_MAX_RANGE_M;
      const ez = oz + dirZ * PROJECTILE_MAX_RANGE_M;
      const hit = earliestWallHit(ox, oz, ex, ez, collisionWorld);
      const endX = hit ? hit.x : ex;
      const endZ = hit ? hit.z : ez;

      aimLine.visible = true;
      const opacity = state.meta.fireHeld ? AIM_LINE_BRIGHT_OPACITY : AIM_LINE_DIM_OPACITY;
      for (const mesh of [aimCore, aimHalo]) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
      orientHorizontalSegment(aimHalo, ox, AIM_LINE_Y_M, oz, endX, endZ);
      orientHorizontalSegment(aimCore, ox, AIM_LINE_Y_M, oz, endX, endZ);
    },

    setEnabled(next: boolean): void {
      enabled = next;
      if (!enabled) hideAll();
    },

    dispose(): void {
      for (const id of [...tracers.keys()]) {
        removeTracer(id);
      }
      scene.remove(aimLine);
      for (const mesh of [aimCore, aimHalo]) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    },

    tracerIds(): EntityId[] {
      return [...tracers.keys()];
    },
  };

  return internal;
}

/** Test / dev hook — tracer entity ids after last sync. */
export function getTracerIdsForTest(telegraphs: CombatTelegraphs): EntityId[] {
  if (!import.meta.env.VITEST && !import.meta.env.DEV) {
    throw new Error('getTracerIdsForTest is only available in vitest or DEV');
  }
  return (telegraphs as CombatTelegraphsInternal).tracerIds();
}

/** Test / dev hook — aim line visibility and core opacity after last sync. */
export function getAimLineStateForTest(telegraphs: CombatTelegraphs): {
  visible: boolean;
  opacity: number;
} {
  if (!import.meta.env.VITEST && !import.meta.env.DEV) {
    throw new Error('getAimLineStateForTest is only available in vitest or DEV');
  }
  const handle = telegraphs as CombatTelegraphsInternal;
  const mat = handle.aimCoreMesh.material as THREE.MeshBasicMaterial;
  return { visible: handle.aimLineGroup.visible, opacity: mat.opacity };
}

/** Test / dev hook — aim line core segment world endpoints after last sync. */
export function getAimLineEndpointsForTest(telegraphs: CombatTelegraphs): {
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
} {
  if (!import.meta.env.VITEST && !import.meta.env.DEV) {
    throw new Error('getAimLineEndpointsForTest is only available in vitest or DEV');
  }
  const mesh = (telegraphs as CombatTelegraphsInternal).aimCoreMesh;
  mesh.updateWorldMatrix(true, false);
  _aimLocalStart.set(0, 0, 0);
  _aimLocalEnd.set(0, 1, 0);
  _aimLocalStart.applyMatrix4(mesh.matrixWorld);
  _aimLocalEnd.applyMatrix4(mesh.matrixWorld);
  return {
    startX: _aimLocalStart.x,
    startY: _aimLocalStart.y,
    startZ: _aimLocalStart.z,
    endX: _aimLocalEnd.x,
    endY: _aimLocalEnd.y,
    endZ: _aimLocalEnd.z,
  };
}
