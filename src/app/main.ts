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
const audioManager = state.getAudioManager();

// High score management
let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
highScoreEl.textContent = String(highScore);

let audioEnabled = localStorage.getItem('snakeAudioEnabled') !== 'false';
let volumeLevel = parseFloat(localStorage.getItem('snakeVolume') || '0.7');

if (!audioEnabled) {
  audioManager.mute();
}
audioManager.setVolume(volumeLevel);

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

function hideStartScreen() {
  startScreen?.classList.add('hide');
  audioManager.playBackgroundMusic();
}

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

function openMenu() {
  menu?.classList.add('show');
  if (!paused && state.isAlive()) {
    pause();
  }
}

function closeMenu() {
  menu?.classList.remove('show');
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

function showCurrentEffects() {
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
  
  audioManager.playBackgroundMusic();
  
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
  
  if (startScreen) {
    startScreen.style.transition = '';
    startScreen.style.opacity = '';
    startScreen.style.transform = '';
    startScreen.classList.remove('hide');
  }
}

function startNewGame() {
  if (startScreen) {
    startScreen.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    startScreen.style.opacity = '0';
    startScreen.style.transform = 'scale(0.95) translateY(-20px)';
  }
  
  setTimeout(() => {
    gameStarted = true;
    hideStartScreen();
    hideOverlay();
    paused = false;
    state.resume(Date.now());
    scheduleNext(Date.now());
  }, 800);
}

function toggleAudio() {
  if (audioManager.isMuted()) {
    audioManager.unmute();
    audioEnabled = true;
    localStorage.setItem('snakeAudioEnabled', 'true');
  } else {
    audioManager.mute();
    audioEnabled = false;
    localStorage.setItem('snakeAudioEnabled', 'false');
  }
  updateAudioUI();
}

function setVolume(volume: number) {
  volumeLevel = volume;
  audioManager.setVolume(volume);
  localStorage.setItem('snakeVolume', String(volume));
  updateAudioUI();
}

function updateAudioUI() {
  const audioBtn = document.getElementById('audioToggle');
  const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
  
  if (audioBtn) {
    audioBtn.innerHTML = audioEnabled ? '🔊' : '🔇';
    audioBtn.title = audioEnabled ? 'Mute Audio' : 'Unmute Audio';
  }
  
  if (volumeSlider) {
    volumeSlider.value = String(volumeLevel);
  }
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
  
  if (e.code === 'KeyM') {
    toggleAudio();
    return;
  }
  
  if (e.code === 'Space') {
    if (menu?.classList.contains('show')) {
      return;
    }
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.id === 'audioToggle' || 
      activeElement.id === 'volumeSlider' ||
      activeElement.closest('#audioControls')
    )) {
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

startGameBtn?.addEventListener('click', startNewGame);
rulesBtn?.addEventListener('click', () => {
  openMenu();
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


closeMenuBtn?.addEventListener('click', closeMenu);

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    if (tabName) {
      switchTab(tabName);
    }
  });
});

menu?.addEventListener('click', (e) => {
  if (e.target === menu) {
    closeMenu();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking game over elements...');
  
  const gameOverScreenLoaded = document.getElementById('gameOverScreen');
  const mainMenuBtnLoaded = document.getElementById('mainMenuBtn');
  const restartBtnLoaded = document.getElementById('restartBtn');
  
  console.log('DOM loaded elements:', {
    gameOverScreen: !!gameOverScreenLoaded,
    mainMenuBtn: !!mainMenuBtnLoaded,
    restartBtn: !!restartBtnLoaded
  });
  
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
  
  const audioToggle = document.getElementById('audioToggle');
  const volumeSlider = document.getElementById('volumeSlider');
  
  if (audioToggle) {
    audioToggle.addEventListener('click', toggleAudio);
    audioToggle.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        // Make the button lose focus so space can work for game controls
        (e.target as HTMLElement).blur();
      }
    });
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
  
  updateAudioUI();
  
  const enableAudio = () => {
    audioManager.enableAudio();
    document.removeEventListener('click', enableAudio);
    document.removeEventListener('keydown', enableAudio);
  };
  
  document.addEventListener('click', enableAudio);
  document.addEventListener('keydown', enableAudio);
});