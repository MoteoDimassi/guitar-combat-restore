# Система управления состоянием (State Management)

## Обзор

Система управления состоянием в приложении Guitar Combat построена на основе централизованного подхода с использованием паттерна "Single Source of Truth". Она обеспечивает предсказуемое управление состоянием приложения с возможностью отслеживания изменений, отката действий и расширения функциональности через middleware.

## Основные компоненты

### 1. StateManager

`StateManager` - это ядро системы управления состоянием, которое предоставляет централизованное хранилище для всех данных приложения.

#### Основные возможности:

- **Централизованное хранение**: Все состояние приложения хранится в одном месте
- **Иммутабельность**: Состояние изменяется только через специальные методы
- **История изменений**: Поддержка undo/redo операций
- **Подписки**: Возможность подписываться на изменения отдельных частей состояния
- **Валидация**: Проверка данных перед изменением состояния
- **Middleware**: Расширение функциональности через промежуточное ПО

#### Структура состояния:

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

#### Основные методы:

##### `getState(path?)`
Получение состояния или его части по пути.

```javascript
// Получение всего состояния
const fullState = stateManager.getState();

// Получение конкретного значения
const bpm = stateManager.getState('settings.bpm');
const volume = stateManager.getState('settings.volume.strum');
```

##### `setState(path, value, options?)`
Установка значения по пути.

```javascript
// Простое присваивание
stateManager.setState('settings.bpm', 140);

// С опциями
stateManager.setState('playback.isPlaying', true, {
  saveToHistory: true,  // Сохранить в историю (по умолчанию)
});
```

##### `updateState(path, updater, options?)`
Обновление состояния через функцию.

```javascript
// Увеличение громкости на 10
stateManager.updateState('settings.volume.strum', volume => Math.min(100, volume + 10));

// Добавление элемента в массив
stateManager.updateState('bars', bars => [...bars, newBar]);
```

##### `subscribe(path, callback, options?)`
Подписка на изменения состояния.

```javascript
// Подписка на изменения BPM
const unsubscribe = stateManager.subscribe('settings.bpm', (newValue, oldValue) => {
  console.log(`BPM изменен с ${oldValue} на ${newValue}`);
});

// Отписка
unsubscribe();
```

##### `subscribeMultiple(paths, callback, options?)`
Подписка на несколько путей одновременно.

```javascript
const unsubscribe = stateManager.subscribeMultiple(
  ['settings.bpm', 'settings.beatCount'],
  (value, oldValue, changedPath) => {
    console.log(`Изменен ${changedPath}:`, value);
  }
);
```

##### `undo()` и `redo()`
Отмена и повтор изменений.

```javascript
// Отмена последнего изменения
if (stateManager.canUndo()) {
  stateManager.undo();
}

// Повтор отмененного изменения
if (stateManager.canRedo()) {
  stateManager.redo();
}
```

##### `reset(path?)`
Сброс состояния к начальным значениям.

```javascript
// Сброс всего состояния
stateManager.reset();

// Сброс только настроек
stateManager.reset('settings');
```

##### `toJSON()` и `fromJSON(data)`
Сериализация и десериализация состояния.

```javascript
// Сохранение состояния
const stateJSON = stateManager.toJSON();
localStorage.setItem('appState', JSON.stringify(stateJSON));

// Загрузка состояния
const savedState = JSON.parse(localStorage.getItem('appState'));
stateManager.fromJSON(savedState);
```

### 2. StateHooks

`StateHooks` предоставляет удобные хуки для работы с состоянием в компонентах.

#### Основные хуки:

##### `useState(path, callback)`
Хук для получения состояния и подписки на изменения.

```javascript
const [value, setValue, unsubscribe] = stateHooks.useState(
  'settings.bpm',
  (newValue) => console.log('BPM изменен:', newValue)
);

// Получение значения
console.log(value);

// Установка значения
setValue(130);
```

##### `useForm(basePath, initialValues)`
Хук для работы с формами.

```javascript
const chordForm = stateHooks.useForm('chordInput', {
  chordName: '',
  chordType: 'major',
});

// Установка значений
chordForm.setValue('chordName', 'C');
chordForm.setValue('chordType', 'minor');

// Получение всех значений
const formData = chordForm.getValues();

// Валидация
const isValid = chordForm.validate({
  chordName: (value) => value.length > 0 || 'Введите название аккорда',
  chordType: (value) => ['major', 'minor'].includes(value) || 'Выберите тип аккорда',
});
```

