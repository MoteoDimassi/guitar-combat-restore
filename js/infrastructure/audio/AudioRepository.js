export class AudioRepository {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.audioCache = new Map();
    this.metadataCache = new Map();
    
    // Соответствие нот и аудио файлов
    this.audioFiles = {
      'C1': 'audio/NotesMP3/C1.mp3',
      'C#1': 'audio/NotesMP3/C#1.mp3',
      'D1': 'audio/NotesMP3/D1.mp3',
      'D#1': 'audio/NotesMP3/D#1.mp3',
      'E1': 'audio/NotesMP3/E1.mp3',
      'F1': 'audio/NotesMP3/F1.mp3',
      'F#1': 'audio/NotesMP3/F#1.mp3',
      'G1': 'audio/NotesMP3/G1.mp3',
      'G#1': 'audio/NotesMP3/G#1.mp3',
      'A1': 'audio/NotesMP3/A1.mp3',
      'A#1': 'audio/NotesMP3/A#1.mp3',
      'B1': 'audio/NotesMP3/B1.mp3',
      'C2': 'audio/NotesMP3/C2.mp3',
      'C#2': 'audio/NotesMP3/C#2.mp3',
      'D2': 'audio/NotesMP3/D2.mp3',
      'D#2': 'audio/NotesMP3/D#2.mp3',
      'E2': 'audio/NotesMP3/E2.mp3',
      'F2': 'audio/NotesMP3/F2.mp3',
      'F#2': 'audio/NotesMP3/F#2.mp3',
      'G2': 'audio/NotesMP3/G2.mp3',
      'G#2': 'audio/NotesMP3/G#2.mp3',
      'A2': 'audio/NotesMP3/A2.mp3',
      'A#2': 'audio/NotesMP3/A#2.mp3',
      'B2': 'audio/NotesMP3/B2.mp3',
      'E3': 'audio/NotesMP3/E3.mp3',
      'F3': 'audio/NotesMP3/F3.mp3',
      'F#3': 'audio/NotesMP3/F#3.mp3',
      'G3': 'audio/NotesMP3/G3.mp3',
      'G#3': 'audio/NotesMP3/G#3.mp3',
      'Mute': 'audio/NotesMP3/Mute.mp3'
    };
  }

  /**
   * Получение аудио буфера
   */
  async getAudioBuffer(note, octave = 1) {
    const key = `${note}${octave}`;

    if (this.audioCache.has(key)) {
      return this.audioCache.get(key);
    }

    const audioBuffer = await this.audioEngine.loadSound(note, octave);
    this.audioCache.set(key, audioBuffer);

    return audioBuffer;
  }

  /**
   * Получение метаданных аудио
   */
  async getAudioMetadata(note, octave = 1) {
    const key = `${note}${octave}`;

    if (this.metadataCache.has(key)) {
      return this.metadataCache.get(key);
    }

    const audioBuffer = await this.getAudioBuffer(note, octave);
    const metadata = {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      length: audioBuffer.length,
      numberOfChannels: audioBuffer.numberOfChannels,
    };

    this.metadataCache.set(key, metadata);
    return metadata;
  }

  /**
   * Предзагрузка аудио
   */
  async preloadAudio(notes, octave = 1) {
    const promises = notes.map((note) => this.getAudioBuffer(note, octave));
    return Promise.all(promises);
  }

  /**
   * Предзагрузка всех звуков
   */
  async preloadAllSounds() {
    const allNotes = Object.keys(this.audioFiles);
    console.log("📦 Preloading all audio files...");
    
    const startTime = performance.now();
    
    try {
      const results = await this.preloadAudio(allNotes);
      const loadTime = performance.now() - startTime;
      
      console.log(`✅ Preloaded ${results.length} sounds in ${loadTime.toFixed(2)}ms`);
      return results;
    } catch (error) {
      console.error("❌ Failed to preload all sounds:", error);
      throw error;
    }
  }

  /**
   * Воспроизведение ноты
   */
  async playNote(note, octave = 1, options = {}) {
    try {
      const soundId = await this.audioEngine.playNote(note, octave, options);
      return soundId;
    } catch (error) {
      console.error(`Failed to play note ${note}${octave}:`, error);
      throw error;
    }
  }

  /**
   * Воспроизведение аккорда
   */
  async playChord(notes, octave = 1, options = {}) {
    try {
      const soundIds = await this.audioEngine.playChord(notes, octave, options);
      return soundIds;
    } catch (error) {
      console.error(`Failed to play chord ${notes.join("+")}:`, error);
      throw error;
    }
  }

  /**
   * Воспроизведение паттерна
   */
  async playPattern(pattern, options = {}) {
    try {
      const soundIds = await this.audioEngine.playWithPattern(pattern, options);
      return soundIds;
    } catch (error) {
      console.error("Failed to play pattern:", error);
      throw error;
    }
  }

  /**
   * Получение доступных нот
   */
  getAvailableNotes() {
    return Object.keys(this.audioFiles);
  }

  /**
   * Проверка наличия ноты
   */
  hasNote(note) {
    return note in this.audioFiles;
  }

  /**
   * Получение пути к аудио файлу
   */
  getAudioPath(note, octave = 1) {
    const key = `${note}${octave}`;
    return this.audioFiles[key] || null;
  }

  /**
   * Остановка всех звуков
   */
  stopAll(options = {}) {
    return this.audioEngine.stopAll(options);
  }

  /**
   * Установка громкости
   */
  setVolume(volume, options = {}) {
    return this.audioEngine.setVolume(volume, options);
  }

  /**
   * Получение текущей громкости
   */
  getVolume() {
    return this.audioEngine.getVolume();
  }

  /**
   * Получение аудио данных для визуализации
   */
  getAudioData(options = {}) {
    return this.audioEngine.getAudioData(options);
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      ...this.audioEngine.getStats(),
      cachedSounds: this.audioCache.size,
      cachedMetadata: this.metadataCache.size,
    };
  }

  /**
   * Очистка кеша
   */
  clearCache() {
    this.audioCache.clear();
    this.metadataCache.clear();
    console.log("🗑️ Audio cache cleared");
  }

  /**
   * Очистка кеша аудио буферов
   */
  clearAudioCache() {
    this.audioCache.clear();
    console.log("🗑️ Audio buffer cache cleared");
  }

  /**
   * Очистка кеша метаданных
   */
  clearMetadataCache() {
    this.metadataCache.clear();
    console.log("🗑️ Metadata cache cleared");
  }

  /**
   * Получение информации о кеше
   */
  getCacheInfo() {
    return {
      audioBuffers: this.audioCache.size,
      metadata: this.metadataCache.size,
      totalFiles: Object.keys(this.audioFiles).length,
    };
  }

  /**
   * Уничтожение репозитория
   */
  async destroy() {
    console.log("💥 Destroying AudioRepository...");
    
    // Очищаем кеши
    this.clearCache();
    
    console.log("✅ AudioRepository destroyed");
  }

  // Совместимость с существующим кодом
  async loadSound(note) {
    const octave = note.match(/\d+$/) ? parseInt(note.match(/\d+$/)[0]) : 1;
    const noteName = note.replace(/\d+$/, '');
    
    return await this.getAudioBuffer(noteName, octave);
  }

  async loadAllSounds() {
    return await this.preloadAllSounds();
  }
}

export default AudioRepository;