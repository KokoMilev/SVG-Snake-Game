import { 
  GAME_CONFIG, 
  SKIN_UNLOCK_THRESHOLDS, 
  FOOD_CONFIG 
} from '../src/domain/constants';

describe('Constants', () => {
  test('should have valid game config', () => {
    expect(GAME_CONFIG.COLS).toBeGreaterThan(0);
    expect(GAME_CONFIG.ROWS).toBeGreaterThan(0);
    expect(GAME_CONFIG.CELL_SIZE).toBeGreaterThan(0);
  });

  test('should have skin unlock thresholds', () => {
    expect(SKIN_UNLOCK_THRESHOLDS.basic).toBe(0);
    expect(SKIN_UNLOCK_THRESHOLDS.golden).toBe(5000);
    expect(SKIN_UNLOCK_THRESHOLDS.neon).toBe(10000);
  });

  test('should have food configuration', () => {
    expect(FOOD_CONFIG.VALUES.cherry).toBe(100);
    expect(FOOD_CONFIG.VALUES.pizza).toBe(400);
    expect(FOOD_CONFIG.SPAWN_PROBABILITIES.cherry).toBe(0.25);
  });
});