##### `useArray(path)`
Хук для работы с массивами.

```javascript
const barsArray = stateHooks.useArray('bars');

// Добавление элемента
barsArray.addItem({ id: 1, chords: ['C', 'G', 'Am', 'F'] });

// Вставка по индексу
barsArray.addItem({ id: 2, chords: ['D', 'A', 'Bm', 'G'] }, 0);

// Удаление элемента
barsArray.removeItem(1);

// Обновление элемента
barsArray.updateItem(0, { id: 1, chords: ['C', 'Am', 'F', 'G'] });

// Перемещение элемента
barsArray.moveItem(0, 1);

// Очистка массива
barsArray.clear();
```

##### `useAsync(path)`
Хук для работы с асинхронными операциями.

```javascript
const chordsLoader = stateHooks.useAsync('chords.loading');

// Проверка состояния
if (chordsLoader.isLoading()) {
  console.log('Загрузка аккордов...');
}

// Выполнение асинхронной операции
try {
  const chords = await chordsLoader.execute(async () => {
    const response = await fetch('/api/chords');
    return response.json();
  });
  
  console.log('Загруженные аккорды:', chords);
} catch (error) {
  console.error('Ошибка загрузки:', chordsLoader.getError());
}
```

##### `useLocalState(componentId, initialState)`
Хук для локального состояния компонента.

```javascript
const componentState = stateHooks.useLocalState('chordDisplay', {
  isVisible: true,
  selectedChord: null,
});

// Установка состояния
componentState.setState('isVisible', false);

// Установка нескольких полей
componentState.setState({
  isVisible: true,
  selectedChord: 'C',
});

// Подписка на изменения
const unsubscribe = componentState.subscribe('selectedChord', (chord) => {
  console.log('Выбран аккорд:', chord);
});
```

##### `useHistory()`
Хук для работы с историей изменений.

```javascript
const history = stateHooks.useHistory();

// Проверка доступности операций
if (history.canUndo()) {
  history.undo();
}

if (history.canRedo()) {
  history.redo();
}

// Очистка истории
history.clear();

// Получение размера истории
console.log('Размер истории:', history.size());
```

##### `usePersistentState(path, storageKey, options?)`
Хук для персистентного состояния.

```javascript
const persistentSettings = stateHooks.usePersistentState(
  'settings',
  'guitar_combat_settings',
  {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
);

// Установка значения (автоматически сохраняется в localStorage)
persistentSettings.setValue('bpm', 140);

// Получение значения
const bpm = persistentSettings.getValue();

// Очистка хранилища
persistentSettings.clearStorage();
```

### 3. StateMiddleware

`StateMiddleware` предоставляет систему промежуточного ПО для расширения функциональности StateManager.

#### Встроенные middleware:

##### `CommonMiddleware.logger(options)`
Middleware для логирования изменений состояния.

```javascript
stateManager.use(CommonMiddleware.logger({
  logLevel: 'info',           // Уровень логирования
  includeOldValue: true,      // Включать старое значение
  includeTimestamp: true,     // Включать временную метку
  filter: (path) => path.startsWith('settings'), // Фильтр путей
}));
```

##### `CommonMiddleware.localStorage(options)`
Middleware для сохранения состояния в localStorage.

```javascript
stateManager.use(CommonMiddleware.localStorage({
  key: 'app_state',           // Ключ в localStorage
  debounceMs: 500,            // Задержка перед сохранением
  filter: (path) => !path.startsWith('ui'), // Не сохранять UI состояние
}));
```

##### `CommonMiddleware.validator(options)`
Middleware для валидации состояния.

```javascript
stateManager.use(CommonMiddleware.validator({
  schema: {
    'settings.bpm': (value) => value >= 40 && value <= 300,
    'settings.beatCount': (value) => value >= 1 && value <= 16,
  },
  strict: false,              // Не прерывать выполнение при ошибке
}));
```

##### `CommonMiddleware.immutable(options)`
Middleware для обеспечения иммутабельности состояния.

```javascript
stateManager.use(CommonMiddleware.immutable({
  deep: true,                // Глубокая заморозка объектов
  paths: ['settings', 'bars'], // Применять только к указанным путям
}));
```

##### `CommonMiddleware.analytics(options)`
Middleware для отправки аналитики.

