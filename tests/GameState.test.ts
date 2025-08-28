import { Board } from '../src/domain/Board';
import { GameState } from '../src/domain/GameState';

describe('GameState', () => {
  test('dies when hitting wall', () => {
    const b = new Board(3, 3);
    const gs = new GameState(b, { x: 2, y: 1 }, 'right', 140);
    const now = Date.now();
    gs.step(now);
    expect(gs.isAlive()).toBe(false);
  });

  test('allows only one direction change per tick', () => {
    const b = new Board(10, 10);
    const gs = new GameState(b, { x: 5, y: 5 }, 'right', 140);
    const now = Date.now();

    gs.setDirection('up', now);
    gs.setDirection('left', now); 
    gs.step(now);
    const body = gs.getSnakeBody();
    expect(body[0]).toEqual({ x: 5, y: 4 });
  });
});


