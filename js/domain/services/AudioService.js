import { EventTypes } from "../../core/EventTypes.js";
import MusicUtils from "../../shared/utils/MusicUtils.js";

export class AudioService {
  constructor(eventBus, stateManager, audioEngine) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.audioEngine = audioEngine;
    this.configService = null;
    this.chordParserService = null;

    this.activePlayback = null;
    this.metronomeEnabled = false;
    this.currentPattern = null;
    this.currentBarIndex = 0;
    this.currentBeatIndex = 0;

    this.setupEventSubscriptions();
  }

  /**
   * Установка ConfigService
   */
  setConfigService(configService) {
    this.configService = configService;
    this.setupConfigSubscriptions();
  }

  /**
   * Установка ChordParserService
   */
  setChordParserService(chordParserService) {
    this.chordParserService = chordParserService;
  }

  /**
   * Инициализация сервиса
   */
  async initialize() {
    try {
      console.log("🎵 Initializing AudioService...");

      // Подписываемся на изменения состояния
      this.setupStateSubscriptions();

      // Применяем конфигурацию аудио
      this.applyAudioConfig();

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

    // Изменение громкости из конфигурации
    this.eventBus.on("audio:volume:changed", (event) => {
      this.handleConfigVolumeChange(event.data.volume);
    });

    // Изменение конфигурации аудио
    this.eventBus.on("audio:config:changed", (event) => {
      this.handleAudioConfigChange(event.data);
    });

    // Генерация случайного боя
    this.eventBus.on("generate:strum", () => {
      this.generateRandomStrum();
    });

    // Изменение статуса стрелочки
    this.eventBus.on("beat:statusChanged", (event) => {
      this.handleBeatStatusChanged(event.data);
    });

    // Изменение текущего такта
    this.eventBus.on("navigation:previousBar", () => {
      this.handlePreviousBar();
    });

    this.eventBus.on("navigation:nextBar", () => {
      this.handleNextBar();
    });

    // Воспроизведение бита
    this.eventBus.on("playback:beat", (event) => {
      this.handlePlaybackBeat(event.data);
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
   * Настройка подписок на конфигурацию
   */
  setupConfigSubscriptions() {
    if (!this.configService) return;

    // Подписка на изменения аудио конфигурации
    this.configService.watch("audio.volume", (volume) => {
      this.audioEngine.setVolume(volume);
    });

    this.configService.watch("audio.sampleRate", (sampleRate) => {
      this.audioEngine.setSampleRate(sampleRate);
    });

    this.configService.watch("audio.bufferSize", (bufferSize) => {
      this.audioEngine.setBufferSize(bufferSize);
    });

    this.configService.watch("audio.maxConcurrentSounds", (maxSounds) => {
      this.audioEngine.setMaxConcurrentSounds(maxSounds);
    });

    this.configService.watch("audio.enableMetronome", (enabled) => {
      this.metronomeEnabled = enabled;
    });

    this.configService.watch("audio.metronomeVolume", (volume) => {
      this.updateMetronomeVolume(volume);
    });
  }

  /**
   * Обработка изменений громкости из конфигурации
   */
  handleConfigVolumeChange(volume) {
    this.audioEngine.setVolume(volume);
  }

  /**
   * Обработка изменений конфигурации аудио
   */
  handleAudioConfigChange(audioConfig) {
    // Применяем все аудио настройки
    if (audioConfig.volume !== undefined) {
      this.audioEngine.setVolume(audioConfig.volume);
    }
    if (audioConfig.sampleRate !== undefined) {
      this.audioEngine.setSampleRate(audioConfig.sampleRate);
    }
    if (audioConfig.bufferSize !== undefined) {
      this.audioEngine.setBufferSize(audioConfig.bufferSize);
    }
    if (audioConfig.maxConcurrentSounds !== undefined) {
      this.audioEngine.setMaxConcurrentSounds(audioConfig.maxConcurrentSounds);
    }
    if (audioConfig.enableMetronome !== undefined) {
      this.metronomeEnabled = audioConfig.enableMetronome;
    }
    if (audioConfig.metronomeVolume !== undefined) {
      this.updateMetronomeVolume(audioConfig.metronomeVolume);
    }
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
      // Получаем темп из конфигурации или из состояния
      const defaultTempo = this.configService ?
        this.configService.get("playback.defaultTempo", 120) : 120;
      
      const {
        tempo = this.stateManager.getState("settings.bpm") || defaultTempo,
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
   * Обработка изменения статуса стрелочки
   */
  handleBeatStatusChanged(data) {
    const { beatIndex, status } = data;
    console.log(`AudioService: Beat ${beatIndex} status changed to: ${status}`);
  }

  /**
   * Обработка перехода к предыдущему такту
   */
  handlePreviousBar() {
    if (this.currentBarIndex > 0) {
      this.currentBarIndex--;
      this.currentBeatIndex = 0;
      console.log(`AudioService: Moved to previous bar ${this.currentBarIndex}`);
    }
  }

  /**
   * Обработка перехода к следующему такту
   */
  handleNextBar() {
    if (this.chordParserService) {
      const totalBars = this.chordParserService.getBarsCount();
      if (this.currentBarIndex < totalBars - 1) {
        this.currentBarIndex++;
        this.currentBeatIndex = 0;
        console.log(`AudioService: Moved to next bar ${this.currentBarIndex}`);
      }
    }
  }

  /**
   * Обработка воспроизведения бита с аккордом
   */
  handlePlaybackBeat(data) {
    const { beat } = data;
    this.currentBeatIndex = beat;
    
    // Воспроизводим аккорд если есть ChordParserService
    if (this.chordParserService) {
      this.playChordForBeat(this.currentBarIndex, this.currentBeatIndex);
    }
  }

  /**
   * Воспроизведение аккорда для указанного такта и удара
   */
  async playChordForBeat(barIndex, beatIndex) {
    if (!this.chordParserService) {
      return;
    }

    try {
      // Получаем статус стрелочки из ArrowDisplay
      const arrowDisplay = this.getArrowDisplay();
      if (!arrowDisplay) {
        return;
      }

      const circleStatus = arrowDisplay.getCircleStatus(beatIndex);
      
      // Воспроизводим только если стрелочка помечена как 'played'
      if (circleStatus === 'played') {
        // Получаем ноты для аккорда
        const notes = this.chordParserService.getNotesForBeat(barIndex, beatIndex);
        
        if (notes.length > 0) {
          // Воспроизводим ноты аккорда
          await this.audioEngine.playChord(notes, 2, {
            volume: 1.0,
            arpeggio: false,
            spread: 0.05
          });
          
          console.log(`AudioService: Played chord for bar ${barIndex}, beat ${beatIndex}:`, notes);
        }
      }
    } catch (error) {
      console.error(`AudioService: Error playing chord for bar ${barIndex}, beat ${beatIndex}:`, error);
    }
  }

  /**
   * Получение компонента ArrowDisplay
   */
  getArrowDisplay() {
    // Пытаемся получить ArrowDisplay из ServiceContainer
    if (this.serviceContainer) {
      try {
        return this.serviceContainer.get('arrowDisplay');
      } catch (error) {
        console.warn('AudioService: ArrowDisplay not found in ServiceContainer');
      }
    }
    
    // Альтернативный способ - получить из DOM
    const beatRow = document.getElementById('beatRow');
    if (beatRow && beatRow.arrowDisplay) {
      return beatRow.arrowDisplay;
    }
    
    return null;
  }

  /**
   * Установка ServiceContainer для доступа к другим сервисам
   */
  setServiceContainer(serviceContainer) {
    this.serviceContainer = serviceContainer;
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
   * Применение аудио конфигурации при инициализации
   */
  applyAudioConfig() {
    if (!this.configService) return;

    const audioConfig = this.configService.get("audio");
    if (audioConfig) {
      this.handleAudioConfigChange(audioConfig);
    }
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