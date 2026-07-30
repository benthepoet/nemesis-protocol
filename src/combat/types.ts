export type CombatEvent =
  | { type: 'muzzle'; x: number; y: number; z: number; yaw: number; ownerKind?: string }
  | { type: 'impact-wall'; x: number; y: number; z: number }
  | { type: 'impact-actor'; x: number; y: number; z: number; targetId: import('../sim/types.js').EntityId }
  | { type: 'hit-flash'; targetId: import('../sim/types.js').EntityId };
