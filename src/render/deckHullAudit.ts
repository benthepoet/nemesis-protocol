import * as THREE from 'three';
import {
  INTERSTITIAL_MIN_LINEAR_LUMINANCE,
  VOID_FAMILY_CHANNEL_EPSILON,
  VOID_FAMILY_RGB,
} from '../config.js';
import type { WorldRect, WorldVec2 } from '../deck/types.js';

export function isVoidFamilyRgb(r8: number, g8: number, b8: number): boolean {
  return (
    Math.abs(r8 - VOID_FAMILY_RGB.r) <= VOID_FAMILY_CHANNEL_EPSILON &&
    Math.abs(g8 - VOID_FAMILY_RGB.g) <= VOID_FAMILY_CHANNEL_EPSILON &&
    Math.abs(b8 - VOID_FAMILY_RGB.b) <= VOID_FAMILY_CHANNEL_EPSILON
  );
}

function srgbChannelToLinear(u: number): number {
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}

function linearLuminanceFromHex(hex: string): number {
  const h = hex.replace('#', '');
  const r8 = parseInt(h.slice(0, 2), 16);
  const g8 = parseInt(h.slice(2, 4), 16);
  const b8 = parseInt(h.slice(4, 6), 16);
  const r = srgbChannelToLinear(r8 / 255);
  const g = srgbChannelToLinear(g8 / 255);
  const b = srgbChannelToLinear(b8 / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relative luminance from MeshStandardMaterial color + emissive*intensity (linear approx). */
export function materialLinearLuminance(mat: THREE.MeshStandardMaterial): number {
  const baseLum = linearLuminanceFromHex('#' + mat.color.getHexString());
  const emLum = linearLuminanceFromHex('#' + mat.emissive.getHexString()) * mat.emissiveIntensity;
  return baseLum + emLum;
}

export function interstitialMaterialMeetsLuminanceFloor(mat: THREE.MeshStandardMaterial): boolean {
  return materialLinearLuminance(mat) >= INTERSTITIAL_MIN_LINEAR_LUMINANCE;
}

/** 2D grid: cells inside deckBounds silhouette and outside all room footprints. */
export function buildInterstitialMask(
  bounds: WorldRect,
  roomPolys: { points: WorldVec2[] }[],
  cellSizeM = 0.5,
): { width: number; height: number; insideInterstitial: boolean[] } {
  const width = Math.max(1, Math.ceil(bounds.w / cellSizeM));
  const height = Math.max(1, Math.ceil(bounds.h / cellSizeM));
  const insideInterstitial: boolean[] = [];

  for (let iz = 0; iz < height; iz++) {
    for (let ix = 0; ix < width; ix++) {
      const x = bounds.x + (ix + 0.5) * cellSizeM;
      const z = bounds.z + (iz + 0.5) * cellSizeM;
      const inBounds = x >= bounds.x && x <= bounds.x + bounds.w && z >= bounds.z && z <= bounds.z + bounds.h;
      let inRoom = false;
      for (const poly of roomPolys) {
        if (pointInPolygon(x, z, poly.points)) {
          inRoom = true;
          break;
        }
      }
      insideInterstitial.push(inBounds && !inRoom);
    }
  }

  return { width, height, insideInterstitial };
}

function pointInPolygon(x: number, z: number, points: WorldVec2[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const pi = points[i]!;
    const pj = points[j]!;
    const intersect =
      pi.z > z !== pj.z > z && x < ((pj.x - pi.x) * (z - pi.z)) / (pj.z - pi.z) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}
