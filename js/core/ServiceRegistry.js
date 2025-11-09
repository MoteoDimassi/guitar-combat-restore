export class ServiceRegistry {
  constructor() {
    this.registrations = new Map();
  }

  /**
   * Регистрация сервиса с метаданными
   * @param {string} name - Название сервиса
   * @param {Function} factory - Фабрика сервиса
   * @param {Object} metadata - Метаданные
   */
  register(name, factory, metadata = {}) {
    const registration = {
      name,
      factory,
      metadata: {
        description: metadata.description || "",
        category: metadata.category || "general",
        version: metadata.version || "1.0.0",
        author: metadata.author || "",
        tags: metadata.tags || [],
        dependencies: metadata.dependencies || [],
        singleton: metadata.singleton !== false,
        lazy: metadata.lazy !== false,
        priority: metadata.priority || 0,
        ...metadata,
      },
    };

    this.registrations.set(name, registration);

    console.log(
      `📝 Service registered in registry: ${name}`,
      registration.metadata
    );
  }

  /**
   * Получение регистрации
   * @param {string} name - Название сервиса
   * @returns {Object} Регистрация сервиса
   */
  get(name) {
    return this.registrations.get(name);
  }

  /**
   * Получение всех регистраций
   * @returns {Map} Все регистрации
   */
  getAll() {
    return this.registrations;
  }

  /**
   * Получение сервисов по категории
   * @param {string} category - Категория
   * @returns {Array} Массив сервисов
   */
  getByCategory(category) {
    const services = [];

    for (const [name, registration] of this.registrations) {
      if (registration.metadata.category === category) {
        services.push({ name, ...registration });
      }
    }

    return services;
  }

  /**
   * Получение сервисов по тегу
   * @param {string} tag - Тег
   * @returns {Array} Массив сервисов
   */
  getByTag(tag) {
    const services = [];

    for (const [name, registration] of this.registrations) {
      if (registration.metadata.tags.includes(tag)) {
        services.push({ name, ...registration });
      }
    }

    return services;
  }

  /**
   * Поиск сервисов
   * @param {Function} filter - Функция фильтрации
   * @returns {Array} Массив сервисов
   */
  find(filter) {
    const services = [];

    for (const [name, registration] of this.registrations) {
      if (filter({ name, ...registration })) {
        services.push({ name, ...registration });
      }
    }

    return services;
  }

  /**
   * Применение регистраций к контейнеру
   * @param {ServiceContainer} container - Контейнер сервисов
   */
  applyToContainer(container) {
    for (const [name, registration] of this.registrations) {
      container.register(name, registration.factory, registration.metadata);
    }
  }
}