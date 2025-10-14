/**
 * Класс для управления навигацией по тактам
 * Создает и управляет кнопками переключения между тактами
 */
export class BarNavigation {
  constructor() {
    this.prevButton = null;
    this.nextButton = null;
    this.container = null;
    this.currentBarIndex = 0;
    this.totalBars = 0;
    
    // Колбэки
    this.onBarChange = null;
    this.onNavigationUpdate = null;
    
    // Настройки стилей
    this.styles = {
      container: 'flex items-center gap-2',
      button: 'flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 hover:border-[#38e07b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      icon: 'w-5 h-5',
      activeButton: 'bg-[#38e07b] text-gray-950 border-[#38e07b]'
    };
  }

  /**
   * Инициализирует навигацию по тактам
   * @param {string} containerSelector - Селектор контейнера для кнопок (необязательно)
   */
  init(containerSelector = null) {
    // Ищем существующие кнопки в DOM
    this.prevButton = document.getElementById('prevLineBtn');
    this.nextButton = document.getElementById('nextLineBtn');
    
    if (!this.prevButton || !this.nextButton) {
      return;
    }

    this.bindEvents();
    this.updateNavigationState();
  }

  /**
   * Создает кнопки навигации
   */
  createNavigationButtons() {
    if (!this.container) return;

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Кнопка "Предыдущий такт"
    this.prevButton = document.createElement('button');
    this.prevButton.id = 'prevLineBtn';
    this.prevButton.className = this.styles.button;
    this.prevButton.title = 'Предыдущий такт';
    this.prevButton.innerHTML = `
      <svg class="${this.styles.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    `;

    // Кнопка "Следующий такт"
    this.nextButton = document.createElement('button');
    this.nextButton.id = 'nextLineBtn';
    this.nextButton.className = this.styles.button;
    this.nextButton.title = 'Следующий такт';
    this.nextButton.innerHTML = `
      <svg class="${this.styles.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    `;

    // Добавляем кнопки в контейнер
    this.container.appendChild(this.prevButton);
    this.container.appendChild(this.nextButton);

    // Привязываем события
    this.bindEvents();
  }

  /**
   * Привязывает события к кнопкам
   */
  bindEvents() {
    if (this.prevButton) {
      // Удаляем старые обработчики если есть
      this.prevButton.replaceWith(this.prevButton.cloneNode(true));
      this.prevButton = document.getElementById('prevLineBtn');
      this.prevButton.addEventListener('click', () => this.goToPreviousBar());
      // Привязан обработчик к кнопке "Предыдущий такт"
    }

    if (this.nextButton) {
      // Удаляем старые обработчики если есть
      this.nextButton.replaceWith(this.nextButton.cloneNode(true));
      this.nextButton = document.getElementById('nextLineBtn');
      this.nextButton.addEventListener('click', () => this.goToNextBar());
      // Привязан обработчик к кнопке "Следующий такт"
    }
  }

  /**
   * Переходит к предыдущему такту
   */
  goToPreviousBar() {
    if (this.currentBarIndex > 0) {
      this.currentBarIndex--;
      this.updateNavigationState();
      this.notifyBarChange();
    }
  }

  /**
   * Переходит к следующему такту
   */
  goToNextBar() {
    if (this.currentBarIndex < this.totalBars - 1) {
      this.currentBarIndex++;
      this.updateNavigationState();
      this.notifyBarChange();
    }
  }

  /**
   * Переходит к указанному такту
   * @param {number} barIndex - Индекс такта
   */
  goToBar(barIndex) {
    if (barIndex >= 0 && barIndex < this.totalBars) {
      this.currentBarIndex = barIndex;
      this.updateNavigationState();
      this.notifyBarChange();
    }
  }

