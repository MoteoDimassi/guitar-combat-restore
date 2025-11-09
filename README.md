# Guitar Combat - Новая архитектура

## Обзор

Проект Guitar Combat был перестроен с использованием современной модульной архитектуры, основанной на принципах Clean Architecture и Domain-Driven Design.

## Структура проекта

```
js/
├── core/                           # Ядро архитектуры
│   ├── EventBus.js                 # Шина событий
│   ├── ServiceContainer.js         # Контейнер зависимостей
│   ├── StateManager.js             # Управление состоянием
│   └── ConfigManager.js            # Управление конфигурацией
├── domain/                         # Бизнес-логика
│   ├── entities/                   # Сущности
│   │   ├── Bar.js
│   │   ├── BeatUnit.js
│   │   ├── Chord.js
│   │   └── PlayStatus.js
│   ├── services/                   # Сервисы бизнес-логики
│   │   ├── ChordService.js
│   │   ├── BarService.js
│   │   ├── PlaybackService.js
│   │   └── TemplateService.js
│   └── repositories/              # Репозитории данных
│       ├── ChordRepository.js
│       └── BarRepository.js
├── infrastructure/                 # Инфраструктура
│   ├── audio/                      # Аудио система
│   │   ├── AudioEngine.js
│   │   ├── AudioPlayer.js
│   │   └── AudioRepository.js
│   ├── storage/                    # Хранение данных
│   │   ├── LocalStorageAdapter.js
│   │   └── FileStorageAdapter.js
│   └── templates/                  # Управление шаблонами
│       ├── TemplateLoader.js
│       └── TemplateRepository.js
├── presentation/                   # Представление
│   ├── components/                 # UI компоненты
│   │   ├── ArrowDisplay.js
│   │   ├── ChordDisplay.js
│   │   ├── BarDisplay.js
│   │   └── Modal.js
│   ├── controllers/                # Контроллеры
│   │   ├── MainController.js
│   │   ├── ChordController.js
│   │   └── PlaybackController.js
│   └── views/                      # Представления
│       ├── MainView.js
│       └── SettingsView.js
├── application/                    # Приложение
│   ├── services/                   # Сервисы приложения
│   │   ├── ApplicationService.js
│   │   ├── InitializationService.js
│   │   └── ErrorHandlingService.js
│   ├── commands/                   # Команды
│   │   ├── LoadChordsCommand.js
│   │   ├── UpdateBarCommand.js
│   │   └── PlayCommand.js
│   └── queries/                    # Запросы
│       ├── GetChordsQuery.js
│       └── GetBarsQuery.js
├── shared/                         # Общие утилиты
│   ├── utils/
│   │   ├── Utils.js
│   │   └── MusicUtils.js
│   ├── constants/
│   │   ├── Events.js
│   │   └── Config.js
│   └── types/
│       └── index.js
├── app.js                          # Главный файл приложения
└── index.js                        # Точка входа
```

## Ключевые принципы

### 1. Разделение ответственности (Separation of Concerns)

- **Data Layer**: Управление данными и состоянием
- **Business Logic Layer**: Бизнес-логика приложения
- **Presentation Layer**: Отображение и взаимодействие с пользователем
- **Infrastructure Layer**: Вспомогательные сервисы

### 2. Инверсия зависимостей (Dependency Inversion)

- Высокоуровневые модули не зависят от низкоуровневых
- Все зависимости через абстракции (интерфейсы)
- Внедрение зависимостей (Dependency Injection)

### 3. Единая система событий (Event-Driven Architecture)

- Централизованная шина событий
- Компоненты общаются через события
- Слабая связанность между компонентами

## Основные компоненты

### EventBus (Шина событий)

Централизованная система для обмена событиями между компонентами.

```javascript
// Отправка события
eventBus.emit('chord:selected', { chordName: 'C' });

// Подписка на событие
eventBus.on('chord:selected', (data) => {
  console.log('Selected chord:', data.chordName);
});
```

### ServiceContainer (Контейнер зависимостей)

Управляет зависимостями и их жизненным циклом.

```javascript
// Регистрация сервиса
serviceContainer.register('chordService', () => new ChordService(), { singleton: true });

// Получение сервиса
const chordService = serviceContainer.get('chordService');
```

### StateManager (Управление состоянием)

Централизованное управление состоянием приложения.

```javascript
// Установка состояния
stateManager.setState('playback.isPlaying', true);

// Получение состояния
const isPlaying = stateManager.getState('playback.isPlaying');

// Подписка на изменения
stateManager.subscribe('playback', (playbackState) => {
  console.log('Playback state changed:', playbackState);
});
```

## Поток данных

```
User Action → Controller → Command → Service → Repository → State → EventBus → UI Components
```

1. **Пользовательское действие** → Контроллер
2. **Контроллер** создает команду
3. **Команда** вызывает соответствующий сервис
4. **Сервис** выполняет бизнес-логику
5. **Репозиторий** управляет данными
6. **StateManager** обновляет состояние
7. **EventBus** уведомляет подписчиков
8. **UI компоненты** обновляются

## Запуск приложения

1. Убедитесь, что все зависимости установлены:
```bash
npm install
```

2. Запустите приложение в режиме разработки:
```bash
npm run dev
```

3. Или соберите для продакшена:
```bash
npm run build
```

## Расширение архитектуры

### Добавление нового сервиса

1. Создайте класс сервиса в соответствующей директории
2. Зарегистрируйте в `app.js`
3. Используйте через контейнер зависимостей

### Добавление нового компонента UI

1. Создайте класс компонента в `presentation/components/`
2. Создайте контроллер в `presentation/controllers/`
3. Интегрируйте в представление

### Добавление новой команды

1. Создайте класс команды в `application/commands/`
2. Реализуйте метод `execute()`
3. Вызывайте через контроллер

## Тестирование

Архитектура разработана с учетом тестируемости:

- Модульная структура позволяет изолированное тестирование
- Внедрение зависимостей облегчает мокирование
- События позволяют тестировать взаимодействие компонентов

## Производительность

- Ленивая загрузка компонентов
- Оптимизированная работа с аудио
- Эффективное управление состоянием
- Кэширование данных

## Безопасность

- Валидация входных данных
- Безопасная работа с localStorage
- Обработка ошибок

## Совместимость

- Современно с ES6+ модулями
- Поддержка старых браузеров через Babel
- Progressive Enhancement

## Логирование

- Централизованная система обработки ошибок
- Детальное логирование операций
- Уведомления пользователей об ошибках