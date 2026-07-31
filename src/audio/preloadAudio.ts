import { ALL_SHIPPED_CUE_IDS, type ShippedCueId } from './cueIds.js';
import { AUDIO_CUE_URLS } from './urls.js';
import type { AudioBufferMap } from './types.js';

const warnedMissing = new Set<string>();

export async function preloadAudioAssets(
  audioContext: AudioContext,
): Promise<AudioBufferMap> {
  const map: AudioBufferMap = {};
  await Promise.all(
    ALL_SHIPPED_CUE_IDS.map(async (cueId) => {
      const url = AUDIO_CUE_URLS[cueId];
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.arrayBuffer();
        map[cueId] = await audioContext.decodeAudioData(data.slice(0));
      } catch (err) {
        if (!warnedMissing.has(cueId)) {
          warnedMissing.add(cueId);
          console.warn(`[nemesis] audio preload failed for ${cueId}:`, err);
        }
      }
    }),
  );
  return map;
}

export function getBufferForCue(map: AudioBufferMap, cueId: ShippedCueId): AudioBuffer | undefined {
  return map[cueId];
}
