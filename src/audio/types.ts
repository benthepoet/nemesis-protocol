import type { ShippedCueId } from './cueIds.js';

export interface ListenerPose {
  x: number;
  y: number;
  z: number;
  forwardX: number;
  forwardY: number;
  forwardZ: number;
  upX: number;
  upY: number;
  upZ: number;
}

export type PlaySpatialCue = (req: {
  cueId: ShippedCueId;
  x: number;
  y: number;
  z: number;
  spatial: boolean;
}) => void;

export type PlayUiCue = (cueId: ShippedCueId) => void;

export type AudioBufferMap = Partial<Record<ShippedCueId, AudioBuffer>>;
