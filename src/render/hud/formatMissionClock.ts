import { TICK_HZ } from '../../config.js';

/** Sim tick → mission clock `M:SS` (no wall clock). */
export function formatMissionClock(ticks: number): string {
  const safe = Math.max(0, ticks);
  const totalSec = Math.floor(safe / TICK_HZ);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
