import type { Entity } from './types.js';
import type { SimState } from './types.js';

function serializeEntity(entity: Entity): Record<string, unknown> {
  return {
    alive: entity.alive,
    id: entity.id,
    kind: entity.kind,
    x: entity.x,
    y: entity.y,
    z: entity.z,
  };
}

function buildHashPayload(state: SimState): string {
  const entities = [...state.entities.values()]
    .sort((a, b) => a.id - b.id)
    .map(serializeEntity);

  const payload = {
    entities,
    meta: {
      cancelCount: state.meta.cancelCount,
      cancelHeld: state.meta.cancelHeld,
      interactCount: state.meta.interactCount,
      interactHeld: state.meta.interactHeld,
      lastAction: state.meta.lastAction,
    },
    nextEntityId: state.nextEntityId,
    tick: state.tick,
  };

  return JSON.stringify(payload);
}

async function sha256Hex(data: string): Promise<string> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto subtle digest unavailable');
  }
  const encoded = new TextEncoder().encode(data);
  const digest = await cryptoObj.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashSimState(state: SimState): Promise<string> {
  return sha256Hex(buildHashPayload(state));
}

export { buildHashPayload as buildHashPayloadForTests };
