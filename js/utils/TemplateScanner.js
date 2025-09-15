// Утилита для сканирования и получения списка доступных шаблонов
export class TemplateScanner {
  constructor() {
    this.manifestPath = 'templates/manifest.json';
    this.templates = [];
    this.cache = null;
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
   * Асинхронная загрузка списка доступных шаблонов из manifest.json
   * @returns {Promise<Array<Object>>} - массив объектов шаблонов
   */
  async scanTemplates() {
    try {
      // Проверяем кэш сначала
      if (this.cache) {
        return this.cache;
      }

      const fullPath = `${this.getBasePath()}${this.manifestPath}`;

      const response = await fetch(fullPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const manifest = await response.json();

      // Валидируем структуру manifest
      this.validateManifest(manifest);

      // Кэшируем результат
      this.cache = manifest.templates;
      this.templates = [...this.cache];

      return this.templates;

    } catch (error) {
      console.error('TemplateScanner: Ошибка загрузки manifest:', error);

      // Fallback: используем hardcoded список
      this.cache = this.getFallbackTemplates();
      this.templates = [...this.cache];
      return this.templates;
    }
  }

  /**
   * Получить список имен шаблонов для отображения
   * @returns {Promise<Array<string>>} - массив имен шаблонов
   */
  async getTemplateNames() {
    const templates = await this.scanTemplates();
    return templates.map(template => template.name);
  }

  /**
   * Получить шаблон по имени
   * @param {string} name - имя шаблона
   * @returns {Promise<Object|null>} - объект шаблона или null
   */
  async getTemplateByName(name) {
    const templates = await this.scanTemplates();
    return templates.find(template => template.name === name) || null;
  }

  /**
   * Получить шаблон по ID
   * @param {string} id - ID шаблона
   * @returns {Promise<Object|null>} - объект шаблона или null
   */
  async getTemplateById(id) {
    const templates = await this.scanTemplates();
    return templates.find(template => template.id === id) || null;
  }

  /**
   * Валидация структуры manifest файла
   * @param {Object} manifest - загруженный manifest
   * @throws {Error} если структура некорректна
   */
  validateManifest(manifest) {
    if (!manifest) {
      throw new Error('Manifest пустой');
    }

    if (!manifest.templates || !Array.isArray(manifest.templates)) {
      throw new Error('Отсутствует или некорректный массив templates в manifest');
    }

    // Проверяем каждый шаблон
    manifest.templates.forEach((template, index) => {
      if (!template.name) {
        console.warn(`Шаблон ${index}: отсутствует поле 'name'`);
      }
      if (!template.file) {
        throw new Error(`Шаблон ${index}: отсутствует поле 'file'`);
      }
      if (!template.id) {
        console.warn(`Шаблон ${index}: отсутствует поле 'id'`);
      }
    });
  }

  /**
   * Получить fallback список шаблонов при ошибке загрузки manifest
   * @returns {Array<Object>} - массив шаблонов по умолчанию
   */
  getFallbackTemplates() {
    console.warn('TemplateScanner: Используем fallback список шаблонов');
    return [
      {
        name: 'Популярный',
        file: 'популярный.json',
        id: 'popular',
        description: 'Популярный паттерн для начинающих'
      },
      {
        name: 'Блюз',
        file: 'блюз.json',
        id: 'blues',
        description: 'Блюзовый паттерн'
      },
      {
        name: 'Рок',
        file: 'рок.json',
        id: 'rock',
        description: 'Роковый паттерн'
      },
      {
        name: 'Кастомный',
        file: 'кастомный.json',
        id: 'custom',
        description: 'Кастомный паттерн'
      }
    ];
  }


  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache = null;
  }
}