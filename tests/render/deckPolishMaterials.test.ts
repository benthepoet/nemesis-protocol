/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ACCENT_HEX } from '../../src/config.js';
import { createDeckScene } from '../../src/render/createDeckScene.js';
import { createFallbackDeckMaterials } from '../../src/render/deckMaterials.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

const ACCENT_EMISSIVE = new Set(Object.values(ACCENT_HEX));

function emissiveIsAccentTint(mat: THREE.Material): boolean {
  if (!(mat instanceof THREE.MeshStandardMaterial)) return false;
  if (mat.emissiveIntensity <= 0) return false;
  const hex = `#${mat.emissive.getHexString()}`;
  return ACCENT_EMISSIVE.has(hex as (typeof ACCENT_HEX)[keyof typeof ACCENT_HEX]);
}

describe('deck polish materials (G3, G4, G6, M3, M5)', () => {
  it('floors and wall bodies lack accent emissive; signage and trim present', () => {
    const graph = loadTestDeck03();
    const deck = createDeckScene(graph, createFallbackDeckMaterials());

    let floorCount = 0;
    let accentStrip = false;
    let signage = false;

    deck.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = obj.name;
      if (name.startsWith('floor:')) {
        floorCount += 1;
        expect(emissiveIsAccentTint(obj.material as THREE.Material)).toBe(false);
      }
      if (name.endsWith(':body')) {
        expect(emissiveIsAccentTint(obj.material as THREE.Material)).toBe(false);
      }
      if (name.endsWith(':accent')) accentStrip = true;
      if (name.startsWith('signage:')) signage = true;
    });

    expect(floorCount).toBeGreaterThan(0);
    expect(accentStrip).toBe(true);
    expect(signage).toBe(true);

    const interstitial = deck.hullEnvelope!.getObjectByName('hull-interstitial:floor') as THREE.Mesh;
    expect(emissiveIsAccentTint(interstitial.material as THREE.Material)).toBe(false);

    deck.disposeMaterials();
  });
});
