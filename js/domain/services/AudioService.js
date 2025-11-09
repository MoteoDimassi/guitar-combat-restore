import { EventTypes } from "../../core/EventTypes.js";

export class AudioService {
  constructor(eventBus, stateManager, audioEngine) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.audioEngine = audioEngine;

    this.activePlayback = null;
    this.metronomeEnabled = false;
    this.currentPattern = null;

    this.setupEventSubscriptions();
  }

  /**
   * Инициализация сервиса
   */
  async initialize() {
    try {
      console.log("🎵 Initializing AudioService...");

      // Подписываемся на изменения состояния
      this.setupStateSubscriptions();

      console.log("✅ AudioService initialized");
    } catch (error) {
      console.error("❌ AudioService initialization failed:", error);
      throw error;
    }
  }

  /**
   * Настройка подписок на события
   */
  setupEventSubscriptions() {
    // Воспроизведение аккордов
    this.eventBus.on(EventTypes.CHORDS_PARSED, (event) => {
      this.handleChordsParsed(event.data);
    });

    // Управление воспроизведением
    this.eventBus.on(EventTypes.PLAYBACK_STARTED, () => {
      this.startPlayback();
    });

    this.eventBus.on(EventTypes.PLAYBACK_STOPPED, () => {
      this.stopPlayback();
    });

    // Изменение громкости
    this.eventBus.on(EventTypes.VOLUME_CHANGED, (event) => {
      this.handleVolumeChange(event.data);
    });

    // Генерация случайного боя
    this.eventBus.on("generate:strum", () => {
      this.generateRandomStrum();
    });
  }

  /**
   * Настройка подписок на состояние
   */
  setupStateSubscriptions() {
    // Подписка на изменения темпа
    this.stateManager.subscribe("settings.bpm", (bpm) => {
      this.updateTempo(bpm);
    });

    // Подписка на изменения аккордов
    this.stateManager.subscribe("chords.validChords", (chords) => {
      this.updateChords(chords);
    });

    // Подписка на изменения тактов
    this.stateManager.subscribe("bars", (bars) => {
      this.updateBars(bars);
    });
  }

  /**
   * Воспроизведение аккорда
   */
  async playChord(chordName, options = {}) {
    try {
      const chord = this.parseChordName(chordName);
      const notes = chord.notes || [chord.root];

      const soundIds = await this.audioEngine.playChord(
        notes,
        chord.octave || 1,
        {
          volume: options.volume || 1.0,
          arpeggio: options.arpeggio || false,
          spread: options.spread || 0.05,
        }
      );

      return soundIds;
    } catch (error) {
      console.error(`Failed to play chord ${chordName}:`, error);
      throw error;
    }
  }

  /**
   * Воспроизведение паттерна боя
   */
  async playStrumPattern(pattern, options = {}) {
    try {
      const {
        tempo = this.stateManager.getState("settings.bpm"),
        loop = false,
        chord = null,
      } = options;

      // Преобразуем паттерн в формат для аудио движка
      const audioPattern = this.convertPatternToAudio(pattern, chord);

      const soundIds = await this.audioEngine.playWithPattern(audioPattern, {
        tempo,
        loop,
        onBeat: (beatIndex, beat) => {
          this.handleBeatPlayback(beatIndex, beat);
        },
      });

      this.currentPattern = {
        pattern: audioPattern,
        soundIds,
        tempo,
        loop,
      };

      return soundIds;
    } catch (error) {
      console.error("Failed to play strum pattern:", error);
      throw error;
    }
  }

  /**
   * Начало воспроизведения
   */
  async startPlayback() {
    try {
      const bars = this.stateManager.getState("bars");
      const currentBarIndex = this.stateManager.getState("currentBarIndex");

      if (bars.length === 0) {
        console.warn("No bars to play");
        return;
      }

      const currentBar = bars[currentBarIndex];
      if (!currentBar) {
        console.warn("Current bar not found");
        return;
      }

      // Получаем паттерн для текущего такта
      const pattern = this.extractPatternFromBar(currentBar);

      // Воспроизводим паттерн
      await this.playStrumPattern(pattern, {
        tempo: this.stateManager.getState("settings.bpm"),
        loop: true,
      });

      console.log("🎵 Playback started");
    } catch (error) {
      console.error("Failed to start playback:", error);
      throw error;
    }
  }

  /**
   * Остановка воспроизведения
   */
  stopPlayback() {
    try {
      if (this.currentPattern) {
        // Останавливаем текущий паттерн
        this.audioEngine.stopAll({ fadeTime: 0.2 });
        this.currentPattern = null;
      }

      console.log("⏹️ Playback stopped");
    } catch (error) {
      console.error("Failed to stop playback:", error);
    }
  }

  /**
   * Генерация случайного боя
   */
  async generateRandomStrum() {
    try {
      const beatCount = this.stateManager.getState("settings.beatCount");
      const randomPattern = this.generateRandomPattern(beatCount);

      // Обновляем состояние стрелочек
      this.stateManager.setState("ui.arrowsPattern", randomPattern);

      // Воспроизводим сгенерированный паттерн
      await this.playStrumPattern(randomPattern);

      console.log("🎲 Random strum generated and played");
    } catch (error) {
      console.error("Failed to generate random strum:", error);
    }
  }

  /**
   * Обработка изменений громкости
   */
  handleVolumeChange(data) {
    const { type, value } = data;

    if (type === "strum") {
      this.audioEngine.setVolume(value / 100);
    } else if (type === "metronome") {
      // Обработка громкости метронома
      this.updateMetronomeVolume(value / 100);
    }
  }

  /**
   * Обработка воспроизведения бита
   */
  handleBeatPlayback(beatIndex, beat) {
    // Генерируем событие для UI
    this.eventBus.emit("playback:beat", {
      beatIndex,
      beat,
      timestamp: Date.now(),
    });

    // Обновляем состояние воспроизведения
    this.stateManager.setState("playback.currentBeat", beatIndex);
  }

  /**
   * Преобразование паттерна в аудио формат
   */
  convertPatternToAudio(pattern, chord = null) {
    return pattern.map((beat, index) => ({
      play: beat.play || false,
      muted: beat.muted || false,
      volume: beat.volume || 1.0,
      note: chord || "C",
      octave: 1,
      duration: beat.duration || 0.1,
    }));
  }

  /**
   * Извлечение паттерна из такта
   */
  extractPatternFromBar(bar) {
    if (!bar.beatUnits) {
      return [];
    }

    return bar.beatUnits.map((beatUnit) => ({
      play: beatUnit.isPlayed(),
      muted: beatUnit.isMuted(),
      volume: beatUnit.isMuted() ? 0.3 : 1.0,
      duration: 0.1,
    }));
  }

  /**
   * Генерация случайного паттерна
   */
  generateRandomPattern(beatCount) {
    const pattern = [];

    for (let i = 0; i < beatCount; i++) {
      const rand = Math.random();

      if (rand < 0.6) {
        // 60% - играем ноту
        pattern.push({
          play: true,
          muted: false,
          volume: 1.0,
        });
      } else if (rand < 0.8) {
        // 20% - приглушенная нота
        pattern.push({
          play: true,
          muted: true,
          volume: 0.3,
        });
      } else {
        // 20% - пропускаем
        pattern.push({
          play: false,
          muted: false,
          volume: 0,
        });
      }
    }

    // Первую долю всегда играем
    if (pattern.length > 0) {
      pattern[0] = {
        play: true,
        muted: false,
        volume: 1.0,
      };
    }

    return pattern;
  }

  /**
   * Парсинг названия аккорда
   */
  parseChordName(chordName) {
    // Упрощенный парсинг аккордов
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);

    if (!match) {
      return { root: "C", type: "major", octave: 1 };
    }

    const [, root, typeStr] = match;

    return {
      root,
      type: this.parseChordType(typeStr),
      octave: 1,
    };
  }

  /**
   * Парсинг типа аккорда
   */
  parseChordType(typeStr) {
    const typeMap = {
      "": "major",
      m: "minor",
      7: "dominant7",
      maj7: "major7",
      m7: "minor7",
      dim: "diminished",
      aug: "augmented",
    };

    return typeMap[typeStr] || "major";
  }

  /**
   * Обновление темпа
   */
  updateTempo(bpm) {
    if (this.currentPattern) {
      // Перезапускаем воспроизведение с новым темпом
      this.stopPlayback();
      this.startPlayback();
    }
  }

  /**
   * Обновление аккордов
   */
  updateChords(chords) {
    // Обновляем доступные аккорды для воспроизведения
    console.log("Updated chords:", chords);
  }

  /**
   * Обновление тактов
   */
  updateBars(bars) {
    // Обновляем доступные такты для воспроизведения
    console.log("Updated bars:", bars.length);
  }

  /**
   * Обновление громкости метронома
   */
  updateMetronomeVolume(volume) {
    // Реализация управления громкостью метронома
    this.metronomeVolume = volume;
  }

  /**
   * Получение статистики аудио
   */
  getAudioStats() {
    return this.audioEngine.getStats();
  }

  /**
   * Уничтожение сервиса
   */
  async destroy() {
    console.log("💥 Destroying AudioService...");

    // Останавливаем воспроизведение
    this.stopPlayback();

    // Уничтожаем аудио движок
    if (this.audioEngine) {
      await this.audioEngine.destroy();
    }

    console.log("✅ AudioService destroyed");
  }
}

export default AudioService;