/**
 * TemplateSetter - класс для управления шаблонами боя
 * Сканирует папку templates и заполняет выпадающий список шаблонами
 * При выборе шаблона применяет его паттерн к ArrowDisplay
 */
export class TemplateSetter {
  constructor() {
    this.templatesPath = 'templates/';
    this.manifest = null;
    this.templates = [];
    this.templatesSelect = null;
    this.templateManager = null;
    this.arrowDisplay = null;
  }

  /**
   * Инициализирует TemplateSetter
   * @param {TemplateManager} templateManager - менеджер шаблонов
   * @param {ArrowDisplay} arrowDisplay - дисплей стрелочек
   */
  async init(templateManager, arrowDisplay) {
    this.templateManager = templateManager;
    this.arrowDisplay = arrowDisplay;

    try {
      await this.loadManifest();
      await this.scanTemplates();
      console.log(`✅ TemplateSetter: загружено ${this.templates.length} шаблонов`);
    } catch (error) {
      console.error('❌ Ошибка инициализации TemplateSetter:', error);
    }
  }

  /**
   * Загружает манифест шаблонов
   */
  async loadManifest() {
    try {
      const response = await fetch(`${this.templatesPath}manifest.json`);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки манифеста: ${response.status}`);
      }

      this.manifest = await response.json();
    } catch (error) {
      console.error('❌ Ошибка загрузки манифеста:', error);
      // Создаём базовый манифест если загрузка не удалась
      this.manifest = {
        version: "2.0",
        templates: []
      };
    }
  }

  /**
   * Сканирует шаблоны из манифеста
   */
  async scanTemplates() {
    if (!this.manifest || !this.manifest.templates) {
      console.warn('⚠️ Манифест не содержит шаблонов');
      return;
    }

    this.templates = this.manifest.templates.filter(template =>
      template.formats && template.formats.includes('v2')
    );

    console.log(`📋 TemplateSetter: найдено ${this.templates.length} шаблонов v2 формата`);
  }

  /**
   * Привязывает селект шаблонов
   * @param {string} selector - селектор элемента select
   */
  bindTemplateSelect(selector) {
    this.templatesSelect = document.querySelector(selector);

    if (!this.templatesSelect) {
      console.error(`❌ Элемент select не найден: ${selector}`);
      return;
    }

    this.populateTemplateSelect();
    this.bindSelectEvents();
  }

  /**
   * Заполняет выпадающий список шаблонами
   */
  populateTemplateSelect() {
    if (!this.templatesSelect) return;

    // Очищаем список
    this.templatesSelect.innerHTML = '';

    // Добавляем плейсхолдер (disabled option)
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Выберите шаблон...';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.classList.add('template-placeholder');
    this.templatesSelect.appendChild(placeholderOption);

    // Добавляем разделители по категориям
    const categories = new Map();

    this.templates.forEach(template => {
      if (!categories.has(template.category)) {
        categories.set(template.category, []);
      }
      categories.get(template.category).push(template);
    });

    // Получаем названия категорий из манифеста
    const categoryNames = new Map();
    if (this.manifest && this.manifest.categories) {
      this.manifest.categories.forEach(cat => {
        categoryNames.set(cat.id, cat.name);
      });
    }

    // Добавляем опции по категориям
    categories.forEach((templates, categoryId) => {
      if (categoryNames.has(categoryId)) {
        // Добавляем разделитель категории
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryNames.get(categoryId);

        templates.forEach(template => {
          const option = document.createElement('option');
          option.value = template.id;
          option.textContent = template.name;
          option.title = template.description || '';
          optgroup.appendChild(option);
        });

        this.templatesSelect.appendChild(optgroup);
      }
    });

    console.log(`📝 TemplateSetter: заполнен список ${this.templates.length} шаблонами`);
  }

  /**
   * Привязывает события к селекту
   */
  bindSelectEvents() {
    if (!this.templatesSelect) return;

    this.templatesSelect.addEventListener('change', async (e) => {
      const templateId = e.target.value;
      if (templateId) {
        await this.applyTemplate(templateId);
      }
    });
  }

  /**
   * Применяет выбранный шаблон
   * @param {string} templateId - ID шаблона
   */
  async applyTemplate(templateId) {
    try {
      if (!this.templateManager) {
        throw new Error('TemplateManager не инициализирован');
      }

      console.log(`🎯 TemplateSetter: применяем шаблон ${templateId}`);

      // Загружаем данные шаблона
      const templateData = await this.templateManager.loadTemplate(templateId);

      // Применяем шаблон через TemplateManager (ImportStrumFromJSON сам покажет уведомления)
      await this.templateManager.applyTemplate(templateData);

      // Обновляем отображение селекта
      if (this.templatesSelect) {
        this.templatesSelect.value = templateId;
      }

      console.log(`✅ TemplateSetter: шаблон ${templateId} успешно применён`);

      // Вызываем событие применения шаблона
      if (this.onTemplateApplied) {
        this.onTemplateApplied(templateId, templateData);
      }

    } catch (error) {
      console.error(`❌ Ошибка применения шаблона ${templateId}:`, error);

      // Сбрасываем выбор в селекте при ошибке
      if (this.templatesSelect) {
        this.templatesSelect.value = '';
      }

      // ImportStrumFromJSON уже покажет уведомление об ошибке
    }
  }

  /**
   * Получает информацию о шаблоне
   * @param {string} templateId - ID шаблона
   * @returns {Object|null} Информация о шаблоне
   */
  getTemplateInfo(templateId) {
    return this.templates.find(template => template.id === templateId) || null;
  }

  /**
   * Получает список всех шаблонов
   * @returns {Array} Массив шаблонов
   */
  getAllTemplates() {
    return [...this.templates];
  }

  /**
   * Получает шаблоны по категории
   * @param {string} categoryId - ID категории
   * @returns {Array} Массив шаблонов категории
   */
  getTemplatesByCategory(categoryId) {
    return this.templates.filter(template => template.category === categoryId);
  }

  /**
   * Устанавливает callback для применения шаблона
   * @param {Function} callback - функция обратного вызова
   */
  setOnTemplateApplied(callback) {
    this.onTemplateApplied = callback;
  }

  /**
   * Показывает ошибку пользователю
   * @param {string} message - сообщение об ошибке
   */
  showError(message) {
    // Показываем ошибку через alert или другой способ
    alert(message);
  }

  /**
   * Обновляет список шаблонов (при изменении манифеста)
   */
  async refreshTemplates() {
    try {
      await this.loadManifest();
      await this.scanTemplates();
      this.populateTemplateSelect();
      console.log(`🔄 TemplateSetter: список шаблонов обновлён`);
    } catch (error) {
      console.error('❌ Ошибка обновления шаблонов:', error);
    }
  }

  /**
   * Получает текущий выбранный шаблон
   * @returns {string|null} ID выбранного шаблона
   */
  getCurrentTemplate() {
    return this.templatesSelect ? this.templatesSelect.value || null : null;
  }

  /**
   * Сбрасывает выбор шаблона
   */
  resetSelection() {
    if (this.templatesSelect) {
      this.templatesSelect.value = '';
    }
  }
}