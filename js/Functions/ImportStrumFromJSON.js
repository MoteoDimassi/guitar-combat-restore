/**
 * Класс для импорта настроек из JSON файла
 * Восстанавливает функциональность кнопки importJson
 */
export class ImportStrumFromJSON {
  constructor(app) {
    this.app = app;
    this.importInput = null;
  }

  /**
   * Инициализирует функциональность импорта
   */
  init() {
    this.createImportInput();
    this.bindImportEvents();
  }

  /**
   * Создает скрытый input для загрузки файлов
   */
  createImportInput() {
    // Удаляем существующий input если есть
    const existingInput = document.getElementById('importJsonInput');
    if (existingInput) {
      existingInput.remove();
    }

    // Создаем новый input
    this.importInput = document.createElement('input');
    this.importInput.type = 'file';
    this.importInput.id = 'importJsonInput';
    this.importInput.accept = 'application/json';
    this.importInput.style.display = 'none';

    this.importInput.addEventListener('change', async (e) => {
      await this.handleImport(e);
    });

    document.body.appendChild(this.importInput);
  }

  /**
   * Привязывает события импорта
   */
  bindImportEvents() {
    const importJsonBtn = document.getElementById('importJson');
    if (importJsonBtn) {
      importJsonBtn.addEventListener('click', () => {
        this.triggerImport();
      });
    }
  }

  /**
   * Запускает процесс импорта
   */
  triggerImport() {
    if (this.importInput) {
      this.importInput.click();
    }
  }

