// События приложения
export const APP_EVENTS = {
  // Инициализация
  APP_INITIALIZED: 'app:initialized',
  APP_INITIALIZATION_FAILED: 'app:initialization-failed',
  APP_SHUTDOWN: 'app:shutdown',
  
  // Ошибки
  ERROR_OCCURRED: 'error:occurred',
  ERROR_HANDLED: 'error:handled',
  
  // Настройки
  SETTINGS_SAVED: 'settings:saved',
  SETTINGS_CHANGED: 'settings:changed',
  SETTINGS_CLOSED: 'settings:closed',
  
  // Воспроизведение
  PLAYBACK_STARTED: 'playback:started',
  PLAYBACK_PAUSED: 'playback:paused',
  PLAYBACK_STOPPED: 'playback:stopped',
  PLAYBACK_TOGGLED: 'playback:toggle',
  PLAYBACK_TEMPO_CHANGED: 'playback:tempo-changed',
  PLAYBACK_BEAT: 'playback:beat',
  PLAYBACK_BAR: 'playback:bar',
  PLAYBACK_NO_BARS: 'playback:no-bars',
  
  // Аккорды
  CHORDS_LOADED: 'chords:loaded',
  CHORD_LOADED: 'chord:loaded',
  CHORD_ADDED: 'chord:added',
  CHORD_REMOVED: 'chord:removed',
  CHORD_UPDATED: 'chord:updated',
  CHORD_SELECTED: 'chord:selected',
  CHORD_NOT_FOUND: 'chord:not-found',
  CHORDS_LOADED_FOR_BAR: 'chords:loaded-for-bar',
  
  // Такты
  BARS_LOADED: 'bars:loaded',
  BAR_ADDED: 'bar:add',
  BAR_REMOVED: 'bar:remove',
  BAR_UPDATED: 'bar:updated',
  BAR_SELECTED: 'bar:selected',
  BAR_UPDATE_FAILED: 'bar:update-failed',
  
  // Шаблоны
  TEMPLATE_SELECTED: 'template:selected',
  TEMPLATE_APPLIED: 'template:applied',
  TEMPLATES_LOADED: 'templates:loaded',
  
  // Модальные окна
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  MODAL_CLOSED: 'modal:closed',
  MODAL_CONFIRMED: 'modal:confirmed',
  
  // Размер такта
  TIME_SIGNATURE_CHANGED: 'time-signature:changed',
  
  // Проект
  PROJECT_SAVED: 'project:saved',
  PROJECT_OPENED: 'project:opened',
  
  // Экспорт/импорт
  EXPORT_REQUESTED: 'export:requested',
  IMPORT_REQUESTED: 'import:requested',
  
  // UI
  WINDOW_RESIZED: 'window:resized',
  
  // Инициализация
  INITIALIZATION_STEP_STARTED: 'initialization:step-started',
  INITIALIZATION_STEP_COMPLETED: 'initialization:step-completed',
  INITIALIZATION_COMPLETED: 'initialization:completed',
  INITIALIZATION_FAILED: 'initialization:failed'
};

// Типы ошибок
export const ERROR_TYPES = {
  AUDIO: 'audio',
  STORAGE: 'storage',
  NETWORK: 'network',
  VALIDATION: 'validation',
  GENERAL: 'general',
  JAVASCRIPT: 'javascript',
  PROMISE: 'promise'
};

// Типы модальных окон
export const MODAL_TYPES = {
  SETTINGS: 'settings',
  TEMPLATES: 'templates',
  EXPORT: 'export',
  IMPORT: 'import',
  CONFIRM: 'confirm'
};

// Состояния воспроизведения
export const PLAYBACK_STATES = {
  STOPPED: 'stopped',
  PLAYING: 'playing',
  PAUSED: 'paused'
};

// Размеры тактов
export const TIME_SIGNATURES = [
  { beats: 2, beatUnit: 2, name: '2/2' },
  { beats: 2, beatUnit: 4, name: '2/4' },
  { beats: 3, beatUnit: 4, name: '3/4' },
  { beats: 4, beatUnit: 4, name: '4/4' },
  { beats: 6, beatUnit: 8, name: '6/8' }
];

// Диапазоны темпа
export const TEMPO_RANGE = {
  MIN: 40,
  MAX: 200,
  DEFAULT: 120
};

// Диапазоны громкости
export const VOLUME_RANGE = {
  MIN: 0,
  MAX: 1,
  DEFAULT: 0.8
};

// Типы аккордов
export const CHORD_TYPES = {
  MAJOR: 'major',
  MINOR: 'minor',
  DIM: 'dim',
  AUG: 'aug',
  MAJ7: 'maj7',
  MIN7: 'min7',
  DOM7: 'dom7',
  MAJ6: 'maj6',
  MIN6: 'min6'
};

// Ноты
export const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 
  'F#', 'G', 'G#', 'A', 'A#', 'B'
];

// Тональности
export const KEYS = {
  C: { major: 'C', minor: 'Am' },
  G: { major: 'G', minor: 'Em' },
  D: { major: 'D', minor: 'Bm' },
  A: { major: 'A', minor: 'F#m' },
  E: { major: 'E', minor: 'C#m' },
  B: { major: 'B', minor: 'G#m' },
  F: { major: 'F', minor: 'Dm' }
};

// Типы хранения
export const STORAGE_TYPES = {
  LOCAL: 'local',
  FILE: 'file'
};

// Форматы экспорта
export const EXPORT_FORMATS = {
  JSON: 'json',
  MIDI: 'midi'
};

// Темы интерфейса
export const UI_THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Языки интерфейса
export const UI_LANGUAGES = {
  EN: 'en',
  RU: 'ru'
};

// Клавиатурные сокращения
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ' ',
  STOP: 'Escape',
  SAVE: 'Ctrl+S',
  OPEN: 'Ctrl+O'
};