import {
  ACTOR_MAX_HP,
  CREW_FIRE_INTERVAL_TICKS,
  CREW_SIDEARM_DAMAGE,
  FIRE_INTERVAL_TICKS,
  FIXED_DT,
  MAGAZINE_SIZE,
  PLAYER_KIND,
  PROJECTILE_KIND,
  PROJECTILE_MAX_RANGE_M,
  PROJECTILE_MUZZLE_OFFSET_M,
  PROJECTILE_SPEED_MPS,
  RELOAD_DURATION_TICKS,
  RESERVE_AMMO_START,
  RIFLE_DAMAGE_PER_HIT,
  SECURITY_CREW_KIND,
} from '../config.js';
import { tripAlarm } from '../ai/alarm.js';
import type { CollisionWorld } from '../deck/collision.js';
import { computeSpawnPoint } from '../deck/spawn.js';
import type { DeckGraph } from '../deck/types.js';
import type { EntityId, SimState } from '../sim/types.js';
import { getEntity, setEntityPose, setEntityYaw, spawnEntity } from '../sim/world.js';
import { applyDamage } from './applyDamage.js';
import { earliestSegmentHit } from './projectileCollision.js';
import { sampleSpreadYawOffset } from './spread.js';
import type { CombatEvent } from './types.js';

export function tryBeginReload(state: SimState): void {
  const meta = state.meta;
  if (meta.reloadTicksRemaining > 0) return;
  if (meta.reserve <= 0) return;
  if (meta.magazine >= MAGAZINE_SIZE) return;
  meta.reloadTicksRemaining = RELOAD_DURATION_TICKS;
}

