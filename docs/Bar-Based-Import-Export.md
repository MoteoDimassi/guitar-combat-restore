# Тактово-ориентированная система импорта/экспорта

## Обзор

Новая система импорта/экспорта основана на тактовой структуре, которая позволяет универсально организовывать все элементы музыкальной композиции: бои, аккорды и слоги текста.

## Преимущества

- **Универсальная структура**: Все элементы привязаны к тактам и долям
- **Расширяемость**: Легко добавлять новые элементы и возможности
- **Чёткие связи**: Явная временная привязка аккордов и слогов к долям
- **Обратная совместимость**: Поддержка старых форматов данных
- **Образовательные элементы**: Советы и рекомендации в шаблонах

## Структура данных

### Формат v2 (новый)

```json
{
  "version": "2.0",
  "templateInfo": {
    "name": "Название шаблона",
    "id": "template-id",
    "category": "basic",
    "difficulty": "beginner",
    "description": "Описание шаблона",
    "tags": ["tag1", "tag2"],
    "author": "Автор",
    "createdAt": "2025-10-13T10:13:42.075Z"
  },
  "metadata": {
    "title": "Название композиции",
    "artist": "Исполнитель",
    "tempo": 120,
    "timeSignature": "4/4",
    "description": "Описание композиции"
  },
  "songStructure": {
    "beatCount": 4,
    "totalBars": 8,
    "currentBar": 0,
    "hasRepeats": false,
    "repeatStructure": []
  },
  "bars": [
    {
      "index": 0,
      "beatUnits": [
        {
          "index": 0,
          "direction": "down",
          "playStatus": {
            "status": 1,
            "statusString": "играть"
          },
          "metadata": {
            "isPlayed": true,
            "isMuted": false,
            "isSkipped": false,
            "cssClass": "play-status-play"
          }
        }
      ],
      "chordChanges": [
        {
          "name": "C",
          "startBeat": 0,
          "endBeat": 4,
          "duration": 4
        }
      ],
      "lyricSyllables": [
        {
          "text": "Текст",
          "startBeat": 0,
          "duration": 2,
          "endBeat": 2
        }
      ],
      "metadata": {
        "isActive": true,
        "hasChords": true,
        "hasLyrics": true,
        "playingBeats": 3
      }
    }
  ],
  "templates": {
    "strummingPattern": "Название паттерна",
    "customizations": {
      "accentPattern": [true, false, true, false],
      "mutePattern": [false, false, false, false],
      "dynamics": [1.0, 0.8, 1.0, 0.8]
    },
    "generationInfo": {
      "generatedAt": "2025-10-13T10:13:42.075Z",
      "source": "Guitar Combat",
      "version": "2.0"
    }
  },
  "educational": {
    "learningTips": ["Совет 1", "Совет 2"],
    "commonMistakes": ["Ошибка 1", "Ошибка 2"],
    "relatedPatterns": ["Паттерн 1", "Паттерн 2"]
  }
}
```

### Старые форматы (поддерживаются)

#### Legacy формат
```json
{
  "beats": [
    {
      "direction": "down",
      "play": 1
    }
  ],
  "bpm": 100,
  "speed": 100,
  "timestamp": "2025-10-13T10:13:42.075Z"
}
```

#### Current формат
```json
{
  "version": "1.0",
  "settings": {
    "tempo": 120,
    "arrowsPerBar": 4,
    "chords": ["C", "Am"],
    "arrowStatuses": [...],
    "arrows": [...],
    "bars": [...]
  }
}
```

## Компоненты системы

### ImportStrumFromJSON

Класс для импорта данных из JSON файлов с автоматической миграцией.

**Основные методы:**
- `detectDataFormat(data)` - определение формата данных
- `migrateData(data, format)` - миграция в новый формат
- `importV2Format(data)` - импорт в формате v2
- `validateV2Format(data)` - валидация данных

### DownloadManager

Класс для экспорта данных в различных форматах.

**Основные методы:**
- `collectBattleSettingsV2()` - сбор данных в формате v2
- `downloadJson(format)` - скачивание в указанном формате
- `exportToLegacyFormat()` - экспорт в старый формат

### TemplateManager

Класс для управления шаблонами.

**Основные методы:**
- `loadTemplate(templateId)` - загрузка шаблона
- `applyTemplate(templateData)` - применение шаблона
- `saveAsTemplate(name, description)` - сохранение как шаблон
- `getAllTemplates()` - получение всех шаблонов

## Миграция данных

Система автоматически определяет формат данных и мигрирует их в новый формат:

1. **Legacy формат** → **v2 формат**
   - Массив `beats` конвертируется в `beatUnits` первого такта
   - BPM переносится в `metadata.tempo`
   - Количество ударов определяет `beatCount`

2. **Current формат** → **v2 формат**
   - `arrowStatuses` и `arrows` конвертируются в `beatUnits`
   - `settings.tempo` переносится в `metadata.tempo`
   - Аккорды распределяются по тактам

## Категории шаблонов

### Basic (Базовые паттерны)
- Простые паттерны для начинающих
- Основные ритмические рисунки

### Advanced (Сложные паттерны)
- Продвинутые паттерны с элементами перебора
- Сложные ритмические структуры

### Song (Примеры песен)
- Готовые примеры песен с аккордами и текстом
- Полные музыкальные композиции

## Использование

### Импорт файла

```javascript
// Автоматическое определение формата и миграция
const importStrumFromJSON = new ImportStrumFromJSON(app);
await importStrumFromJSON.importData(fileData);
```

### Экспорт файла

```javascript
// Экспорт в новом формате
downloadManager.downloadJson('v2');

// Экспорт в старых форматах для совместимости
downloadManager.downloadJson('current');
downloadManager.downloadJson('legacy');
```

### Работа с шаблонами

```javascript
// Загрузка и применение шаблона
const templateData = await templateManager.loadTemplate('pyaterka');
await templateManager.applyTemplate(templateData);

// Сохранение текущей композиции как шаблона
const newTemplate = await templateManager.saveAsTemplate('Мой шаблон', 'Описание');
```

## Тестирование

Для тестирования системы используйте файлы:
- `test-import-v2.json` - тестовый файл в формате v2
- `templates/Пятерка-v2.json` - пример шаблона в новом формате
- `templates/Пример-песни-v2.json` - пример песни с аккордами и текстом

## Будущие улучшения

1. **Визуальный редактор тактов** - интерактивное редактирование тактов
2. **Автоматическое определение паттернов** - анализ введённых данных
3. **Интеграция с аудио** - воспроизведение с синхронизацией
4. **Облачное хранилище** - сохранение шаблонов в облаке
5. **Совместное редактирование** - работа над композициями вместе

## Совместимость

Система полностью совместима со старыми форматами данных:
- Автоматическая миграция при импорте
- Экспорт в старых форматах
- Сохранение всех пользовательских данных

## Заключение

Новая тактово-ориентированная система создаёт прочный фундамент для развития приложения и значительно упрощает работу с музыкальными композициями.