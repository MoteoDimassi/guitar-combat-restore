export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
    this.instances = new Map();
    this.dependencies = new Map();
    this.loading = new Set();
    this.initialized = new Set();
  }

  /**
   * Регистрация сервиса
   * @param {string} name - Название сервиса
   * @param {Function} factory - Фабрика сервиса
   * @param {Object} options - Опции регистрации
   */
  register(name, factory, options = {}) {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    const serviceDefinition = {
      factory,
      options: {
        singleton: options.singleton !== false, // по умолчанию singleton
        lazy: options.lazy !== false, // по умолчанию lazy
        dependencies: options.dependencies || [],
        init: options.init || null,
        destroy: options.destroy || null,
        priority: options.priority || 0,
        tags: options.tags || [],
        ...options,
      },
    };

    this.services.set(name, serviceDefinition);
    this.dependencies.set(name, serviceDefinition.options.dependencies);

    console.log(`📦 Service registered: ${name}`, {
      singleton: serviceDefinition.options.singleton,
      dependencies: serviceDefinition.options.dependencies,
    });
  }

  /**
   * Регистрация синглтона
   * @param {string} name - Название сервиса
   * @param {Function} factory - Фабрика сервиса
   * @param {Object} options - Опции регистрации
   */
  singleton(name, factory, options = {}) {
    return this.register(name, factory, { ...options, singleton: true });
  }

  /**
   * Регистрация фабрики (всегда создает новый экземпляр)
   * @param {string} name - Название сервиса
   * @param {Function} factory - Фабрика сервиса
   * @param {Object} options - Опции регистрации
   */
  factory(name, serviceFactory, options = {}) {
    return this.register(name, serviceFactory, { ...options, singleton: false });
  }

  /**
   * Получение сервиса
   * @param {string} name - Название сервиса
   * @returns {*} Экземпляр сервиса
   */
  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} is not registered`);
    }

    // Проверяем на циклические зависимости
    if (this.loading.has(name)) {
      throw new Error(
        `Circular dependency detected: ${Array.from(this.loading).join(
          " -> "
        )} -> ${name}`
      );
    }

    const serviceDefinition = this.services.get(name);

    // Возвращаем синглтон если уже создан
    if (serviceDefinition.options.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Создаем экземпляр
    return this.createInstance(name, serviceDefinition);
  }

  /**
   * Создание экземпляра сервиса
   * @private
   */
  createInstance(name, serviceDefinition) {
    this.loading.add(name);

    try {
      // Получаем зависимости
      const dependencies = this.resolveDependencies(
        serviceDefinition.options.dependencies
      );

      // Создаем экземпляр через фабрику
      const instance = serviceDefinition.factory(this, ...dependencies);

      // Сохраняем синглтон
      if (serviceDefinition.options.singleton) {
        this.singletons.set(name, instance);
      }

      // Сохраняем информацию об экземпляре
      this.instances.set(name, {
        instance,
        definition: serviceDefinition,
        createdAt: Date.now(),
        initialized: false,
      });

      console.log(`🔧 Service instance created: ${name}`, {
        singleton: serviceDefinition.options.singleton,
        dependencies: serviceDefinition.options.dependencies.length,
      });

      return instance;
    } finally {
      this.loading.delete(name);
    }
  }

  /**
   * Разрешение зависимостей
   * @private
   */
  resolveDependencies(dependencies) {
    return dependencies.map((dep) => {
      if (typeof dep === "string") {
        return this.get(dep);
      } else if (typeof dep === "object" && dep.name) {
        return this.get(dep.name);
      } else {
        throw new Error(`Invalid dependency definition: ${dep}`);
      }
    });
  }

  /**
   * Инициализация сервисов
   * @param {Array} serviceNames - Названия сервисов (опционально)
   */
  async initialize(serviceNames = null) {
    const servicesToInit = serviceNames || Array.from(this.services.keys());

    // Сортируем по приоритету и зависимостям
    const sortedServices = this.sortServicesByDependencies(servicesToInit);

    console.log("🚀 Initializing services...", sortedServices);

    for (const serviceName of sortedServices) {
      await this.initializeService(serviceName);
    }

    console.log("✅ All services initialized");
  }

  /**
   * Инициализация конкретного сервиса
   * @private
   */
  async initializeService(serviceName) {
    if (this.initialized.has(serviceName)) {
      return;
    }

    let instanceInfo = this.instances.get(serviceName);
    if (!instanceInfo) {
      // Создаем экземпляр если еще не создан
      this.get(serviceName);
      instanceInfo = this.instances.get(serviceName);
    }

    if (instanceInfo && !instanceInfo.initialized) {
      const { instance, definition } = instanceInfo;

      // Вызываем метод init если он есть
      if (
        definition.options.init &&
        typeof instance[definition.options.init] === "function"
      ) {
        await instance[definition.options.init]();
      }

      instanceInfo.initialized = true;
      this.initialized.add(serviceName);

      console.log(`✅ Service initialized: ${serviceName}`);
    }
  }

  /**
   * Сортировка сервисов по зависимостям
   * @private
   */
  sortServicesByDependencies(serviceNames) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (name) => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);

      const dependencies = this.dependencies.get(name) || [];
      for (const dep of dependencies) {
        const depName = typeof dep === "string" ? dep : dep.name;
        if (serviceNames.includes(depName)) {
          visit(depName);
        }
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    for (const name of serviceNames) {
      visit(name);
    }

    return sorted;
  }

  /**
   * Получение сервисов по тегу
   * @param {string} tag - Тег
   * @returns {Array} Массив сервисов
   */
  getByTag(tag) {
    const taggedServices = [];

    for (const [name, definition] of this.services) {
      if (definition.options.tags.includes(tag)) {
        taggedServices.push({
          name,
          instance: this.get(name),
          definition,
        });
      }
    }

    return taggedServices;
  }

  /**
   * Проверка регистрации сервиса
   * @param {string} name - Название сервиса
   * @returns {boolean} Зарегистрирован ли сервис
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Удаление сервиса
   * @param {string} name - Название сервиса
   */
  remove(name) {
    if (!this.services.has(name)) {
      return;
    }

    // Уничтожаем экземпляр
    this.destroyService(name);

    // Удаляем регистрации
    this.services.delete(name);
    this.dependencies.delete(name);
    this.singletons.delete(name);
    this.instances.delete(name);
    this.initialized.delete(name);

    console.log(`🗑️ Service removed: ${name}`);
  }

  /**
   * Уничтожение сервиса
   * @private
   */
  async destroyService(name) {
    const instanceInfo = this.instances.get(name);
    if (!instanceInfo) {
      return;
    }

    const { instance, definition } = instanceInfo;

    // Вызываем метод destroy если он есть
    if (
      definition.options.destroy &&
      typeof instance[definition.options.destroy] === "function"
    ) {
      try {
        await instance[definition.options.destroy]();
      } catch (error) {
        console.error(`Error destroying service ${name}:`, error);
      }
    }

    console.log(`💥 Service destroyed: ${name}`);
  }

  /**
   * Очистка контейнера
   */
  async clear() {
    console.log("🧹 Clearing service container...");

    // Уничтожаем все сервисы
    for (const name of Array.from(this.instances.keys())) {
      await this.destroyService(name);
    }

    // Очищаем все коллекции
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
    this.instances.clear();
    this.dependencies.clear();
    this.initialized.clear();
    this.loading.clear();

    console.log("✅ Service container cleared");
  }

  /**
   * Получение информации о сервисе
   * @param {string} name - Название сервиса
   * @returns {Object} Информация о сервисе
   */
  getServiceInfo(name) {
    const definition = this.services.get(name);
    const instanceInfo = this.instances.get(name);

    if (!definition) {
      return null;
    }

    return {
      name,
      singleton: definition.options.singleton,
      lazy: definition.options.lazy,
      dependencies: definition.options.dependencies,
      tags: definition.options.tags,
      priority: definition.options.priority,
      initialized: this.initialized.has(name),
      instanceCreated: !!instanceInfo,
      createdAt: instanceInfo?.createdAt,
    };
  }

  /**
   * Получение статистики контейнера
   * @returns {Object} Статистика
   */
  getStats() {
    const services = Array.from(this.services.keys());
    const singletons = Array.from(this.singletons.keys());
    const initialized = Array.from(this.initialized.keys());

    return {
      total: services.length,
      singletons: singletons.length,
      initialized: initialized.length,
      loading: this.loading.size,
      byTag: this.getStatsByTag(),
    };
  }

  /**
   * Получение статистики по тегам
   * @private
   */
  getStatsByTag() {
    const tagStats = {};

    for (const [name, definition] of this.services) {
      for (const tag of definition.options.tags) {
        if (!tagStats[tag]) {
          tagStats[tag] = 0;
        }
        tagStats[tag]++;
      }
    }

    return tagStats;
  }

  /**
   * Создание дочернего контейнера
   * @param {Object} options - Опции дочернего контейнера
   * @returns {ServiceContainer} Дочерний контейнер
   */
  createChild(options = {}) {
    const child = new ServiceContainer();
    child.parent = this;
    child.inheritFromParent = options.inheritFromParent !== false;

    return child;
  }
}