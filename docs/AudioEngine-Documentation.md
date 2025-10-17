# AudioEngine - Документация

## Обзор

Класс `AudioEngine` предназначен для управления воспроизведением аудиофайлов нот в приложении Guitar Combat. Он предоставляет полный функционал для загрузки, кэширования и воспроизведения MP3-файлов нот, а также управления состоянием воспроизведения.

## Основные возможности

- **Инициализация AudioContext** с кроссбраузерной поддержкой
- **Загрузка и кэширование** аудиофайлов для быстрого доступа
- **Воспроизведение отдельных нот** с возможностью управления параметрами
- **Одновременное воспроизведение нескольких нот** (аккордов)
- **Управление громкостью** с плавными переходами
- **Обработка состояний PlayStatus** (PLAY, SKIP, MUTED)
- **Поддержка файла Mute.mp3** для приглушенных звуков
- **Методы для остановки и паузы** воспроизведения
- **Интеграция с NoteMapper и ChordAudioParser**

## Инициализация

```javascript
import { AudioEngine } from './js/Audio/AudioEngine.js';

// Базовая инициализация
const audioEngine = new AudioEngine();

// Инициализация с опциями
const audioEngine = new AudioEngine({
    volume: 0.7,        // Начальная громкость (0.0 - 1.0)
    fadeInTime: 0.05,   // Время нарастания громкости в секундах
    fadeOutTime: 0.1    // Время затухания громкости в секундах
});
```

## Основные методы

### Воспроизведение нот

#### Воспроизведение отдельной ноты
```javascript
// Воспроизвести ноту C первой октавы
await audioEngine.playNote('C', 1);

// С дополнительными опциями
await audioEngine.playNote('C', 1, {
    volume: 0.8,    // Громкость для этой ноты
    startTime: 0    // Задержка начала воспроизведения
});
```

#### Воспроизведение аккорда
```javascript
// Воспроизвести аккорд C мажор (C-E-G)
const chordNotes = ['C', 'E', 'G'];
await audioEngine.playChord(chordNotes, 1);

// Воспроизвести аккорд по названию
await audioEngine.playChordByName('C', 1);
await audioEngine.playChordByName('Am', 1);
```

#### Воспроизведение со статусами
```javascript
import { PlayStatus } from './js/Measure/PlayStatus.js';

// Воспроизвести ноту с конкретным статусом
const playStatus = new PlayStatus(PlayStatus.STATUS.PLAY);
await audioEngine.playWithStatus('C', playStatus);

// Воспроизвести аккорд с приглушением
const mutedStatus = new PlayStatus(PlayStatus.STATUS.MUTED);
await audioEngine.playWithStatus(['C', 'E', 'G'], mutedStatus);

// Пропустить воспроизведение
const skipStatus = new PlayStatus(PlayStatus.STATUS.SKIP);
await audioEngine.playWithStatus('C', skipStatus); // Ничего не воспроизведет
```

### Управление громкостью

```javascript
// Установить громкость
audioEngine.setVolume(0.5);

// Получить текущую громкость
const currentVolume = audioEngine.getVolume();

// Плавное изменение громкости
await audioEngine.fadeVolume(0.2, 2); // Уменьшить до 0.2 за 2 секунды
```

### Управление воспроизведением

```javascript
// Остановить все активные источники звука
audioEngine.stopAll();

// Пауза (реализована как остановка)
audioEngine.pauseAll();
```

### Управление кэшем

```javascript
// Предзагрузка нот
const notes = ['C', 'D', 'E', 'F', 'G'];
await audioEngine.preloadNotes(notes, 1);

// Получить информацию о кэше
const cacheInfo = audioEngine.getCacheInfo();
console.log('Размер кэша:', cacheInfo.size);
console.log('Загруженные файлы:', cacheInfo.keys);

// Очистить кэш
audioEngine.clearCache();
```

## Интеграция с существующими классами

### NoteMapper
AudioEngine автоматически использует NoteMapper для определения путей к аудиофайлам:

```javascript
// NoteMapper определяет путь к файлу
// audio/NotesMP3/C1.mp3 для ноты C первой октавы
// audio/NotesMP3/Mute.mp3 для приглушенного звука
```

