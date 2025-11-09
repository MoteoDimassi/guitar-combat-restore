# Тестирование системы управления состоянием

## Обзор

В этом документе описано, как запускать тесты для системы управления состоянием и как писать новые тесты.

## Настройка окружения

### Установка зависимостей

Для запуска тестов необходимо установить следующие зависимости:

```bash
npm install --save-dev jest babel-jest @babel/core @babel/preset-env
```

### Конфигурация Babel

Создайте файл `.babelrc` в корне проекта:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
}
```

## Запуск тестов

### Запуск всех тестов

```bash
npm test
```

### Запуск конкретного тестового файла

```bash
npm test tests/core/StateManager.test.js
```

### Запуск тестов с покрытием кода

```bash
npm test -- --coverage
```

### Запуск тестов в режиме отслеживания

```bash
npm test -- --watch
```

### Запуск тестов с определенным паттерном

```bash
npm test -- --testNamePattern="StateManager"
```

## Структура тестов

### Организация файлов

```
tests/
├── setup.js                 # Глобальная настройка тестов
├── core/
│   ├── StateManager.test.js  # Тесты StateManager
│   ├── StateHooks.test.js    # Тесты StateHooks
│   └── StateMiddleware.test.js # Тесты StateMiddleware
├── domain/
│   ├── entities/
│   └── services/
├── infrastructure/
│   ├── audio/
│   └── storage/
└── presentation/
    ├── components/
    └── controllers/
```

### Настройка тестов

Файл `tests/setup.js` содержит глобальную настройку для всех тестов:

- Моки для localStorage
- Моки для console методов
- Вспомогательные функции для создания моков

## Написание тестов

### Основные принципы

1. **Изоляция**: Каждый тест должен быть независимым от других
2. **Читаемость**: Тесты должны быть понятными и легко читаемыми
3. **Поддерживаемость**: Тесты должны быть легко обновляемыми при изменении кода
4. **Полнота**: Тесты должны покрывать все важные сценарии использования

### Структура теста

```javascript
describe('Тестируемый компонент', () => {
  let component;

  beforeEach(() => {
    // Настройка перед каждым тестом
    component = new Component();
  });

  afterEach(() => {
    // Очистка после каждого теста
    component = null;
  });

  describe('Метод или функциональность', () => {
    test('должен делать что-то при определенных условиях', () => {
      // Подготовка данных
      const input = 'test input';
      
      // Выполнение действия
      const result = component.doSomething(input);
      
      // Проверка результата
      expect(result).toBe('expected output');
    });
  });
});
```

### Тестирование StateManager

#### Базовая функциональность

```javascript
test('должен устанавливать и получать состояние', () => {
  // Установка значения
  stateManager.setState('settings.bpm', 140);
  
  // Проверка значения
  expect(stateManager.getState('settings.bpm')).toBe(140);
});
```

#### Тестирование подписок

```javascript
test('должен уведомлять подписчиков при изменении состояния', () => {
  const callback = jest.fn();
  
  // Подписка на изменения
  const unsubscribe = stateManager.subscribe('settings.bpm', callback);
  
  // Изменение состояния
  stateManager.setState('settings.bpm', 140);
  
  // Проверка вызова callback
  expect(callback).toHaveBeenCalledWith(140, 120, 'settings.bpm');
  
  // Отписка
  unsubscribe();
});
```

#### Тестирование истории изменений

```javascript
test('должен поддерживать отмену и повтор изменений', () => {
  // Изменение состояния
  stateManager.setState('settings.bpm', 140);
  expect(stateManager.getState('settings.bpm')).toBe(140);
  
  // Отмена изменения
  stateManager.undo();
  expect(stateManager.getState('settings.bpm')).toBe(120);
  
  // Повтор изменения
  stateManager.redo();
  expect(stateManager.getState('settings.bpm')).toBe(140);
});
```

### Тестирование StateHooks

#### Тестирование хука useState

```javascript
test('должен возвращать значение и функции управления', () => {
  const [value, setValue, unsubscribe] = stateHooks.useState('settings.bpm');
  
  // Проверка начального значения
  expect(value).toBe(120);
  expect(typeof setValue).toBe('function');
  expect(typeof unsubscribe).toBe('function');
  
  // Изменение значения
  setValue(140);
  expect(stateManager.getState('settings.bpm')).toBe(140);
});
```

#### Тестирование хука useForm

```javascript
test('должен управлять состоянием формы', () => {
  const form = stateHooks.useForm('testForm', {
    name: '',
    type: 'major',
  });
  
  // Установка значения
  form.setValue('name', 'C');
  expect(form.getValue('name')).toBe('C');
  
  // Установка нескольких значений
  form.setValues({ name: 'D', type: 'minor' });
  expect(form.getValues()).toEqual({ name: 'D', type: 'minor' });
  
  // Сброс формы
  form.reset();
  expect(form.getValues()).toEqual({ name: '', type: 'major' });
});
```

### Тестирование Middleware

#### Тестирование логирования

```javascript
test('должен логировать изменения состояния', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  
  stateManager.use(CommonMiddleware.logger());
  
  stateManager.setState('settings.bpm', 140);
  
  expect(consoleSpy).toHaveBeenCalledWith(
    'State changed:',
    expect.objectContaining({
      path: 'settings.bpm',
      value: 140,
      oldValue: 120,
    })
  );
  
  consoleSpy.mockRestore();
});
```

#### Тестирование валидации

```javascript
test('должен валидировать изменения состояния', () => {
  stateManager.use(CommonMiddleware.validator({
    schema: {
      'settings.bpm': (value) => value >= 60 && value <= 180,
    },
    strict: true,
  }));
  
  // Валидное значение
  expect(() => stateManager.setState('settings.bpm', 120)).not.toThrow();
  
  // Невалидное значение
  expect(() => stateManager.setState('settings.bpm', 200)).toThrow(
    'Validation failed for path: settings.bpm'
  );
});
```

## Моки и заглушки

### Создание моков

Для изоляции тестов от внешних зависимостей используются моки:

```javascript
// Мок для EventBus
const mockEventBus = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
};

