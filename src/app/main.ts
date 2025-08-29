import { Board } from '../domain/Board';
import { GameState } from '../domain/GameState';
import type { Dir } from '../domain/types';
import { SvgRenderer } from '../ui/SvgRenderer';

// Configuration constants
const GAME_CONFIG = {
  COLS: 20,
  ROWS: 15,
  CELL_SIZE: 30,
  ANIMATION_DELAY: 800,
  BASE_TICK_MS: 140,
  START_POSITION: { x: 6, y: 7 } // Math.floor(COLS/3), Math.floor(ROWS/2)
} as const;

// Type definitions for better code organization
interface GameElements {
  score: HTMLSpanElement;
  highScore: HTMLSpanElement;
  overlay: HTMLDivElement;
  menu: HTMLDivElement;
  closeMenu: HTMLButtonElement;
  startScreen: HTMLDivElement;
  startGame: HTMLButtonElement;
  rules: HTMLButtonElement;
  gameOver: HTMLDivElement;
  finalScore: HTMLSpanElement;
  gameOverHighScore: HTMLSpanElement;
  restart: HTMLButtonElement;
  mainMenu: HTMLButtonElement;
}

interface AudioSettings {
  enabled: boolean;
  volume: number;
}

// Utility function with better error handling
function getRequiredElement<T extends Element>(selector: string, context: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector} (${context})`);
  }
  return element;
}

// Validate game configuration
function validateGameConfig() {
  if (GAME_CONFIG.COLS < 10 || GAME_CONFIG.ROWS < 10) {
    throw new Error('Game board dimensions too small');
  }
  if (GAME_CONFIG.CELL_SIZE < 20 || GAME_CONFIG.CELL_SIZE > 50) {
    throw new Error('Cell size out of valid range');
  }
  if (GAME_CONFIG.BASE_TICK_MS < 50 || GAME_CONFIG.BASE_TICK_MS > 500) {
    throw new Error('Base tick time out of valid range');
  }
}

// Initialize game components with validation
let board: Board;
let state: GameState;
let renderer: SvgRenderer;

try {
  validateGameConfig();
  board = new Board(GAME_CONFIG.COLS, GAME_CONFIG.ROWS);
  state = new GameState(board, GAME_CONFIG.START_POSITION, 'right', GAME_CONFIG.BASE_TICK_MS);
  renderer = new SvgRenderer(getRequiredElement('#game', 'game container'), GAME_CONFIG.COLS, GAME_CONFIG.ROWS, GAME_CONFIG.CELL_SIZE);
} catch (error) {
  console.error('Failed to initialize game:', error);
  throw error;
}

// DOM element references
const elements: GameElements = {
  score: getRequiredElement<HTMLSpanElement>('#score', 'score display'),
  highScore: getRequiredElement<HTMLSpanElement>('#highScore', 'high score display'),
  overlay: getRequiredElement<HTMLDivElement>('#overlay', 'game overlay'),
  menu: getRequiredElement<HTMLDivElement>('#menu', 'game menu'),
  closeMenu: getRequiredElement<HTMLButtonElement>('#closeMenu', 'close menu button'),
  startScreen: getRequiredElement<HTMLDivElement>('#startScreen', 'start screen'),
  startGame: getRequiredElement<HTMLButtonElement>('#startGameBtn', 'start game button'),
  rules: getRequiredElement<HTMLButtonElement>('#rulesBtn', 'rules button'),
  gameOver: getRequiredElement<HTMLDivElement>('#gameOverScreen', 'game over screen'),
  finalScore: getRequiredElement<HTMLSpanElement>('#finalScore', 'final score display'),
  gameOverHighScore: getRequiredElement<HTMLSpanElement>('#gameOverHighScore', 'game over high score'),
  restart: getRequiredElement<HTMLButtonElement>('#restartBtn', 'restart button'),
  mainMenu: getRequiredElement<HTMLButtonElement>('#mainMenuBtn', 'main menu button')
};

const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');
const audioManager = state.getAudioManager();

// Game state variables
let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
let audioSettings: AudioSettings = {
  enabled: localStorage.getItem('snakeAudioEnabled') !== 'false',
  volume: parseFloat(localStorage.getItem('snakeVolume') || '0.7')
};

// Initialize audio settings
if (!audioSettings.enabled) {
  audioManager.mute();
}
audioManager.setVolume(audioSettings.volume);

// Update high score display
elements.highScore.textContent = String(highScore);

function updateHighScore(score: number) {
  if (score > highScore) {
    highScore = score;
    elements.highScore.textContent = String(highScore);
    localStorage.setItem('snakeHighScore', String(highScore));
  }
}

function showOverlay(msg: string) {
  elements.overlay.textContent = msg;
  elements.overlay.style.display = 'flex';
  elements.overlay.classList.add('show');
}

function hideOverlay() {
  elements.overlay.style.display = 'none';
  elements.overlay.classList.remove('show');
}

function hideStartScreen() {
  elements.startScreen?.classList.add('hide');
  audioManager.playBackgroundMusic();
}

function showGameOver() {
  if (elements.gameOver && elements.finalScore && elements.gameOverHighScore) {
    elements.finalScore.textContent = String(state.getScore());
    elements.gameOverHighScore.textContent = String(highScore);
    elements.gameOver.classList.add('show');
  }
}

function hideGameOver() {
  elements.gameOver?.classList.remove('show');
}

function openMenu() {
  elements.menu?.classList.add('show');
  if (!paused && state.isAlive()) {
    pauseGame();
  }
}

function closeMenu() {
  elements.menu?.classList.remove('show');
}

function switchTab(tabName: string) {
  tabBtns.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`) as HTMLButtonElement;
  const selectedContent = document.getElementById(tabName);
  
  if (selectedTab && selectedContent) {
    selectedTab.classList.add('active');
    selectedContent.classList.add('active');
  }
}

