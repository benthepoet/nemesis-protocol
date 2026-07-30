import {
  ALARM_LEVEL_AL1,
  CREW_ATTACK_RANGE_M,
  CREW_ATTACK_WINDUP_TICKS,
  CREW_CHASE_SPEED_MPS,
  CREW_DETECTION_DELAY_TICKS,
  CREW_INVESTIGATE_SCAN_TICKS,
  CREW_INVESTIGATE_SPEED_MPS,
  CREW_PATROL_SPEED_MPS,
  CREW_WAYPOINT_PAUSE_TICKS,
} from '../config.js';
import type { CollisionWorld } from '../deck/collision.js';
import type { DeckGraph } from '../deck/types.js';
import { tripAlarm, refreshLkpFromPlayer } from './alarm.js';
import { canSeePlayer } from './perception.js';
import { arrivedAt, steerCrewStep } from './pathing.js';
import type { CrewAiEvent, CrewAiState } from './types.js';
import type { SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';

function getPost(graph: DeckGraph, postId: string) {
  const post = graph.crewSpawnTable.find((p) => p.id === postId);
  if (!post) throw new Error(`unknown crew post ${postId}`);
  return post;
}

function convergePatrolToChase(state: SimState): void {
  for (const id of state.meta.crewIds) {
    const ai = state.crewAi.get(id);
    const entity = getEntity(state, id);
    if (!ai || !entity?.alive) continue;
    if (ai.fsm === 'PATROL') ai.fsm = 'CHASE';
  }
}

function anyLivingCrewHasLos(
  state: SimState,
  collisionWorld: CollisionWorld,
  player: NonNullable<ReturnType<typeof getEntity>>,
): boolean {
  for (const id of state.meta.crewIds) {
    const crew = getEntity(state, id);
    if (!crew?.alive) continue;
    if (canSeePlayer(crew, player, collisionWorld)) return true;
  }
  return false;
}

export function integrateCrewAi(
  state: SimState,
  collisionWorld: CollisionWorld,
  graph: DeckGraph,
): CrewAiEvent[] {
  const events: CrewAiEvent[] = [];
  const playerId = state.meta.playerId;
  const player = playerId !== null ? getEntity(state, playerId) : undefined;
  const playerAlive = player?.alive ?? false;

  if (playerAlive && player && anyLivingCrewHasLos(state, collisionWorld, player)) {
    refreshLkpFromPlayer(state);
  }

  for (const id of state.meta.crewIds) {
    const entity = getEntity(state, id);
    let ai = state.crewAi.get(id);
    if (!ai) continue;

    const prevFsm = ai.fsm;

    if (!entity?.alive) {
      ai.fsm = 'DEAD';
      continue;
    }

    let detectedThisTick = false;
    if (playerAlive && player) {
      if (canSeePlayer(entity, player, collisionWorld)) {
        ai.losTicks += 1;
        if (ai.losTicks >= CREW_DETECTION_DELAY_TICKS) {
          tripAlarm(state, 'detection');
          convergePatrolToChase(state);
          ai.fsm = 'CHASE';
          detectedThisTick = true;
          ai.losTicks = CREW_DETECTION_DELAY_TICKS;
        }
      } else {
        ai.losTicks = 0;
      }
    } else {
      ai.losTicks = 0;
    }

    if (!detectedThisTick && ai.fsm === 'PATROL' && state.meta.alarmLevel === ALARM_LEVEL_AL1 && state.meta.lkpValid) {
      ai.fsm = 'CHASE';
    }

    const distToPlayer =
      playerAlive && player ? Math.hypot(player.x - entity.x, player.z - entity.z) : Infinity;
    const hasLos = playerAlive && player ? canSeePlayer(entity, player, collisionWorld) : false;

    if (ai.fsm === 'CHASE') {
      if (hasLos && distToPlayer <= CREW_ATTACK_RANGE_M) {
        ai.fsm = 'ATTACK';
      } else if (
        !hasLos &&
        state.meta.lkpValid &&
        arrivedAt(entity.x, entity.z, state.meta.lkpX, state.meta.lkpZ)
      ) {
        ai.fsm = 'INVESTIGATE';
        ai.investigateTicksRemaining = CREW_INVESTIGATE_SCAN_TICKS;
      }
    } else if (ai.fsm === 'ATTACK') {
      if (!hasLos || distToPlayer > CREW_ATTACK_RANGE_M) {
        ai.fsm = 'CHASE';
      }
    } else if (ai.fsm === 'INVESTIGATE') {
      if (hasLos) {
        ai.fsm = distToPlayer <= CREW_ATTACK_RANGE_M ? 'ATTACK' : 'CHASE';
      } else if (ai.investigateTicksRemaining <= 0) {
        // hold at LKP — remain INVESTIGATE
      }
    }

    if (prevFsm === 'ATTACK' && ai.fsm !== 'ATTACK') {
      ai.windupTicksRemaining = 0;
      events.push({ type: 'windup-end', crewId: id });
    }

    if (ai.fsm === 'ATTACK' && prevFsm !== 'ATTACK') {
      ai.windupTicksRemaining = CREW_ATTACK_WINDUP_TICKS;
      events.push({
        type: 'windup-start',
        crewId: id,
        x: entity.x,
        y: entity.y,
        z: entity.z,
        yaw: entity.yaw,
      });
    }

    switch (ai.fsm) {
      case 'PATROL': {
        if (ai.pauseTicksRemaining > 0) {
          ai.pauseTicksRemaining -= 1;
          break;
        }
        const post = getPost(graph, ai.postId);
        const wp = post.waypoints[ai.waypointIndex % post.waypoints.length]!;
        steerCrewStep(state, id, collisionWorld, graph, wp.x, wp.z, CREW_PATROL_SPEED_MPS);
        if (arrivedAt(entity.x, entity.z, wp.x, wp.z)) {
          ai.pauseTicksRemaining = CREW_WAYPOINT_PAUSE_TICKS;
          ai.waypointIndex = (ai.waypointIndex + 1) % post.waypoints.length;
        }
        break;
      }
      case 'CHASE': {
        let gx = state.meta.lkpX;
        let gz = state.meta.lkpZ;
        if (hasLos && player) {
          gx = player.x;
          gz = player.z;
        } else if (!state.meta.lkpValid && player) {
          gx = player.x;
          gz = player.z;
        }
        steerCrewStep(state, id, collisionWorld, graph, gx, gz, CREW_CHASE_SPEED_MPS);
        break;
      }
      case 'INVESTIGATE': {
        if (state.meta.lkpValid && !arrivedAt(entity.x, entity.z, state.meta.lkpX, state.meta.lkpZ)) {
          steerCrewStep(
            state,
            id,
            collisionWorld,
            graph,
            state.meta.lkpX,
            state.meta.lkpZ,
            CREW_INVESTIGATE_SPEED_MPS,
          );
        } else if (ai.investigateTicksRemaining > 0) {
          ai.investigateTicksRemaining -= 1;
        }
        break;
      }
      case 'ATTACK': {
        if (player) {
          entity.yaw = Math.atan2(player.x - entity.x, player.z - entity.z);
        }
        if (ai.windupTicksRemaining > 0) ai.windupTicksRemaining -= 1;
        if (ai.fireCooldownTicks > 0) ai.fireCooldownTicks -= 1;
        break;
      }
      default:
        break;
    }

    state.crewAi.set(id, ai);
  }

  return events;
}

export function createInitialCrewAi(postId: string): CrewAiState {
  return {
    fsm: 'PATROL',
    waypointIndex: 0,
    pauseTicksRemaining: 0,
    losTicks: 0,
    investigateTicksRemaining: 0,
    windupTicksRemaining: 0,
    fireCooldownTicks: 0,
    shotIndex: 0,
    postId,
  };
}
