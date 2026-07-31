import { describe, expect, it } from 'vitest';
import { detectShellAudioCues } from '../../src/audio/shellCues.js';

describe('shellCues (G5, R4)', () => {
  it('fires focus, confirm, score, and restart cues on edges', () => {
    const plays: string[] = [];
    const play = (id: string) => plays.push(id);
    detectShellAudioCues(
      { missionPhase: 'BRIEFING', breachSelectIndex: 0 },
      { missionPhase: 'BRIEFING', breachSelectIndex: 1 },
      play,
    );
    detectShellAudioCues(
      { missionPhase: 'BRIEFING', breachSelectIndex: 1 },
      { missionPhase: 'INSERTION', breachSelectIndex: 1 },
      play,
    );
    detectShellAudioCues(
      { missionPhase: 'ACTIVE', breachSelectIndex: 1 },
      { missionPhase: 'SCORE', breachSelectIndex: 1 },
      play,
    );
    detectShellAudioCues(
      { missionPhase: 'SCORE', breachSelectIndex: 1 },
      { missionPhase: 'BRIEFING', breachSelectIndex: 0 },
      play,
    );
    expect(plays).toEqual([
      'p1_sfx_ui_focus_01',
      'p1_sfx_ui_confirm_01',
      'p1_sfx_ui_score_appear_01',
      'p1_sfx_ui_confirm_01',
    ]);
  });
});
