import StateMiddleware from './StateMiddleware.js';

export class StateManager {
  constructor(eventBus, initialState = {}) {
    this.eventBus = eventBus;
    this.middleware = new StateMiddleware();
    this.state = {
      // Настройки приложения
      settings: {
        beatCount: 4,
        bpm: 120,
        chordChanges: {},
        isPlaying: false,
        volume: {
          strum: 80,
          metronome: 100,
        },
      },

      // Данные аккордов
      chords: {
        inputString: "",
        parsedChords: [],
        validChords: [],
        invalidChords: [],
      },

      // Такты и их содержимое
      bars: [],
      currentBarIndex: 0,

      // Состояние воспроизведения
      playback: {
        isPlaying: false,
        currentBar: 0,
        currentBeat: 0,
        tempo: 120,
      },

      // UI состояние
      ui: {
        selectedTemplate: null,
        showSettings: false,
        showSongText: false,
        arrowsCount: 8,
      },

      // Данные шаблонов
      templates: {
        available: [],
        loaded: [],
        custom: [],
      },

      // Текст песни
      songText: {
        content: "",
        syllables: [],
      },

      // ... другие состояния
      ...initialState,
    };

    // История изменений для undo/redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;

    // Подписчики на изменения состояния
    this.subscribers = new Map();
  }

  /**
   * Получение состояния по пути
   * @param {string} path - Путь к состоянию (например, 'settings.bpm')
   * @returns {*} Значение состояния
   */
  getState(path = null) {
    if (!path) {
      return this.state;
    }
    return this.getNestedValue(this.state, path);
  }

  /**
   * Установка состояния по пути
   * @param {string} path - Путь к состоянию
   * @param {*} value - Новое значение
   * @param {Object} options - Дополнительные опции
   */
  setState(path, value, options = {}) {
    const oldValue = this.getState(path);

    // Валидация значения
    if (!this.validate(path, value)) {
      console.warn(`Invalid value for ${path}:`, value);
      return false;
    }

    // Создаем контекст для middleware
    const context = {
      path,
      value,
      oldValue,
      options,
      state: this.state,
      timestamp: Date.now(),
    };

    // Выполняем middleware перед изменением состояния
    return this.middleware.execute(context, async () => {
      // Сохраняем в историю если нужно
      if (options.saveToHistory !== false) {
        this.saveToHistory(path, oldValue);
      }

      // Устанавливаем новое значение
      this.state = this.setNestedValue(this.state, path, context.value);

      // Уведомляем подписчиков
      this.notifySubscribers(path, context.value, oldValue);

      // Генерируем событие
      this.eventBus.emit("state:changed", {
        path,
        value: context.value,
        oldValue,
        timestamp: context.timestamp,
      });

      return true;
    });
  }

  /**
   * Добавление middleware
   * @param {Function} middleware - Функция middleware
   * @param {Object} options - Опции middleware
   * @returns {Function} Функция для удаления middleware
   */
  use(middleware, options = {}) {
    return this.middleware.use(middleware, options);
  }

  /**
   * Обновление состояния через функцию
   * @param {string} path - Путь к состоянию
   * @param {Function} updater - Функция обновления
   * @param {Object} options - Дополнительные опции
   */
  updateState(path, updater, options = {}) {
    const currentValue = this.getState(path);
    const newValue = updater(currentValue);
    this.setState(path, newValue, options);
  }