export function integrateCombat(
  state: SimState,
  collisionWorld: CollisionWorld,
  graph: DeckGraph,
): CombatEvent[] {
  const events: CombatEvent[] = [];
  const meta = state.meta;
  const playerId = meta.playerId;
  const traveled = state.projectileTraveledM;

  if (playerId !== null) {
    const player = getEntity(state, playerId);
    if (player && !player.alive && meta.respawnTicksRemaining > 0) {
      meta.respawnTicksRemaining -= 1;
      if (meta.respawnTicksRemaining === 0) {
        const spawn = computeSpawnPoint(graph, 'port-airlock');
        setEntityPose(state, playerId, spawn.x, 0, spawn.z);
        setEntityYaw(state, playerId, spawn.yaw);
        player.alive = true;
        player.hp = ACTOR_MAX_HP;
        player.moveIntentX = 0;
        player.moveIntentZ = 0;
        meta.magazine = MAGAZINE_SIZE;
        meta.reserve = RESERVE_AMMO_START;
        meta.reloadTicksRemaining = 0;
        meta.fireCooldownTicks = 0;
        meta.fireHeld = false;
      }
    }
  }

  const reloadingAtTickStart = meta.reloadTicksRemaining > 0;

  if (meta.reloadTicksRemaining > 0) {
    meta.reloadTicksRemaining -= 1;
    if (meta.reloadTicksRemaining === 0) {
      const moved = Math.min(MAGAZINE_SIZE - meta.magazine, meta.reserve);
      meta.magazine += moved;
      meta.reserve -= moved;
    }
  }

  if (
    meta.fireHeld &&
    meta.magazine === 0 &&
    meta.reserve > 0 &&
    !reloadingAtTickStart &&
    meta.reloadTicksRemaining === 0
  ) {
    tryBeginReload(state);
  }

  const player = playerId !== null ? getEntity(state, playerId) : undefined;
  const playerAlive = player?.alive ?? false;
  const reloadBlocksFire = reloadingAtTickStart;

  if (meta.fireCooldownTicks > 0) {
    meta.fireCooldownTicks -= 1;
  }

  if (playerAlive && meta.fireHeld && !reloadBlocksFire && meta.magazine > 0 && meta.fireCooldownTicks === 0) {
    const dirX = Math.sin(player!.yaw);
    const dirZ = Math.cos(player!.yaw);
    const mx = player!.x + dirX * PROJECTILE_MUZZLE_OFFSET_M;
    const mz = player!.z + dirZ * PROJECTILE_MUZZLE_OFFSET_M;
    const projId = spawnEntity(state, PROJECTILE_KIND, mx, 0, mz);
    const proj = getEntity(state, projId)!;
    proj.yaw = player!.yaw;
    proj.ownerId = playerId;
    proj.hp = 0;
    proj.alive = true;
    traveled.set(projId, 0);
    meta.magazine -= 1;
    meta.fireCooldownTicks = FIRE_INTERVAL_TICKS;
    tripAlarm(state, 'player-shot');
    events.push({ type: 'muzzle', x: mx, y: 0, z: mz, yaw: player!.yaw, ownerKind: PLAYER_KIND });
  }

  for (const id of meta.crewIds) {
    const entity = getEntity(state, id);
    const ai = state.crewAi.get(id);
    if (!entity?.alive || !ai || ai.fsm !== 'ATTACK') continue;
    if (ai.windupTicksRemaining > 0 || ai.fireCooldownTicks > 0) continue;

    const spread = sampleSpreadYawOffset(state.tick, id, ai.shotIndex);
    const yaw = entity.yaw + spread;
    const dirX = Math.sin(yaw);
    const dirZ = Math.cos(yaw);
    const mx = entity.x + dirX * PROJECTILE_MUZZLE_OFFSET_M;
    const mz = entity.z + dirZ * PROJECTILE_MUZZLE_OFFSET_M;
    const projId = spawnEntity(state, PROJECTILE_KIND, mx, 0, mz);
    const proj = getEntity(state, projId)!;
    proj.yaw = yaw;
    proj.ownerId = id;
    proj.hp = 0;
    proj.alive = true;
    traveled.set(projId, 0);
    ai.shotIndex += 1;
    ai.fireCooldownTicks = CREW_FIRE_INTERVAL_TICKS;
    state.crewAi.set(id, ai);
    events.push({ type: 'muzzle', x: mx, y: 0, z: mz, yaw, ownerKind: SECURITY_CREW_KIND });
  }

  const stepDist = PROJECTILE_SPEED_MPS * FIXED_DT;
  const toRemove: EntityId[] = [];

  for (const [id, entity] of state.entities) {
    if (entity.kind !== PROJECTILE_KIND || !entity.alive) continue;

    const prevX = entity.x;
    const prevZ = entity.z;
    const dirX = Math.sin(entity.yaw);
    const dirZ = Math.cos(entity.yaw);
    const nextX = prevX + dirX * stepDist;
    const nextZ = prevZ + dirZ * stepDist;

    let dist = (traveled.get(id) ?? 0) + stepDist;
    traveled.set(id, dist);

    const hit = earliestSegmentHit(
      state,
      prevX,
      prevZ,
      nextX,
      nextZ,
      entity.ownerId ?? (0 as EntityId),
      collisionWorld,
    );

    if (hit) {
      if (hit.kind === 'wall') {
        events.push({ type: 'impact-wall', x: hit.x, y: 0, z: hit.z });
      } else if (hit.targetId !== undefined) {
        const owner = entity.ownerId ? getEntity(state, entity.ownerId) : undefined;
        const amount =
          owner?.kind === SECURITY_CREW_KIND ? CREW_SIDEARM_DAMAGE : RIFLE_DAMAGE_PER_HIT;
        applyDamage(state, hit.targetId, amount);
        events.push({
          type: 'impact-actor',
          x: hit.x,
          y: 0,
          z: hit.z,
          targetId: hit.targetId,
        });
        events.push({ type: 'hit-flash', targetId: hit.targetId });
      }
      toRemove.push(id);
      traveled.delete(id);
      continue;
    }

    if (dist >= PROJECTILE_MAX_RANGE_M) {
      toRemove.push(id);
      traveled.delete(id);
      continue;
    }

    entity.x = nextX;
    entity.z = nextZ;
  }

  for (const id of toRemove) {
    state.entities.delete(id);
  }

  return events;
}

export function isActorKind(kind: string): boolean {
  return kind === PLAYER_KIND || kind === SECURITY_CREW_KIND;
}
