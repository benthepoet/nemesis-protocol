import * as THREE from 'three';
import { HERO_MATERIAL_MODE, SHADOW_CASTING_DIRECTIONAL_MAX } from '../config.js';

export type HeroMaterialMode = 'basic' | 'pbr';

const URL_PARAM = 'heroMaterial';

let activeMode: HeroMaterialMode | null = null;

/** WebGL2 minimum; heroes need headroom with capped shadow directionals (S1). */
const MIN_TEXTURE_UNITS_FOR_HERO_PBR = 32;

function readUrlOverride(searchParams?: URLSearchParams): HeroMaterialMode | null {
  if (typeof window === 'undefined' && !searchParams) return null;
  const params = searchParams ?? new URLSearchParams(window.location.search);
  const raw = params.get(URL_PARAM)?.trim().toLowerCase();
  if (raw === 'basic' || raw === 'pbr') return raw;
  return null;
}

function readEnvOverride(): HeroMaterialMode | null {
  const raw = import.meta.env.VITE_HERO_MATERIAL_MODE as string | undefined;
  if (raw === 'basic' || raw === 'pbr') return raw;
  return null;
}

/**
 * Resolve staged hero shading (R15). Default follows `HERO_MATERIAL_MODE`; when `pbr`, TU budget must allow.
 * URL `?heroMaterial=basic|pbr` or `VITE_HERO_MATERIAL_MODE` override for debug.
 */
export function resolveHeroMaterialMode(options?: {
  searchParams?: URLSearchParams;
  maxTextureImageUnits?: number;
}): HeroMaterialMode {
  const urlMode = readUrlOverride(options?.searchParams);
  if (urlMode) return urlMode;

  const envMode = readEnvOverride();
  if (envMode) return envMode;

  if (HERO_MATERIAL_MODE === 'basic') return 'basic';

  const maxTu =
    options?.maxTextureImageUnits ??
    (typeof window !== 'undefined' ? readMaxTextureUnitsFromCanvas() : MIN_TEXTURE_UNITS_FOR_HERO_PBR);

  if (maxTu < MIN_TEXTURE_UNITS_FOR_HERO_PBR) return 'basic';
  if (SHADOW_CASTING_DIRECTIONAL_MAX > 2) return 'basic';
  return 'pbr';
}

function readMaxTextureUnitsFromCanvas(): number {
  if (import.meta.env.VITEST) return MIN_TEXTURE_UNITS_FOR_HERO_PBR;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return MIN_TEXTURE_UNITS_FOR_HERO_PBR;
    return gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number;
  } catch {
    return MIN_TEXTURE_UNITS_FOR_HERO_PBR;
  }
}

export function initHeroMaterialMode(mode: HeroMaterialMode): void {
  activeMode = mode;
}

export function getHeroMaterialMode(): HeroMaterialMode {
  if (activeMode !== null) return activeMode;
  return resolveHeroMaterialMode();
}

/** Reset for unit tests. */
export function resetHeroMaterialModeForTests(): void {
  activeMode = null;
}

export function setHeroMaterialModeDevMarker(mode: HeroMaterialMode): void {
  if (typeof document === 'undefined' || !import.meta.env.DEV) return;
  document.body.dataset.nemesisHeroTune = mode === 'pbr' ? 'pbr' : '4';
}

/**
 * Compile hero actor roots only; returns true if WebGL logs TU overflow for those meshes.
 */
export function heroActorShadersExceedTextureUnitLimit(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  actorRoots: readonly THREE.Object3D[],
): boolean {
  const captured: string[] = [];
  const prev = console.error;
  console.error = (...args: unknown[]) => {
    captured.push(args.map(String).join(' '));
    prev.apply(console, args as Parameters<typeof console.error>);
  };
  try {
    for (const root of actorRoots) {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
          renderer.compile(obj, camera, scene);
        }
      });
    }
  } finally {
    console.error = prev;
  }
  return captured.some((line) => line.includes('MAX_TEXTURE_IMAGE_UNITS'));
}

/**
 * Compile hero meshes after PBR + shadow-capped lighting; returns true if WebGL reports TU overflow.
 */
export function heroShadersExceedTextureUnitLimit(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): boolean {
  const captured: string[] = [];
  const prev = console.error;
  console.error = (...args: unknown[]) => {
    captured.push(args.map(String).join(' '));
    prev.apply(console, args as Parameters<typeof console.error>);
  };
  try {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
        renderer.compile(obj, camera, scene);
      }
    });
  } finally {
    console.error = prev;
  }
  return captured.some((line) => line.includes('MAX_TEXTURE_IMAGE_UNITS'));
}
