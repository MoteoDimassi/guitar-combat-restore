// Менеджер шаблонов боев - отвечает за загрузку, управление и применение шаблонов
import { TemplateLoader } from '../utils/TemplateLoader.js';
import { ImportUtils } from '../utils/ImportUtils.js';

export class TemplateManager {
  constructor(beatRow, controls) {
    this.beatRow = beatRow;
    this.controls = controls;
    this.loader = new TemplateLoader();
    this.importUtils = new ImportUtils(beatRow);
    this.templatesSelect = null;
    this.availableTemplates = [];
  }

  /**
   * Инициализация менеджера шаблонов
   */
  async init() {
    console.log('TemplateManager: Инициализация...');
    this.templatesSelect = document.getElementById('templates-select');

    if (!this.templatesSelect) {
      console.warn('TemplateManager: Элемент templates-select не найден');
      return;
    }

    try {
      // Получаем список доступных шаблонов
      await this.loadAvailableTemplates();

      // Заполняем селект шаблонами
      this.populateTemplatesSelect();

      // Привязываем обработчик события
      this.bindTemplateEvents();

      console.log('TemplateManager: Инициализация завершена успешно');
    } catch (error) {
      console.error('TemplateManager: Ошибка инициализации:', error);
    }
  }

  /**
   * Загрузка списка доступных шаблонов
   */
  async loadAvailableTemplates() {
    try {
      this.availableTemplates = await this.loader.getAvailableTemplates();
      console.log('TemplateManager: Загружены шаблоны:', this.availableTemplates);
    } catch (error) {
      console.error('TemplateManager: Ошибка загрузки списка шаблонов:', error);
      // Используем hardcoded список как fallback
      this.availableTemplates = ['популярный', 'блюз', 'рок', 'кастомный'];
    }
  }

  /**
   * Заполнение селекта шаблонов
   */
  populateTemplatesSelect() {
    if (!this.templatesSelect) return;

    // Очищаем существующие опции
    this.templatesSelect.innerHTML = '';

    // Добавляем опцию по умолчанию
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Выберите шаблон';
    this.templatesSelect.appendChild(defaultOption);

    // Добавляем шаблоны
    this.availableTemplates.forEach(templateName => {
      const option = document.createElement('option');
      option.value = templateName;
      option.textContent = this.formatTemplateName(templateName);
      this.templatesSelect.appendChild(option);
    });

    console.log('TemplateManager: Селект шаблонов заполнен', this.availableTemplates.length, 'шаблонами');
  }

  /**
   * Форматирование имени шаблона для отображения
   * @param {string} templateName - имя шаблона
   * @returns {string} - отформатированное имя
   */
  formatTemplateName(templateName) {
    // Можно добавить дополнительное форматирование здесь
    return templateName.charAt(0).toUpperCase() + templateName.slice(1);
  }

  /**
   * Привязка обработчиков событий
   */
  bindTemplateEvents() {
    if (!this.templatesSelect) return;

    this.templatesSelect.addEventListener('change', async (e) => {
      const selectedTemplate = e.target.value;
      if (selectedTemplate) {
        await this.applyTemplate(selectedTemplate);
      }
    });
  }

  /**
   * Применение выбранного шаблона
   * @param {string} templateName - имя шаблона для применения
   */
  async applyTemplate(templateName) {
    try {
      console.log(`TemplateManager: Применяем шаблон "${templateName}"`);

      // Загружаем данные шаблона
      const templateData = await this.loader.loadTemplate(templateName);

      // Используем ImportUtils для применения шаблона (уже готовый и протестированный алгоритм)
      console.log('TemplateManager: Используем ImportUtils для применения шаблона');
      this.importUtils.importData(templateData);

      console.log(`TemplateManager: Шаблон "${templateName}" успешно применен`);
    } catch (error) {
      console.error(`TemplateManager: Ошибка применения шаблона "${templateName}":`, error);
      this.showError(`Не удалось загрузить шаблон "${templateName}". ${error.message}`);
    }
  }


  /**
   * Показать сообщение об ошибке
   * @param {string} message - сообщение об ошибке
   */
  showError(message) {
    // Можно заменить на более красивый уведомление
    alert(message);
  }

  /**
   * Получить список доступных шаблонов
   * @returns {Array<string>} - массив имен шаблонов
   */
  getAvailableTemplates() {
    return [...this.availableTemplates];
  }


  /**
   * Очистить кэш всех шаблонов
   */
  clearCache() {
    this.loader.clearCache();
    this.availableTemplates = [];
    console.log('TemplateManager: Кэш очищен');
  }
}