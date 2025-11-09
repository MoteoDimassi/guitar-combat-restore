// Базовые типы данных

// Тип аккорда
export const ChordType = {
  MAJOR: 'major',
  MINOR: 'minor',
  DIMINISHED: 'diminished',
  AUGMENTED: 'augmented',
  MAJOR_SEVENTH: 'major-seventh',
  MINOR_SEVENTH: 'minor-seventh',
  DOMINANT_SEVENTH: 'dominant-seventh',
  MAJOR_SIXTH: 'major-sixth',
  MINOR_SIXTH: 'minor-sixth'
};

// Тип ноты
export const NoteType = {
  NATURAL: 'natural',
  SHARP: 'sharp',
  FLAT: 'flat'
};

// Тип интервала
export const IntervalType = {
  UNISON: 'unison',
  SECOND: 'second',
  THIRD: 'third',
  FOURTH: 'fourth',
  FIFTH: 'fifth',
  SIXTH: 'sixth',
  SEVENTH: 'seventh',
  OCTAVE: 'octave'
};

// Качество интервала
export const IntervalQuality = {
  PERFECT: 'perfect',
  MAJOR: 'major',
  MINOR: 'minor',
  AUGMENTED: 'augmented',
  DIMINISHED: 'diminished'
};

// Тип такта
export const BarType = {
  STANDARD: 'standard',
  REPEAT: 'repeat',
  ENDING: 'ending',
  CODA: 'coda'
};

// Тип размера
export const TimeSignatureType = {
  SIMPLE: 'simple',
  COMPOUND: 'compound',
  IRREGULAR: 'irregular'
};

// Тип шаблона
export const TemplateType = {
  BUILTIN: 'builtin',
  CUSTOM: 'custom',
  USER: 'user'
};

// Тип воспроизведения
export const PlaybackType = {
  ONCE: 'once',
  LOOP: 'loop',
  REPEAT: 'repeat'
};

// Тип хранилища
export const StorageType = {
  LOCAL: 'local',
  SESSION: 'session',
  FILE: 'file',
  CLOUD: 'cloud'
};

// Тип экспорта
export const ExportType = {
  JSON: 'json',
  MIDI: 'midi',
  XML: 'xml',
  PDF: 'pdf'
};

// Тип импорта
export const ImportType = {
  JSON: 'json',
  MIDI: 'midi',
  XML: 'xml',
  GPX: 'gpx',
  GP5: 'gp5'
};

// Тип темы
export const ThemeType = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Тип языка
export const LanguageType = {
  ENGLISH: 'en',
  RUSSIAN: 'ru',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  ITALIAN: 'it',
  JAPANESE: 'ja',
  CHINESE: 'zh'
};

// Тип уведомления
export const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Тип ошибки
export const ErrorType = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUDIO: 'audio',
  STORAGE: 'storage',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

// Тип события
export const EventType = {
  MOUSE: 'mouse',
  KEYBOARD: 'keyboard',
  TOUCH: 'touch',
  AUDIO: 'audio',
  CUSTOM: 'custom'
};

// Тип команды
export const CommandType = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  CUSTOM: 'custom'
};

// Тип запроса
export const QueryType = {
  FIND: 'find',
  FIND_ALL: 'find-all',
  COUNT: 'count',
  EXISTS: 'exists',
  CUSTOM: 'custom'
};

// Тип состояния
export const StateType = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle'
};

// Тип валидации
export const ValidationType = {
  REQUIRED: 'required',
  MIN_LENGTH: 'min-length',
  MAX_LENGTH: 'max-length',
  PATTERN: 'pattern',
  EMAIL: 'email',
  NUMBER: 'number',
  POSITIVE: 'positive',
  RANGE: 'range'
};

// Тип анимации
export const AnimationType = {
  FADE_IN: 'fade-in',
  FADE_OUT: 'fade-out',
  SLIDE_IN: 'slide-in',
  SLIDE_OUT: 'slide-out',
  SCALE_IN: 'scale-in',
  SCALE_OUT: 'scale-out'
};

// Тип направления
export const DirectionType = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

// Тип позиции
export const PositionType = {
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
  FIXED: 'fixed',
  STATIC: 'static'
};

// Тип отображения
export const DisplayType = {
  BLOCK: 'block',
  INLINE: 'inline',
  INLINE_BLOCK: 'inline-block',
  FLEX: 'flex',
  GRID: 'grid',
  NONE: 'none'
};

// Тип выравнивания
export const AlignType = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
  STRETCH: 'stretch'
};

// Тип распределения
export const JustifyType = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
  BETWEEN: 'between',
  AROUND: 'around',
  EVENLY: 'evenly'
};

// Тип направления текста
export const TextDirectionType = {
  LEFT_TO_RIGHT: 'ltr',
  RIGHT_TO_LEFT: 'rtl'
};

// Тип преобразования
export const TransformType = {
  TRANSLATE: 'translate',
  ROTATE: 'rotate',
  SCALE: 'scale',
  SKEW: 'skew'
};

// Тип фильтра
export const FilterType = {
  BLUR: 'blur',
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  GRAYSCALE: 'grayscale',
  HUE_ROTATE: 'hue-rotate',
  INVERT: 'invert',
  SATURATE: 'saturate',
  SEPIA: 'sepia'
};