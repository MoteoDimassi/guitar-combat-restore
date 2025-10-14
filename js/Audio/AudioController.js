import { NoteManager } from './NoteManager.js';
import { ChordAudioMapper } from './ChordAudioMapper.js';
import { AudioEngine } from './AudioEngine.js';
import { AudioScheduler } from './AudioScheduler.js';
import { PlayStatus } from '../Measure/PlayStatus.js';

/**
 * Главный класс аудио системы
 * Координирует работу всех аудио компонентов и интегрируется с основным приложением
 */
export class AudioController {
  constructor() {
    // Компоненты аудио системы
    this.noteManager = null;
    this.chordAudioMapper = null;
    this.audioEngine = null;
    this.audioScheduler = null;
    
    // Внешние зависимости
    this.chordParser = null;
    this.chordBuilder = null;
    this.tempoManager = null;
    
    // Состояние аудио системы
    this.isInitialized = false;
    this.isLoading = false;
    this.loadProgress = 0;
    
    // Настройки
    this.settings = {
      volume: 0.7,
      chordDuration: 0.5,
      autoLoad: true
    };
    
    // Колбэки
    this.callbacks = {
      onLoadProgress: null,
      onLoadComplete: null,
      onError: null,
      onPlayStart: null,
      onPlayStop: null,
      onBeat: null
    };
  }

