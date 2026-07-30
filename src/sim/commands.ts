/** Closed set for this feature: scaffold verbs + move/aim axes. */
export type ActionId = 'interact' | 'cancel' | 'move' | 'aim';

/**
 * Sim-facing command. NO device provenance field (Q3).
 * - interact/cancel: value 0|1; axis fields omitted
 * - move/aim: axisX/axisZ in [-1, 1]; value unused (set 0)
 */
export interface InputCommand {
  tick: number;
  sequence: number;
  action: ActionId;
  value: 0 | 1;
  axisX?: number;
  axisZ?: number;
}

function axisEqual(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return a === b;
}

/** G5 parity: deep equality of the entire command object (Q3). */
export function commandsEqualForParity(a: InputCommand, b: InputCommand): boolean {
  return (
    a.tick === b.tick &&
    a.sequence === b.sequence &&
    a.action === b.action &&
    a.value === b.value &&
    axisEqual(a.axisX, b.axisX) &&
    axisEqual(a.axisZ, b.axisZ)
  );
}
