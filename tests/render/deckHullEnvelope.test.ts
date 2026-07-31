/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { APERTURE_SITES, HULL_ENVELOPE_PAD_M } from '../../src/config.js';
import { getNode } from '../../src/deck/graph.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import {
  computeDeckBounds,
  buildRoomFootprintPolygons,
  buildInterstitialShape,
  type ApertureFaceUserData,
} from '../../src/render/deckHullGeometry.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('deck hull envelope (G1, G2, M1, M2)', () => {
  it('bounds contain every room corner with pad', () => {
    const graph = loadTestDeck03();
    const bounds = computeDeckBounds(graph);
    for (const node of graph.nodes.values()) {
      if (node.footprint.kind === 'rect') {
        const { x, z, w, h } = node.footprint.rect;
        expect(bounds.x).toBeLessThanOrEqual(x);
        expect(bounds.z).toBeLessThanOrEqual(z);
        expect(bounds.x + bounds.w).toBeGreaterThanOrEqual(x + w);
        expect(bounds.z + bounds.h).toBeGreaterThanOrEqual(z + h);
      }
    }
    const rawMin = getNode(graph, 'port-airlock').footprint;
    expect(rawMin.kind).toBe('rect');
    if (rawMin.kind === 'rect') {
      expect(bounds.x).toBeLessThanOrEqual(rawMin.rect.x - HULL_ENVELOPE_PAD_M + 0.001);
    }
  });

  it('interstitial shape hole count matches room footprints', () => {
    const graph = loadTestDeck03();
    const bounds = computeDeckBounds(graph);
    const polys = buildRoomFootprintPolygons(graph);
    const shape = buildInterstitialShape(bounds, polys);
    expect(shape.holes.length).toBe(polys.length);
  });

  it('interstitial floor, shell, skirts, closure, and aperture metadata present', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, createFallbackDeckMaterials());
    expect(deck.hullEnvelope).toBeDefined();
    const floor = deck.hullEnvelope!.getObjectByName('hull-interstitial:floor');
    expect(floor).toBeDefined();
    expect(deck.hullEnvelope!.getObjectByName('hull-envelope:shell:north')).toBeDefined();
    expect(deck.hullEnvelope!.getObjectByName('hull-envelope:corner:nw')).toBeDefined();
    expect(deck.hullEnvelope!.getObjectByName('hull-envelope:top-band:north')).toBeDefined();

    const skirtCount = graph.wallSegments.filter((w) =>
      deck.hullEnvelope!.getObjectByName(`hull-skirt:${w.id}`),
    ).length;
    expect(skirtCount).toBe(graph.wallSegments.length);

    const padRing = deck.hullEnvelope!.children.filter((c) => c.name.startsWith('hull-envelope:pad-ring:'));
    expect(padRing.length).toBeGreaterThan(0);

    for (const site of APERTURE_SITES) {
      const mesh = deck.hullEnvelope!.getObjectByName(
        `hull-envelope:aperture:${site.siteId}`,
      ) as THREE.Mesh | undefined;
      expect(mesh, site.siteId).toBeDefined();
      const ud = mesh!.userData as ApertureFaceUserData;
      expect(ud.apertureReserved).toBe(true);
      expect(ud.apertureClass).toBe('C');
      expect(ud.aperturePhase).toBe('reserved');
      expect(ud.siteId).toBe(site.siteId);
      expect(ud.wallSegmentId).toBe(site.wallSegmentId);
      expect(ud.roomId).toBe(site.roomId);
    }
    deck.disposeMaterials();
  });

  it('R-DP16/R-DP17: interstitial slab is world-placed and covers the spine-adjacent sliver', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, createFallbackDeckMaterials());
    const floor = deck.hullEnvelope!.getObjectByName('hull-interstitial:floor') as THREE.Mesh;
    floor.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(floor);

    const bounds = computeDeckBounds(graph);
    // Probe: sliver between spine south edge and south rooms (previously
    // mirrored off-deck — the black line under the spine in gate2-screen1).
    const spine = getNode(graph, 'main-spine');
    expect(spine.footprint.kind).toBe('rect');
    if (spine.footprint.kind === 'rect') {
      const r = spine.footprint.rect;
      const probe = new THREE.Vector3(r.x + r.w / 2, 0.02, r.z + r.h + 0.3);
      expect(box.containsPoint(probe)).toBe(true);
    }
    // Slab top sits 1 cm below room-floor tops; base at INTERSTITIAL_FLOOR_Y.
    expect(box.max.y).toBeCloseTo(0.04, 3);
    expect(box.min.y).toBeCloseTo(-0.01, 3);
    // World z must match deck bounds (not mirrored to negative z).
    expect(box.min.z).toBeCloseTo(bounds.z, 3);
    expect(box.max.z).toBeCloseTo(bounds.z + bounds.h, 3);
    deck.disposeMaterials();
  });

  it('R-DP17: bridge polygon floor lies inside the bridge footprint at flush height', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, createFallbackDeckMaterials());
    const floor = deck.roomGroups.get('bridge')!.getObjectByName('floor:bridge') as THREE.Mesh;
    expect(floor).toBeDefined();
    floor.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(floor);

    const bridge = getNode(graph, 'bridge');
    expect(bridge.footprint.kind).toBe('polygon');
    if (bridge.footprint.kind === 'polygon') {
      const pts = bridge.footprint.points;
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minZ = Math.min(...pts.map((p) => p.z));
      const maxZ = Math.max(...pts.map((p) => p.z));
      expect(box.min.x).toBeCloseTo(minX, 3);
      expect(box.max.x).toBeCloseTo(maxX, 3);
      expect(box.min.z).toBeCloseTo(minZ, 3);
      expect(box.max.z).toBeCloseTo(maxZ, 3);
    }
    expect(box.min.y).toBeCloseTo(0.05, 3);
    deck.disposeMaterials();
  });
});
