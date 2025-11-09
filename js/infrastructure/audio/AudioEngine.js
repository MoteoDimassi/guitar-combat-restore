import { EventBus } from "../../core/EventBus.js";
import { EventTypes } from "../../core/EventTypes.js";

export class AudioEngine {
  constructor(config = {}) {
    this.config = {
      sampleRate: 44100,
      bufferSize: 2048,
      volume: 0.8,
      muteVolume: 0.3,
      crossfadeTime: 0.05,
      maxConcurrentSounds: 8,
      preloadSounds: true,
      ...config,
    };

    this.eventBus = null;
    this.audioContext = null;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;

    // Управление звуками
    this.sounds = new Map();
    this.activeSounds = new Set();
    this.preloadedSounds = new Map();
    this.loadingPromises = new Map();

    // Пулы для оптимизации
    this.audioBufferPool = [];
    this.sourceNodePool = [];

    // Состояние
    this.isInitialized = false;
    this.isSuspended = false;
    this.currentVolume = this.config.volume;

    // Статистика
    this.stats = {
      soundsPlayed: 0,
      soundsLoaded: 0,
      errors: 0,
      averageLoadTime: 0,
    };
  }

  /**
   * Инициализация аудио движка
   */
  async initialize(eventBus = null) {
    try {
      this.eventBus = eventBus;

      console.log("🎵 Initializing AudioEngine...");

      // Создаем AudioContext
      await this.createAudioContext();

      // Настраиваем аудио граф
      this.setupAudioGraph();

      // Предзагрузка звуков
      if (this.config.preloadSounds) {
        await this.preloadEssentialSounds();
      }

      this.isInitialized = true;

      if (this.eventBus) {
        this.eventBus.emit(EventTypes.AUDIO_INITIALIZED, {
          sampleRate: this.audioContext.sampleRate,
          config: this.config,
        });
      }

      console.log("✅ AudioEngine initialized successfully");
    } catch (error) {
      console.error("❌ AudioEngine initialization failed:", error);
      throw error;
    }
  }

