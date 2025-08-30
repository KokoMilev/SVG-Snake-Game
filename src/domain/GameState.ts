import { Board } from './Board';
import { Snake } from './Snake';
import { FoodManager } from './FoodManager';
import { AudioManager } from './AudioManager';
import type { Dir, Point } from './types';
import { GAME_TIMING, GAME_CONFIG } from './constants';

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
        finalSpeed = Math.max(GAME_TIMING.MIN_SPEED_MS, Math.floor(this.speedMs * GAME_TIMING.SPEED_MULTIPLIER));
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
          this.invertUntil = now + GAME_TIMING.INVERT_DURATION; 
        } else {
          this.audioManager.playSound('heal');
        }
        break;
      case 'pizza':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.speedMs = Math.max(GAME_TIMING.MIN_SPEED_MS, Math.floor(this.speedMs * GAME_TIMING.SPEED_INCREASE_MULTIPLIER));
        } else {
          this.audioManager.playSound('heal');
        }
        break;
      case 'banana':
        if (!this.shieldActive || now >= this.shieldUntil) {
          this.speedMs = Math.min(GAME_TIMING.MAX_SPEED_MS, Math.floor(this.speedMs * GAME_TIMING.SPEED_DECREASE_MULTIPLIER)); 
        }
        break;
      case 'pineapple':
        this.doublePointsUntil = now + GAME_TIMING.DOUBLE_POINTS_DURATION; 
        break;
      case 'coconut':
        this.shieldActive = true;
        this.shieldUntil = now + GAME_TIMING.SHIELD_DURATION; 
        break;
    }
  }

  reset(start: Point, startDir: Dir) {
    this.score = 0; 
    this.alive = true; 
    this.speedMs = GAME_CONFIG.BASE_TICK_MS;
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
