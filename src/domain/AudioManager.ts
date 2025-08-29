export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private muted = false;
  private volume = 0.7;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      await this.loadCustomSounds();
      
      this.backgroundMusic = new Audio();
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = this.volume * 0.5; 
      
      try {
        const response = await fetch('/src/assets/background-music.wav', { method: 'HEAD' });
        if (response.ok) {
          this.backgroundMusic.src = '/src/assets/background-music.wav';
          console.log('Background music loaded');
        }
      } catch (error) {
        console.log('Background music not found, will use silence');
      }
      
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.warn('Audio system could not be initialized:', error);
    }
  }

  private async loadCustomSounds() {
    if (!this.audioContext) return;

    const customSounds = [
      { name: 'cherry', file: '/src/assets/cherry-sound.wav' },
      { name: 'banana', file: '/src/assets/banana-sound.mp3' },
      { name: 'coconut', file: '/src/assets/coconut-sound.wav' },
      { name: 'pineapple', file: '/src/assets/pineapple-sound.wav' },
      { name: 'pizza', file: '/src/assets/pizza-sound.mp3' },
      { name: 'mushroom', file: '/src/assets/mushroom-sound.mp3' },
      { name: 'gameOver', file: '/src/assets/game-over-sound.wav' },
      { name: 'gameStart', file: '/src/assets/game-start-sound.mp3' },
      { name: 'pause', file: '/src/assets/pause-sound.wav' },
      { name: 'resume', file: '/src/assets/resume-sound.wav' },
      { name: 'heal', file: '/src/assets/heal.wav' },
      { name: 'block', file: '/src/assets/block.wav' },
      { name: 'dead', file: '/src/assets/dead.mp3' }
    ];

    // Load each custom sound
    for (const sound of customSounds) {
      try {
        await this.loadCustomSound(sound.name, sound.file);
        console.log(`Custom sound loaded: ${sound.name}`);
      } catch (error) {
        console.warn(`Could not load custom sound ${sound.name}:`, error);
      }
    }
  }

  async loadCustomSound(name: string, audioFile: string): Promise<void> {
    try {
      const response = await fetch(audioFile);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      
      if (this.audioContext) {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds.set(name, audioBuffer);
        console.log(`Custom sound loaded: ${name}`);
      }
    } catch (error) {
      console.warn(`Could not load custom sound ${name}:`, error);
      throw error;
    }
  }

  playSound(soundName: string): void {
    if (this.muted || !this.audioContext) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      gainNode.gain.value = this.volume;
      source.start(0);
    } catch (error) {
      console.warn(`Could not play sound ${soundName}:`, error);
    }
  }

  playFoodSound(foodType: string): void {
    // Map food types to sound names
    const soundMap: Record<string, string> = {
      'cherry': 'cherry',
      'banana': 'banana',
      'coconut': 'coconut',
      'pineapple': 'pineapple',
      'pizza': 'pizza',
      'mushroom': 'mushroom'
    };

    const soundName = soundMap[foodType];
    if (soundName) {
      this.playSound(soundName);
    }
  }

  playBackgroundMusic(musicFile?: string): void {
    if (this.muted || !this.backgroundMusic) return;

    if (musicFile) {
      this.backgroundMusic.src = musicFile;
    }

    this.backgroundMusic.play().catch(error => {
      console.warn('Could not play background music:', error);
    });
  }

  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  resumeBackgroundMusic(): void {
    if (this.backgroundMusic && !this.muted) {
      this.backgroundMusic.play().catch(error => {
        console.warn('Could not resume background music:', error);
      });
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume * 0.5;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  mute(): void {
    this.muted = true;
    this.pauseBackgroundMusic();
  }

  unmute(): void {
    this.muted = false;
    this.resumeBackgroundMusic();
  }

  isMuted(): boolean {
    return this.muted;
  }

  enableAudio(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
