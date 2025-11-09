export class ServiceLoader {
  constructor(container, registry) {
    this.container = container;
    this.registry = registry;
    this.loadedModules = new Set();
  }

  /**
   * Загрузка сервисов из модуля
   * @param {Object} module - Модуль с сервисами
   * @param {Object} options - Опции загрузки
   */
  async loadModule(module, options = {}) {
    const moduleName = options.name || module.name || "unknown";

    if (this.loadedModules.has(moduleName)) {
      console.warn(`Module ${moduleName} is already loaded`);
      return;
    }

    console.log(`📦 Loading module: ${moduleName}`);

    try {
      // Регистрируем сервисы из модуля
      if (module.services) {
        for (const [name, serviceDefinition] of Object.entries(
          module.services
        )) {
          this.registerService(name, serviceDefinition, options);
        }
      }

      // Вызываем метод инициализации модуля
      if (module.initialize && typeof module.initialize === "function") {
        await module.initialize(this.container, options);
      }

      this.loadedModules.add(moduleName);
      console.log(`✅ Module loaded: ${moduleName}`);
    } catch (error) {
      console.error(`❌ Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Регистрация сервиса
   * @private
   */
  registerService(name, serviceDefinition, options = {}) {
    const { factory, metadata = {} } = serviceDefinition;

    // Регистрируем в реестре
    if (this.registry) {
      this.registry.register(name, factory, {
        ...metadata,
        module: options.name,
      });
    }

    // Регистрируем в контейнере
    this.container.register(name, factory, metadata);
  }

  /**
   * Загрузка сервисов из конфигурации
   * @param {Object} config - Конфигурация сервисов
   */
  async loadFromConfig(config) {
    console.log("📋 Loading services from config...");

    for (const [name, serviceConfig] of Object.entries(config)) {
      try {
        // Динамический импорт модуля
        const module = await import(serviceConfig.module);

        // Получаем фабрику сервиса
        const factory =
          module.default || module[serviceConfig.export || "default"];

        // Регистрируем сервис
        this.container.register(name, factory, serviceConfig.options || {});

        console.log(`✅ Service loaded from config: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to load service ${name}:`, error);

        if (serviceConfig.required !== false) {
          throw error;
        }
      }
    }
  }

  /**
   * Автоматическое обнаружение и загрузка сервисов
   * @param {string} basePath - Базовый путь для поиска
   * @param {Object} options - Опции поиска
   */
  async autoDiscover(basePath, options = {}) {
    console.log(`🔍 Auto-discovering services in: ${basePath}`);

    const {
      pattern = /\.service\.js$/,
      recursive = true,
      exclude = [],
    } = options;

    // В реальном приложении здесь была бы логика сканирования файловой системы
    // Для примера используем предопределенный список сервисов
    const serviceModules = [
      "ChordService",
      "BarService",
      "PlaybackService",
      "TemplateService",
      "AudioEngine",
      "StorageService",
    ];

    for (const serviceName of serviceModules) {
      if (exclude.includes(serviceName)) {
        continue;
      }

      try {
        const modulePath = `${basePath}/${serviceName.toLowerCase()}.service.js`;
        const module = await import(modulePath);

        await this.loadModule(module, {
          name: serviceName,
          autoDiscovered: true,
        });
      } catch (error) {
        console.warn(
          `⚠️ Failed to auto-discover service: ${serviceName}`,
          error
        );
      }
    }
  }

  /**
   * Получение загруженных модулей
   * @returns {Set} Множество загруженных модулей
   */
  getLoadedModules() {
    return new Set(this.loadedModules);
  }

  /**
   * Проверка загрузки модуля
   * @param {string} moduleName - Название модуля
   * @returns {boolean} Загружен ли модуль
   */
  isModuleLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }
}