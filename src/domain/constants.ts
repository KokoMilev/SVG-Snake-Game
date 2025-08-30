export const GAME_CONFIG = {
  COLS: 20,
  ROWS: 15,
  CELL_SIZE: 30,
  ANIMATION_DELAY: 800,
  BASE_TICK_MS: 140,
  START_POSITION: { x: 6, y: 7 }
} as const;

export const getResponsiveBoardConfig = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  let cols: number = GAME_CONFIG.COLS;
  let rows: number = GAME_CONFIG.ROWS;
  let cellSize: number = GAME_CONFIG.CELL_SIZE;
  
  if (screenWidth <= 480 && screenHeight > screenWidth) {
    cols = 16;
    rows = 12;
    cellSize = 17;
  }
  else if (screenWidth <= 768) {
    cols = 18;
    rows = 14;
    cellSize = 22;
  }
  else if (screenWidth <= 1024) {
    cols = 19;
    rows = 14;
    cellSize = 28;
  }
  else {
    cols = GAME_CONFIG.COLS;
    rows = GAME_CONFIG.ROWS;
    cellSize = GAME_CONFIG.CELL_SIZE;
  }
  
  return { cols, rows, cellSize };
};

export const SKIN_UNLOCK_THRESHOLDS = {
  basic: 0,
  golden: 5000,
  neon: 10000
} as const;

export const STORAGE_KEYS = {
  HIGH_SCORE: 'snakeHighScore',
  AUDIO_ENABLED: 'snakeAudioEnabled',
  VOLUME: 'snakeVolume',
  SKIN: 'snakeSkin'
} as const;

export const GAME_TIMING = {
  INVERT_DURATION: 30_000,
  SHIELD_DURATION: 20_000,
  DOUBLE_POINTS_DURATION: 15_000,
  MIN_SPEED_MS: 70,
  MAX_SPEED_MS: 200,
  SPEED_MULTIPLIER: 0.75,
  SPEED_INCREASE_MULTIPLIER: 0.85,
  SPEED_DECREASE_MULTIPLIER: 1.2
} as const;

export const FOOD_CONFIG = {
  VALUES: {
    cherry: 100,
    banana: 120,
    coconut: 150,
    pineapple: 200,
    pizza: 400,
    mushroom: 350
  },
  SPAWN_PROBABILITIES: {
    cherry: 0.25,      
    banana: 0.25,       
    coconut: 0.10,     
    pineapple: 0.10,   
    pizza: 0.15,       
    mushroom: 0.15     
  }
} as const;
