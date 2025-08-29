import { Board } from '../domain/Board';
import { GameState } from '../domain/GameState';
import type { Dir } from '../domain/types';
import { SvgRenderer } from '../ui/SvgRenderer';

function qs<T extends Element>(s: string) {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Missing ${s}`);
  return el as T;
}

const COLS = 20, ROWS = 15, CELL = 25;
const board = new Board(COLS, ROWS);
const state = new GameState(board, { x: Math.floor(COLS/3), y: Math.floor(ROWS/2) }, 'right', 140);
const renderer = new SvgRenderer(qs('#game'), COLS, ROWS, CELL);

const scoreEl = qs<HTMLSpanElement>('#score');
const highScoreEl = qs<HTMLSpanElement>('#highScore');
const overlay = qs<HTMLDivElement>('#overlay');

// Menu elements
const menu = qs<HTMLDivElement>('#menu');
const closeMenuBtn = qs<HTMLButtonElement>('#closeMenu');
const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');

// Start screen elements
const startScreen = qs<HTMLDivElement>('#startScreen');
const startGameBtn = qs<HTMLButtonElement>('#startGameBtn');
const rulesBtn = qs<HTMLButtonElement>('#rulesBtn');

// Game over elements
const gameOverScreen = qs<HTMLDivElement>('#gameOverScreen');
const finalScoreEl = qs<HTMLSpanElement>('#finalScore');
const gameOverHighScoreEl = qs<HTMLSpanElement>('#gameOverHighScore');
const restartBtn = qs<HTMLButtonElement>('#restartBtn');
const mainMenuBtn = qs<HTMLButtonElement>('#mainMenuBtn');

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

// Start screen functions
function hideStartScreen() {
  startScreen?.classList.add('hide');
}

function showStartScreen() {
  startScreen?.classList.remove('hide');
}

// Game over functions
function showGameOver() {
  if (gameOverScreen && finalScoreEl && gameOverHighScoreEl) {
    finalScoreEl.textContent = String(state.getScore());
    gameOverHighScoreEl.textContent = String(highScore);
    gameOverScreen.classList.add('show');
  }
}

function hideGameOver() {
  gameOverScreen?.classList.remove('show');
}

// Menu functions
function openMenu() {
  menu?.classList.add('show');
  // Pause the game when menu is open
  if (!paused && state.isAlive()) {
    pause();
  }
}

function closeMenu() {
  menu?.classList.remove('show');
}

function switchTab(tabName: string) {
  // Remove active class from all tabs and contents
  tabBtns.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to selected tab and content
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`) as HTMLButtonElement;
  const selectedContent = document.getElementById(tabName);
  
  if (selectedTab && selectedContent) {
    selectedTab.classList.add('active');
    selectedContent.classList.add('active');
  }
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
let gameStarted = false;

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
    showGameOver();
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
  hideGameOver();
  start();
}

function goToMainMenu() {
  gameStarted = false;
  paused = true;
  if (timer !== null) { clearTimeout(timer); timer = null; }
  state.reset({ x: Math.floor(COLS/3), y: Math.floor(ROWS/2) }, 'right');
  renderer.renderFoods(state.getFood());
  renderer.renderSnake(state.getSnakeBody());
  scoreEl.textContent = '0';
  hideGameOver();
  
  // Reset start screen to its initial state
  if (startScreen) {
    startScreen.style.transition = '';
    startScreen.style.opacity = '';
    startScreen.style.transform = '';
    startScreen.classList.remove('hide');
  }
}

function startNewGame() {
  // Smooth fade-out transition
  if (startScreen) {
    startScreen.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    startScreen.style.opacity = '0';
    startScreen.style.transform = 'scale(0.95) translateY(-20px)';
  }
  
  // Start the game after the fade animation completes
  setTimeout(() => {
    gameStarted = true;
    hideStartScreen();
    hideOverlay();
    paused = false;
    state.resume(Date.now());
    scheduleNext(Date.now());
  }, 800);
}

// Event listeners
window.addEventListener('keydown', (e) => {
  const keyToDir: Record<string, Dir | undefined> = {
    ArrowUp: 'up',    KeyW: 'up',
    ArrowDown: 'down',KeyS: 'down',
    ArrowLeft: 'left',KeyA: 'left',
    ArrowRight: 'right',KeyD: 'right',
  };
  
  if (e.code === 'Escape') {
    if (menu?.classList.contains('show')) {
      closeMenu();
    } else if (gameStarted && !state.isAlive()) {
      openMenu();
    } else if (gameStarted) {
      openMenu();
    }
    return;
  }
  
  if (e.code === 'Space') {
    // Don't allow space to resume/pause if menu is open
    if (menu?.classList.contains('show')) {
      return;
    }
    
    if (!gameStarted) {
      startNewGame();
      return;
    }
    if (!state.isAlive()) { 
      restart();
      return;
    }
    paused ? start() : pause();
    return;
  }
  
  const dir = keyToDir[e.code];
  if (dir) state.setDirection(dir, Date.now());
});

// Start screen event listeners
startGameBtn?.addEventListener('click', startNewGame);
rulesBtn?.addEventListener('click', () => {
  openMenu();
  // Switch to rules tab
  switchTab('rules');
});

// Game over event listeners
restartBtn?.addEventListener('click', () => {
  console.log('Restart button clicked');
  restart();
});

mainMenuBtn?.addEventListener('click', () => {
  console.log('Main menu button clicked');
  goToMainMenu();
});

// Debug button elements
console.log('Game over elements:', {
  gameOverScreen: !!gameOverScreen,
  restartBtn: !!restartBtn,
  mainMenuBtn: !!mainMenuBtn,
  finalScoreEl: !!finalScoreEl,
  gameOverHighScoreEl: !!gameOverHighScoreEl
});

// Menu event listeners
closeMenuBtn?.addEventListener('click', closeMenu);

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    if (tabName) {
      switchTab(tabName);
    }
  });
});

// Close menu when clicking outside
menu?.addEventListener('click', (e) => {
  if (e.target === menu) {
    closeMenu();
  }
});

// Initialize the game
renderer.renderFoods(state.getFood());
renderer.renderSnake(state.getSnakeBody());

// Ensure DOM is ready before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking game over elements...');
  
  // Re-check elements after DOM is loaded
  const gameOverScreenLoaded = document.getElementById('gameOverScreen');
  const mainMenuBtnLoaded = document.getElementById('mainMenuBtn');
  const restartBtnLoaded = document.getElementById('restartBtn');
  
  console.log('DOM loaded elements:', {
    gameOverScreen: !!gameOverScreenLoaded,
    mainMenuBtn: !!mainMenuBtnLoaded,
    restartBtn: !!restartBtnLoaded
  });
  
  // Re-attach event listeners if elements are found
  if (mainMenuBtnLoaded) {
    mainMenuBtnLoaded.addEventListener('click', () => {
      console.log('Main menu button clicked (DOM loaded)');
      goToMainMenu();
    });
  }
  
  if (restartBtnLoaded) {
    restartBtnLoaded.addEventListener('click', () => {
      console.log('Restart button clicked (DOM loaded)');
      restart();
    });
  }
});

// Don't show overlay initially - start screen will be shown