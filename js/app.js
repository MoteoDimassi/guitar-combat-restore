// Импорты ядра архитектуры
import EventBus from './core/EventBus.js';
import ServiceContainer from './core/ServiceContainer.js';
import StateManager from './core/StateManager.js';
import ConfigManager from './core/ConfigManager.js';

// Импорты сервисов приложения
import ApplicationService from './application/services/ApplicationService.js';
import InitializationService from './application/services/InitializationService.js';
import ErrorHandlingService from './application/services/ErrorHandlingService.js';

// Импорты инфраструктуры
import AudioEngine from './infrastructure/audio/AudioEngine.js';
import AudioPlayer from './infrastructure/audio/AudioPlayer.js';
import AudioRepository from './infrastructure/audio/AudioRepository.js';
import LocalStorageAdapter from './infrastructure/storage/LocalStorageAdapter.js';
import FileStorageAdapter from './infrastructure/storage/FileStorageAdapter.js';
import TemplateLoader from './infrastructure/templates/TemplateLoader.js';
import TemplateRepository from './infrastructure/templates/TemplateRepository.js';

// Импорты бизнес-логики
import ChordService from './domain/services/ChordService.js';
import BarService from './domain/services/BarService.js';
import PlaybackService from './domain/services/PlaybackService.js';
import TemplateService from './domain/services/TemplateService.js';
import ChordRepository from './domain/repositories/ChordRepository.js';
import BarRepository from './domain/repositories/BarRepository.js';

// Импорты представления
import MainController from './presentation/controllers/MainController.js';
import ChordController from './presentation/controllers/ChordController.js';
import PlaybackController from './presentation/controllers/PlaybackController.js';
import MainView from './presentation/views/MainView.js';

// Импорты утилит
import Utils from './shared/utils/Utils.js';
import MusicUtils from './shared/utils/MusicUtils.js';

// Импорты констант
import { APP_EVENTS, ERROR_TYPES } from './shared/constants/Events.js';
import { APP_CONFIG } from './shared/constants/Config.js';

