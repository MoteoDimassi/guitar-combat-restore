class InitializationService {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.initializationSteps = [];
    this.currentStep = 0;
  }

  async initialize() {
    try {
      console.log('Starting initialization process...');
      
      // Определяем шаги инициализации
      this.setupInitializationSteps();
      
      // Выполняем шаги инициализации
      for (let i = 0; i < this.initializationSteps.length; i++) {
        this.currentStep = i;
        const step = this.initializationSteps[i];
        
        console.log(`Executing step ${i + 1}/${this.initializationSteps.length}: ${step.name}`);
        this.eventBus.emit('initialization:step-started', { 
          step: i + 1, 
          total: this.initializationSteps.length, 
          name: step.name 
        });
        
        await step.execute();
        
        this.eventBus.emit('initialization:step-completed', { 
          step: i + 1, 
          total: this.initializationSteps.length, 
          name: step.name 
        });
      }
      
      console.log('Initialization completed successfully');
      this.eventBus.emit('initialization:completed');
      
      return true;
    } catch (error) {
      console.error('Initialization failed:', error);
      this.eventBus.emit('initialization:failed', { 
        step: this.currentStep + 1, 
        total: this.initializationSteps.length, 
        error 
      });
      
      return false;
    }
  }

  setupInitializationSteps() {
    this.initializationSteps = [
      {
        name: 'Initialize Core Services',
        execute: async () => {
          await this.initializeCoreServices();
        }
      },
      {
        name: 'Initialize Audio System',
        execute: async () => {
          await this.initializeAudioSystem();
        }
      },
      {
        name: 'Initialize Storage',
        execute: async () => {
          await this.initializeStorage();
        }
      },
      {
        name: 'Load Templates',
        execute: async () => {
          await this.loadTemplates();
        }
      },
      {
        name: 'Initialize UI Components',
        execute: async () => {
          await this.initializeUIComponents();
        }
      },
      {
        name: 'Load Initial Data',
        execute: async () => {
          await this.loadInitialData();
        }
      }
    ];
  }

  async initializeCoreServices() {
    // Проверяем, что все основные сервисы зарегистрированы
    const requiredServices = [
      'eventBus',
      'serviceContainer',
      'stateManager',
      'configManager'
    ];
    
    for (const serviceName of requiredServices) {
      const service = this.serviceContainer.get(serviceName);
      if (!service) {
        throw new Error(`Required service ${serviceName} not found`);
      }
    }
  }

  async initializeAudioSystem() {
    const audioEngine = this.serviceContainer.get('audioEngine');
    await audioEngine.initialize();
    
    const audioRepository = this.serviceContainer.get('audioRepository');
    await audioRepository.loadAllSounds();
  }

  async initializeStorage() {
    const storageAdapter = this.serviceContainer.get('storageAdapter');
    // Проверяем, что хранилище работает
    await storageAdapter.getAll('test');
  }

  async loadTemplates() {
    const templateLoader = this.serviceContainer.get('templateLoader');
    await templateLoader.loadDefaultTemplates();
  }

  async initializeUIComponents() {
    // UI компоненты инициализируются в main.js
    // Здесь можно выполнить дополнительную инициализацию если необходимо
  }

  async loadInitialData() {
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
  }

  getCurrentStep() {
    return this.currentStep;
  }

  getTotalSteps() {
    return this.initializationSteps.length;
  }

  getStepName(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.initializationSteps.length) {
      return this.initializationSteps[stepIndex].name;
    }
    return null;
  }

  addInitializationStep(name, executeFunction) {
    this.initializationSteps.push({
      name,
      execute: executeFunction
    });
  }

  removeInitializationStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.initializationSteps.length) {
      this.initializationSteps.splice(stepIndex, 1);
    }
  }

  async reinitialize() {
    this.currentStep = 0;
    return await this.initialize();
  }

  getInitializationProgress() {
    return {
      current: this.currentStep + 1,
      total: this.initializationSteps.length,
      percentage: Math.round(((this.currentStep + 1) / this.initializationSteps.length) * 100),
      currentStepName: this.getStepName(this.currentStep)
    };
  }
}

export default InitializationService;