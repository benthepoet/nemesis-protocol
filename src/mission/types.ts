export type MissionPhase =
  | 'BRIEFING'
  | 'INSERTION'
  | 'ACTIVE'
  | 'COMPLETE'
  | 'FAILED'
  | 'SCORE';

export type BreachRoomId = 'port-airlock' | 'stbd-airlock';

export interface ScoreSnapshot {
  outcome: 'COMPLETE' | 'FAILED';
  breachRoomId: BreachRoomId;
  missionEndTick: number;
  alarmTripped: boolean;
  alarmTripTick: number | null;
  crewNeutralized: number;
}

export interface BreachOption {
  index: 0 | 1;
  roomId: BreachRoomId;
  label: string;
}
