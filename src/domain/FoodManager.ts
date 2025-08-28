import type { Point } from './types';
import { Board } from './Board';

export type FoodKind = 'cherry' | 'mushroom' | 'pizza';
export type Food = { pos: Point; kind: FoodKind; value: number };

export function emoji(kind: FoodKind) {
  if (kind === 'cherry') return '🍒';
  if (kind === 'mushroom') return '🍄';
  return '🍕';
}

export class FoodManager {
  private food: Food | null = null;

  spawn(board: Board, blocked: Set<string>) {
    const cells: Point[] = [];
    for (let y = 0; y < board.getHeight(); y++) {
      for (let x = 0; x < board.getWidth(); x++) {
        const p = { x, y };
        if (!blocked.has(board.key(p))) cells.push(p);
      }
    }
    if (cells.length === 0) { this.food = null; return; }

    const pos = cells[Math.floor(Math.random() * cells.length)];
    const r = Math.random();
    const kind: FoodKind = r < 0.5 ? 'cherry' : r < 0.85 ? 'pizza' : 'mushroom';
    const value = kind === 'cherry' ? 100 : kind === 'mushroom' ? 350 : 400;
    this.food = { pos, kind, value };
  }

  getFood() { return this.food; }
  consumeAt(p: Point): Food | null {
    if (this.food && this.food.pos.x === p.x && this.food.pos.y === p.y) {
      const f = this.food; this.food = null; return f;
    }
    return null;
  }
}
