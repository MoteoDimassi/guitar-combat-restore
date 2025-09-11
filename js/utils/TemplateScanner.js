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
        console.log('TemplateScanner: Используем кэшированный список шаблонов');
        return this.cache;
      }

      console.log('TemplateScanner: Загружаем список шаблонов из manifest.json');

      const fullPath = `${this.getBasePath()}${this.manifestPath}`;
      console.log('TemplateScanner: Полный путь к manifest:', fullPath);

      const response = await fetch(fullPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const manifest = await response.json();

      // Валидируем структуру manifest
      this.validateManifest(manifest);

      // Получаем список всех JSON файлов в директории templates
      const discoveredTemplates = await this.discoverTemplates();

      // Объединяем manifest с автоматически найденными шаблонами
      const mergedTemplates = this.mergeManifestWithDiscovered(manifest.templates, discoveredTemplates);

      // Кэшируем результат
      this.cache = mergedTemplates;
      this.templates = [...this.cache];

      console.log('TemplateScanner: Загружено', this.templates.length, 'шаблонов (', manifest.templates.length, 'из manifest +', discoveredTemplates.length, 'автоматически)');
      return this.templates;

    } catch (error) {
      console.error('TemplateScanner: Ошибка загрузки manifest:', error);

      // Fallback: сканируем директорию напрямую
      const discoveredTemplates = await this.discoverTemplates();
      if (discoveredTemplates.length > 0) {
        console.log('TemplateScanner: Используем автоматически найденные шаблоны как fallback');
        this.cache = discoveredTemplates;
        this.templates = [...this.cache];
        return this.templates;
      }

      // Последний fallback: hardcoded список
      return this.getFallbackTemplates();
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
        throw new Error(`Шаблон ${index}: отсутствует поле 'name'`);
      }
      if (!template.file) {
        throw new Error(`Шаблон ${index}: отсутствует поле 'file'`);
      }
      if (!template.id) {
        throw new Error(`Шаблон ${index}: отсутствует поле 'id'`);
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
   * Автоматическое обнаружение шаблонов в директории templates
   * @returns {Promise<Array<Object>>} - массив найденных шаблонов
   */
  async discoverTemplates() {
    const discoveredTemplates = [];
    const basePath = this.getBasePath();

    // Список потенциальных имен файлов шаблонов (без расширения)
    const potentialNames = [
      'блюз', 'рок', 'популярный', 'кастомный', 'Бой Пятёрка', 'Бой Восьмёрка',
      'custom', 'blues', 'rock', 'popular', 'boy-pyaterka', 'boy-vosmerka'
    ];

    console.log('TemplateScanner: Начинаем автоматическое обнаружение шаблонов');

    // Проверяем каждый потенциальный файл
    for (const name of potentialNames) {
      try {
        const fileName = `${name}.json`;
        const filePath = `${basePath}templates/${fileName}`;

        console.log(`TemplateScanner: Проверяем файл ${fileName}`);

        const response = await fetch(filePath, { method: 'HEAD' });

        if (response.ok) {
          console.log(`TemplateScanner: Найден файл ${fileName}`);

          // Загружаем содержимое файла для генерации метаданных
          const contentResponse = await fetch(filePath);
          if (contentResponse.ok) {
            const templateData = await contentResponse.json();

            // Генерируем метаданные для найденного шаблона
            const template = this.generateTemplateMetadata(name, fileName, templateData);
            discoveredTemplates.push(template);
          }
        }
      } catch (error) {
        // Файл не найден или ошибка - пропускаем
        console.log(`TemplateScanner: Файл ${name}.json не найден или ошибка загрузки`);
      }
    }

    console.log(`TemplateScanner: Автоматически обнаружено ${discoveredTemplates.length} шаблонов`);
    return discoveredTemplates;
  }

  /**
   * Генерация метаданных для автоматически найденного шаблона
   * @param {string} name - имя шаблона (латиницей)
   * @param {string} fileName - имя файла
   * @param {Object} templateData - данные шаблона
   * @returns {Object} - объект шаблона с метаданными
   */
  generateTemplateMetadata(name, fileName, templateData) {
    // Преобразуем имя файла в человеко-читаемое имя
    const displayName = this.fileNameToDisplayName(name);

    return {
      name: displayName,
      file: fileName,
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: this.generateDescription(templateData, displayName),
      autoDiscovered: true // метка для автоматически найденных шаблонов
    };
  }

  /**
   * Преобразование имени файла в отображаемое имя
   * @param {string} fileName - имя файла без расширения
   * @returns {string} - человеко-читаемое имя
   */
  fileNameToDisplayName(fileName) {
    const nameMap = {
      'блюз': 'Блюз',
      'рок': 'Рок',
      'популярный': 'Популярный',
      'кастомный': 'Кастомный',
      'Бой Пятёрка': 'Бой Пятёрка',
      'Бой Восьмёрка': 'Бой Восьмёрка',
      'boy-pyaterka': 'Бой Пятёрка',
      'boy-vosmerka': 'Бой Восьмёрка',
      'blues': 'Blues',
      'rock': 'Rock',
      'popular': 'Popular',
      'custom': 'Custom'
    };

    return nameMap[fileName] || fileName;
  }

  /**
   * Генерация описания на основе данных шаблона
   * @param {Object} templateData - данные шаблона
   * @param {string} displayName - отображаемое имя
   * @returns {string} - описание шаблона
   */
  generateDescription(templateData, displayName) {
    if (templateData.bpm && templateData.count) {
      return `${displayName} паттерн (${templateData.count} стрелок, ${templateData.bpm} BPM)`;
    }
    return `${displayName} паттерн боя`;
  }

  /**
   * Объединение шаблонов из manifest с автоматически найденными
   * @param {Array<Object>} manifestTemplates - шаблоны из manifest
   * @param {Array<Object>} discoveredTemplates - автоматически найденные шаблоны
   * @returns {Array<Object>} - объединенный список шаблонов
   */
  mergeManifestWithDiscovered(manifestTemplates, discoveredTemplates) {
    const merged = [...manifestTemplates];
    const manifestIds = new Set(manifestTemplates.map(t => t.id));

    console.log('TemplateScanner: Объединяем manifest с автоматически найденными шаблонами');

    // Добавляем новые шаблоны, которых нет в manifest
    for (const discovered of discoveredTemplates) {
      if (!manifestIds.has(discovered.id)) {
        console.log(`TemplateScanner: Добавляем новый шаблон "${discovered.name}" (автоматически найден)`);
        merged.push(discovered);
      } else {
        console.log(`TemplateScanner: Шаблон "${discovered.name}" уже есть в manifest`);
      }
    }

    // Удаляем из списка шаблоны, файлы которых больше не существуют
    const discoveredFiles = new Set(discoveredTemplates.map(t => t.file));
    const filtered = merged.filter(template => {
      if (template.autoDiscovered !== true && !discoveredFiles.has(template.file)) {
        console.log(`TemplateScanner: Удаляем шаблон "${template.name}" - файл ${template.file} не найден`);
        return false;
      }
      return true;
    });

    console.log(`TemplateScanner: Итоговый список: ${filtered.length} шаблонов`);
    return filtered;
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache = null;
    console.log('TemplateScanner: Кэш очищен');
  }
}