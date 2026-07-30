import { describe, expect, it } from 'vitest';
import {
  AIM_ASSIST_HALF_ANGLE_DEG,
  AIM_ASSIST_MAGNETISM,
  AIM_ASSIST_RANGE_M,
  SECURITY_CREW_KIND,
} from '../../src/config.js';
import { hasLineOfSight } from '../../src/ai/perception.js';
import { footprintCenter } from '../../src/deck/spawn.js';
import { getNode } from '../../src/deck/graph.js';
import { applyDamage } from '../../src/combat/applyDamage.js';
import {
  assistedYawFromStick,
  normalizeAngle,
  selectAimAssistTarget,
} from '../../src/sim/aimAssist.js';
import { applyCommands } from '../../src/sim/step.js';
import { getEntity } from '../../src/sim/world.js';
import {
  createCombatTestHarness,
  fireHeldOn,
  runTicks,
} from '../helpers/combatTestUtils.js';
import type { InputCommand } from '../../src/sim/commands.js';

const DEG = Math.PI / 180;

function stickFromYaw(yaw: number): { axisX: number; axisZ: number } {
  return { axisX: Math.sin(yaw), axisZ: Math.cos(yaw) };
}

describe('aim assist (G1, G2, G4)', () => {
  it('E1: magnetism error sequence 5° → 3.25° → 2.1125°', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const targetYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    const { axisX, axisZ } = stickFromYaw(targetYaw);
    let currentYaw = targetYaw - 5 * DEG;
    let errorDeg = 5;
    for (let i = 0; i < 3; i += 1) {
      currentYaw = assistedYawFromStick(
        harness.state,
        harness.collisionWorld,
        player.x,
        player.z,
        currentYaw,
        axisX,
        axisZ,
      );
      const err = Math.abs(normalizeAngle(targetYaw - currentYaw)) / DEG;
      expect(err).toBeCloseTo(errorDeg * (1 - AIM_ASSIST_MAGNETISM) ** (i + 1), 4);
    }
  });

  it('E2/E3: exactly 10° in cone assisted; 10.1° bit-exact raw', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const targetYaw = Math.atan2(crew.x - player.x, crew.z - player.z);

    const rawIn = targetYaw - (AIM_ASSIST_HALF_ANGLE_DEG - 0.05) * DEG;
    const { axisX: axIn, axisZ: azIn } = stickFromYaw(rawIn);
    const assisted = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      rawIn,
      axIn,
      azIn,
    );
    expect(selectAimAssistTarget(harness.state, harness.collisionWorld, player.x, player.z, rawIn)).not.toBe(
      null,
    );
    expect(assisted).not.toBeCloseTo(rawIn, 8);

    const raw101 = targetYaw - (AIM_ASSIST_HALF_ANGLE_DEG + 0.1) * DEG;
    const { axisX: ax101, axisZ: az101 } = stickFromYaw(raw101);
    const rawOnly = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      raw101,
      ax101,
      az101,
    );
    expect(rawOnly).toBe(raw101);
  });

  it('E4: no living crew → raw yaw', () => {
    const harness = createCombatTestHarness();
    for (const id of harness.state.meta.crewIds) {
      const e = getEntity(harness.state, id)!;
      e.alive = false;
      e.hp = 0;
    }
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const rawYaw = 0.42;
    const { axisX, axisZ } = stickFromYaw(rawYaw);
    expect(
      assistedYawFromStick(
        harness.state,
        harness.collisionWorld,
        player.x,
        player.z,
        0,
        axisX,
        axisZ,
      ),
    ).toBe(rawYaw);
  });

  it('E5/E6: nearest angle then distance tie-break', () => {
    const harness = createCombatTestHarness();
    const c0 = harness.state.meta.crewIds[0]!;
    const c1 = harness.state.meta.crewIds[1]!;
    const crew0 = getEntity(harness.state, c0)!;
    const crew1 = getEntity(harness.state, c1)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = 0;
    player.z = 0;
    crew0.x = 8;
    crew0.z = 0;
    crew1.x = 10;
    crew1.z = 0;
    const rawYaw = Math.atan2(8, 0) - 3 * DEG;
    expect(selectAimAssistTarget(harness.state, harness.collisionWorld, 0, 0, rawYaw)).toBe(c0);

    crew0.x = 12;
    crew0.z = 0;
    crew1.x = 8;
    crew1.z = 0;
    const raw2 = Math.atan2(8, 0) - 4 * DEG;
    expect(selectAimAssistTarget(harness.state, harness.collisionWorld, 0, 0, raw2)).toBe(c1);
  });

  it('E7: wall occludes → no assist', () => {
    const harness = createCombatTestHarness();
    const wall = harness.graph.wallSegments.find((w) => w.id === 'wall-a-cargo-armory')!;
    const roomCenter = footprintCenter(getNode(harness.graph, 'cargo-hold'));
    const wcx = wall.rect.x + wall.rect.w / 2;
    const wcz = wall.rect.z + wall.rect.h / 2;
    const dx = wcx - roomCenter.x;
    const dz = wcz - roomCenter.z;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    crew.x = wcx - ux * 2;
    crew.z = wcz - uz * 2;
    player.x = wcx + ux * 3;
    player.z = wcz + uz * 3;
    const rawYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    expect(hasLineOfSight(harness.collisionWorld, player.x, player.z, crew.x, crew.z)).toBe(false);
    const { axisX, axisZ } = stickFromYaw(rawYaw);
    expect(
      assistedYawFromStick(
        harness.state,
        harness.collisionWorld,
        player.x,
        player.z,
        rawYaw,
        axisX,
        axisZ,
      ),
    ).toBe(rawYaw);
  });

  it('E8: crew at 61 m → no assist', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = 0;
    player.z = 0;
    crew.x = AIM_ASSIST_RANGE_M + 1;
    crew.z = 0;
    const rawYaw = 0;
    const { axisX, axisZ } = stickFromYaw(rawYaw);
    expect(
      assistedYawFromStick(
        harness.state,
        harness.collisionWorld,
        player.x,
        player.z,
        rawYaw,
        axisX,
        axisZ,
      ),
    ).toBe(rawYaw);
  });

  it('E9: target dies mid-hold → raw or retarget without NaN', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const targetYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    const { axisX, axisZ } = stickFromYaw(targetYaw - 2 * DEG);
    applyDamage(harness.state, crewId, crew.hp);
    const yaw = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      player.yaw,
      axisX,
      axisZ,
    );
    expect(Number.isFinite(yaw)).toBe(true);
  });

  it('E11: 45° off target → zero pull (raw tracking)', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const targetYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    const rawYaw = targetYaw - 45 * DEG;
    const { axisX, axisZ } = stickFromYaw(rawYaw);
    expect(
      assistedYawFromStick(
        harness.state,
        harness.collisionWorld,
        player.x,
        player.z,
        0,
        axisX,
        axisZ,
      ),
    ).toBe(rawYaw);
  });

  it('E12: neutral stick → sticky (no aim cmd, no drift)', () => {
    const harness = createCombatTestHarness();
    const playerId = harness.state.meta.playerId!;
    const yaw0 = getEntity(harness.state, playerId)!.yaw;
    runTicks(harness, 5);
    expect(getEntity(harness.state, playerId)!.yaw).toBe(yaw0);
  });

  it('E13: sweep through cone — blend in cone, raw outside, no hysteresis', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const targetYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    const inside = targetYaw - 5 * DEG;
    const { axisX: ai, axisZ: az } = stickFromYaw(inside);
    const yIn = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      inside,
      ai,
      az,
    );
    expect(yIn).not.toBe(inside);
    const outside = targetYaw - 20 * DEG;
    const { axisX: ao, axisZ: azo } = stickFromYaw(outside);
    const yOut = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      yIn,
      ao,
      azo,
    );
    expect(yOut).toBe(outside);
  });

  it('E10: aimAssist false with crew in-cone → atan2 only', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const playerId = harness.state.meta.playerId!;
    const player = getEntity(harness.state, playerId)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const rawYaw = Math.atan2(crew.x - player.x, crew.z - player.z) - 3 * DEG;
    const { axisX, axisZ } = stickFromYaw(rawYaw);
    applyCommands(
      harness.state,
      [{ tick: harness.state.tick, sequence: 0, action: 'aim', value: 0, axisX, axisZ }],
      { collisionWorld: harness.collisionWorld, aimAssist: false },
    );
    expect(getEntity(harness.state, playerId)!.yaw).toBe(rawYaw);
  });

  it('assist identical with fireHeld true or false', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[2]!;
    const crew = getEntity(harness.state, crewId)!;
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    player.x = crew.x - 4;
    player.z = crew.z;
    const targetYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    const { axisX, axisZ } = stickFromYaw(targetYaw - 4 * DEG);
    const y0 = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      0,
      axisX,
      axisZ,
    );
    harness.state.meta.fireHeld = true;
    const y1 = assistedYawFromStick(
      harness.state,
      harness.collisionWorld,
      player.x,
      player.z,
      0,
      axisX,
      axisZ,
    );
    expect(y1).toBe(y0);
    const cmds = new Map<number, InputCommand[]>([[harness.state.tick, [fireHeldOn(harness.state.tick, 0)]]]);
    runTicks(harness, 1, cmds, { aimAssist: true });
    expect(harness.state.meta.fireHeld).toBe(true);
  });

  it('only SECURITY_CREW_KIND entities are eligible', () => {
    const harness = createCombatTestHarness();
    const crewId = harness.state.meta.crewIds[0]!;
    const crew = getEntity(harness.state, crewId)!;
    crew.kind = 'other';
    const player = getEntity(harness.state, harness.state.meta.playerId!)!;
    const rawYaw = Math.atan2(crew.x - player.x, crew.z - player.z);
    expect(selectAimAssistTarget(harness.state, harness.collisionWorld, player.x, player.z, rawYaw)).toBe(
      null,
    );
    crew.kind = SECURITY_CREW_KIND;
  });
});

describe('aim assist module purity (G8)', () => {
  it('no Math.random / performance.now in aimAssist.ts', () => {
    const modules = import.meta.glob('../../src/sim/aimAssist.ts', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    for (const text of Object.values(modules)) {
      expect(text).not.toMatch(/Math\.random/);
      expect(text).not.toMatch(/performance\.now/);
    }
  });
});
