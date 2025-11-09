// Конфигурация приложения
export const APP_CONFIG = {
  // Версия приложения
  VERSION: '1.0.0',
  
  // Название приложения
  NAME: 'Guitar Combat',
  
  // Настройки аудио по умолчанию
  AUDIO_DEFAULTS: {
    VOLUME: 0.8,
    TEMPO: 120,
    AUTO_PLAY: false,
    LOOP: false
  },
  
  // Настройки UI по умолчанию
  UI_DEFAULTS: {
    THEME: 'light',
    LANGUAGE: 'en',
    SHOW_NOTIFICATIONS: true,
    AUTO_SAVE: true
  },
  
  // Настройки воспроизведения по умолчанию
  PLAYBACK_DEFAULTS: {
    AUTO_PLAY: false,
    LOOP: false,
    COUNT_IN: false
  },
  
  // Пути к ресурсам
  PATHS: {
    AUDIO_NOTES: 'audio/NotesMP3/',
    TEMPLATES: 'templates/',
    EXPORT: 'exports/'
  },
  
  // Расширения файлов
  FILE_EXTENSIONS: {
    AUDIO: ['.mp3', '.wav', '.ogg'],
    TEMPLATE: ['.json'],
    EXPORT: ['.json', '.mid'],
    PROJECT: ['.gcp'] // Guitar Combat Project
  },
  
  // Ограничения
  LIMITS: {
    MAX_BARS: 64,
    MAX_CHORDS_PER_BAR: 16,
    MAX_TEMPO: 200,
    MIN_TEMPO: 40,
    MAX_VOLUME: 1.0,
    MIN_VOLUME: 0.0
  },
  
  // Настройки localStorage
  STORAGE_KEYS: {
    CONFIG: 'guitar-combat-config',
    PROJECT: 'guitar-combat-project',
    TEMPLATES: 'guitar-combat-templates',
    AUDIO_SETTINGS: 'guitar-combat-audio',
    UI_SETTINGS: 'guitar-combat-ui'
  },
  
  // Настройки уведомлений
  NOTIFICATIONS: {
    DURATION: 3000, // мс
    POSITION: 'top-right',
    MAX_COUNT: 5
  },
  
  // Настройки анимации
  ANIMATION: {
    DURATION: 300, // мс
    EASING: 'ease-in-out'
  },
  
  // Настройки дебаунсинга
  DEBOUNCE: {
    SEARCH: 300, // мс
    AUTO_SAVE: 1000, // мс
    TEMPO_CHANGE: 200 // мс
  },
  
  // Настройки валидации
  VALIDATION: {
    CHORD_NAME_MAX_LENGTH: 10,
    TEMPLATE_NAME_MAX_LENGTH: 50,
    PROJECT_NAME_MAX_LENGTH: 100
  },
  
  // Настройки производительности
  PERFORMANCE: {
    MAX_CONCURRENT_AUDIO: 8,
    AUDIO_BUFFER_SIZE: 4096,
    UPDATE_INTERVAL: 16 // мс (60 FPS)
  },
  
  // Настройки отладки
  DEBUG: {
    ENABLED: false,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    SHOW_PERFORMANCE: false
  }
};

// Конфигурация аудио системы
export const AUDIO_CONFIG = {
  // Контекст аудио
  CONTEXT: {
    SAMPLE_RATE: 44100,
    BUFFER_SIZE: 4096,
    CHANNELS: 2
  },
  
  // Настройки громкости
  VOLUME: {
    MASTER: 1.0,
    CHORD: 0.8,
    METRONOME: 0.5
  },
  
  // Настройки темпа
  TEMPO: {
    MIN: 40,
    MAX: 200,
    DEFAULT: 120,
    STEP: 1
  },
  
  // Настройки нот
  NOTES: {
    OCTAVES: [1, 2, 3],
    PITCH_BEND_RANGE: 12, // полутонов
    SUSTAIN_TIME: 0.5 // секунд
  }
};

// Конфигурация UI
export const UI_CONFIG = {
  // Размеры
  SIZES: {
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800
  },
  
  // Цвета
  COLORS: {
    PRIMARY: '#007bff',
    SECONDARY: '#6c757d',
    SUCCESS: '#28a745',
    DANGER: '#dc3545',
    WARNING: '#ffc107',
    INFO: '#17a2b8',
    LIGHT: '#f8f9fa',
    DARK: '#343a40'
  },
  
  // Шрифты
  FONTS: {
    PRIMARY: 'Arial, sans-serif',
    MONOSPACE: 'Courier New, monospace',
    MUSIC: 'Bravura, sans-serif'
  },
  
  // Отступы
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px'
  },
  
  // Скругления
  BORDER_RADIUS: {
    SM: '4px',
    MD: '8px',
    LG: '12px',
    XL: '16px'
  }
};

// Конфигурация шаблонов
export const TEMPLATE_CONFIG = {
  // Встроенные шаблоны
  BUILTIN: [
    'basic-4-4',
    'basic-3-4',
    'blues-12-bar'
  ],
  
  // Настройки валидации
  VALIDATION: {
    MIN_BARS: 1,
    MAX_BARS: 32,
    MIN_BEATS: 1,
    MAX_BEATS: 16
  },
  
  // Настройки экспорта
  EXPORT: {
    INCLUDE_AUDIO: false,
    INCLUDE_SETTINGS: true,
    FORMAT_VERSION: '1.0'
  }
};

// Конфигурация производительности
export const PERFORMANCE_CONFIG = {
  // Кэширование
  CACHE: {
    AUDIO_BUFFERS: true,
    TEMPLATES: true,
    SETTINGS: true
  },
  
  // Ленивая загрузка
  LAZY_LOADING: {
    AUDIO: true,
    TEMPLATES: false,
    COMPONENTS: true
  },
  
  // Оптимизация
  OPTIMIZATION: {
    VIRTUAL_SCROLLING: false,
    DEBOUNCE_INPUTS: true,
    THROTTLE_EVENTS: true
  }
};

// Конфигурация безопасности
export const SECURITY_CONFIG = {
  // Настройки CORS
  CORS: {
    ALLOWED_ORIGINS: ['*'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization']
  },
  
  // Настройки валидации
  VALIDATION: {
    SANITIZE_INPUT: true,
    ESCAPE_HTML: true,
    VALIDATE_FILE_TYPES: true
  }
};