import type { EntityId } from '../sim/types.js';

export type CrewFsmState = 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'DEAD';

export interface CrewAiState {
  fsm: CrewFsmState;
  waypointIndex: number;
  pauseTicksRemaining: number;
  losTicks: number;
  investigateTicksRemaining: number;
  windupTicksRemaining: number;
  fireCooldownTicks: number;
  shotIndex: number;
  postId: string;
}

export type CrewAiEvent =
  | { type: 'windup-start'; crewId: EntityId; x: number; y: number; z: number; yaw: number }
  | { type: 'windup-end'; crewId: EntityId };
