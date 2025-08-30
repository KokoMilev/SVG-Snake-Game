import { Board } from '../domain/Board';
import { GameState } from '../domain/GameState';
import type { Dir, Skin } from '../domain/types';
import { SvgRenderer } from '../ui/SvgRenderer';
import { 
  GAME_CONFIG, 
  getResponsiveBoardConfig,
  SKIN_UNLOCK_THRESHOLDS, 
  STORAGE_KEYS 
} from '../domain/constants';

interface GameElements {
  score: HTMLSpanElement;
  highScore: HTMLSpanElement;
  overlay: HTMLDivElement;
  menu: HTMLDivElement;
  closeMenu: HTMLButtonElement;
  startScreen: HTMLDivElement;
  startGame: HTMLButtonElement;
  skins: HTMLButtonElement;
  rules: HTMLButtonElement;
  gameOver: HTMLDivElement;
  finalScore: HTMLSpanElement;
  gameOverHighScore: HTMLSpanElement;
  restart: HTMLButtonElement;
  mainMenu: HTMLButtonElement;
  skinsScreen: HTMLDivElement;
  closeSkins: HTMLButtonElement;
  backToMenu: HTMLButtonElement;
}

interface AudioSettings {
  enabled: boolean;
  volume: number;
}

function getRequiredElement<T extends Element>(selector: string, context: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector} (${context})`);
  }
  return element;
}

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

let board: Board;
let state: GameState;
let renderer: SvgRenderer;

try {
  validateGameConfig();
  const responsiveConfig = getResponsiveBoardConfig();
  board = new Board(responsiveConfig.cols, responsiveConfig.rows);
  state = new GameState(board, GAME_CONFIG.START_POSITION, 'right', GAME_CONFIG.BASE_TICK_MS);
  renderer = new SvgRenderer(getRequiredElement('#game', 'game container'), responsiveConfig.cols, responsiveConfig.rows, responsiveConfig.cellSize);
} catch (error) {
  console.error('Failed to initialize game:', error);
  throw error;
}

// Add window resize handler for responsive board
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    try {
      const newConfig = getResponsiveBoardConfig();
      const currentConfig = { cols: board.getWidth(), rows: board.getHeight() };
      
      // Only resize if dimensions actually changed
      if (newConfig.cols !== currentConfig.cols || newConfig.rows !== currentConfig.rows) {
        // Stop any currently playing background music before creating new state
        audioManager.stopBackgroundMusic();
        
        // Create new board and game state with new dimensions
        const newBoard = new Board(newConfig.cols, newConfig.rows);
        const newState = new GameState(newBoard, GAME_CONFIG.START_POSITION, 'right', GAME_CONFIG.BASE_TICK_MS);
        
        // Update references
        board = newBoard;
        state = newState;
        
        // Update audio manager reference to use the new state's audio manager
        const newAudioManager = state.getAudioManager();
        if (newAudioManager) {
          // Apply current audio settings to the new audio manager
          if (!audioSettings.enabled) {
            newAudioManager.mute();
          }
          newAudioManager.setVolume(audioSettings.volume);
          
          // Update the global audio manager reference
          audioManager = newAudioManager;
        }
        
        // Resize the renderer
        renderer.resize(newConfig.cols, newConfig.rows, newConfig.cellSize);
        
         if (gameStarted && !paused) {
           paused = true;
           gameStarted = false;
           showOverlay('Screen resized — Click Space to Restart');
         }
      }
    } catch (error) {
      console.error('Failed to resize game board:', error);
    }
  }, 250); // Debounce resize events
});


const elements: GameElements = {
  score: getRequiredElement<HTMLSpanElement>('#score', 'score display'),
  highScore: getRequiredElement<HTMLSpanElement>('#highScore', 'high score display'),
  overlay: getRequiredElement<HTMLDivElement>('#overlay', 'game overlay'),
  menu: getRequiredElement<HTMLDivElement>('#menu', 'game menu'),
  closeMenu: getRequiredElement<HTMLButtonElement>('#closeMenu', 'close menu button'),
  startScreen: getRequiredElement<HTMLDivElement>('#startScreen', 'start screen'),
  startGame: getRequiredElement<HTMLButtonElement>('#startGameBtn', 'start game button'),
  skins: getRequiredElement<HTMLButtonElement>('#skinsBtn', 'skins button'),
  rules: getRequiredElement<HTMLButtonElement>('#rulesBtn', 'rules button'),
  gameOver: getRequiredElement<HTMLDivElement>('#gameOverScreen', 'game over screen'),
  finalScore: getRequiredElement<HTMLSpanElement>('#finalScore', 'final score display'),
  gameOverHighScore: getRequiredElement<HTMLSpanElement>('#gameOverHighScore', 'game over high score'),
  restart: getRequiredElement<HTMLButtonElement>('#restartBtn', 'restart button'),
  mainMenu: getRequiredElement<HTMLButtonElement>('#mainMenuBtn', 'main menu button'),
  skinsScreen: getRequiredElement<HTMLDivElement>('#skinsScreen', 'skins screen'),
  closeSkins: getRequiredElement<HTMLButtonElement>('#closeSkins', 'close skins button'),
  backToMenu: getRequiredElement<HTMLButtonElement>('#backToMenu', 'back to menu button')
};

const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');
let audioManager = state.getAudioManager();

let highScore = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0');
let audioSettings: AudioSettings = {
  enabled: localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED) !== 'false',
  volume: parseFloat(localStorage.getItem(STORAGE_KEYS.VOLUME) || '0.7')
};

let currentSkin: Skin = (localStorage.getItem(STORAGE_KEYS.SKIN) as Skin) || 'basic';

// Validate the saved skin
if (!Object.keys(SKIN_UNLOCK_THRESHOLDS).includes(currentSkin)) {
  currentSkin = 'basic';
  localStorage.setItem(STORAGE_KEYS.SKIN, 'basic');
}

if (!audioSettings.enabled) {
  audioManager.mute();
}
audioManager.setVolume(audioSettings.volume);

// Set initial skin
renderer.setSkin(currentSkin);

elements.highScore.textContent = String(highScore);

function updateHighScore(score: number) {
  if (score > highScore) {
    highScore = score;
    elements.highScore.textContent = String(highScore);
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, String(highScore));
    
    // Update skin UI when high score changes
    updateSkinUI();
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
  // Play gameplay background music when starting a new game
  audioManager.playBackgroundMusic('/src/assets/background-music.wav');
}

function showGameOver() {
  if (elements.gameOver && elements.finalScore && elements.gameOverHighScore) {
    elements.finalScore.textContent = String(state.getScore());
    elements.gameOverHighScore.textContent = String(highScore);
    elements.gameOver.classList.add('show');
    
    // Stop background music when player dies
    audioManager.stopBackgroundMusic();
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

let paused = true;
let timer: number | null = null;
let gameStarted = false;
let isTransitioning = false;
let lastSpacePress = 0;

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
  
  // Play gameplay background music when restarting
  audioManager.playBackgroundMusic('/src/assets/background-music.wav');
  startGame();
}

function returnToMainMenu() {
  gameStarted = false;
  paused = true;
  clearGameTimer();
  resetGameState();
  hideGameOver();
  
  // Stop background music when returning to start screen
  audioManager.stopBackgroundMusic();
  
  if (elements.startScreen) {
    elements.startScreen.style.transition = '';
    elements.startScreen.style.opacity = '';
    elements.startScreen.style.transform = '';
    elements.startScreen.classList.remove('hide');
  }
}

function startNewGame() {
  if (isTransitioning) return;
  
  isTransitioning = true;
  
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
    isTransitioning = false;
    state.resume(Date.now());
    scheduleNextFrame(Date.now());
  }, GAME_CONFIG.ANIMATION_DELAY);
}

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

function toggleAudio() {
  if (audioManager.isMuted()) {
    audioManager.unmute();
    audioSettings.enabled = true;
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, 'true');
  } else {
    audioManager.mute();
    audioSettings.enabled = false;
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, 'false');
  }
  updateAudioUI();
}

function setVolume(volume: number) {
  audioSettings.volume = volume;
  audioManager.setVolume(volume);
  localStorage.setItem(STORAGE_KEYS.VOLUME, String(volume));
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

function updateSkinUI() {
  const skinItems = document.querySelectorAll('.skin-item');
  skinItems.forEach(item => {
    const skinType = item.getAttribute('data-skin') as Skin;
    const isUnlocked = isSkinUnlocked(skinType);
    const isSelected = skinType === currentSkin;
    
    item.classList.toggle('unlocked', isUnlocked);
    item.classList.toggle('locked', !isUnlocked);
    item.classList.toggle('selected', isSelected);
    
    // Update skin status text
    const statusElement = item.querySelector('.skin-status');
    if (statusElement) {
      if (isUnlocked) {
        statusElement.textContent = isSelected ? '✅ Selected' : '✅ Unlocked';
      } else {
        if (skinType === 'golden') {
          statusElement.textContent = `🔒 Score ${SKIN_UNLOCK_THRESHOLDS.golden - highScore} more to unlock`;
        } else if (skinType === 'neon') {
          statusElement.textContent = `🔒 Score ${SKIN_UNLOCK_THRESHOLDS.neon - highScore} more to unlock`;
        }
      }
    }
    
    if (isUnlocked) {
      item.classList.remove('locked');
      (item as HTMLElement).style.cursor = 'pointer';
    } else {
      item.classList.add('locked');
      (item as HTMLElement).style.cursor = 'not-allowed';
    }
  });
}

function isSkinUnlocked(skin: Skin): boolean {
  if (skin === 'basic') return true;
  if (skin === 'golden') return highScore >= SKIN_UNLOCK_THRESHOLDS.golden;
  if (skin === 'neon') return highScore >= SKIN_UNLOCK_THRESHOLDS.neon;
  return false;
}

function selectSkin(skin: Skin) {
  if (!isSkinUnlocked(skin)) return;
  
  currentSkin = skin;
  localStorage.setItem(STORAGE_KEYS.SKIN, skin);
  renderer.setSkin(skin);
  
  // Update UI to show the selected skin
  const skinItems = document.querySelectorAll('.skin-item');
  skinItems.forEach(item => {
    const skinType = item.getAttribute('data-skin') as Skin;
    if (skinType === skin) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  updateSkinUI();
}

function showSkinsScreen() {
  elements.skinsScreen?.classList.add('show');
  updateSkinUI();
  
  // Highlight the currently selected skin
  const skinItems = document.querySelectorAll('.skin-item');
  skinItems.forEach(item => {
    const skinType = item.getAttribute('data-skin') as Skin;
    if (skinType === currentSkin) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

function hideSkinsScreen() {
  elements.skinsScreen?.classList.remove('show');
}

function openSkins() {
  showSkinsScreen();
}

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
    if (elements.skinsScreen?.classList.contains('show')) return;
    
    const activeElement = document.activeElement;
    if (activeElement?.closest('#audioControls')) return;
    
    if (isTransitioning) return;
    
    // Debounce rapid space presses (minimum 100ms between presses)
    const now = Date.now();
    if (now - lastSpacePress < 100) return;
    lastSpacePress = now;
    
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

function setupEventListeners() {
  elements.startGame?.addEventListener('click', startNewGame);
  elements.skins?.addEventListener('click', openSkins);
  elements.rules?.addEventListener('click', () => {
    openMenu();
    switchTab('rules');
  });
  elements.restart?.addEventListener('click', restartGame);
  elements.mainMenu?.addEventListener('click', returnToMainMenu);
  elements.closeMenu?.addEventListener('click', closeMenu);
  elements.closeSkins?.addEventListener('click', hideSkinsScreen);
  elements.backToMenu?.addEventListener('click', hideSkinsScreen);
  
  // Add skin item click listeners
  document.querySelectorAll('.skin-item').forEach(item => {
    item.addEventListener('click', () => {
      const skinType = item.getAttribute('data-skin') as Skin;
      if (skinType && isSkinUnlocked(skinType)) {
        selectSkin(skinType);
      }
    });
  });
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName) switchTab(tabName);
    });
  });
  
  elements.menu?.addEventListener('click', (e) => {
    if (e.target === elements.menu) closeMenu();
  });
  
  elements.skinsScreen?.addEventListener('click', (e) => {
    if (e.target === elements.skinsScreen) hideSkinsScreen();
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

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupAudioControls();
  setupAudioContext();
  updateAudioUI();
});
  