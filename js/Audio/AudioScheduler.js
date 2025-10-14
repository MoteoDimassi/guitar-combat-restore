/**
 * Класс для синхронизации воспроизведения с темпом
 * Управляет временем воспроизведения аккордов в соответствии с BPM и состоянием PlayStatus
 */
export class AudioScheduler {
  constructor(audioEngine, tempoManager) {
    this.audioEngine = audioEngine;
    this.tempoManager = tempoManager;
    
    // Состояние планировщика
    this.isRunning = false;
    this.isPaused = false;
    this.currentBeatIndex = 0;
    this.currentBarIndex = 0;
    
    // Таймеры
    this.scheduleTimer = null;
    this.lookaheadTime = 100; // Время предварительного планирования в мс
    this.scheduleIntervalTime = 25; // Интервал планирования в мс
    this.lastScheduledTime = 0; // Время последнего запланированного удара
    
    // Настройки
    this.settings = {
      beatCount: 4,         // Количество долей в такте
      swingAmount: 0,       // Величина свинга (0-1)
      humanizeAmount: 0     // Величина человеческого фактора (0-1)
    };
    
    // Колбэки
    this.callbacks = {
      onBeat: null,         // При каждом ударе
      onBarChange: null,    // При смене такта
      onStart: null,        // При начале воспроизведения
      onStop: null,         // При остановке
      onError: null         // При ошибке
    };
    
    // Текущая последовательность для воспроизведения
    this.currentSequence = [];
  }