function updateEffects() {
  const now = Date.now();
  const effects: string[] = [];
  
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
  
  const effectsEl = document.getElementById('effects');
  if (effectsEl) {
    effectsEl.style.display = effects.length > 0 ? 'block' : 'none';
    if (effects.length > 0) {
      effectsEl.innerHTML = effects.map(effect => `<div class="effect">${effect}</div>`).join('');
    }
  }
}

// Game state management
let paused = true;
let timer: number | null = null;
let gameStarted = false;

// Core game loop
function gameLoop() {
  if (paused || !state.isAlive()) return;
  
  const currentTime = Date.now();
  state.step(currentTime);
  renderer.renderFoods(state.getFood());  
  renderer.renderSnake(state.getSnakeBody());
  elements.score.textContent = String(state.getScore());
  
  updateEffects();

  if (!state.isAlive()) {
    updateHighScore(state.getScore());
    showGameOver();
    return;
  }

  scheduleNextFrame(currentTime);
}

function scheduleNextFrame(currentTime: number) {
  const frameDelay = state.getTickMs(currentTime);
  timer = window.setTimeout(gameLoop, frameDelay);
}

// Game control functions
function startGame() {
  if (!state.isAlive() || !paused) return;
  
  paused = false;
  state.resume(Date.now());
  hideOverlay();
  scheduleNextFrame(Date.now());
}

function pauseGame() {
  if (!state.isAlive()) return;
  
  paused = true;
  clearGameTimer();
  state.pause(Date.now());
  showOverlay('Paused — Press Space to Resume');
  updateEffects();
}

function restartGame() {
  paused = true;
  clearGameTimer();
  resetGameState();
  hideGameOver();
  
  audioManager.playBackgroundMusic();
  startGame();
}

function returnToMainMenu() {
  gameStarted = false;
  paused = true;
  clearGameTimer();
  resetGameState();
  hideGameOver();
  
  if (elements.startScreen) {
    elements.startScreen.style.transition = '';
    elements.startScreen.style.opacity = '';
    elements.startScreen.style.transform = '';
    elements.startScreen.classList.remove('hide');
  }
}

function startNewGame() {
  if (elements.startScreen) {
    elements.startScreen.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    elements.startScreen.style.opacity = '0';
    elements.startScreen.style.transform = 'scale(0.95) translateY(-20px)';
  }
  
  setTimeout(() => {
    gameStarted = true;
    hideStartScreen();
    hideOverlay();
    paused = false;
    state.resume(Date.now());
    scheduleNextFrame(Date.now());
  }, GAME_CONFIG.ANIMATION_DELAY);
}