// Мок для localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = mockLocalStorage;
```

### Использование моков

```javascript
test('должен работать с мокированным EventBus', () => {
  const stateManager = new StateManager(mockEventBus);
  
  stateManager.setState('settings.bpm', 140);
  
  expect(mockEventBus.emit).toHaveBeenCalledWith(
    'state:changed',
    expect.objectContaining({
      path: 'settings.bpm',
      value: 140,
    })
  );
});
```

## Асинхронные тесты

### Тестирование асинхронных операций

```javascript
test('должен обрабатывать асинхронные операции', async () => {
  const async = stateHooks.useAsync('testAsync');
  
  const mockFunction = jest.fn().mockResolvedValue('result');
  
  const result = await async.execute(mockFunction);
  
  expect(result).toBe('result');
  expect(async.getStatus()).toBe('success');
  expect(async.getData()).toBe('result');
});
```

### Тестирование ошибок

```javascript
test('должен обрабатывать ошибки в асинхронных операциях', async () => {
  const async = stateHooks.useAsync('testAsync');
  
  const mockFunction = jest.fn().mockRejectedValue(new Error('Test error'));
  
  try {
    await async.execute(mockFunction);
  } catch (error) {
    expect(error.message).toBe('Test error');
  }
  
  expect(async.getStatus()).toBe('error');
  expect(async.getError()).toBe('Test error');
});
```

## Покрытие кода

### Пороги покрытия

В файле `jest.config.js` установлены следующие пороги покрытия:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### Генерация отчетов

Для генерации отчетов о покрытии:

```bash
npm test -- --coverage
```

Отчеты будут сгенерированы в папке `coverage/`:
- `coverage/lcov-report/index.html` - HTML отчет
- `coverage/lcov.info` - LCOV формат для CI/CD

### Исключение файлов из покрытия

Некоторые файлы можно исключить из покрытия:

```javascript
collectCoverageFrom: [
  'js/**/*.js',
  '!js/**/*.test.js',
  '!js/**/*.spec.js',
  '!js/index.js',
  '!js/app.js',
],
```

## Непрерывная интеграция

### GitHub Actions

Пример конфигурации для GitHub Actions:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test -- --coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v1
```

## Лучшие практики

### 1. Организация тестов

- Группируйте тесты по функциональности
- Используйте описательные имена для тестов
- Следуйте структуре AAA (Arrange, Act, Assert)

### 2. Изоляция тестов

- Используйте моки для внешних зависимостей
- Очищайте состояние после каждого теста
- Избегайте зависимостей между тестами

### 3. Читаемость

- Пишите понятные имена для тестов
- Используйте вспомогательные функции для повторяющегося кода
- Добавляйте комментарии для сложных тестов

### 4. Поддерживаемость

- Тестируйте публичный API, а не внутреннюю реализацию
- Используйте константы вместо магических чисел
- Регулярно обновляйте тесты при изменении кода

## Отладка тестов

### Использование console.log

```javascript
test('отладка теста', () => {
  const result = someFunction();
  console.log('Результат:', result);
  expect(result).toBe(expected);
});
```

### Использование debugger

```javascript
test('отладка с debugger', () => {
  debugger; // Точка останова для отладчика
  const result = someFunction();
  expect(result).toBe(expected);
});
```

### Запуск одного теста

```bash
npm test -- --testNamePattern="конкретное имя теста"
```

## Заключение

Тестирование является важной частью разработки системы управления состоянием. Хорошее тестовое покрытие обеспечивает надежность кода и упрощает его дальнейшее развитие и поддержку.