class GuitarCombatApp {
  constructor() {
    this.serviceContainer = new ServiceContainer();
    this.eventBus = new EventBus();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Guitar Combat App...');
      
      // Регистрируем основные сервисы
      this.registerCoreServices();
      
      // Регистрируем инфраструктуру
      this.registerInfrastructure();
      
      // Регистрируем бизнес-логику
      this.registerDomain();
      
      // Регистрируем представление
      this.registerPresentation();
      
      // Регистрируем сервисы приложения
      this.registerApplicationServices();
      
      // Инициализируем приложение
      const applicationService = this.serviceContainer.get('applicationService');
      await applicationService.initialize();
      
      this.isInitialized = true;
      console.log('Guitar Combat App initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Guitar Combat App:', error);
      this.handleInitializationError(error);
      return false;
    }
  }

  registerCoreServices() {
    // Регистрируем ядро архитектуры
    this.serviceContainer.register('eventBus', () => this.eventBus, { singleton: true });
    this.serviceContainer.register('serviceContainer', () => this.serviceContainer, { singleton: true });
    this.serviceContainer.register('stateManager', () => new StateManager(this.eventBus), { singleton: true });
    this.serviceContainer.register('configManager', () => new ConfigManager(), { singleton: true });
  }

  registerInfrastructure() {
    // Регистрируем аудио систему
    this.serviceContainer.register('audioEngine', () => new AudioEngine(), { singleton: true });
    this.serviceContainer.register('audioPlayer', (container) => {
      const audioEngine = container.get('audioEngine');
      return new AudioPlayer(audioEngine);
    }, { singleton: true });
    this.serviceContainer.register('audioRepository', (container) => {
      const audioPlayer = container.get('audioPlayer');
      return new AudioRepository(audioPlayer);
    }, { singleton: true });
    
    // Регистрируем хранилище
    this.serviceContainer.register('localStorageAdapter', () => new LocalStorageAdapter(), { singleton: true });
    this.serviceContainer.register('fileStorageAdapter', () => new FileStorageAdapter(), { singleton: true });
    this.serviceContainer.register('storageAdapter', (container) => {
      return container.get('localStorageAdapter');
    }, { singleton: true });
    
    // Регистрируем шаблоны
    this.serviceContainer.register('templateLoader', () => new TemplateLoader(), { singleton: true });
    this.serviceContainer.register('templateRepository', (container) => {
      const storageAdapter = container.get('storageAdapter');
      const templateLoader = container.get('templateLoader');
      return new TemplateRepository(storageAdapter, templateLoader);
    }, { singleton: true });
  }

  registerDomain() {
    // Регистрируем репозитории
    this.serviceContainer.register('chordRepository', (container) => {
      const storageAdapter = container.get('storageAdapter');
      return new ChordRepository(storageAdapter);
    }, { singleton: true });
    this.serviceContainer.register('barRepository', (container) => {
      const storageAdapter = container.get('storageAdapter');
      return new BarRepository(storageAdapter);
    }, { singleton: true });
    
    // Регистрируем сервисы бизнес-логики
    this.serviceContainer.register('chordService', (container) => {
      const chordRepository = container.get('chordRepository');
      return new ChordService(chordRepository);
    }, { singleton: true });
    this.serviceContainer.register('barService', (container) => {
      const barRepository = container.get('barRepository');
      return new BarService(barRepository);
    }, { singleton: true });
    this.serviceContainer.register('playbackService', (container) => {
      const audioEngine = container.get('audioEngine');
      const barRepository = container.get('barRepository');
      return new PlaybackService(audioEngine, barRepository);
    }, { singleton: true });
    this.serviceContainer.register('templateService', (container) => {
      const templateRepository = container.get('templateRepository');
      return new TemplateService(templateRepository);
    }, { singleton: true });
  }

  registerPresentation() {
    // Регистрируем контроллеры
    this.serviceContainer.register('mainController', (container) => {
      const eventBus = container.get('eventBus');
      const serviceContainer = container.get('serviceContainer');
      return new MainController(eventBus, serviceContainer);
    }, { singleton: true });
    this.serviceContainer.register('chordController', (container) => {
      const eventBus = container.get('eventBus');
      const serviceContainer = container.get('serviceContainer');
      return new ChordController(eventBus, serviceContainer);
    }, { singleton: true });
    this.serviceContainer.register('playbackController', (container) => {
      const eventBus = container.get('eventBus');
      const serviceContainer = container.get('serviceContainer');
      return new PlaybackController(eventBus, serviceContainer);
    }, { singleton: true });
  }

  registerApplicationServices() {
    // Регистрируем сервисы приложения
    this.serviceContainer.register('applicationService', (container) => {
      const eventBus = container.get('eventBus');
      const serviceContainer = container.get('serviceContainer');
      return new ApplicationService(eventBus, serviceContainer);
    }, { singleton: true });
    this.serviceContainer.register('initializationService', (container) => {
      const eventBus = container.get('eventBus');
      const serviceContainer = container.get('serviceContainer');
      return new InitializationService(eventBus, serviceContainer);
    }, { singleton: true });
    this.serviceContainer.register('errorHandlingService', (container) => {
      const eventBus = container.get('eventBus');
      const serviceContainer = container.get('serviceContainer');
      return new ErrorHandlingService(eventBus, serviceContainer);
    }, { singleton: true });
  }

  async start() {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) {
        return false;
      }
    }

    try {
      // Создаем главное представление
      const mainController = this.serviceContainer.get('mainController');
      const appContainer = document.getElementById('app');
      
      if (!appContainer) {
        throw new Error('App container not found');
      }
      
      const mainView = new MainView(
        appContainer,
        this.eventBus,
        this.serviceContainer
      );
      
      // Регистрируем представление в контроллере
      mainController.registerComponent('mainView', mainView);
      
      console.log('Guitar Combat App started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start Guitar Combat App:', error);
      this.handleStartupError(error);
      return false;
    }
  }

  handleInitializationError(error) {
    console.error('Initialization error:', error);
    
    // Показываем сообщение об ошибке
    this.showErrorMessage('Не удалось инициализировать приложение. Пожалуйста, обновите страницу.');
  }

  handleStartupError(error) {
    console.error('Startup error:', error);
    
    // Показываем сообщение об ошибке
    this.showErrorMessage('Не удалось запустить приложение. Пожалуйста, проверьте консоль для деталей.');
  }

  showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.innerHTML = `
      <div class="error-message">
        <h2>Ошибка</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Обновить страницу</button>
      </div>
    `;
    
    document.body.appendChild(errorContainer);
  }

  async shutdown() {
    if (!this.isInitialized) {
      return;
    }

    try {
      const applicationService = this.serviceContainer.get('applicationService');
      await applicationService.shutdown();
      
      console.log('Guitar Combat App shutdown successfully');
    } catch (error) {
      console.error('Failed to shutdown Guitar Combat App:', error);
    }
  }

  getServiceContainer() {
    return this.serviceContainer;
  }

  getEventBus() {
    return this.eventBus;
  }
}

// Создаем экземпляр приложения
const app = new GuitarCombatApp();

// Запускаем приложение когда DOM готов
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.start();
  } catch (error) {
    console.error('Failed to start app:', error);
  }
});

// Обрабатываем ошибки загрузки
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Экспортируем приложение для глобального доступа
window.GuitarCombatApp = app;

// Делаем утилиты доступными глобально
window.Utils = Utils;
window.MusicUtils = MusicUtils;