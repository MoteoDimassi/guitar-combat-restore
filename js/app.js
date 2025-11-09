// Импорты ядра архитектуры
import EventBus from './core/EventBus.js';
import { ServiceContainer } from './core/ServiceContainer.js';
import StateManager from './core/StateManager.js';

// Импорты новой системы зависимостей
import { ServiceRegistry } from './core/ServiceRegistry.js';
import { ServiceLoader } from './core/ServiceLoader.js';
import { OptimizedApplicationService } from './application/OptimizedApplicationService.js';
import { registerServices } from './application/ServiceDefinitions.js';

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
    this.optimizedApplicationService = new OptimizedApplicationService();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Guitar Combat App with optimized dependency injection...');
      
      // Инициализируем оптимизированный сервис приложения
      await this.optimizedApplicationService.initialize({
        debug: true,
        autoDiscover: false, // Отключаем автообнаружение для явного контроля
        modules: {
          // Здесь можно добавить конфигурацию модулей
        }
      });
      
      // Регистрируем дополнительные сервисы, которые не были включены в ServiceDefinitions
      this.registerAdditionalServices();
      
      // Инициализируем все сервисы
      await this.optimizedApplicationService.container.initialize();
      
      this.isInitialized = true;
      console.log('Guitar Combat App initialized successfully with optimized DI');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Guitar Combat App:', error);
      this.handleInitializationError(error);
      return false;
    }
  }

  registerAdditionalServices() {
    const container = this.optimizedApplicationService.container;
    
    // Аудио система теперь регистрируется в ServiceDefinitions
    // AudioPlayer больше не нужен, так как функциональность перенесена в AudioService и AudioEngine
    
    // Инициализация ConfigService при старте
    container.get('configService').initialize();
    
    // Инициализация аудио движка при старте
    container.get('audioEngine').initialize(container.get('eventBus'));
    
    // Инициализация аудио сервиса
    const audioService = container.get('audioService');
    audioService.initialize();
    
    // Передаем chordParserService в audioService
    const chordParserService = container.get('chordParserService');
    audioService.setChordParserService(chordParserService);
    
    // Регистрируем файловое хранилище
    container.register('fileStorageAdapter', () => new FileStorageAdapter(), { singleton: true });
    
    // Регистрируем шаблоны
    container.register('templateLoader', () => new TemplateLoader(), { singleton: true });
    container.register('templateRepository', (container) => {
      const storageAdapter = container.get('storageService');
      const templateLoader = container.get('templateLoader');
      return new TemplateRepository(storageAdapter, templateLoader);
    }, { singleton: true });
    
    // Регистрируем сервисы шаблонов
    container.register('templateService', (container) => {
      const templateRepository = container.get('templateRepository');
      return new TemplateService(templateRepository);
    }, { singleton: true });
    
    // Регистрируем контроллеры
    container.register('mainController', (container) => {
      const eventBus = container.get('eventBus');
      return new MainController(eventBus, container);
    }, { singleton: true });
    container.register('chordController', (container) => {
      const eventBus = container.get('eventBus');
      return new ChordController(eventBus, container);
    }, { singleton: true });
    container.register('playbackController', (container) => {
      const eventBus = container.get('eventBus');
      return new PlaybackController(eventBus, container);
    }, { singleton: true });
    
    // Регистрируем сервисы приложения
    container.register('applicationService', (container) => {
      const eventBus = container.get('eventBus');
      return new ApplicationService(eventBus, container);
    }, { singleton: true });
    container.register('initializationService', (container) => {
      const eventBus = container.get('eventBus');
      return new InitializationService(eventBus, container);
    }, { singleton: true });
    container.register('errorHandlingService', (container) => {
      const eventBus = container.get('eventBus');
      return new ErrorHandlingService(eventBus, container);
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
      const mainController = this.optimizedApplicationService.get('mainController');
      const eventBus = this.optimizedApplicationService.get('eventBus');
      const appContainer = document.getElementById('app');
      
      if (!appContainer) {
        throw new Error('App container not found');
      }
      
      const mainView = new MainView(
        appContainer,
        eventBus,
        this.optimizedApplicationService.container
      );
      
      // Регистрируем представление в контроллере
      mainController.registerComponent('mainView', mainView);
      
      console.log('Guitar Combat App started successfully with optimized DI');
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
      const applicationService = this.optimizedApplicationService.get('applicationService');
      await applicationService.shutdown();
      
      // Очищаем контейнер сервисов
      await this.optimizedApplicationService.container.clear();
      
      console.log('Guitar Combat App shutdown successfully');
    } catch (error) {
      console.error('Failed to shutdown Guitar Combat App:', error);
    }
  }

  getServiceContainer() {
    return this.optimizedApplicationService.container;
  }

  getEventBus() {
    return this.optimizedApplicationService.get('eventBus');
  }

  // Метод для получения статистики системы зависимостей
  getDependencyStats() {
    return this.optimizedApplicationService.getStats();
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

// Экспортируем класс для использования в других модулях
export { GuitarCombatApp };

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