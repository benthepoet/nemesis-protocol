import type { EntityId } from './types.js';

export type { EntityId };

export class EntityIdAllocator {
  private next: number;

  constructor(startId: number = 1) {
    this.next = startId;
  }

  allocate(): EntityId {
    const id = this.next as EntityId;
    this.next += 1;
    return id;
  }

  peekNext(): number {
    return this.next;
  }

  reset(startId: number = 1): void {
    this.next = startId;
  }
}
