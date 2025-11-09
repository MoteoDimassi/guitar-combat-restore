class AudioPlayer {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.sounds = new Map();
    this.volume = 1.0;
  }

  async loadSound(name, url) {
    try {
      const audioBuffer = await this.audioEngine.loadSound(url);
      this.sounds.set(name, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
      throw error;
    }
  }

  playSound(name, volume = null, when = 0) {
    const audioBuffer = this.sounds.get(name);
    if (!audioBuffer) {
      console.warn(`Sound ${name} not found`);
      return null;
    }

    const actualVolume = volume !== null ? volume : this.volume;
    return this.audioEngine.playSound(audioBuffer, actualVolume, when);
  }

  playChord(notes, volume = null, when = 0) {
    const sources = [];
    const actualVolume = volume !== null ? volume : this.volume;
    
    notes.forEach(noteName => {
      const source = this.playSound(noteName, actualVolume, when);
      if (source) {
        sources.push(source);
      }
    });
    
    return sources;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume() {
    return this.volume;
  }

  hasSound(name) {
    return this.sounds.has(name);
  }

  unloadSound(name) {
    return this.sounds.delete(name);
  }

  unloadAllSounds() {
    this.sounds.clear();
  }
}

export default AudioPlayer;