  /**
   * Подписка на изменения состояния
   * @param {string} path - Путь к состоянию
   * @param {Function} callback - Функция обратного вызова
   * @param {Object} options - Опции подписки
   * @returns {Function} Функция отписки
   */
  subscribe(path, callback, options = {}) {
    const id = this.generateId();

    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Map());
    }

    this.subscribers.get(path).set(id, {
      callback,
      options,
      lastValue: this.getState(path),
    });

    // Возвращаем функцию отписки
    return () => {
      const pathSubscribers = this.subscribers.get(path);
      if (pathSubscribers) {
        pathSubscribers.delete(id);
        if (pathSubscribers.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }

  /**
   * Подписка на несколько путей состояния
   * @param {Array} paths - Массив путей
   * @param {Function} callback - Функция обратного вызова
   * @param {Object} options - Опции подписки
   * @returns {Function} Функция отписки
   */
  subscribeMultiple(paths, callback, options = {}) {
    const unsubscribers = paths.map((path) =>
      this.subscribe(
        path,
        (value, oldValue, changedPath) => {
          callback(value, oldValue, changedPath);
        },
        options
      )
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  /**
   * Сохранение состояния в историю
   * @param {string} path - Путь к состоянию
   * @param {*} oldValue - Старое значение
   */
  saveToHistory(path, oldValue) {
    const historyEntry = {
      path,
      oldValue,
      newValue: this.getState(path),
      timestamp: Date.now(),
    };

    // Удаляем будущие записи если мы не в конце истории
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(historyEntry);

    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Отмена последнего изменения (undo)
   */
  undo() {
    if (this.historyIndex >= 0) {
      const entry = this.history[this.historyIndex];
      this.state = this.setNestedValue(this.state, entry.path, entry.oldValue);
      this.historyIndex--;
      return true;
    }
    return false;
  }

  /**
   * Повтор последнего изменения (redo)
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const entry = this.history[this.historyIndex];
      this.state = this.setNestedValue(this.state, entry.path, entry.newValue);
      return true;
    }
    return false;
  }

  /**
   * Сброс состояния к начальным значениям
   * @param {string} path - Путь для сброса (опционально)
   */
  reset(path = null) {
    if (path) {
      // Сброс только указанного пути
      const defaultValue = this.getDefaultValue(path);
      this.setState(path, defaultValue);
    } else {
      // Полный сброс состояния
      this.state = this.getInitialState();
      this.eventBus.emit("state:reset", { timestamp: Date.now() });
    }
  }

  /**
   * Получение всего состояния в виде JSON
   * @returns {Object} Состояние в формате JSON
   */
  toJSON() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Загрузка состояния из JSON
   * @param {Object} data - Данные для загрузки
   */
  fromJSON(data) {
    this.state = { ...this.state, ...data };
    this.eventBus.emit("state:loaded", { timestamp: Date.now() });
  }

  /**
   * Валидация состояния
   * @param {string} path - Путь к состоянию
   * @param {*} value - Значение для валидации
   * @returns {boolean} Результат валидации
   */
  validate(path, value) {
    const validators = {
      "settings.bpm": (val) =>
        typeof val === "number" && val >= 40 && val <= 300,
      "settings.beatCount": (val) =>
        typeof val === "number" && val >= 1 && val <= 16,
      "settings.volume.strum": (val) =>
        typeof val === "number" && val >= 0 && val <= 100,
      "settings.volume.metronome": (val) =>
        typeof val === "number" && val >= 0 && val <= 100,
      bars: (val) => Array.isArray(val),
      currentBarIndex: (val) => typeof val === "number" && val >= 0,
      "playback.currentBar": (val) => typeof val === "number" && val >= 0,
      "playback.currentBeat": (val) => typeof val === "number" && val >= 0,
      "playback.tempo": (val) =>
        typeof val === "number" && val >= 40 && val <= 300,
      "ui.arrowsCount": (val) =>
        typeof val === "number" && val >= 1 && val <= 16,
    };

    const validator = validators[path];
    return validator ? validator(value) : true;
  }

  /**
   * Получение вложенного значения
   * @private
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Установка вложенного значения
   * @private
   */
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
    return obj;
  }

  /**
   * Уведомление подписчиков
   * @private
   */
  notifySubscribers(path, value, oldValue) {
    // Уведомляем прямых подписчиков
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(({ callback, options, lastValue }) => {
        if (options.immediate || value !== lastValue) {
          callback(value, oldValue, path);
        }
      });
    }

    // Уведомляем подписчиков на родительские пути
    const pathParts = path.split(".");
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join(".");
      if (this.subscribers.has(parentPath)) {
        this.subscribers.get(parentPath).forEach(({ callback }) => {
          callback(this.getState(parentPath), undefined, path);
        });
      }
    }
  }

  /**
   * Генерация уникального ID
   * @private
   */
  generateId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получение начального состояния
   * @private
   */
  getInitialState() {
    return {
      settings: {
        beatCount: 4,
        bpm: 120,
        chordChanges: {},
        isPlaying: false,
        volume: {
          strum: 80,
          metronome: 100,
        },
      },
      chords: {
        inputString: "",
        parsedChords: [],
        validChords: [],
        invalidChords: [],
      },
      bars: [],
      currentBarIndex: 0,
      playback: {
        isPlaying: false,
        currentBar: 0,
        currentBeat: 0,
        tempo: 120,
      },
      ui: {
        selectedTemplate: null,
        showSettings: false,
        showSongText: false,
        arrowsCount: 8,
      },
      templates: {
        available: [],
        loaded: [],
        custom: [],
      },
      songText: {
        content: "",
        syllables: [],
      },
    };
  }

  /**
   * Получение значения по умолчанию
   * @private
   */
  getDefaultValue(path) {
    const defaults = {
      "settings.bpm": 120,
      "settings.beatCount": 4,
      "settings.isPlaying": false,
      "settings.volume.strum": 80,
      "settings.volume.metronome": 100,
      currentBarIndex: 0,
      "playback.isPlaying": false,
      "playback.currentBar": 0,
      "playback.currentBeat": 0,
      "playback.tempo": 120,
      "ui.selectedTemplate": null,
      "ui.showSettings": false,
      "ui.showSongText": false,
      "ui.arrowsCount": 8,
      "chords.inputString": "",
      "chords.parsedChords": [],
      "chords.validChords": [],
      "chords.invalidChords": [],
      "bars": [],
      "templates.available": [],
      "templates.loaded": [],
      "templates.custom": [],
      "songText.content": "",
      "songText.syllables": [],
    };

    return defaults[path] !== undefined ? defaults[path] : undefined;
  }

  /**
   * Очистка истории изменений
   */
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Получение размера истории
   */
  getHistorySize() {
    return this.history.length;
  }

  /**
   * Проверка доступности undo
   */
  canUndo() {
    return this.historyIndex >= 0;
  }

  /**
   * Проверка доступности redo
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Очистка состояния и подписок
   */
  clear() {
    this.state = this.getInitialState();
    this.subscribers.clear();
    this.clearHistory();
  }
}

export default StateManager;