  /**
   * Инициализирует планировщик
   * @returns {Promise<void>}
   */
  async init() {
    try {
      if (!this.audioEngine) {
        throw new Error('AudioEngine не предоставлен');
      }
      
      if (!this.tempoManager) {
        throw new Error('TempoManager не предоставлен');
      }
      
      // AudioScheduler инициализирован
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Начинает воспроизведение последовательности
   * @param {Array} sequence - Последовательность аккордов
   * @param {Object} options - Опции воспроизведения
   */
  start(sequence, options = {}) {
    if (this.isRunning) {
      this.stop();
    }
    
    this.currentSequence = sequence || [];
    this.settings = { ...this.settings, ...options };
    this.currentBeatIndex = 0;
    this.currentBarIndex = 0;
    this.isRunning = true;
    this.isPaused = false;
    
    // Начинаем планирование
    this.startScheduling();
    
    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }
  }

  /**
   * Останавливает воспроизведение
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.lastScheduledTime = 0;
    
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    
    // Останавливаем все аудио
    if (this.audioEngine) {
      this.audioEngine.stopAll();
    }
    
    if (this.callbacks.onStop) {
      this.callbacks.onStop();
    }
  }

  /**
   * Приостанавливает воспроизведение
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Возобновляет воспроизведение
   */
  resume() {
    if (this.isRunning) {
      this.isPaused = false;
    }
  }

  /**
   * Начинает планирование воспроизведения
   */
  startScheduling() {
    const scheduleNextBeat = () => {
      if (!this.isRunning || this.isPaused) {
        return;
      }
      
      const currentTime = performance.now();
      const bpm = this.tempoManager ? this.tempoManager.getTempo() : 120;
      const beatDuration = 60000 / bpm; // Длительность доли в мс
      
      // Вычисляем время следующего удара
      const nextBeatTime = this.getNextBeatTime(currentTime, beatDuration);
      
      // Планируем воспроизведение
      this.scheduleBeat(nextBeatTime);
    };
    
    // Запускаем таймер планирования
    this.scheduleTimer = setInterval(scheduleNextBeat, this.scheduleIntervalTime);
  }

  /**
   * Вычисляет время следующего удара
   * @param {number} currentTime - Текущее время
   * @param {number} beatDuration - Длительность доли
   * @returns {number} Время следующего удара
   */
  getNextBeatTime(currentTime, beatDuration) {
    // Применяем свинг
    let swingOffset = 0;
    if (this.settings.swingAmount > 0 && this.currentBeatIndex % 2 === 1) {
      swingOffset = beatDuration * this.settings.swingAmount * 0.2;
    }
    
    // Применяем человеческий фактор
    let humanizeOffset = 0;
    if (this.settings.humanizeAmount > 0) {
      humanizeOffset = (Math.random() - 0.5) * beatDuration * this.settings.humanizeAmount * 0.1;
    }
    
    return currentTime + beatDuration + swingOffset + humanizeOffset;
  }

  /**
   * Планирует воспроизведение удара
   * @param {number} beatTime - Время удара
   */
  scheduleBeat(beatTime) {
    const currentTime = performance.now();
    const timeUntilBeat = beatTime - currentTime;
    
    // Избегаем дублирования планирования одного и того же удара
    if (Math.abs(beatTime - this.lastScheduledTime) < 10) {
      return;
    }
    
    if (timeUntilBeat <= 0) {
      // Пропускаем, если время уже прошло
      return;
    }
    
    this.lastScheduledTime = beatTime;
    
    // Планируем воспроизведение
    setTimeout(() => {
      if (!this.isRunning || this.isPaused) {
        return;
      }
      
      this.playBeat();
    }, timeUntilBeat);
  }

  /**
   * Воспроизводит текущий удар
   */
  playBeat() {
    // Получаем аккорд для текущего удара
    const chordData = this.getCurrentChordData();
    
    if (!chordData || !chordData.notes || chordData.notes.length === 0) {
      this.advanceBeat();
      return;
    }
    
    // Воспроизводим в зависимости от статуса
    this.playChordWithStatus(chordData);
    
    // Вызываем колбэк для удара
    if (this.callbacks.onBeat) {
      this.callbacks.onBeat(this.currentBarIndex, this.currentBeatIndex, chordData);
    }
    
    // Переходим к следующему удару
    this.advanceBeat();
  }

  /**
   * Воспроизводит аккорд в зависимости от статуса
   * @param {Object} chordData - Данные аккорда
   */
  playChordWithStatus(chordData) {
    if (!this.audioEngine) {
      return;
    }
    
    try {
      switch (chordData.status) {
        case 'play':
          // Воспроизводим обычный аккорд
          if (chordData.notes && chordData.notes.length > 0) {
            this.audioEngine.playChord(chordData.notes);
          }
          break;
        case 'muted':
          // Для статуса MUTED воспроизводим специальный звук приглушения
          // Передаем ноты для совместимости, но AudioEngine будет использовать Mute.mp3
          this.audioEngine.playMutedChord(chordData.notes || []);
          break;
        case 'skip':
        default:
          // Не воспроизводим
          break;
      }
    } catch (error) {
      // Ошибка воспроизведения аккорда
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  /**
   * Получает данные аккорда для текущего удара
   * @returns {Object|null} Данные аккорда
   */
  getCurrentChordData() {
    if (!this.currentSequence || this.currentSequence.length === 0) {
      return null;
    }
    
    // Ищем данные для текущего такта и удара
    for (const barData of this.currentSequence) {
      if (barData.barIndex === this.currentBarIndex) {
        if (barData.beats && barData.beats[this.currentBeatIndex]) {
          return barData.beats[this.currentBeatIndex];
        }
        break;
      }
    }
    
    return null;
  }

  /**
   * Переходит к следующему удару
   */
  advanceBeat() {
    this.currentBeatIndex++;
    
    // Проверяем, нужно ли перейти к следующему такту
    if (this.currentBeatIndex >= this.settings.beatCount) {
      this.currentBeatIndex = 0;
      this.currentBarIndex++;
      
      // Вызываем колбэк для смены такта
      if (this.callbacks.onBarChange) {
        this.callbacks.onBarChange(this.currentBarIndex);
      }
      
      // Зацикливаем воспроизведение
      if (this.currentBarIndex >= this.getMaxBarIndex()) {
        this.currentBarIndex = 0;
      }
    }
  }

  /**
   * Получает максимальный индекс такта
   * @returns {number}
   */
  getMaxBarIndex() {
    if (!this.currentSequence || this.currentSequence.length === 0) {
      return 0;
    }
    
    return Math.max(...this.currentSequence.map(bar => bar.barIndex)) + 1;
  }

  /**
   * Устанавливает количество долей в такте
   * @param {number} beatCount - Количество долей
   */
  setBeatCount(beatCount) {
    this.settings.beatCount = Math.max(1, Math.min(16, beatCount));
  }

  /**
   * Устанавливает величину свинга
   * @param {number} swingAmount - Величина свинга (0-1)
   */
  setSwingAmount(swingAmount) {
    this.settings.swingAmount = Math.max(0, Math.min(1, swingAmount));
  }

  /**
   * Устанавливает величину человеческого фактора
   * @param {number} humanizeAmount - Величина человеческого фактора (0-1)
   */
  setHumanizeAmount(humanizeAmount) {
    this.settings.humanizeAmount = Math.max(0, Math.min(1, humanizeAmount));
  }

  /**
   * Получает текущее состояние
   * @returns {Object} Состояние планировщика
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentBeatIndex: this.currentBeatIndex,
      currentBarIndex: this.currentBarIndex,
      settings: { ...this.settings }
    };
  }

  /**
   * Устанавливает колбэк для удара
   * @param {Function} callback - Функция колбэка
   */
  setOnBeat(callback) {
    this.callbacks.onBeat = callback;
  }

  /**
   * Устанавливает колбэк для смены такта
   * @param {Function} callback - Функция колбэка
   */
  setOnBarChange(callback) {
    this.callbacks.onBarChange = callback;
  }

  /**
   * Устанавливает колбэк для начала воспроизведения
   * @param {Function} callback - Функция колбэка
   */
  setOnStart(callback) {
    this.callbacks.onStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки воспроизведения
   * @param {Function} callback - Функция колбэка
   */
  setOnStop(callback) {
    this.callbacks.onStop = callback;
  }

  /**
   * Устанавливает колбэк для ошибок
   * @param {Function} callback - Функция колбэка
   */
  setOnError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    this.stop();
    this.callbacks = {};
    this.currentSequence = [];
  }
}