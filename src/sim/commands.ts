/** Closed set for this feature (Q1). Nothing else. */
export type ActionId = 'interact' | 'cancel';

/**
 * Sim-facing command. NO device provenance field (Q3).
 */
export interface InputCommand {
  tick: number;
  sequence: number;
  action: ActionId;
  value: 0 | 1;
}

/** G5 parity: deep equality of the entire command object (Q3). */
export function commandsEqualForParity(a: InputCommand, b: InputCommand): boolean {
  return (
    a.tick === b.tick &&
    a.sequence === b.sequence &&
    a.action === b.action &&
    a.value === b.value
  );
}
