import type { CombatEvent } from '../combat/types.js';
import {
  AUDIO_MAX_DISTANCE_M,
  AUDIO_REF_DISTANCE_M,
} from '../config.js';
import { getEntity } from '../sim/world.js';
import type { SimState } from '../sim/types.js';
import {
  createAmbientBedLogicState,
  syncAmbientBedAlarmLevel,
  tickAmbientBedCrossfade,
  type AmbientBedLogicState,
} from './ambientBed.js';
import { BED_ALERT_CUE, BED_CALM_CUE, type ShippedCueId } from './cueIds.js';
import {
  createCombatCueCounters,
  pushCombatEventsToAudio,
  type CombatCueCounters,
} from './combatCues.js';
import {
  createFootstepAudioState,
  updateFootsteps,
  type FootstepAudioState,
} from './footsteps.js';
import type { AudioBufferMap, ListenerPose, PlaySpatialCue } from './types.js';
import {
  detectShellAudioCues,
  snapshotShellAudio,
  type ShellAudioSnapshot,
} from './shellCues.js';

export interface GameAudioOptions {
  buffers: AudioBufferMap;
  getListenerPose: () => ListenerPose;
  audioContext?: AudioContext;
  masterGain?: number;
}

export interface GameAudio {
  pushCombatEvents(events: readonly CombatEvent[], state: SimState): void;
  update(dtSec: number, state: SimState): void;
  unlock(): void;
  dispose(): void;
}

export function createGameAudio(options: GameAudioOptions): GameAudio {
  const ctx = options.audioContext ?? new AudioContext();
  const master = ctx.createGain();
  master.gain.value = options.masterGain ?? 1;
  master.connect(ctx.destination);

  let combatCounters: CombatCueCounters = createCombatCueCounters();
  let footstepState: FootstepAudioState = createFootstepAudioState();
  let bedLogic: AmbientBedLogicState = createAmbientBedLogicState();
  let shellPrev: ShellAudioSnapshot | null = null;
  let bedStarted = false;
  let calmGainNode: GainNode | null = null;
  let alertGainNode: GainNode | null = null;
  let calmSource: AudioBufferSourceNode | null = null;
  let alertSource: AudioBufferSourceNode | null = null;

  function playSpatial(req: Parameters<PlaySpatialCue>[0]): void {
    const buffer = options.buffers[req.cueId];
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (req.spatial) {
      const panner = ctx.createPanner();
      panner.panningModel = 'equalpower';
      panner.distanceModel = 'linear';
      panner.refDistance = AUDIO_REF_DISTANCE_M;
      panner.maxDistance = AUDIO_MAX_DISTANCE_M;
      panner.rolloffFactor = 1;
      panner.positionX.value = req.x;
      panner.positionY.value = req.y;
      panner.positionZ.value = req.z;
      source.connect(panner);
      panner.connect(master);
    } else {
      source.connect(master);
    }
    source.start();
  }

  function playUi(cueId: ShippedCueId): void {
    playSpatial({ cueId, x: 0, y: 0, z: 0, spatial: false });
  }

  function ensureBedLoops(): void {
    if (bedStarted) return;
    const calmBuf = options.buffers[BED_CALM_CUE];
    const alertBuf = options.buffers[BED_ALERT_CUE];
    if (!calmBuf || !alertBuf) return;
    calmGainNode = ctx.createGain();
    alertGainNode = ctx.createGain();
    calmGainNode.gain.value = 1;
    alertGainNode.gain.value = 0;
    calmGainNode.connect(master);
    alertGainNode.connect(master);
    calmSource = ctx.createBufferSource();
    calmSource.buffer = calmBuf;
    calmSource.loop = true;
    calmSource.connect(calmGainNode);
    alertSource = ctx.createBufferSource();
    alertSource.buffer = alertBuf;
    alertSource.loop = true;
    alertSource.connect(alertGainNode);
    calmSource.start();
    alertSource.start();
    bedStarted = true;
  }

  function applyBedGains(calm: number, alert: number): void {
    if (calmGainNode && alertGainNode) {
      calmGainNode.gain.value = calm;
      alertGainNode.gain.value = alert;
    }
  }

  function updateListener(): void {
    const pose = options.getListenerPose();
    const listener = ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = pose.x;
      listener.positionY.value = pose.y;
      listener.positionZ.value = pose.z;
      listener.forwardX.value = pose.forwardX;
      listener.forwardY.value = pose.forwardY;
      listener.forwardZ.value = pose.forwardZ;
      listener.upX.value = pose.upX;
      listener.upY.value = pose.upY;
      listener.upZ.value = pose.upZ;
    } else {
      listener.setPosition(pose.x, pose.y, pose.z);
      listener.setOrientation(
        pose.forwardX,
        pose.forwardY,
        pose.forwardZ,
        pose.upX,
        pose.upY,
        pose.upZ,
      );
    }
  }

  function unlock(): void {
    void ctx.resume().then(() => ensureBedLoops());
  }

  return {
    pushCombatEvents(events, state) {
      combatCounters = pushCombatEventsToAudio(
        events,
        state.meta.missionPhase,
        combatCounters,
        playSpatial,
      );
    },
    update(dtSec, state) {
      updateListener();
      const shellSnap = snapshotShellAudio(state.meta);
      detectShellAudioCues(shellPrev, shellSnap, playUi);
      shellPrev = shellSnap;

      bedLogic = syncAmbientBedAlarmLevel(bedLogic, state.meta.alarmLevel);
      const bedTick = tickAmbientBedCrossfade(bedLogic, dtSec);
      bedLogic = bedTick.state;
      applyBedGains(bedTick.calmGain, bedTick.alertGain);

      const playerId = state.meta.playerId;
      const player = playerId !== null ? getEntity(state, playerId) : undefined;
      footstepState = updateFootsteps(
        footstepState,
        dtSec,
        {
          missionPhase: state.meta.missionPhase,
          alive: Boolean(player?.alive && (player?.hp ?? 0) > 0),
          x: player?.x ?? 0,
          z: player?.z ?? 0,
        },
        playSpatial,
      );
    },
    unlock,
    dispose() {
      try {
        calmSource?.stop();
        alertSource?.stop();
      } catch {
        /* already stopped */
      }
      calmSource?.disconnect();
      alertSource?.disconnect();
      calmGainNode?.disconnect();
      alertGainNode?.disconnect();
      master.disconnect();
      void ctx.close();
    },
  };
}