  /**
   * Создание AudioContext
   */
  async createAudioContext() {
    try {
      // Создаем AudioContext с поддержкой разных браузеров
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Web Audio API is not supported");
      }

      this.audioContext = new AudioContextClass({
        sampleRate: this.config.sampleRate,
      });

      // Обрабатываем автоматическое воспроизведение
      await this.handleAutoPlayPolicy();

      console.log("🔊 AudioContext created:", {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
      });
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
      throw error;
    }
  }

  /**
   * Обработка политики автовоспроизведения
   */
  async handleAutoPlayPolicy() {
    if (this.audioContext.state === "suspended") {
      this.isSuspended = true;

      // Добавляем обработчик для возобновления
      const resumeAudio = () => {
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume().then(() => {
            this.isSuspended = false;
            console.log("🔊 AudioContext resumed");
          });
        }
      };

      // Возобновляем при первом взаимодействии
      document.addEventListener("click", resumeAudio, { once: true });
      document.addEventListener("keydown", resumeAudio, { once: true });
      document.addEventListener("touchstart", resumeAudio, { once: true });
    }
  }

  /**
   * Настройка аудио графа
   */
  setupAudioGraph() {
    // Создаем узлы аудио графа
    this.masterGain = this.audioContext.createGain();
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.analyser = this.audioContext.createAnalyser();

    // Настраиваем компрессор
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Настраиваем анализатор
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Соединяем узлы
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    // Устанавливаем начальную громкость
    this.masterGain.gain.value = this.currentVolume;

    console.log("🔗 Audio graph setup complete");
  }

  /**
   * Предзагрузка основных звуков
   */
  async preloadEssentialSounds() {
    const essentialSounds = [
      "C1",
      "D1",
      "E1",
      "F1",
      "G1",
      "A1",
      "B1",
      "C2",
      "D2",
      "E2",
      "F2",
      "G2",
      "A2",
      "B2",
      "Mute",
    ];

    console.log("📦 Preloading essential sounds...");

    const startTime = performance.now();

    try {
      const loadPromises = essentialSounds.map((note) => {
        // Для "Mute" используем octave = 1, для остальных нот извлекаем октаву из имени
        if (note === "Mute") {
          return this.loadSound(note, 1).catch((error) => {
            console.warn(`Failed to preload ${note}:`, error);
            return null;
          });
        } else {
          // Извлекаем ноту и октаву из строки типа "C1", "D2" и т.д.
          const noteName = note.slice(0, -1);
          const octave = parseInt(note.slice(-1));
          return this.loadSound(noteName, octave).catch((error) => {
            console.warn(`Failed to preload ${note}:`, error);
            return null;
          });
        }
      });

      await Promise.all(loadPromises);

      const loadTime = performance.now() - startTime;
      this.stats.averageLoadTime = loadTime / essentialSounds.length;

      console.log(
        `✅ Preloaded ${essentialSounds.length} sounds in ${loadTime.toFixed(
          2
        )}ms`
      );
    } catch (error) {
      console.warn("⚠️ Some sounds failed to preload:", error);
    }
  }

  /**
   * Загрузка звука
   */
  async loadSound(note, octave = 1, options = {}) {
    const soundKey = `${note}${octave}`;

    // Возвращаем из кеша если уже загружен
    if (this.preloadedSounds.has(soundKey)) {
      return this.preloadedSounds.get(soundKey);
    }

    // Проверяем не загружается ли уже
    if (this.loadingPromises.has(soundKey)) {
      return this.loadingPromises.get(soundKey);
    }

    const startTime = performance.now();

    try {
      const loadPromise = this.doLoadSound(note, octave, options);
      this.loadingPromises.set(soundKey, loadPromise);

      const audioBuffer = await loadPromise;

      // Сохраняем в кеш
      this.preloadedSounds.set(soundKey, audioBuffer);
      this.loadingPromises.delete(soundKey);

      // Обновляем статистику
      this.stats.soundsLoaded++;
      const loadTime = performance.now() - startTime;
      this.updateAverageLoadTime(loadTime);

      console.log(`🎵 Loaded sound: ${soundKey} (${loadTime.toFixed(2)}ms)`);

      return audioBuffer;
    } catch (error) {
      this.loadingPromises.delete(soundKey);
      this.stats.errors++;
      console.error(`Failed to load sound ${soundKey}:`, error);
      throw error;
    }
  }

  /**
   * Загрузка аудио файла
   */
  async doLoadSound(note, octave, options) {
    const audioPath = this.getAudioPath(note, octave);

    try {
      const response = await fetch(audioPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio from ${audioPath}:`, error);
      throw error;
    }
  }

  /**
   * Воспроизведение ноты
   */
  async playNote(note, octave = 1, options = {}) {
    if (!this.isInitialized) {
      throw new Error("AudioEngine is not initialized");
    }

    const {
      volume = 1.0,
      startTime = 0,
      duration = null,
      fadeIn = 0.01,
      fadeOut = 0.1,
      pan = 0,
    } = options;

    try {
      // Загружаем звук если нужно
      const audioBuffer = await this.loadSound(note, octave);

      // Создаем источник
      const source = this.createSourceNode();
      source.buffer = audioBuffer;

      // Создаем узлы для управления
      const gainNode = this.audioContext.createGain();
      const panNode = this.audioContext.createStereoPanner();

      // Настраиваем панорамирование
      panNode.pan.value = pan;

      // Настраиваем громкость
      gainNode.gain.value = 0;

      // Применяем fade-in
      if (fadeIn > 0) {
        gainNode.gain.linearRampToValueAtTime(
          volume * this.currentVolume,
          this.audioContext.currentTime + startTime + fadeIn
        );
      } else {
        gainNode.gain.value = volume * this.currentVolume;
      }

      // Применяем fade-out
      if (duration !== null && fadeOut > 0) {
        const fadeOutStart = startTime + duration - fadeOut;
        gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + fadeOutStart + fadeOut
        );
      }

      // Соединяем узлы
      source.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(this.compressor);

      // Воспроизводим
      source.start(this.audioContext.currentTime + startTime);

      // Автоматически останавливаем
      if (duration !== null) {
        source.stop(this.audioContext.currentTime + startTime + duration);
      }

      // Управляем активными звуками
      const soundId = this.generateSoundId();
      this.activeSounds.add({
        id: soundId,
        source,
        gainNode,
        note,
        octave,
        startTime: this.audioContext.currentTime + startTime,
      });

      // Удаляем после воспроизведения
      source.onended = () => {
        this.removeActiveSound(soundId);
        this.returnSourceNode(source);
      };

      // Обновляем статистику
      this.stats.soundsPlayed++;

      // Генерируем событие
      if (this.eventBus) {
        this.eventBus.emit(EventTypes.AUDIO_NOTE_PLAYED, {
          note,
          octave,
          volume,
          duration,
          soundId,
        });
      }

      return soundId;
    } catch (error) {
      this.stats.errors++;
      console.error(`Failed to play note ${note}${octave}:`, error);
      throw error;
    }
  }

  /**
   * Воспроизведение аккорда
   */
  async playChord(notes, octave = 1, options = {}) {
    const {
      volume = 1.0,
      spread = 0.1, // Разброс времени между нотами
      arpeggio = false,
      ...noteOptions
    } = options;

    try {
      const soundIds = [];

      if (arpeggio) {
        // Арпеджио - ноты играются последовательно
        for (let i = 0; i < notes.length; i++) {
          const noteOptions = {
            ...noteOptions,
            volume: volume / notes.length,
            startTime: i * spread,
          };

          const soundId = await this.playNote(notes[i], octave, noteOptions);
          soundIds.push(soundId);
        }
      } else {
        // Аккорд - ноты играются одновременно
        const noteOptions = {
          ...noteOptions,
          volume: volume / notes.length,
        };

        const playPromises = notes.map((note) =>
          this.playNote(note, octave, noteOptions)
        );

        const chordSoundIds = await Promise.all(playPromises);
        soundIds.push(...chordSoundIds);
      }

      // Генерируем событие
      if (this.eventBus) {
        this.eventBus.emit(EventTypes.AUDIO_CHORD_PLAYED, {
          notes,
          octave,
          volume,
          soundIds,
          arpeggio,
        });
      }

      return soundIds;
    } catch (error) {
      console.error(`Failed to play chord ${notes.join("+")}:`, error);
      throw error;
    }
  }

  /**
   * Воспроизведение с паттерном
   */
  async playWithPattern(pattern, options = {}) {
    const { tempo = 120, loop = false, onBeat = null } = options;

    const beatDuration = 60 / tempo;

    try {
      const soundIds = [];

      for (let i = 0; i < pattern.length; i++) {
        const beat = pattern[i];

        if (beat.play) {
          const noteOptions = {
            volume: beat.volume || 1.0,
            startTime: i * beatDuration,
          };

          if (beat.muted) {
            noteOptions.volume *= this.config.muteVolume;
          }

          const soundId = await this.playNote(
            beat.note || "C",
            beat.octave || 1,
            noteOptions
          );
          soundIds.push(soundId);
        }

        // Вызываем колбэк для каждого бита
        if (onBeat) {
          setTimeout(() => onBeat(i, beat), i * beatDuration * 1000);
        }
      }

      return soundIds;
    } catch (error) {
      console.error("Failed to play pattern:", error);
      throw error;
    }
  }

  /**
   * Установка громкости
   */
  setVolume(volume, options = {}) {
    const { fadeTime = 0.1 } = options;

    volume = Math.max(0, Math.min(1, volume));

    if (fadeTime > 0 && this.masterGain) {
      const currentTime = this.audioContext.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(
        volume,
        currentTime + fadeTime
      );
    } else if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }

    this.currentVolume = volume;

    if (this.eventBus) {
      this.eventBus.emit("audio:volume:changed", { volume, fadeTime });
    }
  }

  /**
   * Установка частоты дискретизации
   */
  setSampleRate(sampleRate) {
    // В Web Audio API частота дискретизации не может быть изменена после создания AudioContext
    // Проверяем, пытаемся ли установить то же значение, что уже используется
    if (this.audioContext && this.audioContext.sampleRate === sampleRate) {
      // Значения совпадают, ничего не делаем
      return;
    }
    
    // Сохраняем в конфигурации для возможного использования при пересоздании AudioContext
    this.config.sampleRate = sampleRate;
    
    // Только выводим информационное сообщение, а не предупреждение
    if (this.audioContext) {
      console.info(`AudioEngine: Requested sampleRate(${sampleRate}) differs from current(${this.audioContext.sampleRate}) - using current sampleRate`);
    }
  }

  /**
   * Установка размера буфера
   */
  setBufferSize(bufferSize) {
    // В Web Audio API размер буфера не может быть изменен после создания AudioContext
    // Проверяем, пытаемся ли установить то же значение, что уже используется
    if (this.audioContext && this.audioContext.baseLatency) {
      // bufferSize не хранится в AudioContext, но мы можем сохранить значение
      if (this.config.bufferSize === bufferSize) {
        // Значения совпадают, ничего не делаем
        return;
      }
    }
    
    // Сохраняем в конфигурации для возможного использования при пересоздании AudioContext
    this.config.bufferSize = bufferSize;
    
    // Только выводим информационное сообщение, а не предупреждение
    console.info(`AudioEngine: bufferSize set to ${bufferSize} (note: bufferSize cannot be changed after AudioContext creation)`);
  }

  /**
   * Установка максимального количества одновременно воспроизводимых звуков
   */
  setMaxConcurrentSounds(maxSounds) {
    this.config.maxConcurrentSounds = maxSounds;
    console.log(`AudioEngine: maxConcurrentSounds set to ${maxSounds}`);
  }

  /**
   * Получение текущей громкости
   */
  getVolume() {
    return this.currentVolume;
  }

  /**
   * Остановка всех звуков
   */
  stopAll(options = {}) {
    const { fadeTime = 0.1 } = options;

    if (fadeTime > 0) {
      // Плавное затухание
      this.setVolume(0, { fadeTime });

      setTimeout(() => {
        this.stopAllImmediate();
        this.setVolume(this.currentVolume);
      }, fadeTime * 1000);
    } else {
      this.stopAllImmediate();
    }
  }

  /**
   * Немедленная остановка всех звуков
   */
  stopAllImmediate() {
    for (const sound of this.activeSounds) {
      try {
        sound.source.stop();
        sound.source.disconnect();
      } catch (error) {
        // Игнорируем ошибки при остановке уже остановленных звуков
      }
    }

    this.activeSounds.clear();

    if (this.eventBus) {
      this.eventBus.emit("audio:stopped", { immediate: true });
    }
  }

  /**
   * Получение аудио данных для визуализации
   */
  getAudioData(options = {}) {
    if (!this.analyser) {
      return null;
    }

    const { fftSize = 2048, smoothingTimeConstant = 0.8 } = options;

    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = smoothingTimeConstant;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(dataArray);

    return {
      frequencyData: dataArray,
      bufferLength,
      sampleRate: this.audioContext.sampleRate,
    };
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      ...this.stats,
      activeSounds: this.activeSounds.size,
      preloadedSounds: this.preloadedSounds.size,
      loadingSounds: this.loadingPromises.size,
      currentVolume: this.currentVolume,
      contextState: this.audioContext?.state,
      sampleRate: this.audioContext?.sampleRate,
    };
  }

  /**
   * Уничтожение аудио движка
   */
  async destroy() {
    console.log("💥 Destroying AudioEngine...");

    // Останавливаем все звуки
    this.stopAllImmediate();

    // Закрываем AudioContext
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn("Warning: Failed to close AudioContext:", error);
      }
    }

    // Очищаем ресурсы
    this.sounds.clear();
    this.preloadedSounds.clear();
    this.loadingPromises.clear();
    this.activeSounds.clear();
    this.audioBufferPool = [];
    this.sourceNodePool = [];

    this.isInitialized = false;

    console.log("✅ AudioEngine destroyed");
  }

  /**
   * Получение пути к аудио файлу
   */
  getAudioPath(note, octave) {
    // Для Mute используем специальное имя файла без октавы
    if (note === "Mute") {
      return `./audio/NotesMP3/Mute.mp3`;
    }
    // Для остальных нот используем стандартный формат
    return `./audio/NotesMP3/${note}${octave}.mp3`;
  }

  /**
   * Создание источника звука из пула
   */
  createSourceNode() {
    if (this.sourceNodePool.length > 0) {
      return this.sourceNodePool.pop();
    }

    return this.audioContext.createBufferSource();
  }

  /**
   * Возврат источника звука в пул
   */
  returnSourceNode(source) {
    if (this.sourceNodePool.length < 10) {
      this.sourceNodePool.push(source);
    }
  }

  /**
   * Удаление активного звука
   */
  removeActiveSound(soundId) {
    for (const sound of this.activeSounds) {
      if (sound.id === soundId) {
        this.activeSounds.delete(sound);
        break;
      }
    }
  }

  /**
   * Генерация ID звука
   */
  generateSoundId() {
    return `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Обновление среднего времени загрузки
   */
  updateAverageLoadTime(loadTime) {
    const totalSounds = this.stats.soundsLoaded;
    this.stats.averageLoadTime =
      (this.stats.averageLoadTime * (totalSounds - 1) + loadTime) / totalSounds;
  }

  // Совместимость с существующим кодом
  getAudioContext() {
    if (!this.isInitialized) {
      throw new Error('AudioEngine not initialized');
    }
    return this.audioContext;
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