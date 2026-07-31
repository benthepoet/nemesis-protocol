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

  it('interstitial floor, shell, and aperture metadata present', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, createFallbackDeckMaterials());
    expect(deck.hullEnvelope).toBeDefined();
    const floor = deck.hullEnvelope!.getObjectByName('hull-interstitial:floor');
    expect(floor).toBeDefined();
    expect(deck.hullEnvelope!.getObjectByName('hull-envelope:shell:north')).toBeDefined();

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
});
