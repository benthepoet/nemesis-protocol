import { describe, expect, it } from 'vitest';
import { PLAYER_KIND, SECURITY_CREW_KIND } from '../../src/config.js';
import {
  createCombatCueCounters,
  pushCombatEventsToAudio,
} from '../../src/audio/combatCues.js';

describe('combatCues (G2–G4, R3)', () => {
  it('maps muzzle events to rifle vs sidearm in ACTIVE only', () => {
    const plays: string[] = [];
    const play = (req: { cueId: string }) => plays.push(req.cueId);
    let c = createCombatCueCounters();
    c = pushCombatEventsToAudio(
      [
        { type: 'muzzle', x: 1, y: 0, z: 2, yaw: 0, ownerKind: PLAYER_KIND },
        { type: 'muzzle', x: 3, y: 0, z: 4, yaw: 0, ownerKind: SECURITY_CREW_KIND },
      ],
      'ACTIVE',
      c,
      play,
    );
    expect(plays[0]).toMatch(/p1_sfx_rifle_fire/);
    expect(plays[1]).toMatch(/p1_sfx_sidearm_fire/);
    expect(c.rifle).toBe(1);
    expect(c.sidearm).toBe(1);
  });

  it('silences hit-flash and ignores non-ACTIVE', () => {
    const plays: string[] = [];
    const play = (req: { cueId: string }) => plays.push(req.cueId);
    pushCombatEventsToAudio(
      [
        { type: 'hit-flash', targetId: 1 as import('../../src/sim/types.js').EntityId },
        { type: 'impact-wall', x: 0, y: 0, z: 0 },
      ],
      'BRIEFING',
      createCombatCueCounters(),
      play,
    );
    expect(plays).toHaveLength(0);
  });

  it('plays wall and actor impacts once each', () => {
    const plays: string[] = [];
    const play = (req: { cueId: string }) => plays.push(req.cueId);
    pushCombatEventsToAudio(
      [
        { type: 'impact-wall', x: 0, y: 0, z: 0 },
        { type: 'impact-actor', x: 1, y: 0, z: 1, targetId: 2 as import('../../src/sim/types.js').EntityId },
        { type: 'hit-flash', targetId: 2 as import('../../src/sim/types.js').EntityId },
      ],
      'ACTIVE',
      createCombatCueCounters(),
      play,
    );
    expect(plays).toHaveLength(2);
    expect(plays[0]).toMatch(/impact_wall/);
    expect(plays[1]).toMatch(/impact_actor/);
  });
});
