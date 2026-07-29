import { M_PER_PX, ORIGIN_SX, ORIGIN_SY } from '../config.js';
import type { RectFootprintSvg, WorldRect, WorldVec2 } from './types.js';

/** Sim units = meters. SVG px (y-down) → world XZ (y-up floor plane). */
export function svgToWorld(sx: number, sy: number): WorldVec2 {
  return {
    x: (sx - ORIGIN_SX) * M_PER_PX,
    z: (sy - ORIGIN_SY) * M_PER_PX,
  };
}

export function svgLengthToMeters(px: number): number {
  return px * M_PER_PX;
}

export function rectSvgToWorld(r: RectFootprintSvg): WorldRect {
  const origin = svgToWorld(r.x, r.y);
  return {
    x: origin.x,
    z: origin.z,
    w: r.w * M_PER_PX,
    h: r.h * M_PER_PX,
  };
}

export function polygonSvgToWorld(
  points: ReadonlyArray<readonly [number, number]>,
): WorldVec2[] {
  return points.map(([sx, sy]) => svgToWorld(sx, sy));
}
