/** Data-driven alarm ladder labels (AL2+ forward-compat at P1). */
export const ALARM_LEVEL_LABELS: Readonly<Record<number, string>> = {
  0: 'UNAWARE',
  1: 'ALERTED',
  2: 'HARDENED',
  3: 'SIEGE',
  4: 'MELTDOWN',
};
