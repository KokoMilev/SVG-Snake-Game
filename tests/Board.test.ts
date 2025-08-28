import { Board } from '../src/domain/Board';

describe('Board', () => {
  test('inBounds works at edges', () => {
    const b = new Board(3, 2);
    expect(b.inBounds({ x: 0, y: 0 })).toBe(true);
    expect(b.inBounds({ x: 2, y: 1 })).toBe(true);
    expect(b.inBounds({ x: -1, y: 0 })).toBe(false);
    expect(b.inBounds({ x: 0, y: 2 })).toBe(false);
    expect(b.inBounds({ x: 3, y: 0 })).toBe(false);
  });
});


