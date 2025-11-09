class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  getAudioContext() {
    if (!this.isInitialized) {
      throw new Error('AudioEngine not initialized');
    }
    return this.audioContext;
  }

  async loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  playSound(audioBuffer, volume = 1.0, when = 0) {
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    gainNode.gain.value = volume;
    source.start(when);
    
    return source;
  }

  setVolume(volume) {
    // Глобальная установка громкости
    this.masterVolume = volume;
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }
}

export default AudioEngine;