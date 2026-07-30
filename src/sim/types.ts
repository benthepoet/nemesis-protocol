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
  /** Actor hit points; 0 for non-actors / markers. */
  hp: number;
  /** Projectile owner; null for non-projectiles. */
  ownerId: EntityId | null;
}

export interface WorldMeta {
  interactCount: number;
  cancelCount: number;
  lastAction: ActionId | null;
  interactHeld: boolean;
  cancelHeld: boolean;
  playerId: EntityId | null;
  /** Ordered stand-in ids: spine, cargo, barracks. */
  standInIds: EntityId[];
  fireHeld: boolean;
  magazine: number;
  reserve: number;
  reloadTicksRemaining: number;
  fireCooldownTicks: number;
  respawnTicksRemaining: number;
}

export interface SimState {
  tick: number;
  nextEntityId: number;
  entities: Map<EntityId, Entity>;
  meta: WorldMeta;
  /** Per-projectile range traveled (m); cloned for replay determinism (G8). */
  projectileTraveledM: Map<EntityId, number>;
}
