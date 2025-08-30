export type Dir = 'up' | 'down' | 'left' | 'right';

export type Point = { x: number; y: number };

export type FoodKind = 'cherry' | 'mushroom' | 'pizza' | 'banana' | 'coconut' | 'pineapple';

export type Food = { pos: Point; kind: FoodKind; value: number; effect?: string };

export type Skin = 'basic' | 'golden' | 'neon';

export interface GameConfig {
  readonly COLS: number;
  readonly ROWS: number;
  readonly CELL_SIZE: number;
  readonly ANIMATION_DELAY: number;
  readonly BASE_TICK_MS: number;
  readonly START_POSITION: Point;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
}

export interface SkinUnlockThresholds {
  readonly basic: number;
  readonly golden: number;
  readonly neon: number;
}

export interface GradientStop {
  offset: string;
  color: string;
}

export interface GameElements {
  score: HTMLSpanElement;
  highScore: HTMLSpanElement;
  overlay: HTMLDivElement;
  menu: HTMLDivElement;
  closeMenu: HTMLButtonElement;
  startScreen: HTMLDivElement;
  startGame: HTMLButtonElement;
  skins: HTMLButtonElement;
  rules: HTMLButtonElement;
  gameOver: HTMLDivElement;
  finalScore: HTMLSpanElement;
  gameOverHighScore: HTMLSpanElement;
  restart: HTMLButtonElement;
  mainMenu: HTMLButtonElement;
  skinsScreen: HTMLDivElement;
  closeSkins: HTMLButtonElement;
  backToMenu: HTMLButtonElement;
}