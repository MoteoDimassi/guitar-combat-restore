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
      // Сохраняем текущие слоги перед применением шаблона
      const currentSyllables = this.saveCurrentSyllables();

      // Загружаем данные шаблона
      const templateData = await this.loader.loadTemplate(templateName);

      // Используем ImportUtils для применения шаблона (уже готовый и протестированный алгоритм)
      // Передаем флаг isFromTemplate = true, чтобы аккорды не импортировались
      this.importUtils.importData(templateData, true);

      // Восстанавливаем слоги после применения шаблона
      this.restoreSyllables(currentSyllables);

      // Обновляем отображение аккордов после применения шаблона
      // Используем текущие аккорды пользователя (не из шаблона)
      setTimeout(() => {
        if (window.app && window.app.chordDisplay && window.app.metronome) {
          // Получаем аккорды из поля ввода пользователя
          const chordsInput = document.getElementById('chordsInput');
          if (chordsInput && chordsInput.value.trim()) {
            window.app.metronome.updateChords(chordsInput.value);
            const chords = window.app.metronome.getChords();
            if (chords && chords.length > 0) {
              window.app.chordDisplay.setChords(chords[0], chords[1] || chords[0]);
            } else {
              window.app.chordDisplay.setChords('--', '--');
            }
          } else {
            window.app.chordDisplay.setChords('--', '--');
          }
        }
      }, 100); // Небольшая задержка для гарантированного завершения importData
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
    // ДОБАВИТЬ: Не-блокирующее уведомление вместо alert
    this.showErrorNotification(message);
  }

  /**
   * Показать уведомление об ошибке
   * @param {string} message - сообщение об ошибке
   */
  showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000); // Показываем ошибки дольше
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
  }

  /**
   * Сохраняет текущие слоги перед применением шаблона
   * @returns {Array} массив сохранённых слогов
   */
  saveCurrentSyllables() {
    if (window.app && window.app.syllableDragDrop) {
      return window.app.syllableDragDrop.allSyllables ? [...window.app.syllableDragDrop.allSyllables] : [];
    }
    return [];
  }

  /**
   * Восстанавливает слоги после применения шаблона
   * @param {Array} syllables - массив слогов для восстановления
   */
  restoreSyllables(syllables) {
    if (!syllables || syllables.length === 0) return;
    
    if (window.app && window.app.syllableDragDrop) {
      // Восстанавливаем слоги в SyllableDragDrop
      window.app.syllableDragDrop.allSyllables = [...syllables];
      window.app.syllableDragDrop.saveSyllablesToStorage();
      
      // Перерисовываем слоги для текущего такта
      const currentBarIndex = window.app.state.currentBarIndex || 0;
      window.app.syllableDragDrop.renderBarSyllables(currentBarIndex);
    }
  }
}