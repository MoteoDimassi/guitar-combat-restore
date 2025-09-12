// Утилита для асинхронной загрузки JSON шаблонов боев
import { TemplateScanner } from './TemplateScanner.js';

export class TemplateLoader {
  constructor() {
    this.cache = new Map(); // Кэш для загруженных шаблонов
    this.scanner = new TemplateScanner();
  }

  /**
   * Получить правильный путь к файлам в зависимости от окружения
   * @returns {string} - base path
   */
  getBasePath() {
    if (typeof window === 'undefined') return '';
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDevelopment ? '' : './';
  }

  /**
   * Асинхронная загрузка JSON файла шаблона
   * @param {string} templateName - имя шаблона из manifest
   * @returns {Promise<Object>} - Promise с данными шаблона
   */
  async loadTemplate(templateName) {
    try {
      // Проверяем кэш сначала
      if (this.cache.has(templateName)) {
        return this.cache.get(templateName);
      }

      // Получаем информацию о шаблоне из manifest
      const templateInfo = await this.scanner.getTemplateByName(templateName);
      if (!templateInfo) {
        throw new Error(`Шаблон "${templateName}" не найден в manifest`);
      }

      const basePath = this.getBasePath();
      const filePath = `${basePath}templates/${templateInfo.file}`;

      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const templateData = await response.json();

      // Валидируем и нормализуем структуру данных
      const normalizedData = this.validateAndNormalizeTemplateData(templateData, templateInfo);

      // Кэшируем загруженный шаблон
      this.cache.set(templateName, normalizedData);

      return normalizedData;

    } catch (error) {
      console.error(`TemplateLoader: Ошибка загрузки шаблона "${templateName}":`, error);

      // Возвращаем fallback шаблон при ошибке
      return this.getFallbackTemplate(templateName);
    }
  }

  /**
   * Получить список доступных шаблонов через TemplateScanner
   * @returns {Promise<Array<string>>} - массив имен шаблонов
   */
  async getAvailableTemplates() {
    try {
      const templateNames = await this.scanner.getTemplateNames();
      return templateNames;

    } catch (error) {
      console.error('TemplateLoader: Ошибка получения списка шаблонов:', error);
      return [];
    }
  }

  /**
   * Валидация и нормализация структуры данных шаблона
   * @param {Object} data - данные шаблона для валидации
   * @param {Object} templateInfo - информация о шаблоне из manifest
   * @returns {Object} - нормализованные данные шаблона
   * @throws {Error} если структура некорректна
   */
  validateAndNormalizeTemplateData(data, templateInfo) {
    if (!data) {
      throw new Error('Шаблон пустой');
    }

    if (!data.beats || !Array.isArray(data.beats)) {
      throw new Error('Отсутствует или некорректный массив beats');
    }

    if (typeof data.bpm !== 'number' || data.bpm < 40 || data.bpm > 200) {
      throw new Error('Некорректное значение BPM (должно быть от 40 до 200)');
    }

    // Нормализуем поле count - если отсутствует, берем длину массива beats
    if (typeof data.count !== 'number') {
      data.count = data.beats.length;
    }

    if (data.count < 4 || data.count > 16) {
      throw new Error('Некорректное количество стрелок (должно быть от 4 до 16)');
    }

    if (data.beats.length !== data.count) {
      throw new Error(`Количество beats (${data.beats.length}) не соответствует count (${data.count})`);
    }

    // Нормализуем поле chords - если это строка, преобразуем в массив
    if (data.chords && typeof data.chords === 'string') {
      data.chords = [data.chords];
    }

    // Добавляем информацию из manifest
    data.name = templateInfo.name;
    data.description = templateInfo.description || '';

    return data;
  }

  /**
   * Получить fallback шаблон при ошибке загрузки
   * @param {string} templateName - имя шаблона
   * @returns {Object} - fallback шаблон
   */
  getFallbackTemplate(templateName) {
    console.warn(`TemplateLoader: Используем fallback шаблон для "${templateName}"`);

    return {
      description: `Fallback шаблон для "${templateName}"`,
      chords: "Am C G F",
      bpm: 90,
      count: 8,
      pattern: [1, 0, 1, 0, 1, 0, 0, 0],
      beats: [
        {"direction": "down", "play": true},
        {"direction": "up", "play": false},
        {"direction": "down", "play": true},
        {"direction": "up", "play": false},
        {"direction": "down", "play": true},
        {"direction": "up", "play": false},
        {"direction": "down", "play": false},
        {"direction": "up", "play": false}
      ]
    };
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache.clear();
    this.scanner.clearCache();
  }

  /**
   * Получить TemplateScanner для доступа к дополнительным методам
   * @returns {TemplateScanner} - экземпляр TemplateScanner
   */
  getScanner() {
    return this.scanner;
  }
}