# RandomStrumGenerator

Класс для случайной генерации боя в приложении Guitar Combat.

## Описание

`RandomStrumGenerator` создает случайные последовательности состояний воспроизведения для каждой длительности такта. Основное правило: **первая длительность всегда имеет статус "Играть" (PLAY)**.

## Возможные состояния

- **SKIP (0)** - ○ (пустой кружок) - не играть
- **PLAY (1)** - ● (закрашенный кружок) - играть  
- **MUTED (2)** - ⊗ (кружок с крестиком) - играть с приглушением

## Основные методы

### generateRandomStrum(count)

Генерирует случайный бой для указанного количества длительностей.

```javascript
const generator = new RandomStrumGenerator();
const playStatuses = generator.generateRandomStrum(8);
```

**Параметры:**
- `count` (number) - Количество длительностей (стрелочек)

**Возвращает:** `PlayStatus[]` - Массив состояний воспроизведения

### generateRandomStrumWithConstraints(count, options)

Генерирует случайный бой с определенными ограничениями.

```javascript
const playStatuses = generator.generateRandomStrumWithConstraints(8, {
  minPlayCount: 3,    // Минимальное количество играющих долей
  maxPlayCount: 6,    // Максимальное количество играющих долей
  minMutedCount: 1,   // Минимальное количество приглушенных долей
  maxMutedCount: 3    // Максимальное количество приглушенных долей
});
```

### generatePatternStrum(count, pattern)

Генерирует бой по определенному паттерну.

```javascript
// Доступные паттерны:
const basicPattern = generator.generatePatternStrum(8, 'basic');     // Чередование PLAY/SKIP
const complexPattern = generator.generatePatternStrum(8, 'complex'); // С приглушением
const rhythmicPattern = generator.generatePatternStrum(8, 'rhythmic'); // Ритмический паттерн
```

### analyzeStrum(playStatuses)

Анализирует сгенерированный бой и возвращает статистику.

```javascript
const analysis = generator.analyzeStrum(playStatuses);
console.log(analysis);
// {
//   total: 8,
//   playCount: 4,
//   mutedCount: 2,
//   skipCount: 2,
//   playPercentage: 50,
//   mutedPercentage: 25,
//   skipPercentage: 25,
//   firstBeatPlayed: true
// }
```

### validateStrum(playStatuses)

Проверяет корректность сгенерированного боя.

```javascript
const validation = generator.validateStrum(playStatuses);
if (validation.isValid) {
  console.log('Бой корректен');
} else {
  console.log('Найдены ошибки:', validation.issues);
}
```

## Интеграция с ArrowDisplay

Генератор интегрирован в основное приложение через кнопку "Случайный бой":

```javascript
// В GuitarCombatApp
generateRandomStrum() {
  const currentCount = this.arrowDisplay.currentCount || 8;
  const randomPlayStatuses = this.randomStrumGenerator.generateRandomStrum(currentCount);
  this.arrowDisplay.setAllPlayStatuses(randomPlayStatuses);
}
```

## Примеры использования

### Простая генерация

```javascript
import { RandomStrumGenerator } from './Strum/RandomStrumGenerator.js';

const generator = new RandomStrumGenerator();
const strum = generator.generateRandomStrum(8);

// Отображение результата
console.log(strum.map(status => status.getDisplaySymbol()).join(' '));
// Пример вывода: ● ○ ● ⊗ ○ ● ⊗ ○
```

### Генерация с ограничениями

```javascript
const constrainedStrum = generator.generateRandomStrumWithConstraints(8, {
  minPlayCount: 3,
  maxPlayCount: 6,
  minMutedCount: 1,
  maxMutedCount: 2
});
```

### Проверка валидности

```javascript
const strum = generator.generateRandomStrum(8);
const validation = generator.validateStrum(strum);

if (validation.isValid) {
  console.log(`Валидный бой: ${validation.playCount} играющих долей из ${validation.totalCount}`);
} else {
  console.log('Ошибки:', validation.issues);
}
```

## Особенности

1. **Первая доля всегда PLAY** - это основное правило генератора
2. **Случайность** - остальные доли выбираются случайно из трех возможных состояний
3. **Валидация** - все сгенерированные бои проходят проверку корректности
4. **Гибкость** - поддержка различных паттернов и ограничений
5. **Интеграция** - легко интегрируется с существующим ArrowDisplay

## Тестирование

Для тестирования генератора можно использовать файл `test-random-generator.js`:

```javascript
import { testRandomGenerator } from './Strum/test-random-generator.js';
testRandomGenerator();
```

Этот файл содержит комплексные тесты всех функций генератора.
