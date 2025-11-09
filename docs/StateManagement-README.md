# Система управления состоянием Guitar Combat

## Обзор

Система управления состоянием (State Management) для приложения Guitar Combat предоставляет централизованный подход к управлению данными приложения с поддержкой истории изменений, middleware и удобных хуков для работы с состоянием в компонентах.

## Быстрый старт

### Установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd guitar-combat-restore

# Установите зависимости
npm install
```

### Базовое использование

```javascript
import StateManager from './js/core/StateManager.js';
import StateHooks from './js/core/StateHooks.js';
import StateActions from './js/core/StateActions.js';
import StateSelectors from './js/core/StateSelectors.js';
import EventBus from './js/core/EventBus.js';

// Создаем экземпляр EventBus
const eventBus = new EventBus();

// Создаем StateManager
const stateManager = new StateManager(eventBus);

// Создаем StateActions и StateSelectors для удобной работы
const stateActions = new StateActions(stateManager, eventBus);

// Создаем StateHooks для удобной работы
const stateHooks = new StateHooks(stateManager);

// Получаем состояние
const bpm = stateManager.getState('settings.bpm');
console.log('Текущий BPM:', bpm); // 120

// Устанавливаем новое значение через StateActions
stateActions.updateTempo(140);

// Подписываемся на изменения
const unsubscribe = stateManager.subscribe('settings.bpm', (newValue, oldValue) => {
  console.log(`BPM изменен с ${oldValue} на ${newValue}`);
});

// Используем селекторы для получения данных
const currentChords = StateSelectors.getCurrentChords(stateManager.getState());
const playbackSettings = StateSelectors.getPlaybackSettings(stateManager.getState());

// Используем хуки
const [arrowsCount, setArrowsCount] = stateHooks.useState('ui.arrowsCount');
setArrowsCount(12);
```

## Структура проекта

```
js/core/
├── StateManager.js          # Основной класс управления состоянием
├── StateHooks.js            # Хуки для удобной работы с состоянием
├── StateMiddleware.js       # Система middleware
├── StateSelectors.js        # Селекторы для получения данных из состояния
├── StateActions.js          # Действия для изменения состояния
└── examples/
    ├── StateManagerExample.js # Примеры использования StateManager
    └── StateManagerUsageExample.js # Примеры использования всей системы

tests/
├── setup.js                 # Настройка тестового окружения
└── core/
    └── StateManager.test.js  # Тесты StateManager

docs/
├── StateManagement.md       # Подробная документация
├── Testing.md              # Документация по тестированию
└── StateManagement-README.md # Этот файл
```

## Основные компоненты

### StateManager

Централизованное хранилище состояния приложения с поддержкой:

- Получения и установки состояния по пути
- Подписок на изменения состояния
- Истории изменений (undo/redo)
- Валидации данных
- Сериализации/десериализации состояния
- Расширения через middleware

### StateActions

Класс для выполнения действий над состоянием с интеграцией EventBus:

- `updateChordsInput` - Обновление строки аккордов
- `updateParsedChords` - Обновление распарсенных аккордов
- `updateBars` - Обновление тактов
- `nextBar/previousBar/goToBar` - Навигация по тактам
- `updateTempo/updateBeatCount` - Обновление настроек воспроизведения
- `togglePlayback/startPlayback/stopPlayback` - Управление воспроизведением
- `updatePlaybackPosition` - Обновление позиции воспроизведения
- `selectTemplate` - Выбор шаблона
- `updateVolume` - Обновление громкости
- `toggleSettings` - Переключение видимости настроек
- `updateSongText` - Обновление текста песни

### StateSelectors

Статические методы для получения данных из состояния:

- `getCurrentChords` - Получение текущих аккордов
- `getCurrentBar` - Получение текущего такта
- `getPlaybackSettings` - Получение настроек воспроизведения
- `getTemplatesInfo` - Получение информации о шаблонах
- `getChordsStats` - Получение статистики по аккордам
- `getBarsInfo` - Получение информации о тактах

### StateHooks

Удобные хуки для работы с состоянием в компонентах:

- `useState` - Базовая работа с состоянием
- `useForm` - Управление формами
- `useArray` - Работа с массивами
- `useAsync` - Асинхронные операции
- `useLocalState` - Локальное состояние компонента
- `useHistory` - Работа с историей изменений
- `usePersistentState` - Персистентное состояние

### StateMiddleware

Система промежуточного ПО для расширения функциональности:

- `logger` - Логирование изменений
- `localStorage` - Сохранение в localStorage
- `validator` - Валидация данных
- `immutable` - Обеспечение иммутабельности
- `analytics` - Отправка аналитики
- `sync` - Синхронизация с сервером

## Примеры использования

### Использование StateActions и StateSelectors

```javascript
// Инициализация
const eventBus = new EventBus();
const stateManager = new StateManager(eventBus);
const stateActions = new StateActions(stateManager, eventBus);

