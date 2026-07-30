import type { ActionId } from './commands.js';
import type { CrewAiState } from '../ai/types.js';
import type { MissionPhase, ScoreSnapshot } from '../mission/types.js';

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
  /** Ordered crew entity ids from spawner (length 8 after spawn). */
  crewIds: EntityId[];
  /** P1 stub: 0 or 1. */
  alarmLevel: 0 | 1;
  lkpValid: boolean;
  lkpX: number;
  lkpZ: number;
  fireHeld: boolean;
  magazine: number;
  reserve: number;
  reloadTicksRemaining: number;
  fireCooldownTicks: number;
  missionPhase: MissionPhase;
  breachSelectIndex: 0 | 1;
  breachRoomId: 'port-airlock' | 'stbd-airlock' | null;
  insertionTicksRemaining: number;
  closedDoorEdgeId: string | null;
  objectiveIssued: boolean;
  objectiveComplete: boolean;
  alarmTripTick: number | null;
  score: ScoreSnapshot | null;
  shellInteractPrev: boolean;
  shellMoveAxisX: number;
  shellMoveAxisZ: number;
}

export interface SimState {
  tick: number;
  nextEntityId: number;
  entities: Map<EntityId, Entity>;
  meta: WorldMeta;
  /** Per-projectile range traveled (m); cloned for replay determinism (G8). */
  projectileTraveledM: Map<EntityId, number>;
  crewAi: Map<EntityId, CrewAiState>;
}
