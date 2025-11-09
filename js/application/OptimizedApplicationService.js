import { ServiceContainer } from "../core/ServiceContainer.js";
import { ServiceRegistry } from "../core/ServiceRegistry.js";
import { ServiceLoader } from "../core/ServiceLoader.js";
import { EventBus } from "../core/EventBus.js";
import { StateManager } from "../core/StateManager.js";
import ConfigManager from "../core/ConfigManager.js";
import { registerServices } from "./ServiceDefinitions.js";

export class OptimizedApplicationService {
  constructor() {
    this.container = new ServiceContainer();
    this.registry = new ServiceRegistry();
    this.loader = new ServiceLoader(this.container, this.registry);
    this.isInitialized = false;
  }

  /**
   * Оптимизированная инициализация
   */
  async initialize(config = {}) {
    try {
      console.log("🚀 Initializing optimized application...");

      // 1. Регистрация базовых сервисов
      this.registerCoreServices(config);

      // 2. Регистрация бизнес-сервисов
      registerServices(this.container, this.registry);

      // 3. Загрузка дополнительных модулей
      await this.loadAdditionalModules(config);

      // 4. Инициализация сервисов по приоритету
      await this.initializeServicesByPriority();

      // 5. Настройка ленивой загрузки
      this.setupLazyLoading();

      this.isInitialized = true;
      console.log("✅ Optimized application initialized");
    } catch (error) {
      console.error("❌ Failed to initialize optimized application:", error);
      throw error;
    }
  }

  /**
   * Регистрация базовых сервисов
   */
  registerCoreServices(config) {
    // EventBus
    this.container.singleton(
      "eventBus",
      () =>
        new EventBus({
          debug: config.debug || false,
          maxHistorySize: config.maxEventHistory || 100,
        })
    );

    // StateManager
    this.container.singleton("stateManager", (container) => {
      return new StateManager(container.get("eventBus"), config.initialState);
    });

    // ConfigManager
    this.container.singleton("configManager", () => {
      return new ConfigManager(config);
    });

    // StateActions - для совместимости с существующими контроллерами
    this.container.singleton("stateActions", (container) => {
      const stateManager = container.get("stateManager");
      return {
        updateChordsInput: (chordsString) => {
          stateManager.setState("chords.inputString", chordsString);
        },
        updateBeatCount: (beatCount) => {
          stateManager.setState("settings.beatCount", beatCount);
        },
        updateTempo: (bpm) => {
          stateManager.setState("settings.bpm", bpm);
        },
        togglePlayback: () => {
          const isPlaying = stateManager.getState("playback.isPlaying");
          stateManager.setState("playback.isPlaying", !isPlaying);
        },
        toggleSettings: () => {
          const isVisible = stateManager.getState("ui.settingsVisible");
          stateManager.setState("ui.settingsVisible", !isVisible);
        },
        updateVolume: (type, value) => {
          stateManager.setState(`settings.volume.${type}`, value);
        },
        nextBar: () => {
          const currentBar = stateManager.getState("playback.currentBar");
          stateManager.setState("playback.currentBar", currentBar + 1);
        },
        previousBar: () => {
          const currentBar = stateManager.getState("playback.currentBar");
          stateManager.setState("playback.currentBar", Math.max(0, currentBar - 1));
        }
      };
    });
  }

  /**
   * Загрузка дополнительных модулей
   */
  async loadAdditionalModules(config) {
    // Загрузка модулей из конфигурации
    if (config.modules) {
      await this.loader.loadFromConfig(config.modules);
    }

    // Автообнаружение сервисов
    if (config.autoDiscover) {
      await this.loader.autoDiscover("./services", {
        pattern: /\.service\.js$/,
        exclude: config.excludeServices || [],
      });
    }
  }

  /**
   * Инициализация сервисов по приоритету
   */
  async initializeServicesByPriority() {
    // Получаем все сервисы с их приоритетами
    const services = [];

    for (const [name, definition] of this.container.services) {
      services.push({
        name,
        priority: definition.options.priority || 0,
        dependencies: definition.options.dependencies || [],
      });
    }

    // Сортируем по приоритету
    services.sort((a, b) => b.priority - a.priority);

    // Инициализируем в порядке приоритета
    const serviceNames = services.map((s) => s.name);
    await this.container.initialize(serviceNames);
  }

  /**
   * Настройка ленивой загрузки
   */
  setupLazyLoading() {
    // Создаем прокси для ленивой загрузки
    this.lazyServices = new Proxy(
      {},
      {
        get: (target, name) => {
          if (target[name]) {
            return target[name];
          }

          // Ленивая загрузка сервиса
          if (this.container.has(name)) {
            target[name] = this.container.get(name);
            return target[name];
          }

          throw new Error(`Service ${name} is not registered`);
        },
      }
    );
  }

  /**
   * Получение сервиса с ленивой загрузкой
   */
  get(serviceName) {
    return this.lazyServices[serviceName];
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      container: this.container.getStats(),
      registry: {
        total: this.registry.getAll().size,
        byCategory: this.getRegistryStatsByCategory(),
      },
      loader: {
        loadedModules: Array.from(this.loader.getLoadedModules()),
      },
    };
  }

  /**
   * Получение статистики реестра по категориям
   */
  getRegistryStatsByCategory() {
    const stats = {};

    for (const [name, registration] of this.registry.getAll()) {
      const category = registration.metadata.category || "other";

      if (!stats[category]) {
        stats[category] = 0;
      }

      stats[category]++;
    }

    return stats;
  }
}