  /**
   * Инициализирует аудио систему
   * @param {Object} dependencies - Зависимости (chordParser, chordBuilder, tempoManager)
   * @returns {Promise<void>}
   */
  async init(dependencies = {}) {
    try {
      this.isLoading = true;
      
      // Сохраняем зависимости
      this.chordParser = dependencies.chordParser;
      this.chordBuilder = dependencies.chordBuilder;
      this.tempoManager = dependencies.tempoManager;
      
      // Проверяем зависимости
      if (!this.chordParser) {
        throw new Error('ChordParser не предоставлен');
      }
      
      if (!this.chordBuilder) {
        throw new Error('ChordBuilder не предоставлен');
      }
      
      if (!this.tempoManager) {
        throw new Error('TempoManager не предоставлен');
      }
      
      // Инициализируем компоненты
      await this.initializeComponents();
      
      // Настраиваем связи между компонентами
      this.setupComponentConnections();
      
      this.isInitialized = true;
      this.isLoading = false;
      
      if (this.callbacks.onLoadComplete) {
        this.callbacks.onLoadComplete();
      }
      
      // AudioController инициализирован
    } catch (error) {
      this.isLoading = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Инициализирует компоненты аудио системы
   * @returns {Promise<void>}
   */
  async initializeComponents() {
    // Инициализируем NoteManager
    this.noteManager = new NoteManager();
    
    // Устанавливаем колбэки для NoteManager
    this.noteManager.setOnLoadProgress((progress) => {
      this.loadProgress = progress * 0.7; // 70% прогресса для загрузки нот
      if (this.callbacks.onLoadProgress) {
        this.callbacks.onLoadProgress(this.loadProgress);
      }
    });
    
    this.noteManager.setOnLoadComplete(() => {
      // NoteManager завершил загрузку
    });
    
    this.noteManager.setOnError((error) => {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
    
    // Загружаем ноты
    if (this.settings.autoLoad) {
      await this.noteManager.init();
    }
    
    // Инициализируем ChordAudioMapper
    this.chordAudioMapper = new ChordAudioMapper();
    
    // Инициализируем AudioEngine
    this.audioEngine = new AudioEngine(this.noteManager);
    
    // Устанавливаем колбэки для AudioEngine
    this.audioEngine.setOnPlayStart(() => {
      if (this.callbacks.onPlayStart) {
        this.callbacks.onPlayStart();
      }
    });
    
    this.audioEngine.setOnPlayStop(() => {
      if (this.callbacks.onPlayStop) {
        this.callbacks.onPlayStop();
      }
    });
    
    this.audioEngine.setOnError((error) => {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
    
    await this.audioEngine.init();
    
    // Инициализируем AudioScheduler
    this.audioScheduler = new AudioScheduler(this.audioEngine, this.tempoManager);
    
    // Устанавливаем колбэки для AudioScheduler
    this.audioScheduler.setOnBeat((barIndex, beatIndex, chordData) => {
      if (this.callbacks.onBeat) {
        this.callbacks.onBeat(barIndex, beatIndex, chordData);
      }
    });
    
    this.audioScheduler.setOnStart(() => {
      if (this.callbacks.onPlayStart) {
        this.callbacks.onPlayStart();
      }
    });
    
    this.audioScheduler.setOnStop(() => {
      if (this.callbacks.onPlayStop) {
        this.callbacks.onPlayStop();
      }
    });
    
    this.audioScheduler.setOnError((error) => {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
    
    await this.audioScheduler.init();
    
    // Применяем настройки
    this.applySettings();
  }

  /**
   * Настраивает связи между компонентами
   */
  setupComponentConnections() {
    // Связываем изменения темпа с AudioScheduler
    if (this.tempoManager) {
      this.tempoManager.setOnTempoChange((bpm) => {
        // Темп автоматически применяется в AudioScheduler
        // Темп изменен
      });
    }
  }

  /**
   * Применяет настройки к компонентам
   */
  applySettings() {
    if (this.audioEngine) {
      this.audioEngine.setVolume(this.settings.volume);
      this.audioEngine.setChordDuration(this.settings.chordDuration);
    }
    
    if (this.noteManager) {
      this.noteManager.setVolume(this.settings.volume);
    }
  }

  /**
   * Начинает воспроизведение аккордов
   * @param {Object} options - Опции воспроизведения
   */
  async startPlayback(options = {}) {
    if (!this.isInitialized) {
      throw new Error('Аудио система не инициализирована');
    }
    
    // Создаем последовательность для воспроизведения
    const sequence = this.createPlaybackSequence(options);
    
    // Начинаем воспроизведение
    this.audioScheduler.start(sequence, options);
  }

  /**
   * Останавливает воспроизведение
   */
  stopPlayback() {
    if (this.audioScheduler) {
      this.audioScheduler.stop();
    }
  }

  /**
   * Приостанавливает воспроизведение
   */
  pausePlayback() {
    if (this.audioScheduler) {
      this.audioScheduler.pause();
    }
  }

  /**
   * Возобновляет воспроизведение
   */
  resumePlayback() {
    if (this.audioScheduler) {
      this.audioScheduler.resume();
    }
  }

  /**
   * Создает последовательность для воспроизведения
   * @param {Object} options - Опции
   * @returns {Array} Последовательность аккордов
   */
  createPlaybackSequence(options = {}) {
    const sequence = [];
    const beatCount = options.beatCount || 4;
    const bars = options.bars || [];
    
    // Если есть такты, используем их
    if (bars.length > 0) {
      bars.forEach((bar, barIndex) => {
        const barData = {
          barIndex: barIndex,
          beats: []
        };
        
        // Используем количество долей из такта, если оно указано
        const currentBeatCount = bar.beatCount || beatCount;
        
        for (let beatIndex = 0; beatIndex < currentBeatCount; beatIndex++) {
          const beatData = this.createBeatData(bar, beatIndex, barIndex);
          barData.beats.push(beatData);
        }
        
        sequence.push(barData);
      });
    } else {
      // Иначе используем аккорды из парсера
      const validChords = this.chordParser.getValidChords();
      
      if (validChords.length > 0) {
        // Создаем один такт с аккордами
        const barData = {
          barIndex: 0,
          beats: []
        };
        
        for (let beatIndex = 0; beatIndex < beatCount; beatIndex++) {
          const chordIndex = Math.min(beatIndex, validChords.length - 1);
          const chord = validChords[chordIndex];
          
          const beatData = this.createBeatDataFromChord(chord, beatIndex, 0);
          barData.beats.push(beatData);
        }
        
        sequence.push(barData);
      }
    }
    
    return sequence;
  }

  /**
   * Создает данные для удара из такта
   * @param {Object} bar - Такт
   * @param {number} beatIndex - Индекс удара
   * @param {number} barIndex - Индекс такта
   * @returns {Object} Данные удара
   */
  createBeatData(bar, beatIndex, barIndex) {
    // Получаем название аккорда для удара
    let chordName = bar.getChordForBeat ?
      bar.getChordForBeat(beatIndex) :
      this.chordParser.getChordNameForPosition(barIndex, beatIndex);
    
    // Если аккорд не найден в такте, пробуем получить из парсера
    if (!chordName && this.chordParser) {
      const validChords = this.chordParser.getValidChords();
      if (validChords.length > 0) {
        // Используем первый доступный аккорд как базовый
        chordName = validChords[0].name;
      }
    }
    
    // Получаем статус воспроизведения
    let playStatus = PlayStatus.STATUS.SKIP;
    if (bar.getBeatPlayStatus) {
      const status = bar.getBeatPlayStatus(beatIndex);
      if (status) {
        playStatus = status.getStatus();
      }
    }
    
    return this.createBeatDataFromChord({ name: chordName || 'C' }, beatIndex, barIndex, playStatus);
  }

  /**
   * Создает данные для удара из аккорда
   * @param {Object} chord - Аккорд
   * @param {number} beatIndex - Индекс удара
   * @param {number} barIndex - Индекс такта
   * @param {number} playStatus - Статус воспроизведения
   * @returns {Object} Данные удара
   */
  createBeatDataFromChord(chord, beatIndex, barIndex, playStatus = PlayStatus.STATUS.PLAY) {
    // Получаем ноты аккорда
    const notes = this.getChordNotes(chord.name);
    
    // Определяем статус
    let status = 'skip';
    if (playStatus === PlayStatus.STATUS.PLAY) {
      status = 'play';
    } else if (playStatus === PlayStatus.STATUS.MUTED) {
      status = 'muted';
    }
    
    return {
      beatIndex: beatIndex,
      barIndex: barIndex,
      chordName: chord.name,
      notes: notes,
      status: status,
      timestamp: Date.now()
    };
  }

  /**
   * Получает ноты для аккорда
   * @param {string} chordName - Название аккорда
   * @returns {string[]} Массив названий нот
   */
  getChordNotes(chordName) {
    if (!chordName || !this.chordBuilder || !this.chordAudioMapper) {
      return [];
    }
    
    // Преобразуем аккорд в ноты
    return this.chordAudioMapper.mapChordToNotes(chordName, this.chordBuilder);
  }

  /**
   * Воспроизводит один аккорд немедленно
   * @param {string} chordName - Название аккорда
   * @param {Object} options - Опции воспроизведения
   * @returns {Promise}
   */
  async playChord(chordName, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Аудио система не инициализирована');
    }
    
    const notes = this.getChordNotes(chordName);
    
    if (notes.length === 0) {
      // Не найдены ноты для аккорда
      return;
    }
    
    return this.audioEngine.playChord(notes, options);
  }

  /**
   * Устанавливает громкость
   * @param {number} volume - Громкость от 0 до 1
   */
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.applySettings();
  }

  /**
   * Получает текущую громкость
   * @returns {number} Текущая громкость
   */
  getVolume() {
    return this.settings.volume;
  }

  /**
   * Устанавливает длительность аккорда
   * @param {number} duration - Длительность в секундах
   */
  setChordDuration(duration) {
    this.settings.chordDuration = Math.max(0.1, Math.min(5, duration));
    this.applySettings();
  }

  /**
   * Получает длительность аккорда
   * @returns {number} Длительность в секундах
   */
  getChordDuration() {
    return this.settings.chordDuration;
  }

  /**
   * Получает статус загрузки
   * @returns {Object} Статус загрузки
   */
  getLoadStatus() {
    const noteManagerStatus = this.noteManager ? this.noteManager.getLoadStatus() : null;
    
    return {
      isLoading: this.isLoading,
      isInitialized: this.isInitialized,
      progress: this.loadProgress,
      noteManager: noteManagerStatus
    };
  }

  /**
   * Получает текущее состояние
   * @returns {Object} Состояние аудио системы
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      loadProgress: this.loadProgress,
      settings: { ...this.settings },
      schedulerState: this.audioScheduler ? this.audioScheduler.getState() : null,
      engineState: this.audioEngine ? this.audioEngine.getSettings() : null
    };
  }

  /**
   * Устанавливает колбэк для прогресса загрузки
   * @param {Function} callback - Функция колбэка
   */
  setOnLoadProgress(callback) {
    this.callbacks.onLoadProgress = callback;
  }

  /**
   * Устанавливает колбэк для завершения загрузки
   * @param {Function} callback - Функция колбэка
   */
  setOnLoadComplete(callback) {
    this.callbacks.onLoadComplete = callback;
  }

  /**
   * Устанавливает колбэк для ошибок
   * @param {Function} callback - Функция колбэка
   */
  setOnError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Устанавливает колбэк для начала воспроизведения
   * @param {Function} callback - Функция колбэка
   */
  setOnPlayStart(callback) {
    this.callbacks.onPlayStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки воспроизведения
   * @param {Function} callback - Функция колбэка
   */
  setOnPlayStop(callback) {
    this.callbacks.onPlayStop = callback;
  }

  /**
   * Устанавливает колбэк для удара
   * @param {Function} callback - Функция колбэка
   */
  setOnBeat(callback) {
    this.callbacks.onBeat = callback;
  }

  /**
   * Тестирует воспроизведение отдельной ноты
   * @param {string} noteName - Название ноты
   * @returns {Promise}
   */
  async testNote(noteName) {
    if (!this.isInitialized) {
      throw new Error('Аудио система не инициализирована');
    }
    
    try {
      await this.audioEngine.playNote(noteName);
      // Тестовая нота воспроизведена
    } catch (error) {
      // Ошибка воспроизведения тестовой ноты
      throw error;
    }
  }

  /**
   * Тестирует воспроизведение аккорда
   * @param {string} chordName - Название аккорда
   * @returns {Promise}
   */
  async testChord(chordName) {
    if (!this.isInitialized) {
      throw new Error('Аудио система не инициализирована');
    }
    
    try {
      await this.playChord(chordName);
      // Тестовый аккорд воспроизведен
    } catch (error) {
      // Ошибка воспроизведения тестового аккорда
      throw error;
    }
  }

  /**
   * Получает список доступных нот для тестирования
   * @returns {string[]} Массив названий нот
   */
  getAvailableTestNotes() {
    if (!this.chordAudioMapper) {
      return [];
    }
    
    return this.chordAudioMapper.getAvailableNotes();
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    if (this.audioScheduler) {
      this.audioScheduler.dispose();
    }
    
    if (this.audioEngine) {
      this.audioEngine.dispose();
    }
    
    if (this.noteManager) {
      this.noteManager.dispose();
    }
    
    this.callbacks = {};
    this.isInitialized = false;
  }
}