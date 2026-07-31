import type { MissionPhase } from '../mission/types.js';
import { UI_CONFIRM_CUE, UI_FOCUS_CUE, UI_SCORE_APPEAR_CUE, type ShippedCueId } from './cueIds.js';

export interface ShellAudioSnapshot {
  missionPhase: MissionPhase;
  breachSelectIndex: number;
}

export function snapshotShellAudio(meta: {
  missionPhase: MissionPhase;
  breachSelectIndex: number;
}): ShellAudioSnapshot {
  return {
    missionPhase: meta.missionPhase,
    breachSelectIndex: meta.breachSelectIndex,
  };
}

export function detectShellAudioCues(
  prev: ShellAudioSnapshot | null,
  curr: ShellAudioSnapshot,
  play: (cueId: ShippedCueId) => void,
): void {
  if (!prev) return;
  if (
    curr.missionPhase === 'BRIEFING' &&
    prev.missionPhase === 'BRIEFING' &&
    curr.breachSelectIndex !== prev.breachSelectIndex
  ) {
    play(UI_FOCUS_CUE);
  }
  if (prev.missionPhase === 'BRIEFING' && curr.missionPhase === 'INSERTION') {
    play(UI_CONFIRM_CUE);
  }
  if (prev.missionPhase !== 'SCORE' && curr.missionPhase === 'SCORE') {
    play(UI_SCORE_APPEAR_CUE);
  }
  if (prev.missionPhase === 'SCORE' && curr.missionPhase === 'BRIEFING') {
    play(UI_CONFIRM_CUE);
  }
}
