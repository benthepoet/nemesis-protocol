import { DECK_VISUAL_MODE } from '../config.js';

export type DeckVisualMode = 'blender' | 'procedural';

const URL_PARAM = 'deckVisual';

function readUrlOverride(searchParams?: URLSearchParams): DeckVisualMode | null {
  if (typeof window === 'undefined' && !searchParams) return null;
  const params = searchParams ?? new URLSearchParams(window.location.search);
  const raw = params.get(URL_PARAM)?.trim().toLowerCase();
  if (raw === 'blender' || raw === 'procedural') return raw;
  return null;
}

function readEnvOverride(): DeckVisualMode | null {
  const raw = import.meta.env.VITE_DECK_VISUAL as string | undefined;
  if (raw === 'blender' || raw === 'procedural') return raw;
  return null;
}

/**
 * Priority: URL ?deckVisual= → VITE_DECK_VISUAL → DECK_VISUAL_MODE.
 * Accepted: blender | procedural. Omit / invalid → blender (R-BM4).
 */
export function resolveDeckVisualMode(options?: {
  searchParams?: URLSearchParams;
}): DeckVisualMode {
  const urlMode = readUrlOverride(options?.searchParams);
  if (urlMode) return urlMode;

  const envMode = readEnvOverride();
  if (envMode) return envMode;

  return DECK_VISUAL_MODE === 'procedural' ? 'procedural' : 'blender';
}
