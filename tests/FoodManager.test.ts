import { Board } from '../src/domain/Board';
import { FoodManager } from '../src/domain/FoodManager';

describe('FoodManager', () => {
  test('spawns food not on blocked cells', () => {
    const b = new Board(5, 5);
    const fm = new FoodManager();
    const blocked = new Set<string>(['0,0', '1,1', '2,2']);
    fm.spawn(b, blocked);
    const food = fm.getFood();
    expect(food).not.toBeNull();
    if (food) {
      expect(blocked.has(`${food.pos.x},${food.pos.y}`)).toBe(false);
      expect(food.value).toBeGreaterThan(0);
    }
  });
});


