export const TICK_HZ = 60 as const;
export const FIXED_DT = 1 / TICK_HZ;
export const MAX_FRAME_DELTA_SEC = 0.25;
export const DEFAULT_PIXEL_RATIO_CAP = 2;

/** Mockup scale bar: 120 px = 25 m (design pack rule 7). */
export const SCALE_PX = 120 as const;
export const SCALE_M = 25 as const;
export const M_PER_PX = SCALE_M / SCALE_PX; // 25/120

export const ORIGIN_SX = 0 as const;
export const ORIGIN_SY = 0 as const;

/** Blockout / collision wall thickness for interior, partition, hull (meters). */
export const WALL_THICKNESS_M = 0.3 as const;

/** Class B bulkhead extrusion thickness (meters) — double base (Q7). */
export const BULKHEAD_THICKNESS_M = WALL_THICKNESS_M * 2;

/** Interior floor-to-ceiling height (meters). Binding Q5. */
export const ROOM_HEIGHT_M = 3.0 as const;

/** Horizontal actor proxy radius for collision + spawn tests (meters). Binding Q4. */
export const ACTOR_PROXY_RADIUS_M = 0.4 as const;

/** Extra clearance beyond proxy radius required at spawn (meters). Binding Q4. */
export const SPAWN_CLEARANCE_M = 0.3 as const;

/** Shift from airlock footprint center toward spine-side door (meters). Binding Q4. */
export const SPAWN_OFFSET_TOWARD_DOOR_M = 1.0 as const;

/** Dev-only debug fly camera URL flag (G8). */
export const DEBUG_CAMERA_PARAM = 'debugCamera' as const;

/** Player move speed (m/s). Design pack M1 — P1 checkpoint tunable. */
export const PLAYER_MOVE_SPEED_MPS = 6 as const;

/** Entity kind string for the local player. */
export const PLAYER_KIND = 'player' as const;

/** Allied / player blockout color (visual direction §3 safe/allied). */
export const PLAYER_COLOR_HEX = '#69f0ae' as const;

/** Visual capsule radius (m) — matches ACTOR_PROXY_RADIUS_M. */
export const PLAYER_MESH_RADIUS_M = ACTOR_PROXY_RADIUS_M;

/** Visual capsule height (m), excluding artistic wedge. */
export const PLAYER_MESH_HEIGHT_M = 1.6 as const;

/** Facing wedge length along forward (m). */
export const PLAYER_WEDGE_LENGTH_M = 0.35 as const;

/** Radial deadzone for gamepad sticks (M3). P1 checkpoint tunable. */
export const GAMEPAD_AXIS_DEADZONE = 0.24 as const;

/** Follow camera pitch below horizontal (degrees). Pack M6 / VD §7. */
export const FOLLOW_CAMERA_PITCH_DEG = 60 as const;

/** Perspective FOV (degrees). */
export const FOLLOW_CAMERA_FOV_DEG = 50 as const;

/** Distance from focus point to camera along the pitched view ray (m). */
export const FOLLOW_CAMERA_DISTANCE_M = 18 as const;

/** Max aim-bias shift of frame center toward aim point (m). Pack M6. */
export const FOLLOW_AIM_BIAS_M = 2.0 as const;

/** Render-side follow position smoothing rate (higher = snappier). Not sim state. */
export const FOLLOW_CAMERA_POS_SMOOTH = 12 as const;

/** Render-side focus smoothing rate. */
export const FOLLOW_CAMERA_FOCUS_SMOOTH = 10 as const;

/**
 * Binding accent hex map (Q2 / visual direction §3 v1.2).
 * Keys match AccentId in src/deck/types.ts.
 */
export const ACCENT_HEX = {
  engineering: '#ef5350',
  command: '#7986cb',
  ops: '#ffb74d',
  lifeSupport: '#4dd0e1',
  crew: '#ce93d8',
  hydro: '#81c784',
  armory: '#ff8a65',
  medical: '#80cbc4',
  comms: '#5c7cfa',
  mess: '#a1887f',
  corridor: '#8b949e',
  safe: '#69f0ae',
} as const;
