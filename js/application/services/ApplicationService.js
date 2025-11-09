class ApplicationService {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing application...');
      
      // Инициализируем ядро системы
      await this.initializeCore();
      
      // Инициализируем инфраструктуру
      await this.initializeInfrastructure();
      
      // Инициализируем бизнес-логику
      await this.initializeDomain();
      
      // Инициализируем представление
      await this.initializePresentation();
      
      // Загружаем начальные данные
      await this.loadInitialData();
      
      this.isInitialized = true;
      this.eventBus.emit('app:initialized');
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.eventBus.emit('app:initialization-failed', { error });
      throw error;
    }
  }

  async initializeCore() {
    console.log('Initializing core services...');
    
    // Ядро уже инициализировано в main.js, здесь просто проверяем
    const eventBus = this.serviceContainer.get('eventBus');
    const serviceContainer = this.serviceContainer.get('serviceContainer');
    const stateManager = this.serviceContainer.get('stateManager');
    const configManager = this.serviceContainer.get('configManager');
    
    if (!eventBus || !serviceContainer || !stateManager || !configManager) {
      throw new Error('Core services not properly initialized');
    }
  }

  async initializeInfrastructure() {
    console.log('Initializing infrastructure services...');
    
    // Инициализируем аудио движок
    const audioEngine = this.serviceContainer.get('audioEngine');
    await audioEngine.initialize();
    
    // Инициализируем аудио плеер
    const audioPlayer = this.serviceContainer.get('audioPlayer');
    
    // Инициализируем аудио репозиторий
    const audioRepository = this.serviceContainer.get('audioRepository');
    await audioRepository.loadAllSounds();
    
    // Инициализируем хранилище
    const storageAdapter = this.serviceContainer.get('storageAdapter');
    
    // Инициализируем загрузчик шаблонов
    const templateLoader = this.serviceContainer.get('templateLoader');
    await templateLoader.loadDefaultTemplates();
  }

  async initializeDomain() {
    console.log('Initializing domain services...');
    
    // Бизнес-сервисы уже созданы через контейнер зависимостей
    // Здесь можно выполнить дополнительную инициализацию если необходимо
  }

  async initializePresentation() {
    console.log('Initializing presentation layer...');
    
    // Представление инициализируется в main.js
    // Здесь можно выполнить дополнительную инициализацию если необходимо
  }

  async loadInitialData() {
    console.log('Loading initial data...');
    
    try {
      // Загружаем настройки
      const configManager = this.serviceContainer.get('configManager');
      const savedConfig = localStorage.getItem('guitar-combat-config');
      if (savedConfig) {
        configManager.load(JSON.parse(savedConfig));
      }
      
      // Применяем настройки
      const audioRepository = this.serviceContainer.get('audioRepository');
      const volume = configManager.get('audio.volume');
      if (volume !== undefined) {
        audioRepository.setVolume(volume);
      }
      
      // Загружаем сохраненные данные если необходимо
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      // Здесь можно загрузить сохраненные аккорды и такты
      
      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Продолжаем работу даже если не удалось загрузить данные
    }
  }

  async shutdown() {
    try {
      console.log('Shutting down application...');
      
      // Сохраняем настройки
      const configManager = this.serviceContainer.get('configManager');
      localStorage.setItem('guitar-combat-config', configManager.save());
      
      // Останавливаем воспроизведение
      const playbackService = this.serviceContainer.get('playbackService');
      if (playbackService.isCurrentlyPlaying()) {
        playbackService.stop();
      }
      
      // Очищаем ресурсы
      const audioEngine = this.serviceContainer.get('audioEngine');
      audioEngine.suspend();
      
      this.isInitialized = false;
      this.eventBus.emit('app:shutdown');
      
      console.log('Application shutdown successfully');
    } catch (error) {
      console.error('Failed to shutdown application:', error);
      throw error;
    }
  }

  async restart() {
    try {
      await this.shutdown();
      await this.initialize();
    } catch (error) {
      console.error('Failed to restart application:', error);
      throw error;
    }
  }

  isAppInitialized() {
    return this.isInitialized;
  }

  getVersion() {
    return '1.0.0'; // В реальном приложении это может быть взято из package.json
  }

  getServiceContainer() {
    return this.serviceContainer;
  }

  getEventBus() {
    return this.eventBus;
  }
}

export default ApplicationService;