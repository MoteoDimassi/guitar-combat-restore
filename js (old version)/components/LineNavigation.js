/**
 * @fileoverview Компонент для навигации между строками (тактами).
 * Добавляет кнопки перехода на следующую/предыдущую строку.
 */

/**
 * Класс LineNavigation - управляет кнопками навигации между строками
 */
export class LineNavigation {
  constructor(barManager, barSyllableDisplay) {
    this.barManager = barManager;
    this.barSyllableDisplay = barSyllableDisplay;
    this.prevButton = null;
    this.nextButton = null;
    this.buttonsCreated = false;
  }

  /**
   * Инициализация компонента
   */
  init() {
    // Проверяем, есть ли текст песни
    this.updateVisibility();
  }

  /**
   * Создаёт кнопки навигации
   */
  createButtons() {
    if (this.buttonsCreated) return;

    // Находим контейнер с кнопкой воспроизведения
    const playButtonContainer = document.querySelector('.absolute.bottom-6');
    if (!playButtonContainer) return;

    // Создаём контейнер для кнопок навигации
    const navContainer = document.createElement('div');
    navContainer.className = 'line-navigation-container';
    navContainer.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;
      z-index: 5;
    `;

    // Кнопка "Предыдущая строка"
    this.prevButton = document.createElement('button');
    this.prevButton.id = 'prevLineBtn';
    this.prevButton.className = 'line-nav-btn';
    this.prevButton.innerHTML = `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    `;
    this.prevButton.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #1f2937;
      color: white;
      border: 2px solid #374151;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    `;
    this.prevButton.addEventListener('mouseenter', () => {
      this.prevButton.style.backgroundColor = '#374151';
      this.prevButton.style.borderColor = '#38e07b';
      this.prevButton.style.transform = 'scale(1.1)';
    });
    this.prevButton.addEventListener('mouseleave', () => {
      this.prevButton.style.backgroundColor = '#1f2937';
      this.prevButton.style.borderColor = '#374151';
      this.prevButton.style.transform = 'scale(1)';
    });
    this.prevButton.addEventListener('click', () => {
      this.previousLine();
    });

    // Кнопка "Следующая строка"
    this.nextButton = document.createElement('button');
    this.nextButton.id = 'nextLineBtn';
    this.nextButton.className = 'line-nav-btn';
    this.nextButton.innerHTML = `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    `;
    this.nextButton.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #1f2937;
      color: white;
      border: 2px solid #374151;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    `;
    this.nextButton.addEventListener('mouseenter', () => {
      this.nextButton.style.backgroundColor = '#374151';
      this.nextButton.style.borderColor = '#38e07b';
      this.nextButton.style.transform = 'scale(1.1)';
    });
    this.nextButton.addEventListener('mouseleave', () => {
      this.nextButton.style.backgroundColor = '#1f2937';
      this.nextButton.style.borderColor = '#374151';
      this.nextButton.style.transform = 'scale(1)';
    });
    this.nextButton.addEventListener('click', () => {
      this.nextLine();
    });

    // Добавляем кнопки в контейнер
    navContainer.appendChild(this.prevButton);
    
    // Добавляем плейсхолдер для кнопки воспроизведения (она уже существует)
    const placeholder = document.createElement('div');
    placeholder.style.width = '64px';
    navContainer.appendChild(placeholder);
    
    navContainer.appendChild(this.nextButton);

    // Вставляем контейнер в родительский элемент
    const parent = playButtonContainer.parentElement;
    parent.insertBefore(navContainer, playButtonContainer);

    // Перемещаем кнопку воспроизведения в середину
    placeholder.appendChild(playButtonContainer.querySelector('#toggleBtn'));

    this.buttonsCreated = true;
    this.updateButtonStates();
  }

  /**
   * Удаляет кнопки навигации
   */
  removeButtons() {
    const navContainer = document.querySelector('.line-navigation-container');
    if (navContainer) {
      // Возвращаем кнопку воспроизведения на место
      const playButton = navContainer.querySelector('#toggleBtn');
      if (playButton) {
        const originalContainer = document.querySelector('.absolute.bottom-6');
        if (originalContainer) {
          originalContainer.appendChild(playButton);
        }
      }
      
      navContainer.remove();
      this.buttonsCreated = false;
      this.prevButton = null;
      this.nextButton = null;
    }
  }

  /**
   * Переход к следующей строке
   */
  nextLine() {
    if (this.barSyllableDisplay) {
      this.barSyllableDisplay.nextLine();
      this.updateButtonStates();
    }
  }

  /**
   * Переход к предыдущей строке
   */
  previousLine() {
    if (this.barSyllableDisplay) {
      this.barSyllableDisplay.previousLine();
      this.updateButtonStates();
    }
  }

  /**
   * Обновляет состояние кнопок (активность/неактивность)
   */
  updateButtonStates() {
    if (!this.prevButton || !this.nextButton) return;

    const currentBarIndex = this.barSyllableDisplay.getCurrentBarIndex();
    const totalBars = this.barManager.getBarCount();

    // Деактивируем кнопку "Назад" если на первом такте
    if (currentBarIndex === 0) {
      this.prevButton.disabled = true;
      this.prevButton.style.opacity = '0.3';
      this.prevButton.style.cursor = 'not-allowed';
    } else {
      this.prevButton.disabled = false;
      this.prevButton.style.opacity = '1';
      this.prevButton.style.cursor = 'pointer';
    }

    // Деактивируем кнопку "Вперёд" если на последнем такте
    if (currentBarIndex >= totalBars - 1) {
      this.nextButton.disabled = true;
      this.nextButton.style.opacity = '0.3';
      this.nextButton.style.cursor = 'not-allowed';
    } else {
      this.nextButton.disabled = false;
      this.nextButton.style.opacity = '1';
      this.nextButton.style.cursor = 'pointer';
    }
  }

  /**
   * Обновляет видимость кнопок в зависимости от наличия текста песни
   */
  updateVisibility() {
    const hasSongText = this.hasSongText();

    if (hasSongText && !this.buttonsCreated) {
      this.createButtons();
    } else if (!hasSongText && this.buttonsCreated) {
      this.removeButtons();
    }

    if (this.buttonsCreated) {
      this.updateButtonStates();
    }
  }

  /**
   * Проверяет наличие текста песни
   */
  hasSongText() {
    try {
      const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
      return songs.length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Показывает кнопки навигации
   */
  show() {
    if (!this.buttonsCreated) {
      this.createButtons();
    }
    this.updateButtonStates();
  }

  /**
   * Скрывает кнопки навигации
   */
  hide() {
    if (this.buttonsCreated) {
      this.removeButtons();
    }
  }
}

