import { Snake } from '../src/domain/Snake';

describe('Snake', () => {
  let snake: Snake;

  beforeEach(() => {
    snake = new Snake({ x: 10, y: 7 }, 'right');
  });

  test('should start with 3 segments', () => {
    expect(snake.getBody()).toHaveLength(3);
  });

  test('should move forward', () => {
    const initialHead = snake.getHead();
    snake.move(false);
    
    expect(snake.getHead().x).toBe(initialHead.x + 1);
  });

  test('should grow when eating', () => {
    const initialLength = snake.getBody().length;
    snake.move(true);
    
    expect(snake.getBody()).toHaveLength(initialLength + 1);
  });

  test('should change direction', () => {
    snake.setDirection('up');
    expect(snake.getDirection()).toBe('up');
  });

  test('should detect occupied positions', () => {
    const headPos = snake.getHead();
    expect(snake.occupies(headPos)).toBe(true);
  });
});


