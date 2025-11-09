import { EventBus } from '../core/EventBus.js';
import { StateManager } from '../core/StateManager.js';
import { StateActions } from '../core/StateActions.js';
import { ServiceContainer } from '../core/ServiceContainer.js';
import ConfigManager from '../core/ConfigManager.js';
import { EventTypes } from '../core/EventTypes.js';
import { EventMiddleware } from '../core/EventMiddleware.js';

// Импорты сервисов
import ChordService from '../domain/services/ChordService.js';
import BarService from '../domain/services/BarService.js';
import PlaybackService from '../domain/services/PlaybackService.js';
import TemplateService from '../domain/services/TemplateService.js';

// Импорты инфраструктуры
import AudioEngine from '../infrastructure/audio/AudioEngine.js';
import LocalStorageAdapter from '../infrastructure/storage/LocalStorageAdapter.js';

// Импорты контроллеров
import MainController from '../presentation/controllers/MainController.js';
import ChordController from '../presentation/controllers/ChordController.js';
import PlaybackController from '../presentation/controllers/PlaybackController.js';

// Импорты UI компонентов
import ArrowDisplay from '../presentation/components/ArrowDisplay.js';
import ChordDisplay from '../presentation/components/ChordDisplay.js';
import BarDisplay from '../presentation/components/BarDisplay.js';

export class ApplicationService {
  constructor() {
    this.eventBus = null;
    this.stateManager = null;
    this.stateActions = null;
    this.serviceContainer = null;
    this.configManager = null;
    this.isInitialized = false;
    this.initializationPromises = new Map();
    this.autoSaveTimeout = null;
  }

