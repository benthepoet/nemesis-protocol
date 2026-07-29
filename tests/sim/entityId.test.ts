import { describe, expect, it } from 'vitest';
import { EntityIdAllocator } from '../../src/sim/entityId.js';
import { createWorld, spawnEntity } from '../../src/sim/world.js';

describe('entity IDs (G6)', () => {
  it('E6: identical spawn sequences yield identical EntityId sequences', () => {
    const run = () => {
      const state = createWorld();
      const ids: number[] = [];
      ids.push(spawnEntity(state, 'probe', 0, 0, 0));
      ids.push(spawnEntity(state, 'probe', 1, 0, 0));
      ids.push(spawnEntity(state, 'crate', 2, 0, 0));
      return ids;
    };
    expect(run()).toEqual(run());
  });

  it('allocator matches deterministic sequence', () => {
    const a = new EntityIdAllocator();
    expect(a.allocate()).toBe(1);
    expect(a.allocate()).toBe(2);
    a.reset(1);
    expect(a.allocate()).toBe(1);
  });
});
