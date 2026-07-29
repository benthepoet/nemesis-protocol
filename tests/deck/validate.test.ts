import { describe, expect, it } from 'vitest';
import { bordersClassA } from '../../src/deck/graph.js';
import { buildDeckGraph } from '../../src/deck/loadDeck.js';
import {
  P1_CRITICAL_PATH_IDS,
  validateDeckGraph,
} from '../../src/deck/validate.js';
import {
  baseDeckDefinition,
  deckEngineeringClassA,
  deckExtraBreach,
  deckMissingDoor,
  deckUntypedDoor,
} from './fixtures/minimalInvalidDeck.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';

describe('validateDeckGraph (G2)', () => {
  it('E4: deck03 validates clean', () => {
    const report = validateDeckGraph(loadTestDeck03());
    expect(report.ok).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('E5: missing door fails connectivity', () => {
    const graph = buildDeckGraph(deckMissingDoor());
    const report = validateDeckGraph(graph);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === 'CONNECTED' || i.code === 'REACH_FROM_BREACH')).toBe(
      true,
    );
  });

  it('E6: third breach flag fails', () => {
    const graph = buildDeckGraph(deckExtraBreach());
    const report = validateDeckGraph(graph);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === 'BREACH_COUNT')).toBe(true);
  });

  it('E7: Class-A door edge fails DOOR_CLASS_B', () => {
    const graph = buildDeckGraph(deckUntypedDoor());
    const report = validateDeckGraph(graph);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === 'DOOR_CLASS_B' || i.code === 'EDGE_TYPED')).toBe(
      true,
    );
  });

  it('E8: Engineering Class A outer wall fails ENGINEERING_B_BOUND', () => {
    const graph = buildDeckGraph(deckEngineeringClassA());
    const report = validateDeckGraph(graph);
    expect(report.ok).toBe(false);
    expect(report.issues.some((i) => i.code === 'ENGINEERING_B_BOUND')).toBe(true);
  });

  it('E19: critical path set exact match', () => {
    const graph = loadTestDeck03();
    const criticalIds = [...graph.nodes.values()]
      .filter((n) => n.onCriticalPath)
      .map((n) => n.id)
      .sort();
    expect(criticalIds).toEqual([...P1_CRITICAL_PATH_IDS].sort());
  });

  it('E20: airlocks border Class A; spine/engineering exempt', () => {
    const graph = loadTestDeck03();
    expect(bordersClassA(graph, 'port-airlock')).toBe(true);
    expect(bordersClassA(graph, 'stbd-airlock')).toBe(true);
    expect(bordersClassA(graph, 'main-spine')).toBe(false);
    expect(bordersClassA(graph, 'engineering')).toBe(false);
    expect(validateDeckGraph(graph).ok).toBe(true);
  });

  it('base definition sanity', () => {
    const def = baseDeckDefinition();
    expect(def.nodes).toHaveLength(18);
  });
});
