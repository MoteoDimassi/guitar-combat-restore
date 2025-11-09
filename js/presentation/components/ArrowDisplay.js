class ArrowDisplay {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.arrows = [];
    this.currentBeat = 0;
    this.isPlaying = false;
    // Массив направлений стрелок для каждого бита (по умолчанию чередуем вниз/вверх)
    this.arrowDirections = ['down', 'up', 'down', 'up', 'down', 'up', 'down', 'up'];
  }

  async initialize() {
    if (!this.container) {
      console.warn('ArrowDisplay: Container not found');
      return;
    }
    
    this.init();
    this.subscribeToEvents();
  }

  init() {
    // Создаем 8 элементов для стрелок (как в образце)
    let arrowsHTML = '';
    for (let i = 0; i < 8; i++) {
      arrowsHTML += `
        <div class="flex flex-col items-center gap-2 select-none flex-shrink-0 beat-wrapper-medium">
          <div class="arrow-container" data-beat="${i}">
            ${this.getArrowSVG(i)}
          </div>
          <div class="circle-container">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5"></circle>
            </svg>
          </div>
          <div class="syllable-drop-zone hidden" data-arrow-index="${i}" style="display: none;"></div>
        </div>
      `;
    }
    
    this.container.innerHTML = arrowsHTML;
    this.arrows = this.container.querySelectorAll('.arrow-container');
    this.updateArrows();
  }

  subscribeToEvents() {
    this.eventBus.on('playback:started', () => {
      this.isPlaying = true;
    });

    this.eventBus.on('playback:stopped', () => {
      this.isPlaying = false;
      this.currentBeat = 0;
      this.updateArrows();
    });

    this.eventBus.on('playback:beat', (data) => {
      this.currentBeat = data.beat;
      this.updateArrows();
    });

    this.eventBus.on('playback:bar', (data) => {
      this.currentBeat = 0;
      this.updateArrows();
    });
  }

  updateArrows() {
    this.arrows.forEach((arrow, index) => {
      if (index === this.currentBeat && this.isPlaying) {
        arrow.classList.add('active');
      } else {
        arrow.classList.remove('active');
      }
    });
  }

  setCurrentBeat(beat) {
    this.currentBeat = beat;
    this.updateArrows();
  }

  setPlaying(isPlaying) {
    this.isPlaying = isPlaying;
    this.updateArrows();
  }

  reset() {
    this.currentBeat = 0;
    this.isPlaying = false;
    this.updateArrows();
  }

  /**
   * Возвращает SVG для стрелочки вниз (удар по струнам)
   * @returns {string} SVG код
   */
  getDownArrowSVG() {
    return `
      <svg width="36" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v14" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"></path>
        <path d="M19 10l-7 7-7-7" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"></path>
      </svg>
    `;
  }

  /**
   * Возвращает SVG для стрелочки вверх (удар по струнам)
   * @returns {string} SVG код
   */
  getUpArrowSVG() {
    return `
      <svg width="36" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21V7" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"></path>
        <path d="M5 14l7-7 7 7" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"></path>
      </svg>
    `;
  }

  /**
   * Возвращает SVG для стрелочки в зависимости от направления
   * @param {number} beatIndex - индекс бита
   * @returns {string} SVG код
   */
  getArrowSVG(beatIndex) {
    const direction = this.arrowDirections[beatIndex] || 'down';
    return direction === 'down' ? this.getDownArrowSVG() : this.getUpArrowSVG();
  }

  /**
   * Устанавливает направление стрелки для указанного бита
   * @param {number} beatIndex - индекс бита (0-3)
   * @param {string} direction - направление ('up' или 'down')
   */
  setArrowDirection(beatIndex, direction) {
    if (beatIndex >= 0 && beatIndex < this.arrowDirections.length) {
      this.arrowDirections[beatIndex] = direction;
      // Обновляем HTML для соответствующей стрелки
      const arrowElement = this.arrows[beatIndex];
      if (arrowElement) {
        arrowElement.innerHTML = this.getArrowSVG(beatIndex);
      }
    }
  }

  /**
   * Переключает направление стрелки для указанного бита
   * @param {number} beatIndex - индекс бита (0-3)
   */
  toggleArrowDirection(beatIndex) {
    if (beatIndex >= 0 && beatIndex < this.arrowDirections.length) {
      const currentDirection = this.arrowDirections[beatIndex];
      const newDirection = currentDirection === 'down' ? 'up' : 'down';
      this.setArrowDirection(beatIndex, newDirection);
    }
  }

  /**
   * Устанавливает направления для всех стрелок
   * @param {Array} directions - массив направлений ['up', 'down', ...]
   */
  setAllArrowDirections(directions) {
    for (let i = 0; i < Math.min(directions.length, this.arrowDirections.length); i++) {
      this.setArrowDirection(i, directions[i]);
    }
  }

  /**
   * Обновляет состояние круга (заполненный или пустой)
   * @param {number} beatIndex - индекс бита
   * @param {boolean} isActive - активен ли круг (заполнен)
   */
  updateCircleStatus(beatIndex, isActive) {
    const beatWrapper = this.container.children[beatIndex];
    if (!beatWrapper) return;
    
    const circleContainer = beatWrapper.querySelector('.circle-container');
    if (!circleContainer) return;
    
    if (isActive) {
      circleContainer.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" fill="#ef4444"></circle>
        </svg>
      `;
    } else {
      circleContainer.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5"></circle>
        </svg>
      `;
    }
  }

  /**
   * Обновляет статусы всех кругов
   * @param {Array} statuses - массив статусов для каждого бита
   */
  updateAllCircleStatuses(statuses) {
    for (let i = 0; i < Math.min(statuses.length, 8); i++) {
      this.updateCircleStatus(i, statuses[i]);
    }
  }

  destroy() {
    this.eventBus.off('playback:started');
    this.eventBus.off('playback:stopped');
    this.eventBus.off('playback:beat');
    this.eventBus.off('playback:bar');
    this.container.innerHTML = '';
  }
}

export default ArrowDisplay;