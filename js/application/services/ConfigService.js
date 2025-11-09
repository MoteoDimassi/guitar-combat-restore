import { ConfigManager } from "../../core/ConfigManager.js";
import { EnvironmentDetector } from "../../core/EnvironmentDetector.js";
import { EventTypes } from "../../core/EventTypes.js";

export class ConfigService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.configManager = new ConfigManager(eventBus);
    this.environmentDetector = new EnvironmentDetector();

    this.initialize();
  }

  /**
   * Инициализация сервиса конфигурации
   */
  async initialize() {
    try {
      console.log("⚙️ Initializing ConfigService...");

      // Определяем окружение
      const environment = this.environmentDetector.getDetected();
      console.log("🔍 Environment detected:", environment);

      // Адаптируем конфигурацию под окружение
      this.adaptConfiguration(environment);

      // Загружаем сохраненную конфигурацию
      await this.configManager.loadFromStorage();

      // Настраиваем наблюдателей
      this.setupWatchers();

      console.log("✅ ConfigService initialized");
    } catch (error) {
      console.error("❌ ConfigService initialization failed:", error);
      throw error;
    }
  }

  /**
   * Адаптация конфигурации под окружение
   */
  adaptConfiguration(environment) {
    const adaptedConfig = this.environmentDetector.getAdaptedConfig(
      this.configManager.getAll()
    );

    this.configManager.update(adaptedConfig, { scope: "runtime" });
  }

  /**
   * Настройка наблюдателей
   */
  setupWatchers() {
    // Наблюдение за изменениями аудио настроек
    this.configManager.watch("audio.volume", (volume) => {
      console.log("Audio volume changed:", volume);
      this.eventBus.emit("audio:volume:changed", { volume });
    });

    // Наблюдение за изменениями UI настроек
    this.configManager.watch("ui.theme", (theme) => {
      console.log("Theme changed:", theme);
      this.applyTheme(theme);
    });

    // Наблюдение за изменениями настроек воспроизведения
    this.configManager.watch("playback.defaultTempo", (tempo) => {
      console.log("Default tempo changed:", tempo);
      this.eventBus.emit("tempo:default:changed", { tempo });
    });
  }

  /**
   * Применение темы
   */
  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
    }
  }

  /**
   * Получение конфигурации
   */
  get(path, defaultValue) {
    return this.configManager.get(path, defaultValue);
  }

  /**
   * Установка конфигурации
   */
  set(path, value, options = {}) {
    return this.configManager.set(path, value, options);
  }

  /**
   * Наблюдение за изменениями
   */
  watch(path, callback, options = {}) {
    return this.configManager.watch(path, callback, options);
  }

  /**
   * Сохранение конфигурации
   */
  async save() {
    return this.configManager.saveToStorage();
  }

  /**
   * Экспорт конфигурации
   */
  export(options = {}) {
    return this.configManager.export(options);
  }

  /**
   * Импорт конфигурации
   */
  async import(file) {
    return this.configManager.loadFromFile(file);
  }

  /**
   * Сброс конфигурации
   */
  reset(path = null) {
    return this.configManager.reset(path);
  }

  /**
   * Получение информации об окружении
   */
  getEnvironment() {
    return this.environmentDetector.getDetected();
  }

  /**
   * Получение всей конфигурации
   */
  getAll() {
    return this.configManager.getAll();
  }

  /**
   * Получение пользовательской конфигурации
   */
  getUserConfig() {
    return this.configManager.getUserConfig();
  }

  /**
   * Получение конфигурации выполнения
   */
  getRuntimeConfig() {
    return this.configManager.getRuntimeConfig();
  }

  /**
   * Обновление нескольких значений конфигурации
   */
  update(updates, options = {}) {
    return this.configManager.update(updates, options);
  }

  /**
   * Валидация значения конфигурации
   */
  validateValue(path, value) {
    return this.configManager.validateValue(path, value);
  }

  /**
   * Получение схемы конфигурации для пути
   */
  getSchemaForPath(path) {
    return this.configManager.getSchemaForPath(path);
  }

  /**
   * Получение значения по умолчанию
   */
  getDefaultValue(path) {
    return this.configManager.getDefaultValue(path);
  }

  /**
   * Применение конфигурации аудио
   */
  applyAudioConfig() {
    const audioConfig = this.get("audio");
    
    // Применяем настройки аудио к аудио движку
    if (this.eventBus) {
      this.eventBus.emit("audio:config:changed", audioConfig);
    }
  }

  /**
   * Применение конфигурации воспроизведения
   */
  applyPlaybackConfig() {
    const playbackConfig = this.get("playback");
    
    // Применяем настройки воспроизведения
    if (this.eventBus) {
      this.eventBus.emit("playback:config:changed", playbackConfig);
    }
  }

  /**
   * Применение конфигурации UI
   */
  applyUIConfig() {
    const uiConfig = this.get("ui");
    
    // Применяем настройки UI
    this.applyTheme(uiConfig.theme);
    
    // Применяем другие настройки UI
    document.documentElement.setAttribute("data-animations", uiConfig.animations);
    document.documentElement.setAttribute("data-compact-mode", uiConfig.compactMode);
    
    if (this.eventBus) {
      this.eventBus.emit("ui:config:changed", uiConfig);
    }
  }

  /**
   * Применение всей конфигурации
   */
  applyAllConfig() {
    this.applyAudioConfig();
    this.applyPlaybackConfig();
    this.applyUIConfig();
  }

  /**
   * Создание пресета конфигурации
   */
  createPreset(name, config) {
    const presets = this.get("presets", {});
    presets[name] = {
      ...config,
      createdAt: Date.now(),
      version: this.get("app.version"),
    };
    
    this.set("presets", presets, { persist: true });
  }

  /**
   * Загрузка пресета конфигурации
   */
  loadPreset(name) {
    const presets = this.get("presets", {});
    const preset = presets[name];
    
    if (preset) {
      this.update(preset, { persist: true });
      return true;
    }
    
    return false;
  }

  /**
   * Удаление пресета конфигурации
   */
  deletePreset(name) {
    const presets = this.get("presets", {});
    
    if (presets[name]) {
      delete presets[name];
      this.set("presets", presets, { persist: true });
      return true;
    }
    
    return false;
  }

  /**
   * Получение списка пресетов
   */
  getPresets() {
    return this.get("presets", {});
  }

  /**
   * Сброс к настройкам по умолчанию
   */
  resetToDefaults() {
    this.reset();
    this.applyAllConfig();
  }

  /**
   * Получение статистики использования конфигурации
   */
  getConfigStats() {
    return {
      totalKeys: this.countConfigKeys(this.getAll()),
      userKeys: this.countConfigKeys(this.getUserConfig()),
      runtimeKeys: this.countConfigKeys(this.getRuntimeConfig()),
      environment: this.getEnvironment(),
      lastModified: this.get("lastModified"),
    };
  }

  /**
   * Подсчет ключей в конфигурации
   */
  countConfigKeys(obj, count = 0) {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        count = this.countConfigKeys(obj[key], count);
      } else {
        count++;
      }
    }
    return count;
  }
}

export default ConfigService;