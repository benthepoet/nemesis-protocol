import { RIFLE_DAMAGE_PER_HIT, SECURITY_CREW_KIND } from '../config.js';
import { tripAlarm } from '../ai/alarm.js';
import type { EntityId, SimState } from '../sim/types.js';
import { getEntity } from '../sim/world.js';

export function applyDamage(state: SimState, targetId: EntityId, amount: number): void {
  const entity = getEntity(state, targetId);
  if (!entity || !entity.alive) return;

  const prevHp = entity.hp;
  entity.hp = Math.max(0, entity.hp - amount);
  if (entity.kind === SECURITY_CREW_KIND && amount > 0 && entity.hp < prevHp) {
    tripAlarm(state, 'crew-damage');
  }
  if (entity.hp === 0 && prevHp > 0) {
    entity.alive = false;
    if (state.meta.playerId === targetId) {
      state.meta.fireHeld = false;
    }
  }
}

export { RIFLE_DAMAGE_PER_HIT };
