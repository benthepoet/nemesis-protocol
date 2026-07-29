import type { DeckDefinition } from '../../../src/deck/types.js';
import deck03Raw from '../../../src/deck/data/deck03.json';

export function baseDeckDefinition(): DeckDefinition {
  return structuredClone(deck03Raw) as DeckDefinition;
}

export function deckMissingDoor(): DeckDefinition {
  const def = baseDeckDefinition();
  def.doorEdges = def.doorEdges.filter((d) => d.id !== 'door-spine-cargo');
  return def;
}

export function deckExtraBreach(): DeckDefinition {
  const def = baseDeckDefinition();
  const cargo = def.nodes.find((n) => n.id === 'cargo-hold');
  if (cargo) {
    cargo.breachPoint = true;
  }
  return def;
}

export function deckUntypedDoor(): DeckDefinition {
  const def = baseDeckDefinition();
  const door = def.doorEdges.find((d) => d.id === 'door-spine-cargo');
  if (door) {
    (door as { wallClass: string }).wallClass = 'A';
  }
  return def;
}

export function deckEngineeringClassA(): DeckDefinition {
  const def = baseDeckDefinition();
  def.wallSegments.push({
    id: 'wall-a-engineering-test',
    wallClass: 'A',
    role: 'partition',
    x: 140,
    y: 348,
    w: 8,
    h: 104,
    rooms: ['engineering'],
  });
  return def;
}
