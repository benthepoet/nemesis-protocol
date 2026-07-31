import * as THREE from 'three';
import { roomAtPosition } from './roomQuery.js';
import type { DeckGraph, WorldRect } from './types.js';

/** Min footprint (m) for a prop to block actors. */
const PROP_COLLISION_MIN_M = 0.35;
/** Max footprint (m) — skip merged hull/exterior slabs. */
const PROP_COLLISION_MAX_M = 6.5;
/** Min vertical extent (m) — skip flat decals. */
const PROP_COLLISION_MIN_HEIGHT_M = 0.28;

const SKIP_NAME_PARTS = [
  'wall_',
  'floor:',
  'floor_',
  'ceiling:',
  'ceil_',
  'aperture:',
  'signage:',
  'room:',
  'hull',
  'interstitial',
  'underbelly',
  'bay_floor',
  'maint_',
  'plate_',
  'topseam',
  'lintel_',
  'door',
  'df_',
  'spine_',
  'trim_',
  'hatch_',
  'sensor_dome',
  'eng_house',
  'nozzle',
  'player',
  'stand-in',
  'standin',
];

const PROP_NAME_HINTS = [
  'crate',
  'console',
  'rack',
  'medbed',
  'bunk',
  'locker',
  'mess_',
  'hydro_',
  'armrack',
  'reactor',
  'bridge_',
  'cic_',
  'airlock_rail',
  'desk',
  'table',
  'bench',
  'tank',
  'ls_tank',
  'helm',
  'holo',
  'android',
  'prop',
  'engine_',
  'oq_',
];

function shouldSkipPropName(name: string): boolean {
  const n = name.toLowerCase();
  if (!n || n === 'mesh') return true;
  return SKIP_NAME_PARTS.some((part) => n.includes(part));
}

function looksLikeProp(name: string): boolean {
  const n = name.toLowerCase();
  return PROP_NAME_HINTS.some((hint) => n.includes(hint));
}

function isPropMesh(name: string): boolean {
  if (shouldSkipPropName(name)) return false;
  if (looksLikeProp(name)) return true;
  // Merged export shards keep Blender object names (crate_0, eng_console_scr, …).
  const n = name.toLowerCase();
  if (/^(crate|medbed|bunk|locker|mess_|hydro_|armrack|rack_|bridge_|cic_|cn_|eng_|oq_|ls_tank|reactor_|airlock_rail|cyl|box)/.test(n)) {
    return true;
  }
  return n.includes('_scr') || n.endsWith('_leg') || n.includes('_slot') || n.includes('_gel');
}

/**
 * Build axis-aligned prop obstacles from a loaded Blender deck (presentation root).
 * Does not mutate deck03 graph data.
 */
export function buildPropCollisionAABBs(root: THREE.Object3D, graph: DeckGraph): WorldRect[] {
  root.updateMatrixWorld(true);
  const rects: WorldRect[] = [];
  const box = new THREE.Box3();

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (shouldSkipPropName(obj.name)) return;
    if (!isPropMesh(obj.name)) return;

    box.setFromObject(obj);
    if (box.isEmpty()) return;

    const height = box.max.y - box.min.y;
    if (height < PROP_COLLISION_MIN_HEIGHT_M) return;
    if (box.max.y < 0.15) return;

    let w = box.max.x - box.min.x;
    let d = box.max.z - box.min.z;
    if (w < PROP_COLLISION_MIN_M || d < PROP_COLLISION_MIN_M) return;
    if (w > PROP_COLLISION_MAX_M || d > PROP_COLLISION_MAX_M) return;

    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    if (roomAtPosition(graph, cx, cz) === null) return;

    w = Math.max(PROP_COLLISION_MIN_M, w);
    d = Math.max(PROP_COLLISION_MIN_M, d);
    rects.push({
      x: cx - w * 0.5,
      z: cz - d * 0.5,
      w,
      h: d,
    });
  });

  return rects;
}
