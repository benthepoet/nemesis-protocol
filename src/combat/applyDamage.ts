import { RESPAWN_DELAY_TICKS, RIFLE_DAMAGE_PER_HIT } from '../config.js';
import type { EntityId, SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';

export function applyDamage(state: SimState, targetId: EntityId, amount: number): void {
  const entity = getEntity(state, targetId);
  if (!entity || !entity.alive) return;

  const prevHp = entity.hp;
  entity.hp = Math.max(0, entity.hp - amount);
  if (entity.hp === 0 && prevHp > 0) {
    entity.alive = false;
    if (state.meta.playerId === targetId) {
      state.meta.respawnTicksRemaining = RESPAWN_DELAY_TICKS;
      state.meta.fireHeld = false;
    }
  }
}

export { RIFLE_DAMAGE_PER_HIT };
