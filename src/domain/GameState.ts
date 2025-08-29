import { Board } from './Board';
import { Snake } from './Snake';
import { FoodManager } from './FoodManager';
import { AudioManager } from './AudioManager';
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
  private audioManager: AudioManager;
  
  // New properties for enhanced food effects
  private shieldActive = false;
  private shieldUntil = 0;
  private doublePointsUntil = 0;
  
  // Pause management
  private pauseStartTime = 0;
  private totalPauseTime = 0;

  constructor(board: Board, start: Point, startDir: Dir, baseTickMs = 140) {
    this.board = board;
    this.snake = new Snake(start, startDir);
    this.foods = new FoodManager();
    this.audioManager = new AudioManager();
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
  getInvertUntil() { return this.invertUntil; }
  getShieldUntil() { return this.shieldUntil; }
  getDoublePointsUntil() { return this.doublePointsUntil; }
  getAudioManager() { return this.audioManager; }
  getTotalPauseTime() { return this.totalPauseTime; }
  
  pause(now: number) {
    this.pauseStartTime = now;
    this.audioManager.playSound('pause');
  }
  
  resume(now: number) {
    if (this.pauseStartTime > 0) {
      this.totalPauseTime += now - this.pauseStartTime;
      this.pauseStartTime = 0;
    }
    this.audioManager.resumeBackgroundMusic();
    this.audioManager.playSound('resume');
  }
  
  private getAdjustedTime(now: number): number {
    return now - this.totalPauseTime;
  }
  
  getTickMs(now: number) { 
    const adjustedNow = this.getAdjustedTime(now);
    let finalSpeed = this.speedMs;
    
    // Apply speed effects only if shield is not active
    if (!this.shieldActive || adjustedNow >= this.shieldUntil) {
      if (adjustedNow < this.invertUntil) {
        finalSpeed = Math.max(70, Math.floor(this.speedMs * 0.75));
      }
    }
    
    return finalSpeed;
  }

  setDirection(dir: Dir, now: number) {
    if (!this.canTurn) return;
    
    const adjustedNow = this.getAdjustedTime(now);
    if ((adjustedNow < this.invertUntil) && (!this.shieldActive || adjustedNow >= this.shieldUntil)) {
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
      const adjustedNow = this.getAdjustedTime(now);
      if (this.shieldActive && adjustedNow < this.shieldUntil) {
        this.shieldActive = false;
        this.shieldUntil = 0;
        this.audioManager.playSound('block');
        return; 
      }
      this.alive = false;
      this.audioManager.playSound('dead');
      return;
    }

    const eaten = this.foods.consumeAt(next);
    this.snake.move(!!eaten);

    if (eaten) {
      this.audioManager.playFoodSound(eaten.kind);
      this.processFood(eaten, now);
      this.spawnFood();
    }

    this.canTurn = true;
  }

  private processFood(food: any, now: number) {
    let points = food.value;
    
    if (now < this.doublePointsUntil) {
      points *= 2;
    }
    
    this.score += points;

    switch (food.kind) {
      case 'mushroom':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.invertUntil = now + 30_000; 
        } else {
          this.audioManager.playSound('heal');
        }
        break;
      case 'pizza':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.speedMs = Math.max(80, Math.floor(this.speedMs * 0.85));
        } else {
          this.audioManager.playSound('heal');
        }
        break;
      case 'banana':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.speedMs = Math.min(200, Math.floor(this.speedMs * 1.2)); 
        }
        break;
      case 'pineapple':
        this.doublePointsUntil = now + 15_000; 
        break;
      case 'coconut':
        this.shieldActive = true;
        this.shieldUntil = now + 20_000; 
        break;
    }
  }

  reset(start: Point, startDir: Dir) {
    this.score = 0; 
    this.alive = true; 
    this.speedMs = this.baseSpeedMs;
    this.invertUntil = 0;
    this.canTurn = true;
    this.shieldActive = false;
    this.shieldUntil = 0;
    this.doublePointsUntil = 0;
    this.pauseStartTime = 0;
    this.totalPauseTime = 0;
    this.snake = new Snake(start, startDir);
    this.foods = new FoodManager();
    this.spawnFood();
    this.audioManager.playSound('gameStart');
  }

  private spawnFood() {
    const blocked = new Set(this.snake.getBody().map(p => this.board.key(p)));
    this.foods.spawn(this.board, blocked);
  }
}
