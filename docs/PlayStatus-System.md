# Система PlayStatus - Управление воспроизведением

## Обзор

Система PlayStatus заменяет цифры под стрелочками на кружочки, которые показывают способ звукоизвлечения для каждой длительности.

## Три состояния воспроизведения

1. **○ (Пустой кружок)** - `PlayStatus.STATUS.SKIP` (0)
   - Длительность не играется
   - Звук отсутствует
   - Цвет: серый

2. **● (Закрашенный кружок)** - `PlayStatus.STATUS.PLAY` (1)
   - Длительность играется полностью
   - Полный звук аккорда
   - Цвет: зеленый

3. **⊗ (Кружок с крестиком)** - `PlayStatus.STATUS.MUTED` (2)
   - Длительность играется с приглушением
   - Приглушенный звук
   - Цвет: оранжевый

## Архитектура

### PlayStatus
- Центральный класс для управления состоянием воспроизведения
- Методы: `isPlayed()`, `isMuted()`, `isSkipped()`, `toggleStatus()`
- Поддержка сериализации в JSON

### BeatUnit
- Интегрирован с PlayStatus
- Обратная совместимость с числовыми типами
- Новые методы: `getPlayStatus()`, `setPlayStatus()`, `getDisplaySymbol()`

### Bar
- Обновлен для работы с PlayStatus
- Новые методы: `setBeatPlayStatus()`, `getBeatPlayStatus()`, `toggleBeatStatus()`

### BarSequenceBuilder
- Поддержка создания тактов с паттернами воспроизведения
- Новые методы: `createBarWithPlayPattern()`, `buildWithPlayPattern()`
- Парсинг строковых паттернов: "○●⊗○", "skip,play,muted,skip"

## Использование

### Создание такта с паттерном
```javascript
const builder = new BarSequenceBuilder(4);

// Паттерн: играть, приглушить, пропустить, играть
const bar = builder.createBarWithPlayPattern('C', 0, [1, 2, 0, 1]);

// Или строковый паттерн
const bar2 = builder.createBarWithPlayPattern('Am', 1, "●⊗○●");
```

### Переключение статусов
```javascript
// Переключить статус первой длительности
bar.toggleBeatStatus(0);

// Установить конкретный статус
bar.setBeatPlayStatus(1, new PlayStatus(PlayStatus.STATUS.MUTED));
```

### Получение информации
```javascript
// Получить символ для отображения
const symbol = bar.getBeatPlayStatus(0).getDisplaySymbol(); // "●"

// Получить CSS класс
const cssClass = bar.getBeatPlayStatus(0).getCSSClass(); // "play-status-play"

// Проверить состояние
const isPlayed = bar.getBeatPlayStatus(0).isPlayed(); // true
```

## CSS Стили

Добавлены классы для стилизации:
- `.play-status-skip` - серый цвет
- `.play-status-play` - зеленый цвет  
- `.play-status-muted` - оранжевый цвет
- `.play-status-symbol` - базовые стили для символов

## Обратная совместимость

Система полностью обратно совместима:
- Старые числовые типы (0, 1, 2) продолжают работать
- JSON сериализация поддерживает оба формата
- Методы `setBeatType()` и `getBeatType()` сохранены

## Логика работы

1. **Определение длительности** - на основе паттерна создается PlayStatus для каждой длительности
2. **Создание BeatUnit** - каждая длительность получает свой PlayStatus
3. **Формирование такта** - такт (Bar) объединяет все BeatUnit с их PlayStatus
4. **Воспроизведение** - на основе PlayStatus определяется способ звукоизвлечения

Эта система обеспечивает гибкое управление ритмическими паттернами и визуально понятное отображение способов звукоизвлечения.
