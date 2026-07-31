import { ASSET_BASE_URL } from '../config.js';
import { ALL_SHIPPED_CUE_IDS, type ShippedCueId } from './cueIds.js';

const audioBase = `${ASSET_BASE_URL}/audio`;

export function audioUrlForCue(cueId: ShippedCueId): string {
  return `${audioBase}/${cueId}.ogg`;
}

export const AUDIO_CUE_URLS: Record<ShippedCueId, string> = Object.fromEntries(
  ALL_SHIPPED_CUE_IDS.map((id) => [id, audioUrlForCue(id)]),
) as Record<ShippedCueId, string>;