  /**
   * Инициализация приложения
   */
  async initialize(config = {}) {
    try {
      console.log('🚀 Initializing Guitar Combat Application...');

      // 1. Инициализация ядра
      await this.initializeCore(config);

      // 2. Регистрация сервисов
      await this.registerServices();

      // 3. Инициализация сервисов
      await this.initializeServices();

      // 4. Настройка подписок на события
      this.setupEventSubscriptions();

      // 5. Загрузка сохраненных данных
      await this.loadSavedData();

      // 6. Инициализация UI
      await this.initializeUI();

      this.isInitialized = true;
      this.eventBus.emit(EventTypes.APPLICATION_INITIALIZED, {
        timestamp: Date.now()
      });

      console.log('✅ Application initialized successfully');

    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Инициализация ядра архитектуры
   */
  async initializeCore(config) {
    // Инициализация EventBus
    this.eventBus = new EventBus({
      debug: config.debug || false,
      maxHistorySize: config.maxEventHistory || 100
    });

    // Добавление middleware
    this.setupEventMiddleware();

    // Инициализация StateManager
    this.stateManager = new StateManager(this.eventBus, config.initialState);

    // Инициализация StateActions
    this.stateActions = new StateActions(this.stateManager, this.eventBus);

    // Инициализация ServiceContainer
    this.serviceContainer = new ServiceContainer();

    // Инициализация ConfigManager
    this.configManager = new ConfigManager();
    if (config) {
      this.configManager.load(config);
    }

    // Регистрация ядра в контейнере
    this.serviceContainer.register('eventBus', () => this.eventBus, { singleton: true });
    this.serviceContainer.register('stateManager', () => this.stateManager, { singleton: true });
    this.serviceContainer.register('stateActions', () => this.stateActions, { singleton: true });
    this.serviceContainer.register('configManager', () => this.configManager, { singleton: true });
  }

  /**
   * Настройка middleware для EventBus
   */
  setupEventMiddleware() {
    // Логирование событий
    this.eventBus.use(EventMiddleware.logger({
      logLevel: 'info',
      excludeEvents: ['mousemove', 'keydown']
    }));

    // Валидация событий
    this.eventBus.use(EventMiddleware.validator({
      'tempo:changed': (data) => data.bpm >= 40 && data.bpm <= 300,
      'beatCount:changed': (data) => data.beatCount >= 1 && data.beatCount <= 16
    }));

    // Измерение производительности
    this.eventBus.use(EventMiddleware.performance({
      threshold: 50,
      includeEvents: ['playback:started', 'playback:stopped']
    }));
  }

  /**
   * Регистрация сервисов
   */
  async registerServices() {
    // Регистрация репозиториев
    this.serviceContainer.register('chordRepository', (container) => {
      return {
        findAll: async () => [],
        findById: async (id) => null,
        save: async (data) => data,
        update: async (id, data) => data,
        delete: async (id) => true
      };
    }, { singleton: true });

    this.serviceContainer.register('barRepository', (container) => {
      return {
        findAll: async () => [],
        findById: async (id) => null,
        save: async (data) => data,
        update: async (id, data) => data,
        delete: async (id) => true
      };
    }, { singleton: true });

    this.serviceContainer.register('templateRepository', (container) => {
      return {
        findAll: async () => [],
        findById: async (id) => null,
        save: async (data) => data,
        update: async (id, data) => data,
        delete: async (id) => true
      };
    }, { singleton: true });

    // Сервисы бизнес-логики
    this.serviceContainer.register('chordService', (container) => {
      return new ChordService(container.get('chordRepository'));
    }, { singleton: true });

    this.serviceContainer.register('barService', (container) => {
      return new BarService(container.get('barRepository'));
    }, { singleton: true });

    this.serviceContainer.register('playbackService', (container) => {
      return new PlaybackService(
        container.get('audioEngine'),
        container.get('barRepository')
      );
    }, { singleton: true });

    this.serviceContainer.register('templateService', (container) => {
      return new TemplateService(container.get('templateRepository'));
    }, { singleton: true });

    // Инфраструктурные сервисы
    this.serviceContainer.register('audioEngine', (container) => {
      return new AudioEngine();
    }, { singleton: true });

    this.serviceContainer.register('storageService', (container) => {
      return new LocalStorageAdapter();
    }, { singleton: true });

    // Контроллеры
    this.serviceContainer.register('mainController', (container) => {
      return new MainController(container);
    }, { singleton: true });

    this.serviceContainer.register('chordController', (container) => {
      return new ChordController(container.get('eventBus'), container);
    }, { singleton: true });

    this.serviceContainer.register('playbackController', (container) => {
      return new PlaybackController(container.get('eventBus'), container);
    }, { singleton: true });

    // UI компоненты
    this.serviceContainer.register('arrowDisplay', (container) => {
      return new ArrowDisplay(document.getElementById('arrowDisplay'), container.get('eventBus'));
    }, { singleton: true });

    this.serviceContainer.register('chordDisplay', (container) => {
      return new ChordDisplay(document.getElementById('chordDisplay'), container.get('eventBus'));
    }, { singleton: true });

    this.serviceContainer.register('barDisplay', (container) => {
      return new BarDisplay(document.getElementById('barDisplay'), container.get('eventBus'));
    }, { singleton: true });
  }

  /**
   * Инициализация сервисов
   */
  async initializeServices() {
    const services = [
      'audioEngine',
      'storageService',
      'chordService',
      'barService',
      'playbackService',
      'templateService'
    ];

    for (const serviceName of services) {
      try {
        const service = this.serviceContainer.get(serviceName);
        if (typeof service.initialize === 'function') {
          await service.initialize();
        }
        console.log(`✅ Service initialized: ${serviceName}`);
      } catch (error) {
        console.error(`❌ Service initialization failed: ${serviceName}`, error);
        throw error;
      }
    }
  }

  /**
   * Настройка подписок на события
   */
  setupEventSubscriptions() {
    // Подписка на ошибки
    this.eventBus.on(EventTypes.ERROR_OCCURRED, (event) => {
      this.handleError(event.data.error, event.data.context);
    });

    // Подписка на изменения состояния
    this.eventBus.on(EventTypes.STATE_CHANGED, (event) => {
      this.handleStateChange(event.data.path, event.data.value, event.data.oldValue);
    });

    // Подписка на изменения аккордов
    this.eventBus.on(EventTypes.CHORDS_INPUT_CHANGED, (event) => {
      this.handleChordsInputChange(event.data.chordsString);
    });

    // Подписка на изменения воспроизведения
    this.eventBus.on(EventTypes.PLAYBACK_TOGGLED, (event) => {
      this.handlePlaybackToggle(event.data.isPlaying);
    });
  }

  /**
   * Загрузка сохраненных данных
   */
  async loadSavedData() {
    try {
      const storageService = this.serviceContainer.get('storageService');
      const savedData = await storageService.load('guitarCombatData');

      if (savedData) {
        this.stateManager.fromJSON(savedData);
        console.log('✅ Saved data loaded successfully');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved data:', error);
    }
  }

  /**
   * Инициализация UI
   */
  async initializeUI() {
    // Инициализация контроллеров
    const mainController = this.serviceContainer.get('mainController');
    const chordController = this.serviceContainer.get('chordController');
    const playbackController = this.serviceContainer.get('playbackController');

    await mainController.initialize();
    await chordController.initialize();
    await playbackController.initialize();

    // Инициализация UI компонентов
    const arrowDisplay = this.serviceContainer.get('arrowDisplay');
    const chordDisplay = this.serviceContainer.get('chordDisplay');
    const barDisplay = this.serviceContainer.get('barDisplay');

    await arrowDisplay.initialize();
    await chordDisplay.initialize();
    await barDisplay.initialize();
  }

  /**
   * Обработка ошибок инициализации
   */
  handleInitializationError(error) {
    console.error('Application initialization error:', error);

    // Показываем пользователю сообщение об ошибке
    if (typeof document !== 'undefined') {
      const errorElement = document.createElement('div');
      errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
      errorElement.innerHTML = `
        <h3 class="font-bold">Ошибка инициализации</h3>
        <p>Не удалось загрузить приложение. Пожалуйста, обновите страницу.</p>
        <button onclick="location.reload()" class="mt-2 bg-white text-red-500 px-4 py-2 rounded">
          Обновить
        </button>
      `;
      document.body.appendChild(errorElement);
    }
  }

  /**
   * Обработка ошибок приложения
   */
  handleError(error, context = null) {
    console.error('Application error:', error, context);

    // Сохраняем ошибку в состояние
    this.stateManager.setState('ui.lastError', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });

    // Уведомляем об ошибке
    this.eventBus.emit(EventTypes.ERROR_HANDLED, {
      error,
      context,
      timestamp: Date.now()
    });
  }

  /**
   * Обработка изменений состояния
   */
  handleStateChange(path, value, oldValue) {
    // Автоматическое сохранение при изменении важных данных
    const autoSavePaths = [
      'settings',
      'chords',
      'bars',
      'templates'
    ];

    const shouldAutoSave = autoSavePaths.some(savePath => path.startsWith(savePath));

    if (shouldAutoSave) {
      this.debounceAutoSave();
    }
  }

  /**
   * Обработка изменений аккордов
   */
  async handleChordsInputChange(chordsString) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      await chordService.processChordsInput(chordsString);
    } catch (error) {
      this.handleError(error, 'handleChordsInputChange');
    }
  }

