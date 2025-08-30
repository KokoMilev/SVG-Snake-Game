import { Board } from '../src/domain/Board';

describe('Board', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board(20, 15);
  });

  test('should have correct dimensions', () => {
    expect(board.getWidth()).toBe(20);
    expect(board.getHeight()).toBe(15);
  });

  test('should generate correct keys for positions', () => {
    const key = board.key({ x: 5, y: 10 });
    expect(key).toBe('5,10');
  });

  test('should detect positions in bounds', () => {
    expect(board.inBounds({ x: 0, y: 0 })).toBe(true);
    expect(board.inBounds({ x: 19, y: 14 })).toBe(true);
    expect(board.inBounds({ x: 20, y: 15 })).toBe(false);
    expect(board.inBounds({ x: -1, y: 0 })).toBe(false);
  });
});