```javascript
stateManager.use(CommonMiddleware.analytics({
  tracker: analyticsTracker,  // Объект для отслеживания
  eventName: 'state_changed', // Имя события
  filter: (path) => path.startsWith('playback'), // Фильтр путей
  transform: (data) => ({     // Трансформация данных
    path: data.path,
    value: data.value,
  }),
}));
```

##### `CommonMiddleware.sync(options)`
Middleware для синхронизации состояния с сервером.

```javascript
stateManager.use(CommonMiddleware.sync({
  apiClient: httpClient,      // HTTP клиент
  endpoint: '/api/sync',      // Эндпоинт синхронизации
  debounceMs: 1000,           // Задержка перед синхронизацией
  retryCount: 3,              // Количество попыток при ошибке
}));
```

## Примеры использования

### Базовое использование

```javascript
import StateManager from './js/core/StateManager.js';
import StateHooks from './js/core/StateHooks.js';
import CommonMiddleware from './js/core/StateMiddleware.js';

// Создание StateManager
const stateManager = new StateManager(eventBus);

// Настройка middleware
stateManager.use(CommonMiddleware.logger());
stateManager.use(CommonMiddleware.localStorage());

// Создание StateHooks
const stateHooks = new StateHooks(stateManager);

// Работа с состоянием
stateManager.setState('settings.bpm', 120);
const bpm = stateManager.getState('settings.bpm');

// Подписка на изменения
stateManager.subscribe('settings.bpm', (newValue) => {
  console.log('BPM изменен:', newValue);
});
```

### Работа с аккордами

```javascript
// Установка строки с аккордами
stateManager.setState('chords.inputString', 'C G Am F Dm G C');

// Парсинг аккордов
const inputString = stateManager.getState('chords.inputString');
const parsedChords = inputString.split(' ').filter(chord => chord.trim());

// Валидация аккордов
const validChords = parsedChords.filter(chord => 
  ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(chord.replace(/[mM]/g, ''))
);

stateManager.setState('chords.parsedChords', parsedChords);
stateManager.setState('chords.validChords', validChords);

// Создание тактов
const beatCount = stateManager.getState('settings.beatCount');
const bars = [];

for (let i = 0; i < validChords.length; i += beatCount) {
  bars.push({
    id: bars.length,
    chords: validChords.slice(i, i + beatCount),
  });
}

stateManager.setState('bars', bars);
```

### Управление воспроизведением

```javascript
// Начало воспроизведения
stateManager.setState('playback.isPlaying', true);

// Подписка на изменения воспроизведения
stateManager.subscribe('playback.isPlaying', (isPlaying) => {
  if (isPlaying) {
    startPlaybackTimer();
  } else {
    stopPlaybackTimer();
  }
});

// Функция обновления текущего такта и доли
function updatePlayback() {
  if (!stateManager.getState('playback.isPlaying')) return;

  const currentBar = stateManager.getState('playback.currentBar');
  const currentBeat = stateManager.getState('playback.currentBeat');
  const beatCount = stateManager.getState('settings.beatCount');
  const bars = stateManager.getState('bars');

  // Обновление текущей доли
  let newBeat = currentBeat + 1;
  let newBar = currentBar;

  if (newBeat >= beatCount) {
    newBeat = 0;
    newBar = currentBar + 1;
    
    if (newBar >= bars.length) {
      newBar = 0; // Зацикливание
    }
  }

  stateManager.setState('playback.currentBar', newBar);
  stateManager.setState('playback.currentBeat', newBeat);
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

### 5. Валидация

- Валидируйте данные на уровне StateManager
- Используйте строгую валидацию для критических данных
- Предоставляйте понятные сообщения об ошибках

### 6. Производительность

- Используйте debounce для частых изменений
- Применяйте фильтры в middleware для оптимизации
- Избегайте излишних подписок на изменения

## Интеграция с существующим кодом

Для интеграции новой системы управления состоянием с существующим кодом:

1. **Постепенный переход**: Начните с новых компонентов и постепенно переносите существующие
2. **Адаптеры**: Создайте адаптеры для совместимости со старым кодом
3. **Обучение**: Проведите обучение команды по использованию новой системы
4. **Документация**: Поддерживайте актуальную документацию по состоянию приложения

## Заключение

Система управления состоянием предоставляет мощный и гибкий инструмент для управления данными в приложении Guitar Combat. Она обеспечивает предсказуемость, отслеживаемость и расширяемость состояния, что упрощает разработку и поддержку приложения.