/**
 * Класс для отображения аккордов в поле chordDisplay
 * Показывает текущий аккорд большим зеленым шрифтом и следующий серым поменьше
 */
export class ChordDisplay {
  constructor() {
    this.container = null;
    this.currentChordElement = null;
    this.nextChordElement = null;
    this.currentChord = null;
    this.nextChord = null;
    
    // Настройки стилей
    this.styles = {
      currentChord: {
        fontSize: 'text-4xl md:text-5xl',
        fontWeight: 'font-bold',
        color: 'text-[#38e07b]'
      },
      nextChord: {
        fontSize: 'text-lg md:text-xl',
        fontWeight: 'font-medium',
        color: 'text-gray-400'
      },
      container: {
        classes: 'flex flex-row items-center justify-center text-center px-4 py-2 gap-4'
      }
    };
  }

  /**
   * Инициализирует отображение аккордов
   * @param {string} containerSelector - Селектор контейнера для отображения
   */
  init(containerSelector = '#chordDisplay') {
    this.container = document.querySelector(containerSelector);
    
    if (!this.container) {
      console.warn('⚠️ Контейнер для отображения аккордов не найден:', containerSelector);
      return;
    }

    this.createDisplayElements();
    this.updateDisplay();
    
    console.log('✅ ChordDisplay инициализирован');
  }

  /**
   * Создает DOM элементы для отображения аккордов
   */
  createDisplayElements() {
    if (!this.container) return;

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Создаем контейнер для аккордов
    const chordContainer = document.createElement('div');
    chordContainer.className = this.styles.container.classes;

    // Создаем элемент для текущего аккорда
    this.currentChordElement = document.createElement('div');
    this.currentChordElement.className = `${this.styles.currentChord.fontSize} ${this.styles.currentChord.fontWeight} ${this.styles.currentChord.color}`;
    this.currentChordElement.textContent = '';

    // Создаем элемент для следующего аккорда
    this.nextChordElement = document.createElement('div');
    this.nextChordElement.className = `${this.styles.nextChord.fontSize} ${this.styles.nextChord.fontWeight} ${this.styles.nextChord.color}`;
    this.nextChordElement.textContent = '';

    // Добавляем элементы в контейнер
    chordContainer.appendChild(this.currentChordElement);
    chordContainer.appendChild(this.nextChordElement);

    // Добавляем контейнер в основной элемент
    this.container.appendChild(chordContainer);
  }

  /**
   * Обновляет отображение аккордов
   * @param {string|string[]} currentChord - Текущий аккорд или массив аккордов
   * @param {string|string[]} nextChord - Следующий аккорд или массив аккордов (опционально)
   */
  updateDisplay(currentChord = null, nextChord = null) {
    if (currentChord !== null) {
      this.currentChord = Array.isArray(currentChord) ? currentChord.join(' / ') : currentChord;
    }
    
    if (nextChord !== null) {
      this.nextChord = Array.isArray(nextChord) ? nextChord.join(' / ') : nextChord;
    }

    if (!this.container || !this.currentChordElement || !this.nextChordElement) {
      return;
    }

    // Обновляем текущий аккорд
    if (this.currentChord) {
      this.currentChordElement.textContent = this.currentChord;
      this.currentChordElement.style.display = 'block';
    } else {
      this.currentChordElement.style.display = 'none';
    }

    // Обновляем следующий аккорд
    if (this.nextChord && this.nextChord !== this.currentChord) {
      this.nextChordElement.textContent = `→ ${this.nextChord}`;
      this.nextChordElement.style.display = 'block';
    } else {
      this.nextChordElement.style.display = 'none';
    }

    console.log('🎵 Аккорды обновлены:', {
      текущий: this.currentChord,
      следующий: this.nextChord
    });
  }

  /**
   * Устанавливает только текущий аккорд
   * @param {string} chord - Название аккорда
   */
  setCurrentChord(chord) {
    this.updateDisplay(chord, this.nextChord);
  }

  /**
   * Устанавливает только следующий аккорд
   * @param {string} chord - Название аккорда
   */
  setNextChord(chord) {
    this.updateDisplay(this.currentChord, chord);
  }

  /**
   * Очищает отображение аккордов
   */
  clear() {
    this.currentChord = null;
    this.nextChord = null;
    this.updateDisplay();
  }

  /**
   * Получает текущий аккорд
   * @returns {string|null} Текущий аккорд
   */
  getCurrentChord() {
    return this.currentChord;
  }

  /**
   * Получает следующий аккорд
   * @returns {string|null} Следующий аккорд
   */
  getNextChord() {
    return this.nextChord;
  }

  /**
   * Обновляет стили отображения
   * @param {Object} newStyles - Новые стили
   */
  updateStyles(newStyles) {
    this.styles = { ...this.styles, ...newStyles };
    
    if (this.currentChordElement && this.nextChordElement) {
      this.createDisplayElements();
      this.updateDisplay();
    }
  }

  /**
   * Показывает/скрывает отображение аккордов
   * @param {boolean} visible - Видимость
   */
  setVisible(visible) {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Проверяет, инициализирован ли отображение
   * @returns {boolean} true если инициализирован
   */
  isInitialized() {
    return this.container !== null && this.currentChordElement !== null && this.nextChordElement !== null;
  }

  /**
   * Получает состояние отображения
   * @returns {Object} Состояние отображения
   */
  getState() {
    return {
      isInitialized: this.isInitialized(),
      currentChord: this.currentChord,
      nextChord: this.nextChord,
      containerExists: this.container !== null,
      styles: { ...this.styles }
    };
  }

  /**
   * Уничтожает отображение аккордов
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.container = null;
    this.currentChordElement = null;
    this.nextChordElement = null;
    this.currentChord = null;
    this.nextChord = null;
    
    console.log('🗑️ ChordDisplay уничтожен');
  }
}