  /**
   * Обрабатывает импорт файла
   * @param {Event} event - Событие выбора файла
   */
  async handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await this.importData(data);
      } catch (error) {
        console.error('Ошибка при импорте JSON:', error);
        this.showErrorNotification('Ошибка при импорте файла: ' + error.message);
      }
    };
    reader.onerror = () => {
      this.showErrorNotification('Ошибка чтения файла');
    };
    reader.readAsText(file);

    // Сбрасываем input для возможности повторного импорта того же файла
    event.target.value = '';
  }

  /**
   * Импортирует данные из JSON
   * @param {Object} data - Данные для импорта
   */
  async importData(data) {
    if (!data || !data.settings) {
      this.showErrorNotification('Файл пуст или имеет неверный формат. Ожидается структура с полем "settings"');
      return;
    }

    try {
      console.log('🔄 Импорт данных:', data);

      await this.importSettings(data);

      // Финальное обновление отображения после всех настроек
      if (this.app.arrowDisplay) {
        this.app.arrowDisplay.updateDisplay();
      }

      this.showSuccessNotification('Настройки успешно импортированы!');
      console.log('✅ Импорт завершен успешно');

    } catch (error) {
      console.error('Ошибка при импорте данных:', error);
      this.showErrorNotification('Ошибка при импорте данных: ' + error.message);
    }
  }

  /**
   * Импортирует настройки из JSON
   * @param {Object} data - Данные для импорта
   */
  async importSettings(data) {
    const settings = data.settings;
    
    // 1. Импорт количества долей в такте (сначала устанавливаем количество стрелочек)
    if (settings.arrowsPerBar && this.app.arrowDisplay) {
      this.importBeatCount(settings.arrowsPerBar);
    }

    // 2. Импорт BPM
    if (settings.tempo && this.app.tempoManager) {
      this.importBPM(settings.tempo);
    }

    // 3. Импорт аккордов
    if (settings.chords && Array.isArray(settings.chords) && this.app.chordParser) {
      this.importChords(settings.chords);
    }

    // 4. Импорт статусов стрелочек из arrowStatuses (после установки количества)
    if (settings.arrowStatuses && Array.isArray(settings.arrowStatuses)) {
      await this.importArrowStatuses(settings.arrowStatuses);
    }

    // 5. Импорт стрелок из arrows (если нужно для дополнительной информации)
    if (settings.arrows && Array.isArray(settings.arrows) && this.app.arrowDisplay) {
      await this.importArrows(settings.arrows);
    }

    // 6. Импорт настроек тактов
    if (settings.bars && Array.isArray(settings.bars)) {
      await this.importBars(settings.bars);
    }
  }

  /**
   * Импортирует BPM
   * @param {number} bpm - Темп
   */
  importBPM(bpm) {
    if (this.app.tempoManager) {
      this.app.tempoManager.setTempo(bpm);
      console.log('🎵 BPM установлен:', bpm);
    }

    // Также обновляем DOM элементы напрямую
    const bpmSlider = document.getElementById('bpm');
    const bpmLabel = document.getElementById('bpmLabel');
    if (bpmSlider && bpmLabel) {
      bpmSlider.value = bpm;
      bpmLabel.textContent = bpm;
    }

    // Обновляем настройки приложения
    if (this.app.settings) {
      this.app.settings.bpm = bpm;
    }
  }

  /**
   * Импортирует аккорды
   * @param {string|Array} chords - Аккорды
   */
  importChords(chords) {
    let chordsString;
    if (Array.isArray(chords)) {
      chordsString = chords.join(' ');
    } else {
      chordsString = chords;
    }

    // Обновляем поле ввода аккордов
    const chordsInput = document.getElementById('chordsInput');
    if (chordsInput) {
      chordsInput.value = chordsString;
    }

    // Парсим аккорды через ChordParser
    if (this.app.chordParser) {
      this.app.chordParser.parseChords(chordsString);
      this.app.chordParser.buildChords();
    }

    // Обновляем ChordDisplay
    if (this.app.chordDisplay) {
      // Получаем валидные аккорды для отображения
      const validChords = this.app.chordParser.getValidChords();
      if (validChords && validChords.length > 0) {
        const firstChord = validChords[0].name;
        const secondChord = validChords[1] ? validChords[1].name : validChords[0].name;
        this.app.chordDisplay.updateDisplay(firstChord, secondChord);
      } else {
        this.app.chordDisplay.updateDisplay('--', '--');
      }
    }

    console.log('🎸 Аккорды импортированы:', chordsString);
  }


  /**
   * Импортирует статусы стрелочек из arrowStatuses
   * @param {Array} arrowStatuses - Массив статусов стрелочек
   */
  async importArrowStatuses(arrowStatuses) {
    if (!Array.isArray(arrowStatuses)) {
      console.warn('ArrowStatuses должны быть массивом');
      return;
    }

    // Импортируем PlayStatus один раз
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    // Извлекаем статусы из arrowStatuses и создаем объекты PlayStatus
    const playStatuses = arrowStatuses.map((statusData, index) => {
      let status;
      if (typeof statusData.status === 'number') {
        status = statusData.status;
      } else {
        status = 0; // По умолчанию не играть
      }
      
      return new PlayStatus(status);
    });

    // Устанавливаем статусы в ArrowDisplay
    if (this.app.arrowDisplay) {
      this.app.arrowDisplay.setAllPlayStatuses(playStatuses);
    }
  }

  /**
   * Импортирует стрелки из arrows
   * @param {Array} arrows - Массив стрелок
   */
  async importArrows(arrows) {
    if (!Array.isArray(arrows)) {
      console.warn('Arrows должны быть массивом');
      return;
    }

    // Импортируем PlayStatus один раз
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    // Извлекаем статусы из playStatus и создаем объекты PlayStatus
    const playStatuses = arrows.map(arrow => {
      let status;
      if (arrow.playStatus && typeof arrow.playStatus.status === 'number') {
        status = arrow.playStatus.status;
      } else {
        status = 0; // По умолчанию не играть
      }
      
      return new PlayStatus(status);
    });

    // Устанавливаем стрелки в ArrowDisplay
    if (this.app.arrowDisplay) {
      this.app.arrowDisplay.setAllPlayStatuses(playStatuses);
    }

    console.log('🎯 Стрелки импортированы из arrows:', playStatuses.length);
  }


  /**
   * Импортирует настройки тактов
   * @param {Array} bars - Массив тактов
   */
  async importBars(bars) {
    if (!Array.isArray(bars)) {
      console.warn('Bars должны быть массивом');
      return;
    }

    // Очищаем существующие такты
    this.app.bars = [];

    // Импортируем Bar из правильного модуля
    const { Bar } = await import('../Measure/Bar.js');
    
    // Создаем новые такты
    for (let index = 0; index < bars.length; index++) {
      const barData = bars[index];
      const bar = new Bar(index);
      // Здесь можно добавить логику восстановления тактов
      this.app.bars.push(bar);
    }

    console.log('📊 Такты импортированы:', bars.length);
  }

  /**
   * Импортирует количество долей в такте
   * @param {number} count - Количество долей
   */
  importBeatCount(count) {
    if (this.app.arrowDisplay) {
      this.app.arrowDisplay.setArrowCount(count);
    }

    // Обновляем настройки
    this.app.settings.beatCount = count;

    // Обновляем DOM элемент
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.value = count;
    }
  }

  /**
   * Показывает уведомление об успехе
   * @param {string} message - Сообщение
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Показывает уведомление об ошибке
   * @param {string} message - Сообщение
   */
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Показывает уведомление
   * @param {string} message - Сообщение
   * @param {string} type - Тип уведомления
   */
  showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}
