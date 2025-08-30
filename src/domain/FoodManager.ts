import type { Point, Food, FoodKind } from './types';
import { Board } from './Board';
import { FOOD_CONFIG } from './constants';

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
    const foodType = this.selectRandomFoodType();
    
    this.food = { 
      pos, 
      kind: foodType.kind, 
      value: foodType.value, 
      effect: getFoodEffect(foodType.kind) 
    };
  }

  private selectRandomFoodType(): { kind: FoodKind; value: number } {
    const r = Math.random();
    let cumulativeProbability = 0;
    
    const foodTypes: Array<{ kind: FoodKind; probability: number }> = [
      { kind: 'cherry', probability: FOOD_CONFIG.SPAWN_PROBABILITIES.cherry },
      { kind: 'banana', probability: FOOD_CONFIG.SPAWN_PROBABILITIES.banana },
      { kind: 'coconut', probability: FOOD_CONFIG.SPAWN_PROBABILITIES.coconut },
      { kind: 'pineapple', probability: FOOD_CONFIG.SPAWN_PROBABILITIES.pineapple },
      { kind: 'pizza', probability: FOOD_CONFIG.SPAWN_PROBABILITIES.pizza },
      { kind: 'mushroom', probability: FOOD_CONFIG.SPAWN_PROBABILITIES.mushroom }
    ];
    
    for (const foodType of foodTypes) {
      cumulativeProbability += foodType.probability;
      if (r < cumulativeProbability) {
        return {
          kind: foodType.kind,
          value: FOOD_CONFIG.VALUES[foodType.kind]
        };
      }
    }
    
    return {
      kind: 'mushroom',
      value: FOOD_CONFIG.VALUES.mushroom
    };
  }

  getFood() { return this.food; }
  consumeAt(p: Point): Food | null {
    if (this.food && this.food.pos.x === p.x && this.food.pos.y === p.y) {
      const f = this.food; this.food = null; return f;
    }
    return null;
  }
}
