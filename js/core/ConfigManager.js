import { EventBus } from "./EventBus.js";
import { EventTypes } from "./EventTypes.js";

export class ConfigManager {
  constructor(eventBus = null, initialConfig = {}) {
    this.eventBus = eventBus;
    this.config = this.createDefaultConfig();
    this.userConfig = {};
    this.runtimeConfig = {};
    this.configSchema = this.createConfigSchema();
    this.watchers = new Map();
    this.validators = new Map();
    this.transformers = new Map();

    // Загружаем конфигурацию
    this.mergeConfig(initialConfig);

    // Настраиваем валидаторы
    this.setupValidators();

    // Настраиваем трансформеры
    this.setupTransformers();
  }

  /**
   * Создание конфигурации по умолчанию
   */
  createDefaultConfig() {
    return {
      // Настройки приложения
      app: {
        name: "Guitar Combat",
        version: "2.0.0",
        debug: false,
        environment: "production",
        language: "ru",
        theme: "dark",
      },

      // Аудио настройки
      audio: {
        sampleRate: 44100,
        bufferSize: 2048,
        volume: 0.8,
        muteVolume: 0.3,
        crossfadeTime: 0.05,
        maxConcurrentSounds: 8,
        preloadSounds: true,
        enableMetronome: true,
        metronomeVolume: 1.0,
        audioContextOptions: {
          latencyHint: "interactive",
        },
      },

      // Настройки воспроизведения
      playback: {
        defaultTempo: 120,
        minTempo: 40,
        maxTempo: 300,
        defaultBeatCount: 8,
        minBeatCount: 1,
        maxBeatCount: 16,
        autoAdvance: true,
        highlightCurrentBeat: true,
        showCountdown: true,
      },

      // Настройки UI
      ui: {
        animations: true,
        animationDuration: 300,
        showTooltips: true,
        showKeyboardShortcuts: true,
        compactMode: false,
        showAdvancedOptions: false,
        arrowSize: "medium",
        colorScheme: "default",
      },

      // Настройки хранения
      storage: {
        key: "guitarCombatData",
        autoSave: true,
        autoSaveDelay: 1000,
        maxStorageSize: 5242880, // 5MB
        compressionEnabled: false,
        encryptionEnabled: false,
      },

      // Настройки шаблонов
      templates: {
        autoLoad: true,
        cacheEnabled: true,
        customTemplatesPath: "./templates/custom",
        maxCustomTemplates: 50,
      },

      // Настройки производительности
      performance: {
        enableProfiling: false,
        maxEventHistory: 100,
        enableServiceWorker: false,
        lazyLoading: true,
        poolingEnabled: true,
        maxPoolSize: 10,
      },

      // Настройки логирования
      logging: {
        level: "info", // debug, info, warn, error
        enableConsole: true,
        enableRemote: false,
        remoteEndpoint: null,
        maxLogSize: 1000,
        includeStackTrace: true,
      },

      // Настройки разработки
      development: {
        enableHotReload: false,
        showDebugInfo: false,
        enableMockData: false,
        mockAudioEngine: false,
        disableServiceWorker: false,
      },

      // Настройки доступа
      accessibility: {
        enableScreenReader: false,
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        keyboardNavigation: true,
      },

      // Настройки сети
      network: {
        enableOfflineMode: true,
        cacheStrategy: "cacheFirst",
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
    };
  }

  /**
   * Создание схемы конфигурации
   */
  createConfigSchema() {
    return {
      app: {
        name: { type: "string", required: true },
        version: { type: "string", required: true },
        debug: { type: "boolean", default: false },
        environment: {
          type: "string",
          enum: ["development", "production", "test"],
        },
        language: { type: "string", default: "ru" },
        theme: { type: "string", enum: ["light", "dark", "auto"] },
      },

      audio: {
        sampleRate: { type: "number", min: 22050, max: 96000 },
        volume: { type: "number", min: 0, max: 1 },
        muteVolume: { type: "number", min: 0, max: 1 },
        maxConcurrentSounds: { type: "number", min: 1, max: 32 },
        preloadSounds: { type: "boolean" },
      },

      playback: {
        defaultTempo: { type: "number", min: 40, max: 300 },
        minTempo: { type: "number", min: 20, max: 100 },
        maxTempo: { type: "number", min: 200, max: 500 },
        defaultBeatCount: { type: "number", min: 1, max: 32 },
        autoAdvance: { type: "boolean" },
      },

      ui: {
        animations: { type: "boolean" },
        animationDuration: { type: "number", min: 0, max: 2000 },
        showTooltips: { type: "boolean" },
        compactMode: { type: "boolean" },
        arrowSize: { type: "string", enum: ["small", "medium", "large"] },
      },

      storage: {
        autoSave: { type: "boolean" },
        autoSaveDelay: { type: "number", min: 100, max: 10000 },
        maxStorageSize: { type: "number", min: 1048576, max: 52428800 },
      },
    };
  }

  /**
   * Получение значения конфигурации
   */
  get(path, defaultValue = undefined) {
    const value = this.getNestedValue(this.config, path);

    if (value !== undefined) {
      return this.transformValue(path, value);
    }

    return defaultValue;
  }

  /**
   * Установка значения конфигурации
   */
  set(path, value, options = {}) {
    const {
      persist = false,
      validate = true,
      silent = false,
      scope = "runtime",
    } = options;

    // Валидация
    if (validate && !this.validateValue(path, value)) {
      throw new Error(`Invalid value for ${path}: ${value}`);
    }

    const oldValue = this.get(path);

    // Трансформация
    const transformedValue = this.transformValue(path, value, "set");

    // Устанавливаем в соответствующую область
    switch (scope) {
      case "user":
        this.setNestedValue(this.userConfig, path, transformedValue);
        break;
      case "runtime":
        this.setNestedValue(this.runtimeConfig, path, transformedValue);
        break;
      default:
        this.setNestedValue(this.config, path, transformedValue);
    }

    // Обновляем общую конфигурацию
    this.rebuildConfig();

    // Сохраняем если нужно
    if (persist) {
      this.persistConfig(path, transformedValue);
    }

    // Уведомляем наблюдателей
    if (!silent) {
      this.notifyWatchers(path, transformedValue, oldValue);

      if (this.eventBus) {
        this.eventBus.emit(EventTypes.CONFIG_CHANGED, {
          path,
          value: transformedValue,
          oldValue,
          scope,
          timestamp: Date.now(),
        });
      }
    }

    return transformedValue;
  }

  /**
   * Обновление нескольких значений
   */
  update(updates, options = {}) {
    const changes = [];

    for (const [path, value] of Object.entries(updates)) {
      const oldValue = this.get(path);

      try {
        this.set(path, value, { ...options, silent: true });
        changes.push({ path, value, oldValue });
      } catch (error) {
        console.warn(`Failed to set ${path}:`, error);
      }
    }

    // Уведомляем об изменениях
    if (!options.silent && changes.length > 0) {
      changes.forEach(({ path, value, oldValue }) => {
        this.notifyWatchers(path, value, oldValue);
      });

      if (this.eventBus) {
        this.eventBus.emit(EventTypes.CONFIG_BATCH_CHANGED, {
          changes,
          timestamp: Date.now(),
        });
      }
    }

    return changes;
  }

  /**
   * Сброс конфигурации
   */
  reset(path = null, options = {}) {
    if (path) {
      const defaultValue = this.getDefaultValue(path);
      this.set(path, defaultValue, options);
    } else {
      this.config = this.createDefaultConfig();
      this.userConfig = {};
      this.runtimeConfig = {};

      if (!options.silent && this.eventBus) {
        this.eventBus.emit(EventTypes.CONFIG_RESET, {
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Наблюдение за изменениями
   */
  watch(path, callback, options = {}) {
    const { immediate = false, deep = false } = options;

    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }

    const watcher = {
      callback,
      options: { immediate, deep },
      id: this.generateWatcherId(),
    };

    this.watchers.get(path).add(watcher);

    // Немедленный вызов если нужно
    if (immediate) {
      callback(this.get(path), undefined, path);
    }

    // Возвращаем функцию отписки
    return () => {
      const pathWatchers = this.watchers.get(path);
      if (pathWatchers) {
        pathWatchers.delete(watcher);
        if (pathWatchers.size === 0) {
          this.watchers.delete(path);
        }
      }
    };
  }

  /**
   * Валидация значения
   */
  validateValue(path, value) {
    const schema = this.getSchemaForPath(path);

    if (!schema) {
      return true; // Нет схемы - пропускаем
    }

    const validator = this.validators.get(schema.type);
    if (validator) {
      return validator(value, schema);
    }

    return true;
  }

  /**
   * Трансформация значения
   */
  transformValue(path, value, direction = "get") {
    const transformer = this.transformers.get(path);

    if (transformer) {
      return direction === "get"
        ? transformer.get
          ? transformer.get(value)
          : value
        : transformer.set
        ? transformer.set(value)
        : value;
    }

    return value;
  }

  /**
   * Загрузка конфигурации из хранилища
   */
  async loadFromStorage(storageKey = "guitarCombatConfig") {
    try {
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const config = JSON.parse(stored);
        this.mergeConfig(config);

        if (this.eventBus) {
          this.eventBus.emit(EventTypes.CONFIG_LOADED, {
            source: "storage",
            timestamp: Date.now(),
          });
        }

        console.log("✅ Configuration loaded from storage");
      }
    } catch (error) {
      console.warn("Failed to load configuration from storage:", error);
    }
  }

  /**
   * Сохранение конфигурации в хранилище
   */
  async saveToStorage(storageKey = "guitarCombatConfig") {
    try {
      const configToSave = {
        user: this.userConfig,
        version: this.get("app.version"),
        timestamp: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(configToSave));

      if (this.eventBus) {
        this.eventBus.emit(EventTypes.CONFIG_SAVED, {
          source: "storage",
          timestamp: Date.now(),
        });
      }
console.log("✅ Configuration saved to storage");
} catch (error) {
console.warn("Failed to save configuration to storage:", error);
}
}

/**
* Загрузка конфигурации из файла
*/
  async loadFromFile(file) {
    try {
      const text = await file.text();
      const config = JSON.parse(text);

      this.mergeConfig(config);

      if (this.eventBus) {
        this.eventBus.emit(EventTypes.CONFIG_LOADED, {
          source: "file",
          filename: file.name,
          timestamp: Date.now(),
        });
      }

      console.log("✅ Configuration loaded from file");
    } catch (error) {
      console.error("Failed to load configuration from file:", error);
      throw error;
    }
  }

  /**
   * Экспорт конфигурации
   */
  export(options = {}) {
    const {
      includeDefaults = false,
      includeRuntime = false,
      format = "json",
    } = options;

    let configToExport = {};

    if (includeDefaults) {
      configToExport = { ...this.config };
    } else {
      configToExport = {
        user: this.userConfig,
      };
    }

    if (includeRuntime) {
      configToExport.runtime = this.runtimeConfig;
    }

    configToExport.metadata = {
      version: this.get("app.version"),
      exportedAt: new Date().toISOString(),
      exportedBy: "Guitar Combat Config Manager",
    };

    switch (format) {
      case "json":
        return JSON.stringify(configToExport, null, 2);
      case "yaml":
        return this.convertToYaml(configToExport);
      default:
        return JSON.stringify(configToExport, null, 2);
    }
  }

  /**
   * Получение всей конфигурации
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Получение пользовательской конфигурации
   */
  getUserConfig() {
    return { ...this.userConfig };
  }

  /**
   * Получение конфигурации выполнения
   */
  getRuntimeConfig() {
    return { ...this.runtimeConfig };
  }

  /**
   * Получение схемы для пути
   */
  getSchemaForPath(path) {
    const pathParts = path.split(".");
    let current = this.configSchema;

    for (const part of pathParts) {
      if (current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * Получение значения по умолчанию
   */
  getDefaultValue(path) {
    const defaultConfig = this.createDefaultConfig();
    return this.getNestedValue(defaultConfig, path);
  }

  /**
   * Слияние конфигурации
   */
  mergeConfig(config) {
    this.config = this.deepMerge(this.config, config);
  }

  /**
   * Перестроение конфигурации
   */
  rebuildConfig() {
    const defaultConfig = this.createDefaultConfig();
    this.config = this.deepMerge(
      defaultConfig,
      this.userConfig,
      this.runtimeConfig
    );
  }

  /**
   * Уведомление наблюдателей
   */
  notifyWatchers(path, newValue, oldValue) {
    // Уведомляем прямых наблюдателей
    if (this.watchers.has(path)) {
      for (const watcher of this.watchers.get(path)) {
        try {
          watcher.callback(newValue, oldValue, path);
        } catch (error) {
          console.error("Config watcher error:", error);
        }
      }
    }

    // Уведомляем наблюдателей родительских путей
    const pathParts = path.split(".");
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join(".");

      if (this.watchers.has(parentPath)) {
        const parentValue = this.get(parentPath);

        for (const watcher of this.watchers.get(parentPath)) {
          if (watcher.options.deep) {
            try {
              watcher.callback(parentValue, undefined, parentPath);
            } catch (error) {
              console.error("Config watcher error:", error);
            }
          }
        }
      }
    }
  }

  /**
   * Настройка валидаторов
   */
  setupValidators() {
    this.validators.set("string", (value, schema) => {
      if (typeof value !== "string") {
        return false;
      }

      if (schema.enum && !schema.enum.includes(value)) {
        return false;
      }

      return true;
    });

    this.validators.set("number", (value, schema) => {
      if (typeof value !== "number" || isNaN(value)) {
        return false;
      }

      if (schema.min !== undefined && value < schema.min) {
        return false;
      }

      if (schema.max !== undefined && value > schema.max) {
        return false;
      }

      return true;
    });

    this.validators.set("boolean", (value) => {
      return typeof value === "boolean";
    });
  }

  /**
   * Настройка трансформеров
   */
  setupTransformers() {
    // Трансформер для громкости
    this.transformers.set("audio.volume", {
      get: (value) => Math.max(0, Math.min(1, value)),
      set: (value) => Math.max(0, Math.min(1, parseFloat(value))),
    });

    // Трансформер для темпа
    this.transformers.set("playback.defaultTempo", {
      get: (value) => Math.max(40, Math.min(300, parseInt(value))),
      set: (value) => Math.max(40, Math.min(300, parseInt(value))),
    });
  }

  /**
   * Получение вложенного значения
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Установка вложенного значения
   */
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
    return obj;
  }

  /**
   * Глубокое слияние объектов
   */
  deepMerge(...objects) {
    const result = {};

    for (const obj of objects) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (
            typeof obj[key] === "object" &&
            obj[key] !== null &&
            !Array.isArray(obj[key])
          ) {
            result[key] = this.deepMerge(result[key] || {}, obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }
    }

    return result;
  }

  /**
   * Преобразование в YAML
   */
  convertToYaml(obj) {
    // Упрощенное преобразование в YAML
    return JSON.stringify(obj, null, 2)
      .replace(/"/g, "")
      .replace(/,/g, "")
      .replace(/\{/g, "")
      .replace(/\}/g, "")
      .replace(/\[/g, "")
      .replace(/\]/g, "");
  }

  /**
   * Генерация ID наблюдателя
   */
  generateWatcherId() {
    return `watcher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Сохранение конфигурации (для совместимости)
   */
  persistConfig(path, value) {
    // В реальном приложении здесь будет сохранение в localStorage
    if (this.get("storage.autoSave")) {
      setTimeout(() => {
        this.saveToStorage();
      }, this.get("storage.autoSaveDelay"));
    }
  }
}

export default ConfigManager;