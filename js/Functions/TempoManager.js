/**
 * Менеджер управления темпом
 * Управляет ползунком, отображением и кнопками изменения темпа
 */
export class TempoManager {
  constructor() {
    // DOM элементы
    this.elements = {
      slider: null,           // Ползунок темпа
      label: null,            // Отображение значения темпа
      incrementBtn: null,     // Кнопка увеличения
      decrementBtn: null      // Кнопка уменьшения
    };
    
    // Настройки
    this.settings = {
      minBpm: 40,            // Минимальный темп
      maxBpm: 200,           // Максимальный темп
      defaultBpm: 90,        // Темп по умолчанию
      step: 1                // Шаг изменения
    };
    
    // Текущее значение
    this.currentBpm = this.settings.defaultBpm;
    
    // Колбэки
    this.callbacks = {
      onTempoChange: null    // Колбэк при изменении темпа
    };
    
    // Состояние инициализации
    this.isInitialized = false;
  }

  /**
   * Инициализирует менеджер темпа
   * @param {Object} options - Опции инициализации
   * @param {string} options.sliderSelector - Селектор ползунка
   * @param {string} options.labelSelector - Селектор отображения
   * @param {string} options.incrementSelector - Селектор кнопки увеличения
   * @param {string} options.decrementSelector - Селектор кнопки уменьшения
   */
  init(options = {}) {
    try {
      // Получаем DOM элементы
      this.elements.slider = document.getElementById('bpm');
      this.elements.label = document.getElementById('bpmLabel');
      this.elements.incrementBtn = document.getElementById('bpmIncrement');
      this.elements.decrementBtn = document.getElementById('bpmDecrement');
      
      // Проверяем наличие элементов
      const missingElements = [];
      Object.entries(this.elements).forEach(([key, element]) => {
        if (!element) {
          missingElements.push(key);
        }
      });
      
      if (missingElements.length > 0) {
        throw new Error(`Отсутствуют DOM элементы: ${missingElements.join(', ')}`);
      }
      
      // Привязываем события
      this.bindEvents();
      
      // Устанавливаем начальное значение
      this.setTempo(this.currentBpm);
      
      this.isInitialized = true;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Привязывает события к DOM элементам
   */
  bindEvents() {
    // Событие изменения ползунка
    this.elements.slider.addEventListener('input', (e) => {
      const newTempo = parseInt(e.target.value);
      this.setTempo(newTempo, false); // false - не обновлять ползунок
    });
    
    // Событие изменения ползунка (для лучшей совместимости)
    this.elements.slider.addEventListener('change', (e) => {
      const newTempo = parseInt(e.target.value);
      this.setTempo(newTempo, false);
    });
    
    // Кнопка увеличения
    this.elements.incrementBtn.addEventListener('click', () => {
      this.incrementTempo();
    });
    
    // Кнопка уменьшения
    this.elements.decrementBtn.addEventListener('click', () => {
      this.decrementTempo();
    });
    
  }

  /**
   * Устанавливает новый темп
   * @param {number} bpm - Новый темп
   * @param {boolean} updateSlider - Обновлять ли ползунок (по умолчанию true)
   */
  setTempo(bpm, updateSlider = true) {
    // Проверяем границы
    const clampedBpm = Math.max(this.settings.minBpm, Math.min(this.settings.maxBpm, bpm));
    
    if (clampedBpm !== this.currentBpm) {
      this.currentBpm = clampedBpm;
      
      // Обновляем ползунок
      if (updateSlider && this.elements.slider) {
        this.elements.slider.value = this.currentBpm;
      }
      
      // Обновляем отображение
      this.updateDisplay();
      
      // Вызываем колбэк
      if (this.callbacks.onTempoChange) {
        this.callbacks.onTempoChange(this.currentBpm);
      }
      
    }
  }

  /**
   * Увеличивает темп на один шаг
   */
  incrementTempo() {
    const newTempo = this.currentBpm + this.settings.step;
    this.setTempo(newTempo);
  }

  /**
   * Уменьшает темп на один шаг
   */
  decrementTempo() {
    const newTempo = this.currentBpm - this.settings.step;
    this.setTempo(newTempo);
  }

  /**
   * Обновляет отображение темпа
   */
  updateDisplay() {
    if (this.elements.label) {
      this.elements.label.textContent = this.currentBpm;
    }
  }

  /**
   * Получает текущий темп
   * @returns {number} Текущий темп в BPM
   */
  getTempo() {
    return this.currentBpm;
  }

  /**
   * Получает текущие настройки
   * @returns {Object} Настройки менеджера темпа
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Обновляет настройки
   * @param {Object} newSettings - Новые настройки
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Обновляем атрибуты ползунка если они изменились
    if (this.elements.slider) {
      this.elements.slider.min = this.settings.minBpm;
      this.elements.slider.max = this.settings.maxBpm;
    }
    
    // Проверяем, что текущий темп в допустимых границах
    if (this.currentBpm < this.settings.minBpm) {
      this.setTempo(this.settings.minBpm);
    } else if (this.currentBpm > this.settings.maxBpm) {
      this.setTempo(this.settings.maxBpm);
    }
    
  }

  /**
   * Устанавливает колбэк для изменения темпа
   * @param {Function} callback - Колбэк функция
   */
  setOnTempoChange(callback) {
    this.callbacks.onTempoChange = callback;
  }

  /**
   * Получает состояние инициализации
   * @returns {boolean} Инициализирован ли менеджер
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Получает текущее состояние менеджера
   * @returns {Object} Состояние менеджера
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentBpm: this.currentBpm,
      settings: { ...this.settings },
      elements: Object.keys(this.elements).reduce((acc, key) => {
        acc[key] = !!this.elements[key];
        return acc;
      }, {})
    };
  }

  /**
   * Сбрасывает темп к значению по умолчанию
   */
  reset() {
    this.setTempo(this.settings.defaultBpm);
  }

  /**
   * Уничтожает менеджер (удаляет события)
   */
  destroy() {
    if (this.elements.slider) {
      this.elements.slider.removeEventListener('input', this.handleSliderInput);
      this.elements.slider.removeEventListener('change', this.handleSliderChange);
    }
    
    if (this.elements.incrementBtn) {
      this.elements.incrementBtn.removeEventListener('click', this.handleIncrement);
    }
    
    if (this.elements.decrementBtn) {
      this.elements.decrementBtn.removeEventListener('click', this.handleDecrement);
    }
    
    this.isInitialized = false;
  }

  /**
   * Экспортирует состояние в JSON
   * @returns {Object} Состояние для сохранения
   */
  toJSON() {
    return {
      currentBpm: this.currentBpm,
      settings: { ...this.settings },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Импортирует состояние из JSON
   * @param {Object} data - Данные для загрузки
   */
  fromJSON(data) {
    if (data.currentBpm) {
      this.setTempo(data.currentBpm);
    }
    
    if (data.settings) {
      this.updateSettings(data.settings);
    }
    
  }
}

// Экспорт для использования в других модулях
export default TempoManager;
