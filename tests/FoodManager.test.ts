import { FoodManager } from '../src/domain/FoodManager';
import { Board } from '../src/domain/Board';

describe('FoodManager', () => {
  let foodManager: FoodManager;
  let board: Board;

  beforeEach(() => {
    foodManager = new FoodManager();
    board = new Board(10, 10);
  });

  test('should spawn food on empty board', () => {
    const blocked = new Set<string>();
    foodManager.spawn(board, blocked);
    
    const food = foodManager.getFood();
    expect(food).not.toBeNull();
    expect(food?.pos.x).toBeGreaterThanOrEqual(0);
    expect(food?.pos.y).toBeGreaterThanOrEqual(0);
  });

  test('should not spawn food on full board', () => {
    const blocked = new Set<string>();
    // Fill entire board
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        blocked.add(`${x},${y}`);
      }
    }
    
    foodManager.spawn(board, blocked);
    expect(foodManager.getFood()).toBeNull();
  });

  test('should consume food at correct position', () => {
    const blocked = new Set<string>();
    foodManager.spawn(board, blocked);
    const food = foodManager.getFood();
    
    if (food) {
      const consumed = foodManager.consumeAt(food.pos);
      expect(consumed).toEqual(food);
      expect(foodManager.getFood()).toBeNull();
    }
  });

  test('should spawn different food types', () => {
    const blocked = new Set<string>();
    const foodTypes = new Set<string>();
    
    for (let i = 0; i < 20; i++) {
      foodManager.spawn(board, blocked);
      const food = foodManager.getFood();
      if (food) {
        foodTypes.add(food.kind);
      }
    }
    
    expect(foodTypes.size).toBeGreaterThan(1);
  });
});


