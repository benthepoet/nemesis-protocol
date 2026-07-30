import { describe, expect, it } from 'vitest';
import { CREW_POPULATION } from '../../src/config.js';
import { loadTestDeck03 } from '../helpers/deckTestUtils.js';
import { validateCrewSpawnTable } from '../../src/deck/validate.js';

describe('crewSpawnTable (G2,G6)', () => {
  it('loads eight posts and validates', () => {
    const graph = loadTestDeck03();
    expect(graph.crewSpawnTable.length).toBe(CREW_POPULATION);
    const issues = validateCrewSpawnTable(graph);
    expect(issues).toEqual([]);
  });
});
