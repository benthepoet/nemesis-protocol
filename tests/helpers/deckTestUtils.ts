import { buildDeckGraph, loadDeck03 } from '../../src/deck/loadDeck.js';
import type { DeckGraph } from '../../src/deck/types.js';

export function loadTestDeck03(): DeckGraph {
  return loadDeck03();
}

export { buildDeckGraph, loadDeck03 };