  /**
   * Обработка переключения воспроизведения
   */
  async handlePlaybackToggle(isPlaying) {
    try {
      const playbackService = this.serviceContainer.get('playbackService');

      if (isPlaying) {
        await playbackService.start();
      } else {
        await playbackService.stop();
      }
    } catch (error) {
      this.handleError(error, 'handlePlaybackToggle');
    }
  }

  /**
   * Автосохранение с дебаунсингом
   */
  debounceAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        const storageService = this.serviceContainer.get('storageService');
        await storageService.save('guitarCombatData', this.stateManager.toJSON());
        console.log('✅ Auto-saved application data');
      } catch (error) {
        console.warn('⚠️ Auto-save failed:', error);
      }
    }, 1000);
  }

  /**
   * Получение сервиса
   */
  getService(serviceName) {
    if (!this.isInitialized) {
      throw new Error('Application not initialized');
    }
    return this.serviceContainer.get(serviceName);
  }

  /**
   * Получение состояния приложения
   */
  getState(path = null) {
    if (!this.isInitialized) {
      throw new Error('Application not initialized');
    }
    return this.stateManager.getState(path);
  }

  /**
   * Выполнение действия
   */
  async executeAction(actionName, ...args) {
    if (!this.isInitialized) {
      throw new Error('Application not initialized');
    }

    const action = this.stateActions[actionName];
    if (typeof action === 'function') {
      return await action.apply(this.stateActions, args);
    } else {
      throw new Error(`Action not found: ${actionName}`);
    }
  }

  /**
   * Уничтожение приложения
   */
  async destroy() {
    console.log('🔄 Destroying application...');

    // Сохраняем данные
    try {
      const storageService = this.serviceContainer.get('storageService');
      await storageService.save('guitarCombatData', this.stateManager.toJSON());
    } catch (error) {
      console.warn('⚠️ Failed to save data on destroy:', error);
    }

    // Останавливаем воспроизведение
    try {
      const playbackService = this.serviceContainer.get('playbackService');
      await playbackService.stop();
    } catch (error) {
      console.warn('⚠️ Failed to stop playback on destroy:', error);
    }

    // Очищаем ресурсы
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.eventBus.clear();
    this.stateManager.clear();
    this.serviceContainer.clear();

    this.isInitialized = false;

    this.eventBus.emit(EventTypes.APPLICATION_DESTROYED, {
      timestamp: Date.now()
    });

    console.log('✅ Application destroyed successfully');
  }
}

export default ApplicationService;