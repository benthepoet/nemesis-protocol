import { describe, expect, it } from 'vitest';
import { ALARM_BED_CROSSFADE_SEC } from '../../src/config.js';
import {
  createAmbientBedLogicState,
  syncAmbientBedAlarmLevel,
  tickAmbientBedCrossfade,
} from '../../src/audio/ambientBed.js';

describe('ambientBed (G6, R2)', () => {
  it('starts crossfade on AL0→AL1 and finishes at 1.5s', () => {
    let state = createAmbientBedLogicState();
    state = syncAmbientBedAlarmLevel(state, 1);
    expect(state.crossfading).toBe(true);
    const dt = ALARM_BED_CROSSFADE_SEC / 30;
    let calm = 1;
    let alert = 0;
    for (let i = 0; i < 30; i++) {
      const tick = tickAmbientBedCrossfade(state, dt);
      state = tick.state;
      calm = tick.calmGain;
      alert = tick.alertGain;
    }
    expect(state.crossfading).toBe(false);
    expect(calm).toBeLessThan(0.05);
    expect(alert).toBeGreaterThan(0.95);
  });

  it('does not de-escalate while alarm stays AL1', () => {
    let state = syncAmbientBedAlarmLevel(createAmbientBedLogicState(), 1);
    for (let i = 0; i < 5; i++) {
      state = tickAmbientBedCrossfade(state, ALARM_BED_CROSSFADE_SEC).state;
    }
    const after = tickAmbientBedCrossfade(state, 0.016);
    expect(after.calmGain).toBe(0);
    expect(after.alertGain).toBe(1);
  });

  it('restart resets to calm layer', () => {
    let state = syncAmbientBedAlarmLevel(createAmbientBedLogicState(), 1);
    state = tickAmbientBedCrossfade(state, ALARM_BED_CROSSFADE_SEC).state;
    state = syncAmbientBedAlarmLevel(state, 0);
    const gains = tickAmbientBedCrossfade(state, 0);
    expect(gains.calmGain).toBe(1);
    expect(gains.alertGain).toBe(0);
    expect(gains.state.crossfading).toBe(false);
  });
});