  /**
   * Обновляет состояние кнопок навигации
   */
  updateNavigationState() {
    if (!this.prevButton || !this.nextButton) return;

    // Обновляем состояние кнопки "Предыдущий"
    const canGoPrev = this.currentBarIndex > 0;
    this.prevButton.disabled = !canGoPrev;
    this.prevButton.classList.toggle('opacity-50', !canGoPrev);
    this.prevButton.classList.toggle('cursor-not-allowed', !canGoPrev);

    // Обновляем состояние кнопки "Следующий"
    const canGoNext = this.currentBarIndex < this.totalBars - 1;
    this.nextButton.disabled = !canGoNext;
    this.nextButton.classList.toggle('opacity-50', !canGoNext);
    this.nextButton.classList.toggle('cursor-not-allowed', !canGoNext);

    // Обновляем заголовки кнопок
    this.prevButton.title = canGoPrev ? `Такт ${this.currentBarIndex}` : 'Первый такт';
    this.nextButton.title = canGoNext ? `Такт ${this.currentBarIndex + 2}` : 'Последний такт';

    // Уведомляем о обновлении навигации
    this.notifyNavigationUpdate();
  }

  /**
   * Устанавливает общее количество тактов
   * @param {number} totalBars - Общее количество тактов
   */
  setTotalBars(totalBars) {
    this.totalBars = Math.max(0, totalBars);
    
    // Проверяем, что текущий индекс не превышает общее количество
    if (this.currentBarIndex >= this.totalBars) {
      this.currentBarIndex = Math.max(0, this.totalBars - 1);
    }
    
    this.updateNavigationState();
  }

  /**
   * Устанавливает текущий индекс такта
   * @param {number} barIndex - Индекс такта
   */
  setCurrentBarIndex(barIndex) {
    if (barIndex >= 0 && barIndex < this.totalBars) {
      this.currentBarIndex = barIndex;
      this.updateNavigationState();
    }
  }

  /**
   * Получает текущий индекс такта
   * @returns {number} Текущий индекс такта
   */
  getCurrentBarIndex() {
    return this.currentBarIndex;
  }

  /**
   * Получает общее количество тактов
   * @returns {number} Общее количество тактов
   */
  getTotalBars() {
    return this.totalBars;
  }

  /**
   * Уведомляет о смене такта
   */
  notifyBarChange() {
    if (this.onBarChange) {
      this.onBarChange(this.currentBarIndex);
    }
  }

  /**
   * Уведомляет об обновлении навигации
   */
  notifyNavigationUpdate() {
    if (this.onNavigationUpdate) {
      this.onNavigationUpdate({
        currentBarIndex: this.currentBarIndex,
        totalBars: this.totalBars,
        canGoPrev: this.currentBarIndex > 0,
        canGoNext: this.currentBarIndex < this.totalBars - 1
      });
    }
  }

  /**
   * Устанавливает колбэк для смены такта
   * @param {Function} callback - Колбэк функция
   */
  setOnBarChange(callback) {
    this.onBarChange = callback;
  }

  /**
   * Устанавливает колбэк для обновления навигации
   * @param {Function} callback - Колбэк функция
   */
  setOnNavigationUpdate(callback) {
    this.onNavigationUpdate = callback;
  }

  /**
   * Показывает/скрывает навигацию
   * @param {boolean} visible - Видимость
   */
  setVisible(visible) {
    if (this.container) {
      this.container.style.display = visible ? 'flex' : 'none';
    }
  }

  /**
   * Обновляет стили кнопок
   * @param {Object} newStyles - Новые стили
   */
  updateStyles(newStyles) {
    this.styles = { ...this.styles, ...newStyles };
    
    if (this.prevButton && this.nextButton) {
      this.createNavigationButtons();
      this.updateNavigationState();
    }
  }

  /**
   * Получает состояние навигации
   * @returns {Object} Состояние навигации
   */
  getState() {
    return {
      currentBarIndex: this.currentBarIndex,
      totalBars: this.totalBars,
      canGoPrev: this.currentBarIndex > 0,
      canGoNext: this.currentBarIndex < this.totalBars - 1,
      isInitialized: this.container !== null && this.prevButton !== null && this.nextButton !== null
    };
  }

  /**
   * Очищает навигацию
   */
  clear() {
    this.currentBarIndex = 0;
    this.totalBars = 0;
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.prevButton = null;
    this.nextButton = null;
  }

  /**
   * Уничтожает навигацию
   */
  destroy() {
    this.clear();
    this.container = null;
    this.onBarChange = null;
    this.onNavigationUpdate = null;
  }
}
