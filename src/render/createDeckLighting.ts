import * as THREE from 'three';
import {
  ALARM_LEVEL_AL1,
  HAZE_DENSITY_AL0,
  HAZE_DENSITY_AL1,
  PRACTICAL_FLICKER_AMPLITUDE,
  PRACTICAL_LIVE_FRACTION_AL0,
  ROOM_HEIGHT_M,
  SHADOW_CASTING_DIRECTIONAL_MAX,
  SHADOW_MAP_SIZE,
} from '../config.js';
import { listNodes } from '../deck/graph.js';
import type { DeckGraph } from '../deck/types.js';
import { cloneGltfTemplate } from './assets/loadGltf.js';

export interface DeckLighting {
  update(dtSec: number, alarmLevel: 0 | 1): void;
  dispose(): void;
}

const CORRIDOR_NODE_IDS = new Set(['main-spine', 'fore-connector']);

function isCorridorSpace(nodeId: string, accentId: string): boolean {
  return CORRIDOR_NODE_IDS.has(nodeId) || accentId === 'corridor';
}

function configureShadowLight(light: THREE.DirectionalLight): void {
  light.castShadow = true;
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  light.shadow.bias = -0.0002;
  light.shadow.normalBias = 0.02;
}

export function createDeckLighting(
  scene: THREE.Scene,
  graph: DeckGraph,
  fixtures: { corridorLight: THREE.Group; amberBeacon: THREE.Group },
): DeckLighting {
  scene.fog = new THREE.FogExp2('#05080f', HAZE_DENSITY_AL0);

  const fill = new THREE.HemisphereLight('#b8cce0', '#1a2430', 0.55);
  scene.add(fill);

  interface RoomLightBundle {
    keys: THREE.DirectionalLight[];
    practicals: THREE.PointLight[];
    practicalBase: number[];
    beaconRoots: THREE.Group[];
    beaconLights: THREE.PointLight[];
    nodeId: string;
    isCorridor: boolean;
  }

  const bundles: RoomLightBundle[] = [];
  let shadowDirectionalsEnabled = 0;

  for (const node of listNodes(graph)) {
    const isCorridor = isCorridorSpace(node.id, node.accentId);
    const center =
      node.footprint.kind === 'rect'
        ? {
            x: node.footprint.rect.x + node.footprint.rect.w / 2,
            z: node.footprint.rect.z + node.footprint.rect.h / 2,
          }
        : { x: 0, z: 0 };

    const keys: THREE.DirectionalLight[] = [];
    for (let i = 0; i < 2; i++) {
      const key = new THREE.DirectionalLight('#fff2e0', 0.85);
      key.position.set(center.x + (i ? -3 : 3), ROOM_HEIGHT_M + 2, center.z + (i ? 2 : -2));
      if (shadowDirectionalsEnabled < SHADOW_CASTING_DIRECTIONAL_MAX) {
        configureShadowLight(key);
        shadowDirectionalsEnabled += 1;
      } else {
        key.castShadow = false;
      }
      key.target.position.set(center.x, 0, center.z);
      scene.add(key);
      scene.add(key.target);
      keys.push(key);
    }

    const practicals: THREE.PointLight[] = [];
    const practicalBase: number[] = [];
    const slotCount = isCorridor ? 5 : 3;
    const liveCount = Math.max(2, Math.floor(slotCount * PRACTICAL_LIVE_FRACTION_AL0));
    for (let s = 0; s < slotCount; s++) {
      const fixture = cloneGltfTemplate(fixtures.corridorLight);
      fixture.position.set(center.x + (s - slotCount / 2) * 1.2, 0, center.z);
      scene.add(fixture);
      if (s < liveCount) {
        const pl = new THREE.PointLight('#fff2e0', 0.55, 8);
        pl.position.set(fixture.position.x, ROOM_HEIGHT_M - 0.2, fixture.position.z);
        pl.castShadow = false;
        scene.add(pl);
        practicals.push(pl);
        practicalBase.push(pl.intensity);
      }
    }

    const localBeacons: THREE.Group[] = [];
    const beaconLights: THREE.PointLight[] = [];
    if (isCorridor) {
      for (const offset of [-2, 2]) {
        const beacon = cloneGltfTemplate(fixtures.amberBeacon);
        beacon.name = 'p1_amber_beacon';
        beacon.position.set(center.x + offset, 0, center.z);
        beacon.visible = false;
        scene.add(beacon);
        localBeacons.push(beacon);

        const bl = new THREE.PointLight('#ffb300', 0, 10);
        bl.position.set(beacon.position.x, ROOM_HEIGHT_M - 0.3, beacon.position.z);
        bl.visible = false;
        scene.add(bl);
        beaconLights.push(bl);
      }
    }

    bundles.push({
      keys,
      practicals,
      practicalBase,
      beaconRoots: localBeacons,
      beaconLights,
      nodeId: node.id,
      isCorridor,
    });
  }

  let flickerPhase = 0;

  return {
    update(dtSec: number, level: 0 | 1): void {
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = level === ALARM_LEVEL_AL1 ? HAZE_DENSITY_AL1 : HAZE_DENSITY_AL0;
      }

      flickerPhase += dtSec;
      for (const bundle of bundles) {
        for (let i = 0; i < bundle.practicals.length; i++) {
          const light = bundle.practicals[i]!;
          const base = bundle.practicalBase[i] ?? light.intensity;
          const wobble =
            1 +
            PRACTICAL_FLICKER_AMPLITUDE *
              Math.sin(flickerPhase * 3.1 + i * 1.7 + bundle.nodeId.length);
          light.intensity = base * wobble;
        }

        if (bundle.isCorridor && level === ALARM_LEVEL_AL1) {
          for (let b = 0; b < bundle.beaconRoots.length; b++) {
            const root = bundle.beaconRoots[b]!;
            root.visible = true;
            root.userData.alarmBeaconActive = true;
            root.rotation.y += dtSec * 2.5;
            const bl = bundle.beaconLights[b]!;
            bl.visible = true;
            bl.intensity = 1.2 + 0.3 * Math.sin(flickerPhase * 5 + b);
          }
        } else if (level !== ALARM_LEVEL_AL1) {
          for (let b = 0; b < bundle.beaconRoots.length; b++) {
            const root = bundle.beaconRoots[b]!;
            root.visible = false;
            root.userData.alarmBeaconActive = false;
            const bl = bundle.beaconLights[b]!;
            bl.visible = false;
            bl.intensity = 0;
          }
        }
      }
    },

    dispose(): void {
      scene.remove(fill);
      fill.dispose();
      scene.fog = null;
      for (const bundle of bundles) {
        for (const key of bundle.keys) {
          scene.remove(key);
          scene.remove(key.target);
          key.dispose();
        }
        for (const pl of bundle.practicals) {
          scene.remove(pl);
          pl.dispose();
        }
        for (const b of bundle.beaconRoots) scene.remove(b);
        for (const bl of bundle.beaconLights) {
          scene.remove(bl);
          bl.dispose();
        }
      }
    },
  };
}

export function countActiveCorridorBeacons(scene: THREE.Scene): number {
  let n = 0;
  scene.traverse((obj) => {
    if (obj.userData.alarmBeaconActive === true && obj.visible) n += 1;
  });
  return n;
}

export function countShadowCastingDirectionals(scene: THREE.Scene): number {
  let n = 0;
  scene.traverse((obj) => {
    if (obj instanceof THREE.DirectionalLight && obj.castShadow) n += 1;
  });
  return n;
}
