export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const LANES = [310, 480, 650] as const;
export const CAT_Y = 420;

export const INITIAL_HEARTS = 3;
export const INITIAL_SPEED = 238;
export const MAX_SPEED = 344;
export const FINISH_DISTANCE = 4200;

export const OBSTACLE_SPAWN_MS = 880;
export const YARN_SPAWN_MS = 620;

export const DEPTHS = {
  background: 0,
  track: 5,
  trackDecor: 8,
  pickups: 18,
  obstacles: 20,
  player: 30,
  finish: 35,
  effects: 45,
  hud: 60,
  overlay: 80
} as const;

export type GamePhase = 'start' | 'playing' | 'won' | 'lost';
export type ObstacleType = 'dog' | 'cucumber' | 'foil';

