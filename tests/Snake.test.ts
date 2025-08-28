import { Snake } from '../src/domain/Snake';
import type { Dir } from '../src/domain/types';

describe('Snake', () => {
  test('initial length and head', () => {
    const start = { x: 5, y: 5 };
    const snake = new Snake(start, 'right');
    expect(snake.getBody().length).toBe(3);
    expect(snake.getHead()).toEqual(start);
  });

  test('nextHead follows direction and move grows when requested', () => {
    const snake = new Snake({ x: 2, y: 2 }, 'right');
    expect(snake.nextHead()).toEqual({ x: 3, y: 2 });
    snake.move(false);
    expect(snake.getBody().length).toBe(3);
    snake.move(true);
    expect(snake.getBody().length).toBe(4);
  });

  test('setDirection prevents 180-degree turns', () => {
    const snake = new Snake({ x: 2, y: 2 }, 'right');
    const opposite: Record<Dir, Dir> = { up:'down', down:'up', left:'right', right:'left' };
    snake.setDirection('left');
    expect(snake.getDirection()).toBe('right');
    snake.setDirection('up');
    expect(snake.getDirection()).toBe('up');
    snake.setDirection(opposite['up']);
    expect(snake.getDirection()).toBe('up');
  });
});


