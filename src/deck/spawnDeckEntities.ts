import { spawnEntity } from '../sim/world.js';
import type { SimState } from '../sim/types.js';
import { breachNodes } from './graph.js';
import type { DeckGraph } from './types.js';

export function spawnDeckEntities(state: SimState, graph: DeckGraph): void {
  const sortedObjectives = [...graph.objectives].sort((a, b) => a.id.localeCompare(b.id));
  for (const obj of sortedObjectives) {
    spawnEntity(state, 'objective-marker', obj.position.x, 0, obj.position.z);
  }

  const sortedRacks = [...graph.androidRacks].sort((a, b) => a.id.localeCompare(b.id));
  for (const rack of sortedRacks) {
    spawnEntity(state, 'android-rack', rack.position.x, 0, rack.position.z);
  }

  const sortedBreaches = [...breachNodes(graph)].sort((a, b) => a.id.localeCompare(b.id));
  for (const breach of sortedBreaches) {
    const center =
      breach.footprint.kind === 'rect'
        ? {
            x: breach.footprint.rect.x + breach.footprint.rect.w / 2,
            z: breach.footprint.rect.z + breach.footprint.rect.h / 2,
          }
        : {
            x: breach.footprint.points.reduce((s, p) => s + p.x, 0) / breach.footprint.points.length,
            z: breach.footprint.points.reduce((s, p) => s + p.z, 0) / breach.footprint.points.length,
          };
    spawnEntity(state, 'breach-point', center.x, 0, center.z);
  }
}
