# Механизм событий BeatUnit

## Обзор

Механизм событий в классе BeatUnit предоставляет возможность отслеживать изменения статуса воспроизведения и реагировать на них. Это основа для создания единого источника правды при синхронизации статусов воспроизведения стрелочек.

## Компоненты системы

### 1. BeatUnit

Класс `BeatUnit` теперь включает следующие компоненты для работы с событиями:

- `statusChangeListeners` - Set для хранения функций-слушателей
- `parentBar` - ссылка на родительский объект Bar
- Методы для управления слушателями и уведомлениями

### 2. Методы для работы с событиями

#### `addStatusChangeListener(listener)`
Добавляет слушателя изменений статуса.

```javascript
beatUnit.addStatusChangeListener((beatUnit, oldStatus, newStatus) => {
    console.log(`Статус изменен с ${oldStatus.getStatusString()} на ${newStatus.getStatusString()}`);
});
```

#### `removeStatusChangeListener(listener)`
Удаляет слушателя изменений статуса.

```javascript
beatUnit.removeStatusChangeListener(listener);
```

#### `notifyStatusChange(oldStatus, newStatus)`
Уведомляет всех слушателей об изменении статуса. Этот метод вызывается автоматически при изменении статуса.

#### `setParentBar(parentBar)`
Устанавливает ссылку на родительский Bar.

```javascript
beatUnit.setParentBar(bar);
```

## Интеграция с Bar

Класс `Bar` автоматически устанавливает связь с дочерними BeatUnit:

1. При создании новых BeatUnit в методе `initializeBeatUnits()`
2. При установке массива BeatUnit в методе `setBeatUnits()`
3. При синхронизации связей в методах `syncChordLinks()` и `syncSyllableLinks()`
4. При восстановлении из JSON в методе `fromJSON()`

## Примеры использования

### Базовый пример

```javascript
import { BeatUnit } from './js/Measure/BeatUnit.js';
import { PlayStatus } from './js/Measure/PlayStatus.js';

// Создаем BeatUnit
const beatUnit = new BeatUnit(0, new PlayStatus(PlayStatus.STATUS.PLAY));

// Добавляем слушателя
const listener = (beatUnit, oldStatus, newStatus) => {
    console.log(`BeatUnit ${beatUnit.index}: ${oldStatus.getStatusString()} -> ${newStatus.getStatusString()}`);
};

beatUnit.addStatusChangeListener(listener);

// Изменяем статус - слушатель будет уведомлен
beatUnit.setPlayStatus(new PlayStatus(PlayStatus.STATUS.MUTED));
```

### Пример с Bar

```javascript
import { Bar } from './js/Measure/Bar.js';
import { PlayStatus } from './js/Measure/PlayStatus.js';

// Создаем Bar с 4 долями
const bar = new Bar(0, 4);

// Добавляем слушателя ко всем BeatUnit
bar.beatUnits.forEach(beatUnit => {
    beatUnit.addStatusChangeListener((beatUnit, oldStatus, newStatus) => {
        console.log(`Bar ${bar.barIndex}, Beat ${beatUnit.index}: ${oldStatus.getStatusString()} -> ${newStatus.getStatusString()}`);
    });
});

// Изменяем статус через Bar
bar.setBeatPlayStatus(2, PlayStatus.STATUS.MUTED);
```

### Пример с ArrowDisplay

```javascript
// В классе ArrowDisplay можно добавить слушателя для синхронизации отображения
beatUnit.addStatusChangeListener((beatUnit, oldStatus, newStatus) => {
    this.updateArrowDisplay(beatUnit.index, newStatus);
});
```

## Преимущества механизма событий

1. **Децентрализованное управление**: Любой компонент может подписаться на изменения статуса
2. **Обратная совместимость**: Существующий код продолжает работать без изменений
3. **Гибкость**: Можно добавлять и удалять слушателей динамически
4. **Отладка**: Встроенные логи помогают отслеживать поток событий
5. **Расширяемость**: Основание для построения более сложных систем синхронизации

## Отладочные логи

Система включает подробные логи для отслеживания событий:

- Добавление/удаление слушателей
- Изменение статуса
- Установка связи с родительским Bar
- Уведомление слушателей

## Планы развития

1. **Синхронизация с ArrowDisplay**: Использовать события для обновления отображения стрелочек
2. **Транзакционные изменения**: Группировать несколько изменений в одну транзакцию
3. **Валидация**: Добавить валидацию изменений статуса
4. **История изменений**: Хранить историю изменений для отката
5. **Оптимизация**: Ленивая загрузка и пуллинг событий

## Тестирование

Для тестирования механизма событий можно использовать файл `test-beatunit-events.html`, который предоставляет интерактивный интерфейс для проверки работы системы.
