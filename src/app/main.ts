import { Board } from '../domain/Board';
import { GameState } from '../domain/GameState';
import type { Dir } from '../domain/types';
import { SvgRenderer } from '../ui/SvgRenderer';

function qs<T extends Element>(s: string) {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Missing ${s}`);
  return el as T;
}

const COLS = 20, ROWS = 15, CELL = 30;
const board = new Board(COLS, ROWS);
const state = new GameState(board, { x: Math.floor(COLS/3), y: Math.floor(ROWS/2) }, 'right', 140);
const renderer = new SvgRenderer(qs('#game'), COLS, ROWS, CELL);

const scoreEl = qs<HTMLSpanElement>('#score');
const highScoreEl = qs<HTMLSpanElement>('#highScore');
const overlay = qs<HTMLDivElement>('#overlay');

// High score management
let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
highScoreEl.textContent = String(highScore);

function updateHighScore(score: number) {
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = String(highScore);
    localStorage.setItem('snakeHighScore', String(highScore));
  }
}

function showOverlay(msg: string) {
  overlay.textContent = msg;
  overlay.style.display = 'flex';
  overlay.classList.add('show');
}

function hideOverlay() {
  overlay.style.display = 'none';
  overlay.classList.remove('show');
}

function showCurrentEffects() {
  const now = Date.now();
  const effects: string[] = [];
  
  // Check for active effects using adjusted time
  const adjustedNow = now - state.getTotalPauseTime();
  
  if (adjustedNow < state.getInvertUntil()) {
    effects.push('🔄 Invert');
  }
  if (adjustedNow < state.getShieldUntil()) {
    effects.push('🛡️ Shield');
  }
  if (adjustedNow < state.getDoublePointsUntil()) {
    effects.push('⚡ 2x Points');
  }
  
  // Update effects display
  const effectsEl = document.getElementById('effects');
  if (effectsEl) {
    if (effects.length > 0) {
      effectsEl.innerHTML = effects.map(effect => `<div class="effect">${effect}</div>`).join('');
      effectsEl.style.display = 'block';
    } else {
      effectsEl.style.display = 'none';
    }
  }
}

function updateEffectsDisplay() {
  // Only update effects if the game is not paused
  if (paused) return;
  
  const now = Date.now();
  const effects: string[] = [];
  
  // Check for active effects using adjusted time
  const adjustedNow = now - state.getTotalPauseTime();
  
  if (adjustedNow < state.getInvertUntil()) {
    effects.push('🔄 Invert');
  }
  if (adjustedNow < state.getShieldUntil()) {
    effects.push('🛡️ Shield');
  }
  if (adjustedNow < state.getDoublePointsUntil()) {
    effects.push('⚡ 2x Points');
  }
  
  // Update effects display
  const effectsEl = document.getElementById('effects');
  if (effectsEl) {
    if (effects.length > 0) {
      effectsEl.innerHTML = effects.map(effect => `<div class="effect">${effect}</div>`).join('');
      effectsEl.style.display = 'block';
    } else {
      effectsEl.style.display = 'none';
    }
  }
}

let paused = true;
let timer: number | null = null;

function loop() {
  if (paused || !state.isAlive()) return;
  const now = Date.now();
  state.step(now);
  renderer.renderFoods(state.getFood());  
  renderer.renderSnake(state.getSnakeBody());
  scoreEl.textContent = String(state.getScore());
  
  // Update effects display
  updateEffectsDisplay();

  if (!state.isAlive()) {
    updateHighScore(state.getScore());
    showOverlay('Game Over — Press Space to Restart');
    return;
  }

  scheduleNext(now);
}

function scheduleNext(now: number) {
  const delay = state.getTickMs(now);
  timer = window.setTimeout(loop, delay);
}

function start() {
  if (!state.isAlive()) return; // require restart if dead
  if (!paused) return;
  paused = false;
  state.resume(Date.now());
  hideOverlay();
  scheduleNext(Date.now());
}

function pause() {
  if (!state.isAlive()) return;
  paused = true;
  if (timer !== null) { clearTimeout(timer); timer = null; }
  state.pause(Date.now());
  showOverlay('Paused — Press Space to Resume');
  // Show current effects state when paused
  showCurrentEffects();
}

function restart() {
  paused = true;
  if (timer !== null) { clearTimeout(timer); timer = null; }
  state.reset({ x: Math.floor(COLS/3), y: Math.floor(ROWS/2) }, 'right');
  renderer.renderFoods(state.getFood());
  renderer.renderSnake(state.getSnakeBody());
  scoreEl.textContent = '0';
  showOverlay('Press Space to Start');
}

window.addEventListener('keydown', (e) => {
  const keyToDir: Record<string, Dir | undefined> = {
    ArrowUp: 'up',    KeyW: 'up',
    ArrowDown: 'down',KeyS: 'down',
    ArrowLeft: 'left',KeyA: 'left',
    ArrowRight: 'right',KeyD: 'right',
  };
  if (e.code === 'Space') {
    if (!state.isAlive()) { restart(); start(); return; }
    paused ? start() : pause();
    return;
  }
  const dir = keyToDir[e.code];
  if (dir) state.setDirection(dir, Date.now());
});

renderer.renderFoods(state.getFood());
renderer.renderSnake(state.getSnakeBody());
showOverlay('Press Space to Start');