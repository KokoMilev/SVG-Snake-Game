import { Board } from './Board';
import { Snake } from './Snake';
import { FoodManager } from './FoodManager';
import type { Dir, Point } from './types';

export class GameState {
  private score = 0;
  private alive = true;
  private speedMs: number;
  private baseSpeedMs: number;
  private invertUntil = 0;
  private canTurn = true; 
  private snake: Snake;
  private foods: FoodManager;
  private board: Board;

  constructor(board: Board, start: Point, startDir: Dir, baseTickMs = 140) {
    this.board = board;
    this.snake = new Snake(start, startDir);
    this.foods = new FoodManager();
    this.baseSpeedMs = baseTickMs;
    this.speedMs = baseTickMs;
    this.spawnFood();
  }

  getScore() { return this.score; }
  isAlive() { return this.alive; }
  getSnakeBody() { return this.snake.getBody(); }
  getFood() { return this.foods.getFood(); }
  getCurrentSpeed() { return this.speedMs; }
  getBaseSpeed() { return this.baseSpeedMs; }
  getTickMs(now: number) { return now < this.invertUntil ? Math.max(70, Math.floor(this.speedMs * 0.75)) : this.speedMs; }

  setDirection(dir: Dir, now: number) {
    if (!this.canTurn) return;
    if (now < this.invertUntil) {
      const invert: Record<Dir, Dir> = { up:'down', down:'up', left:'right', right:'left' };
      dir = invert[dir];
    }
    this.snake.setDirection(dir);
    this.canTurn = false;
  }

  step(now: number) {
    if (!this.alive) return;

    const next = this.snake.nextHead();
    if (!this.board.inBounds(next) || this.snake.occupies(next)) {
      this.alive = false; return;
    }

    const eaten = this.foods.consumeAt(next);
    this.snake.move(!!eaten);

    if (eaten) {
      this.score += eaten.value;
      if (eaten.kind === 'mushroom') this.invertUntil = now + 30_000; // 30s invert
      if (eaten.kind === 'pizza') this.speedMs = Math.max(80, Math.floor(this.speedMs * 0.85)); // slight speedup
      this.spawnFood();
    }

    this.canTurn = true;
  }

  reset(start: Point, startDir: Dir, baseTickMs = 140) {
    this.score = 0; 
    this.alive = true; 
    this.baseSpeedMs = baseTickMs;
    this.speedMs = baseTickMs;
    this.invertUntil = 0;
    this.canTurn = true;
    this.snake = new Snake(start, startDir);
    this.foods = new FoodManager();
    this.spawnFood();
  }

  private spawnFood() {
    const blocked = new Set(this.snake.getBody().map(p => this.board.key(p)));
    this.foods.spawn(this.board, blocked);
  }
}
