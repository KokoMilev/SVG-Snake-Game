import type { Point, Food, FoodKind } from './types';
import { Board } from './Board';

export function emoji(kind: FoodKind) {
  if (kind === 'cherry') return '🍒';
  if (kind === 'mushroom') return '🍄';
  if (kind === 'pizza') return '🍕';
  if (kind === 'banana') return '🍌';
  if (kind === 'coconut') return '🥥';
  return '🍍';
}

export function getFoodEffect(kind: FoodKind): string | undefined {
  const effects: Record<FoodKind, string | undefined> = {
    cherry: undefined,
    mushroom: 'invert',
    pizza: 'speedup',
    banana: 'slowdown',
    coconut: 'shield',
    pineapple: 'doublePoints'
  };
  return effects[kind];
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
    
    // Updated food spawning logic with new foods
    let kind: FoodKind;
    let value: number;
    
    if (r < 0.25) {
      kind = 'cherry';
      value = 100;
    } else if (r < 0.50) {
      kind = 'banana';
      value = 120;
    } else if (r < 0.60) {
      kind = 'coconut';
      value = 150;
    } else if (r < 0.70) {
      kind = 'pineapple';
      value = 200;
    } else if (r < 0.85) {
      kind = 'pizza';
      value = 400;
    } else {
      kind = 'mushroom';
      value = 350;
    }
    
    this.food = { pos, kind, value, effect: getFoodEffect(kind) };
  }

  getFood() { return this.food; }
  consumeAt(p: Point): Food | null {
    if (this.food && this.food.pos.x === p.x && this.food.pos.y === p.y) {
      const f = this.food; this.food = null; return f;
    }
    return null;
  }
}