### ChordAudioParser
Для воспроизведения аккордов по названию:

```javascript
// AudioEngine использует ChordAudioParser для получения нот аккорда
await audioEngine.playChordByName('Cmaj7', 1);
// ChordAudioParser вернет ноты: ['C', 'E', 'G', 'B']
```

### PlayStatus
Интеграция с системой статусов воспроизведения:

```javascript
// Автоматическая обработка статусов
await audioEngine.playWithStatus(notes, playStatus);
// PLAY - обычное воспроизведение
// SKIP - пропустить воспроизведение
// MUTED - воспроизвести файл Mute.mp3
```

## Структура аудиофайлов

Аудиофайлы должны находиться в папке `audio/NotesMP3/` со следующей структурой:

```
audio/NotesMP3/
├── C1.mp3      // Нота C первой октавы
├── C2.mp3      // Нота C второй октавы
├── C#1.mp3     // Нота C# первой октавы
├── D1.mp3      // Нота D первой октавы
├── ...
└── Mute.mp3    // Приглушенный звук
```

## Пример использования

```javascript
import { AudioEngine } from './js/Audio/AudioEngine.js';
import { PlayStatus } from './js/Measure/PlayStatus.js';

class AudioController {
    constructor() {
        this.audioEngine = new AudioEngine({ volume: 0.7 });
        this.currentChord = null;
    }
    
    async init() {
        // Предзагружаем часто используемые ноты
        await this.audioEngine.preloadNotes(['C', 'D', 'E', 'F', 'G', 'A', 'B'], 1);
    }
    
    async playChord(chordName, octave = 1) {
        try {
            this.currentChord = chordName;
            await this.audioEngine.playChordByName(chordName, octave);
        } catch (error) {
            console.error('Ошибка воспроизведения аккорда:', error);
        }
    }
    
    async playBeat(beatInfo) {
        const { chord, playStatus } = beatInfo;
        
        if (chord && playStatus) {
            // Получаем ноты аккорда
            const chordNotes = await this.audioEngine.chordAudioParser.getChordNotes(chord);
            
            // Воспроизводим с учетом статуса
            await this.audioEngine.playWithStatus(chordNotes, playStatus);
        }
    }
    
    setVolume(volume) {
        this.audioEngine.setVolume(volume);
    }
    
    stop() {
        this.audioEngine.stopAll();
    }
}

// Использование
const audioController = new AudioController();
await audioController.init();

// Воспроизведение аккордов
await audioController.playChord('C');
await audioController.playChord('G');
await audioController.playChord('Am');
await audioController.playChord('F');
```

## Методы для отладки

```javascript
// Проверка инициализации
if (audioEngine.isInitialized()) {
    console.log('AudioEngine готов к работе');
}

// Получение состояния AudioContext
console.log('Состояние:', audioEngine.getContextState());

// Информация о кэше
console.log('Информация о кэше:', audioEngine.getCacheInfo());
```

## Очистка ресурсов

```javascript
// При завершении работы приложения
audioEngine.dispose();
```

## Особенности реализации

1. **Кроссбраузерная совместимость**: AudioEngine автоматически определяет поддержку Web Audio API и использует соответствующие конструкторы.

2. **Автовозобновление контекста**: В браузерах с политикой автозапрета аудио, контекст автоматически возобновляется при первом взаимодействии пользователя.

3. **Эффективное кэширование**: Аудиофайлы загружаются только один раз и кэшируются для быстрого последующего доступа.

4. **Управление памятью**: Активные источники звука отслеживаются и автоматически удаляются после завершения воспроизведения.

5. **Интеграция с системой статусов**: Полная поддержка состояний PLAY, SKIP, MUTED из класса PlayStatus.

## Возможные расширения

1. **Поддержка эффектов**: Добавление реверберации, задержки и других аудиоэффектов.
2. **Визуализация**: Интеграция с анализатором частот для визуализации звука.
3. **Секвенсор**: Расширение для создания последовательностей нот с точным таймингом.
4. **MIDI-поддержка**: Добавление возможности работы с MIDI-устройствами.
5. **Адаптивное качество**: Автоматическое выбор качества аудио в зависимости от скорости соединения.