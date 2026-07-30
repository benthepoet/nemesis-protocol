import type { ActionId } from './commands.js';

export type EntityId = number & { readonly __brand: 'EntityId' };

export interface Entity {
  id: EntityId;
  kind: string;
  x: number;
  y: number;
  z: number;
  /** Radians; atan2(dirX, dirZ). */
  yaw: number;
  moveIntentX: number;
  moveIntentZ: number;
  alive: boolean;
}

export interface WorldMeta {
  interactCount: number;
  cancelCount: number;
  lastAction: ActionId | null;
  interactHeld: boolean;
  cancelHeld: boolean;
  playerId: EntityId | null;
}

export interface SimState {
  tick: number;
  nextEntityId: number;
  entities: Map<EntityId, Entity>;
  meta: WorldMeta;
}
