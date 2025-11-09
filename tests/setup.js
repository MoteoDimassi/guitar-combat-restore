// Глобальная настройка для тестов
import { jest } from '@jest/globals';

// Мок для localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Мок для console методов, чтобы избежать вывода в консоль во время тестов
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Глобальные вспомогательные функции
global.createMockEventBus = () => {
  const listeners = new Map();
  
  return {
    on: jest.fn((event, callback) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(callback);
    }),
    
    emit: jest.fn((event, data) => {
      if (listeners.has(event)) {
        listeners.get(event).forEach(callback => callback(data));
      }
    }),
    
    off: jest.fn((event, callback) => {
      if (listeners.has(event)) {
        const callbacks = listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }),
    
    // Вспомогательный метод для тестов
    getListeners: (event) => listeners.get(event) || [],
    
    clear: jest.fn(() => listeners.clear()),
  };
};

// Глобальная функция для создания мока StateManager
global.createMockStateManager = (initialState = {}) => {
  const state = {
    settings: {
      beatCount: 4,
      bpm: 120,
      chordChanges: {},
      isPlaying: false,
      volume: {
        strum: 80,
        metronome: 100,
      },
      ...initialState.settings,
    },
    chords: {
      inputString: "",
      parsedChords: [],
      validChords: [],
      invalidChords: [],
      ...initialState.chords,
    },
    bars: initialState.bars || [],
    currentBarIndex: initialState.currentBarIndex || 0,
    playback: {
      isPlaying: false,
      currentBar: 0,
      currentBeat: 0,
      tempo: 120,
      ...initialState.playback,
    },
    ui: {
      selectedTemplate: null,
      showSettings: false,
      showSongText: false,
      arrowsCount: 8,
      ...initialState.ui,
    },
    templates: {
      available: [],
      loaded: [],
      custom: [],
      ...initialState.templates,
    },
    songText: {
      content: "",
      syllables: [],
      ...initialState.songText,
    },
  };

  const subscribers = new Map();
  const history = [];
  let historyIndex = -1;

  return {
    getState: jest.fn((path) => {
      if (!path) return state;
      
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, state);
    }),
    
    setState: jest.fn((path, value, options = {}) => {
      const oldValue = stateManager.getState(path);
      
      // Сохранение в историю
      if (options.saveToHistory !== false) {
        history.push({ path, oldValue, timestamp: Date.now() });
        historyIndex++;
      }
      
      // Установка значения
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
      }, state);
      
      target[lastKey] = value;
      
      // Уведомление подписчиков
      if (subscribers.has(path)) {
        subscribers.get(path).forEach(callback => callback(value, oldValue, path));
      }
      
      return true;
    }),
    
    updateState: jest.fn((path, updater, options = {}) => {
      const currentValue = stateManager.getState(path);
      const newValue = updater(currentValue);
      return stateManager.setState(path, newValue, options);
    }),
    
    subscribe: jest.fn((path, callback, options = {}) => {
      const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!subscribers.has(path)) {
        subscribers.set(path, new Map());
      }
      
      subscribers.get(path).set(id, { callback, options });
      
      return () => {
        const pathSubscribers = subscribers.get(path);
        if (pathSubscribers) {
          pathSubscribers.delete(id);
          if (pathSubscribers.size === 0) {
            subscribers.delete(path);
          }
        }
      };
    }),
    
    subscribeMultiple: jest.fn((paths, callback, options = {}) => {
      const unsubscribers = paths.map(path => 
        stateManager.subscribe(path, callback, options)
      );
      
      return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }),
    
    undo: jest.fn(() => {
      if (historyIndex >= 0) {
        const entry = history[historyIndex];
        stateManager.setState(entry.path, entry.oldValue, { saveToHistory: false });
        historyIndex--;
        return true;
      }
      return false;
    }),
    
    redo: jest.fn(() => {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        // В реальной реализации здесь было бы восстановление нового значения
        return true;
      }
      return false;
    }),
    
    canUndo: jest.fn(() => historyIndex >= 0),
    canRedo: jest.fn(() => historyIndex < history.length - 1),
    
    reset: jest.fn((path = null) => {
      if (path) {
        // Сброс только указанного пути
        const defaults = {
          'settings.bpm': 120,
          'settings.beatCount': 4,
          'settings.isPlaying': false,
          'currentBarIndex': 0,
          'playback.isPlaying': false,
          'playback.currentBar': 0,
          'playback.currentBeat': 0,
        };
        
        if (defaults[path] !== undefined) {
          stateManager.setState(path, defaults[path]);
        }
      } else {
        // Полный сброс состояния
        Object.keys(state).forEach(key => {
          if (typeof state[key] === 'object' && state[key] !== null) {
            Object.keys(state[key]).forEach(subKey => {
              delete state[key][subKey];
            });
          }
        });
      }
    }),
    
    toJSON: jest.fn(() => JSON.parse(JSON.stringify(state))),
    
    fromJSON: jest.fn((data) => {
      Object.assign(state, data);
    }),
    
    validate: jest.fn((path, value) => {
      const validators = {
        'settings.bpm': (val) => typeof val === 'number' && val >= 40 && val <= 300,
        'settings.beatCount': (val) => typeof val === 'number' && val >= 1 && val <= 16,
        'settings.volume.strum': (val) => typeof val === 'number' && val >= 0 && val <= 100,
        'settings.volume.metronome': (val) => typeof val === 'number' && val >= 0 && val <= 100,
        bars: (val) => Array.isArray(val),
        currentBarIndex: (val) => typeof val === 'number' && val >= 0,
        'playback.currentBar': (val) => typeof val === 'number' && val >= 0,
        'playback.currentBeat': (val) => typeof val === 'number' && val >= 0,
        'playback.tempo': (val) => typeof val === 'number' && val >= 40 && val <= 300,
        'ui.arrowsCount': (val) => typeof val === 'number' && val >= 1 && val <= 16,
      };
      
      const validator = validators[path];
      return validator ? validator(value) : true;
    }),
    
    use: jest.fn((middleware, options = {}) => {
      const id = `mw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return () => {}; // Функция для удаления middleware
    }),
    
    // Вспомогательные методы для тестов
    _getState: () => state,
    _getSubscribers: () => subscribers,
    _getHistory: () => history,
    _getHistoryIndex: () => historyIndex,
  };
};

// Очистка после каждого теста
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});