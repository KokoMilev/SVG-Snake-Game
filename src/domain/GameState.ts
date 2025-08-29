import { Board } from './Board';
import { Snake } from './Snake';
import { FoodManager } from './FoodManager';
import { AudioManager } from './AudioManager';
import type { Dir, Point } from './types';

export class GameState {
  private static readonly INVERT_DURATION = 30_000;
  private static readonly SHIELD_DURATION = 20_000;
  private static readonly DOUBLE_POINTS_DURATION = 15_000;
  private static readonly MIN_SPEED_MS = 70;
  private static readonly MAX_SPEED_MS = 200;
  private static readonly SPEED_MULTIPLIER = 0.75;
  private static readonly SPEED_INCREASE_MULTIPLIER = 0.85;
  private static readonly SPEED_DECREASE_MULTIPLIER = 1.2;
  
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
  
  private shieldActive = false;
  private shieldUntil = 0;
  private doublePointsUntil = 0;
  
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
    
    if (!this.shieldActive || adjustedNow >= this.shieldUntil) {
      if (adjustedNow < this.invertUntil) {
        finalSpeed = Math.max(GameState.MIN_SPEED_MS, Math.floor(this.speedMs * GameState.SPEED_MULTIPLIER));
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
          this.invertUntil = now + GameState.INVERT_DURATION; 
        } else {
          this.audioManager.playSound('heal');
        }
        break;
      case 'pizza':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.speedMs = Math.max(GameState.MIN_SPEED_MS, Math.floor(this.speedMs * GameState.SPEED_INCREASE_MULTIPLIER));
        } else {
          this.audioManager.playSound('heal');
        }
        break;
      case 'banana':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.speedMs = Math.min(GameState.MAX_SPEED_MS, Math.floor(this.speedMs * GameState.SPEED_DECREASE_MULTIPLIER)); 
        }
        break;
      case 'pineapple':
        this.doublePointsUntil = now + GameState.DOUBLE_POINTS_DURATION; 
        break;
      case 'coconut':
        this.shieldActive = true;
        this.shieldUntil = now + GameState.SHIELD_DURATION; 
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