// Utility functions
function clearGameTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function resetGameState() {
  state.reset({ x: Math.floor(GAME_CONFIG.COLS/3), y: Math.floor(GAME_CONFIG.ROWS/2) }, 'right');
  renderer.renderFoods(state.getFood());
  renderer.renderSnake(state.getSnakeBody());
  elements.score.textContent = '0';
}

// Audio management
function toggleAudio() {
  if (audioManager.isMuted()) {
    audioManager.unmute();
    audioSettings.enabled = true;
    localStorage.setItem('snakeAudioEnabled', 'true');
  } else {
    audioManager.mute();
    audioSettings.enabled = false;
    localStorage.setItem('snakeAudioEnabled', 'false');
  }
  updateAudioUI();
}

function setVolume(volume: number) {
  audioSettings.volume = volume;
  audioManager.setVolume(volume);
  localStorage.setItem('snakeVolume', String(volume));
  updateAudioUI();
}

function updateAudioUI() {
  const audioBtn = document.getElementById('audioToggle');
  const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
  
  if (audioBtn) {
    audioBtn.innerHTML = audioSettings.enabled ? '🔊' : '🔇';
    audioBtn.title = audioSettings.enabled ? 'Mute Audio' : 'Unmute Audio';
  }
  
  if (volumeSlider) {
    volumeSlider.value = String(audioSettings.volume);
  }
}

// Event handling utilities
function addAudioControlListeners(element: HTMLElement, action: () => void) {
  element.addEventListener('click', action);
  element.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).blur();
    }
  });
}

// Keyboard event handling
window.addEventListener('keydown', (e) => {
  const keyToDir: Record<string, Dir | undefined> = {
    ArrowUp: 'up',    KeyW: 'up',
    ArrowDown: 'down',KeyS: 'down',
    ArrowLeft: 'left',KeyA: 'left',
    ArrowRight: 'right',KeyD: 'right',
  };
  
  if (e.code === 'Escape') {
    if (elements.menu?.classList.contains('show')) {
      closeMenu();
    } else if (gameStarted) {
      openMenu();
    }
    return;
  }
  
  if (e.code === 'KeyM') {
    toggleAudio();
    return;
  }
  
  if (e.code === 'Space') {
    if (elements.menu?.classList.contains('show')) return;
    
    const activeElement = document.activeElement;
    if (activeElement?.closest('#audioControls')) return;
    
    if (!gameStarted) {
      startNewGame();
    } else if (!state.isAlive()) {
      restartGame();
    } else {
      paused ? startGame() : pauseGame();
    }
    return;
  }
  
  const dir = keyToDir[e.code];
  if (dir) state.setDirection(dir, Date.now());
});

// Event listener setup
function setupEventListeners() {
  elements.startGame?.addEventListener('click', startNewGame);
  elements.rules?.addEventListener('click', () => {
    openMenu();
    switchTab('rules');
  });
  elements.restart?.addEventListener('click', restartGame);
  elements.mainMenu?.addEventListener('click', returnToMainMenu);
  elements.closeMenu?.addEventListener('click', closeMenu);
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName) switchTab(tabName);
    });
  });
  
  elements.menu?.addEventListener('click', (e) => {
    if (e.target === elements.menu) closeMenu();
  });
}

function setupAudioControls() {
  const audioToggle = document.getElementById('audioToggle');
  const volumeSlider = document.getElementById('volumeSlider');
  
  if (audioToggle) {
    addAudioControlListeners(audioToggle, toggleAudio);
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      setVolume(parseFloat(target.value));
    });
    
    volumeSlider.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).blur();
      }
    });
  }
}

function setupAudioContext() {
  const enableAudio = () => {
    audioManager.enableAudio();
    document.removeEventListener('click', enableAudio);
    document.removeEventListener('keydown', enableAudio);
  };
  
  document.addEventListener('click', enableAudio);
  document.addEventListener('keydown', enableAudio);
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupAudioControls();
  setupAudioContext();
  updateAudioUI();
});