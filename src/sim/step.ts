import type { InputCommand } from './commands.js';
import type { SimState } from './types.js';
import { applyDamage, RIFLE_DAMAGE_PER_HIT } from '../combat/applyDamage.js';
import { tryBeginReload } from '../combat/integrateCombat.js';
import { getEntity } from './world.js';

function playerCombatInputBlocked(state: SimState): boolean {
  const playerId = state.meta.playerId;
  if (playerId === null) return false;
  const entity = getEntity(state, playerId);
  return !entity || !entity.alive;
}

export function applyCommands(state: SimState, commands: readonly InputCommand[]): void {
  const sorted = [...commands].sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.sequence - b.sequence;
  });

  const playerId = state.meta.playerId;
  const combatBlocked = playerCombatInputBlocked(state);

  for (const cmd of sorted) {
    if (cmd.tick !== state.tick) {
      continue;
    }
    if (cmd.action === 'move' && playerId !== null && !combatBlocked) {
      const entity = getEntity(state, playerId);
      if (entity) {
        entity.moveIntentX = cmd.axisX ?? 0;
        entity.moveIntentZ = cmd.axisZ ?? 0;
      }
    } else if (cmd.action === 'aim' && playerId !== null && !combatBlocked) {
      const entity = getEntity(state, playerId);
      const ax = cmd.axisX ?? 0;
      const az = cmd.axisZ ?? 0;
      if (entity && Math.hypot(ax, az) > 0) {
        entity.yaw = Math.atan2(ax, az);
      }
    } else if (cmd.action === 'fire') {
      if (combatBlocked) continue;
      if (cmd.value === 1) {
        state.meta.fireHeld = true;
        state.meta.lastAction = 'fire';
      } else {
        state.meta.fireHeld = false;
      }
    } else if (cmd.action === 'reload') {
      if (combatBlocked) continue;
      if (cmd.value === 1) {
        tryBeginReload(state);
        state.meta.lastAction = 'reload';
      }
    } else if (cmd.action === 'debugDamage') {
      if (cmd.value !== 1) continue;
      if (!import.meta.env.DEV) continue;
      if (playerId === null) continue;
      const entity = getEntity(state, playerId);
      if (!entity || !entity.alive) continue;
      applyDamage(state, playerId, RIFLE_DAMAGE_PER_HIT);
    } else if (cmd.action === 'interact') {
      if (combatBlocked) continue;
      if (cmd.value === 1) {
        state.meta.interactCount += 1;
        state.meta.lastAction = 'interact';
        state.meta.interactHeld = true;
        if (import.meta.env.DEV) {
          console.debug('[interact]', { tick: state.tick, value: 1 });
        }
      } else {
        state.meta.interactHeld = false;
      }
    } else if (cmd.action === 'cancel') {
      if (combatBlocked) continue;
      if (cmd.value === 1) {
        state.meta.cancelCount += 1;
        state.meta.lastAction = 'cancel';
        state.meta.cancelHeld = true;
      } else {
        state.meta.cancelHeld = false;
      }
    }
  }
}

export function fixedStep(state: SimState): void {
  state.tick += 1;
}
