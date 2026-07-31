/** Shipped cue ids — must match `assets/audio/` prereq table (pack v1). */
export const RIFLE_FIRE_CUES = [
  'p1_sfx_rifle_fire_01',
  'p1_sfx_rifle_fire_02',
  'p1_sfx_rifle_fire_03',
] as const;

export const SIDEARM_FIRE_CUES = [
  'p1_sfx_sidearm_fire_01',
  'p1_sfx_sidearm_fire_02',
  'p1_sfx_sidearm_fire_03',
] as const;

export const IMPACT_WALL_CUES = [
  'p1_sfx_impact_wall_01',
  'p1_sfx_impact_wall_02',
  'p1_sfx_impact_wall_03',
] as const;

export const IMPACT_ACTOR_CUES = ['p1_sfx_impact_actor_01', 'p1_sfx_impact_actor_02'] as const;

export const FOOTSTEP_CUES = [
  'p1_sfx_footstep_01',
  'p1_sfx_footstep_02',
  'p1_sfx_footstep_03',
  'p1_sfx_footstep_04',
] as const;

export const UI_FOCUS_CUE = 'p1_sfx_ui_focus_01' as const;
export const UI_CONFIRM_CUE = 'p1_sfx_ui_confirm_01' as const;
export const UI_SCORE_APPEAR_CUE = 'p1_sfx_ui_score_appear_01' as const;

export const BED_CALM_CUE = 'p1_bed_ship_calm_loop' as const;
export const BED_ALERT_CUE = 'p1_bed_ship_alert_loop' as const;

export const ALL_SHIPPED_CUE_IDS = [
  ...RIFLE_FIRE_CUES,
  ...SIDEARM_FIRE_CUES,
  ...IMPACT_WALL_CUES,
  ...IMPACT_ACTOR_CUES,
  ...FOOTSTEP_CUES,
  UI_FOCUS_CUE,
  UI_CONFIRM_CUE,
  UI_SCORE_APPEAR_CUE,
  BED_CALM_CUE,
  BED_ALERT_CUE,
] as const;

export type ShippedCueId = (typeof ALL_SHIPPED_CUE_IDS)[number];