// Использование действий для обновления состояния
stateActions.updateChordsInput("Am F C G");
stateActions.updateTempo(120);
stateActions.togglePlayback();

// Получение состояния через селекторы
const currentChords = StateSelectors.getCurrentChords(stateManager.getState());
const playbackSettings = StateSelectors.getPlaybackSettings(stateManager.getState());
const chordsStats = StateSelectors.getChordsStats(stateManager.getState());

console.log('Current chords:', currentChords);
console.log('Playback settings:', playbackSettings);
console.log('Chords statistics:', chordsStats);
```

### Работа с аккордами

```javascript
// Установка строки с аккордами через StateActions
stateActions.updateChordsInput('C G Am F Dm G C');

// Парсинг аккордов
const inputString = stateManager.getState('chords.inputString');
const parsedChords = inputString.split(' ').filter(chord => chord.trim());

// Валидация аккордов
const validChords = parsedChords.filter(chord =>
  ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(chord.replace(/[mM]/g, ''))
);

// Обновление через StateActions
stateActions.updateParsedChords(validChords, parsedChords.filter(chord => !validChords.includes(chord)));
```

### Управление воспроизведением

```javascript
// Начало воспроизведения через StateActions
stateActions.startPlayback();

// Подписка на изменения воспроизведения
stateManager.subscribe('playback.isPlaying', (isPlaying) => {
  if (isPlaying) {
    startPlaybackTimer();
  } else {
    stopPlaybackTimer();
  }
});

// Обновление позиции воспроизведения через StateActions
function updatePlayback() {
  if (!stateManager.getState('playback.isPlaying')) return;

  const currentBar = stateManager.getState('playback.currentBar');
  const currentBeat = stateManager.getState('playback.currentBeat');
  const beatCount = stateManager.getState('settings.beatCount');

  let newBeat = currentBeat + 1;
  let newBar = currentBar;

  if (newBeat >= beatCount) {
    newBeat = 0;
    newBar = currentBar + 1;
    
    if (newBar >= stateManager.getState('bars').length) {
      newBar = 0; // Зацикливание
    }
  }

  stateActions.updatePlaybackPosition(newBar, newBeat);
}
```

### Навигация по тактам

```javascript
// Обновление тактов
stateActions.updateBars([
  { chords: ['Am', 'F'], duration: 8 },
  { chords: ['C', 'G'], duration: 8 },
  { chords: ['Dm', 'Am'], duration: 8 }
]);

// Навигация по тактам
stateActions.nextBar();
stateActions.previousBar();
stateActions.goToBar(2);

// Получение информации о тактах
const barsInfo = StateSelectors.getBarsInfo(stateManager.getState());
console.log('Bars info:', barsInfo);
// Вывод: { total: 3, current: 1, hasPrevious: true, hasNext: true }
```

### Использование middleware

```javascript
// Логирование изменений
stateManager.use(CommonMiddleware.logger({
  logLevel: 'info',
  filter: (path) => path.startsWith('settings'),
}));

// Сохранение в localStorage
stateManager.use(CommonMiddleware.localStorage({
  key: 'guitar_combat_state',
  debounceMs: 500,
}));

// Валидация данных
stateManager.use(CommonMiddleware.validator({
  schema: {
    'settings.bpm': (value) => value >= 40 && value <= 300,
    'settings.beatCount': (value) => value >= 1 && value <= 16,
  },
  strict: false,
}));
```

## Тестирование

### Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск с покрытием кода
npm test -- --coverage

# Запуск в режиме отслеживания
npm test -- --watch
```

### Структура тестов

```javascript
describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(new MockEventBus());
  });

  test('должен устанавливать и получать состояние', () => {
    stateManager.setState('settings.bpm', 140);
    expect(stateManager.getState('settings.bpm')).toBe(140);
  });
});
```

## Документация

- [Подробная документация](./StateManagement.md) - Полное описание API и примеры
- [Тестирование](./Testing.md) - Руководство по написанию и запуску тестов
- [Примеры использования StateManager](../js/core/examples/StateManagerExample.js) - Практические примеры StateManager
- [Примеры использования системы](../js/core/examples/StateManagerUsageExample.js) - Примеры использования StateActions и StateSelectors

## Структура состояния

```javascript
{
  // Настройки приложения
  settings: {
    beatCount: 4,           // Количество долей в такте
    bpm: 120,               // Темп воспроизведения
    chordChanges: {},       // Изменения аккордов
    isPlaying: false,       // Состояние воспроизведения
    volume: {               // Настройки громкости
      strum: 80,            // Громкость перебора
      metronome: 100,       // Громкость метронома
    },
  },

  // Данные аккордов
  chords: {
    inputString: "",        // Входная строка с аккордами
    parsedChords: [],       // Распарсенные аккорды
    validChords: [],        // Валидные аккорды
    invalidChords: [],      // Невалидные аккорды
  },

  // Такты и их содержимое
  bars: [],                 // Массив тактов
  currentBarIndex: 0,       // Индекс текущего такта

  // Состояние воспроизведения
  playback: {
    isPlaying: false,       // Состояние воспроизведения
    currentBar: 0,          // Текущий такт
    currentBeat: 0,         // Текущая доля
    tempo: 120,             // Темп воспроизведения
  },

  // UI состояние
  ui: {
    selectedTemplate: null, // Выбранный шаблон
    showSettings: false,    // Показать настройки
    showSongText: false,    // Показать текст песни
    arrowsCount: 8,         // Количество стрелок
  },

  // Данные шаблонов
  templates: {
    available: [],          // Доступные шаблоны
    loaded: [],             // Загруженные шаблоны
    custom: [],             // Пользовательские шаблоны
  },

  // Текст песни
  songText: {
    content: "",            // Содержимое текста
    syllables: [],          // Слоги текста
  },
}
```

## Лучшие практики

### 1. Структурирование состояния

- Группируйте связанные данные в логические разделы
- Избегайте излишней вложенности
- Используйте плоскую структуру для часто изменяемых данных

### 2. Использование middleware

- Применяйте middleware для кросс-срезающей логики
- Используйте фильтры для оптимизации производительности
- Комбинируйте несколько middleware для сложных сценариев

### 3. Подписки

- Отписывайтесь от изменений, когда они больше не нужны
- Используйте точные пути для подписок вместо общих
- Применяйте `subscribeMultiple` для отслеживания нескольких путей

### 4. История изменений

- Ограничивайте размер истории для экономии памяти
- Используйте опцию `saveToHistory: false` для временных изменений
- Предоставляйте пользователю возможность отмены действий

## Интеграция с существующим кодом

Для интеграции новой системы управления состоянием с существующим кодом:

1. **Постепенный переход**: Начните с новых компонентов и постепенно переносите существующие
2. **Адаптеры**: Создайте адаптеры для совместимости со старым кодом
3. **Обучение**: Проведите обучение команды по использованию новой системы
4. **Документация**: Поддерживайте актуальную документацию по состоянию приложения

## Внесение вклада

При внесении изменений в систему управления состоянием:

1. Напишите тесты для новой функциональности
2. Обновите документацию
3. Убедитесь, что все тесты проходят
4. Следуйте существующим стилям кода

## Поддержка

Если у вас есть вопросы или проблемы с системой управления состоянием:

1. Проверьте документацию
2. Посмотрите примеры использования
3. Изучите тесты для понимания ожидаемого поведения
4. Создайте issue с подробным описанием проблемы

## Лицензия

[Информация о лицензии]

---

**Примечание**: Эта система управления состоянием является частью приложения Guitar Combat и разработана специально для его нужд. При использовании в других проектах может потребоваться адаптация.