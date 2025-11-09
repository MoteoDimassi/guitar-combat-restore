import BeatUnit from '../../domain/entities/BeatUnit.js';

class ArrowDisplay {
  constructor(container, eventBus, stateManager = null) {
    this.container = container;
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.serviceContainer = null;
    this.arrows = [];
    this.currentBeat = 0;
    this.isPlaying = false;
    // Массив направлений стрелок для каждого бита (по умолчанию чередуем вниз/вверх)
    this.arrowDirections = ['down', 'up', 'down', 'up', 'down', 'up', 'down', 'up'];
    // Массив для хранения привязанных аккордов
    this.arrowChords = new Array(8).fill(null);
    // Массив для хранения BeatUnit для каждой стрелочки
    this.beatUnits = new Array(8).fill(null).map(() => new BeatUnit());
    // Массив для хранения статусов кружочков
    this.circleStatuses = new Array(8).fill('empty');
    // Флаг наличия текста песни
    this.hasSongText = false;
    // Текущий такт
    this.currentBarIndex = 0;
  }

  /**
   * Установка ServiceContainer
   */
  setServiceContainer(serviceContainer) {
    this.serviceContainer = serviceContainer;
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
    // Проверяем наличие текста песни в localStorage или stateManager
    this.checkSongText();
    
    // Создаем 8 элементов для стрелок (как в образце)
    let arrowsHTML = '';
    for (let i = 0; i < 8; i++) {
      const syllableZone = this.hasSongText ?
        `<div class="syllable-drop-zone text-center text-sm text-gray-400 min-h-[20px]" data-arrow-index="${i}"></div>` : '';
      
      arrowsHTML += `
        <div class="flex flex-col items-center gap-2 select-none flex-shrink-0 beat-wrapper-medium">
          <div class="arrow-container" data-beat="${i}">
            ${this.getArrowSVG(i)}
          </div>
          <div class="circle-container cursor-pointer hover:opacity-80 transition-opacity" data-beat="${i}">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5"></circle>
            </svg>
          </div>
          ${syllableZone}
        </div>
      `;
    }
    
    this.container.innerHTML = arrowsHTML;
    this.arrows = this.container.querySelectorAll('.arrow-container');
    this.circleElements = this.container.querySelectorAll('.circle-container');
    this.syllableElements = this.container.querySelectorAll('.syllable-drop-zone');
    
    // Добавляем обработчики кликов на кружочки
    this.setupCircleClickHandlers();
    
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

    // Подписываемся на изменения текста песни
    this.eventBus.on('songText:updated', (data) => {
      this.handleSongTextUpdate(data.content);
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
   * Обновляет состояние круга (заполненный, пустой или с крестиком)
   * @param {number} beatIndex - индекс бита
   * @param {string} status - статус ('played', 'muted', 'empty')
   */
  updateCircleStatus(beatIndex, status) {
    const beatWrapper = this.container.children[beatIndex];
    if (!beatWrapper) return;
    
    const circleContainer = beatWrapper.querySelector('.circle-container');
    if (!circleContainer) return;
    
    // Сохраняем статус в массиве
    this.circleStatuses[beatIndex] = status;
    
    // Обновляем соответствующий BeatUnit
    if (this.beatUnits[beatIndex]) {
      this.beatUnits[beatIndex].setCircleStatus(status);
    }
    
    switch (status) {
      case 'played':
        circleContainer.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" fill="#ef4444"></circle>
          </svg>
        `;
        break;
      case 'muted':
        circleContainer.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5"></circle>
            <path d="M8 8l8 8M16 8l-8 8" stroke="#ef4444" stroke-width="2" stroke-linecap="round"></path>
          </svg>
        `;
        break;
      case 'empty':
      default:
        circleContainer.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5"></circle>
          </svg>
        `;
        break;
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

  /**
   * Получает текущий статус кружочка
   * @param {number} beatIndex - индекс бита
   * @returns {string} текущий статус
   */
  getCircleStatus(beatIndex) {
    return this.circleStatuses[beatIndex] || 'empty';
  }

  /**
   * Устанавливает обработчики кликов на кружочки
   */
  setupCircleClickHandlers() {
    this.circleElements.forEach((circle, index) => {
      circle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cycleCircleStatus(index);
      });
    });
  }

  /**
   * Циклически переключает состояние кружочка
   * @param {number} beatIndex - индекс бита
   */
  cycleCircleStatus(beatIndex) {
    const currentStatus = this.getCircleStatus(beatIndex);
    let newStatus;
    
    switch (currentStatus) {
      case 'empty':
        newStatus = 'played';
        break;
      case 'played':
        newStatus = 'muted';
        break;
      case 'muted':
        newStatus = 'empty';
        break;
      default:
        newStatus = 'played';
    }
    
    this.updateCircleStatus(beatIndex, newStatus);
    
    // Обновляем статус в ChordParserService
    if (this.serviceContainer) {
      try {
        const chordParserService = this.serviceContainer.get('chordParserService');
        if (chordParserService) {
          chordParserService.setBeatStatus(this.currentBarIndex, beatIndex, newStatus);
        }
      } catch (error) {
        console.warn('ArrowDisplay: Failed to update beat status in ChordParserService:', error);
      }
    }
    
    // Генерируем событие об изменении статуса
    this.eventBus.emit('beat:statusChanged', {
      beatIndex,
      status: newStatus,
      barIndex: this.currentBarIndex
    });
  }

  /**
   * Привязывает аккорд к стрелочке
   * @param {number} beatIndex - индекс бита
   * @param {Object} chord - объект аккорда
   */
  setChordToArrow(beatIndex, chord) {
    if (beatIndex >= 0 && beatIndex < this.arrowChords.length) {
      this.arrowChords[beatIndex] = chord;
      
      // Обновляем BeatUnit
      if (this.beatUnits[beatIndex]) {
        this.beatUnits[beatIndex].setChord(chord);
      }
      
      // Генерируем событие
      this.eventBus.emit('arrow:chordAssigned', {
        beatIndex,
        chord
      });
    }
  }

  /**
   * Получает аккорд, привязанный к стрелочке
   * @param {number} beatIndex - индекс бита
   * @returns {Object|null} аккорд или null
   */
  getChordFromArrow(beatIndex) {
    if (beatIndex >= 0 && beatIndex < this.arrowChords.length) {
      return this.arrowChords[beatIndex];
    }
    return null;
  }

  /**
   * Отображает слог для стрелочки
   * @param {number} beatIndex - индекс бита
   * @param {string} syllable - слог
   */
  showSyllable(beatIndex, syllable) {
    const syllableElement = this.syllableElements[beatIndex];
    if (syllableElement) {
      syllableElement.textContent = syllable;
      syllableElement.style.display = 'block';
      
      // Обновляем BeatUnit
      if (this.beatUnits[beatIndex]) {
        this.beatUnits[beatIndex].setSyllable(syllable);
      }
    }
  }

  /**
   * Скрывает слог для стрелочки
   * @param {number} beatIndex - индекс бита
   */
  hideSyllable(beatIndex) {
    const syllableElement = this.syllableElements[beatIndex];
    if (syllableElement) {
      syllableElement.style.display = 'none';
      syllableElement.textContent = '';
      
      // Обновляем BeatUnit
      if (this.beatUnits[beatIndex]) {
        this.beatUnits[beatIndex].setSyllable(null);
      }
    }
  }

  /**
   * Привязывает слог к стрелочке
   * @param {number} beatIndex - индекс бита
   * @param {string|null} syllable - слог или null для очистки
   */
  setSyllableToArrow(beatIndex, syllable) {
    if (beatIndex >= 0 && beatIndex < this.syllableElements.length) {
      if (syllable) {
        this.showSyllable(beatIndex, syllable);
      } else {
        this.hideSyllable(beatIndex);
      }
      
      // Генерируем событие
      this.eventBus.emit('arrow:syllableAssigned', {
        beatIndex,
        syllable
      });
    }
  }

  /**
   * Получает BeatUnit по индексу
   * @param {number} beatIndex - индекс бита
   * @returns {BeatUnit|null} объект BeatUnit или null
   */
  getBeatUnitByIndex(beatIndex) {
    if (beatIndex >= 0 && beatIndex < this.beatUnits.length) {
      return this.beatUnits[beatIndex];
    }
    return null;
  }

  /**
   * Получает все BeatUnit
   * @returns {Array} массив объектов BeatUnit
   */
  getAllBeatUnits() {
    return [...this.beatUnits];
  }

  /**
   * Проверяет наличие текста песни в localStorage или stateManager
   */
  checkSongText() {
    let songTextContent = '';
    
    // Сначала проверяем в stateManager если он доступен
    if (this.stateManager) {
      songTextContent = this.stateManager.getState('songText.content') || '';
    } else {
      // Иначе проверяем в localStorage
      try {
        const savedConfig = localStorage.getItem('guitar-combat-config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          songTextContent = config.state?.songText?.content || '';
        }
      } catch (error) {
        console.warn('Ошибка при проверке текста песни в localStorage:', error);
      }
    }
    
    this.hasSongText = songTextContent.trim().length > 0;
  }

  /**
   * Обрабатывает обновление текста песни
   * @param {string} content - новый текст песни
   */
  handleSongTextUpdate(content) {
    const hadSongText = this.hasSongText;
    this.hasSongText = content.trim().length > 0;
    
    // Если статус наличия текста изменился, пересоздаем интерфейс
    if (hadSongText !== this.hasSongText) {
      this.rebuildInterface();
    }
  }

  /**
   * Перестраивает интерфейс при изменении статуса текста песни
   */
  rebuildInterface() {
    // Сохраняем текущие состояния
    const currentBeatUnits = [...this.beatUnits];
    const currentCircleStatuses = [...this.circleStatuses];
    const currentArrowDirections = [...this.arrowDirections];
    const currentArrowChords = [...this.arrowChords];
    
    // Пересоздаем HTML
    this.init();
    
    // Восстанавливаем состояния
    this.beatUnits = currentBeatUnits;
    this.circleStatuses = currentCircleStatuses;
    this.arrowDirections = currentArrowDirections;
    this.arrowChords = currentArrowChords;
    
    // Восстанавливаем статусы кружочков
    currentCircleStatuses.forEach((status, index) => {
      this.updateCircleStatus(index, status);
    });
    
    // Восстанавливаем слоги если они были
    if (this.hasSongText) {
      currentBeatUnits.forEach((beatUnit, index) => {
        if (beatUnit && beatUnit.getSyllable()) {
          this.showSyllable(index, beatUnit.getSyllable());
        }
      });
    }
  }

  /**
   * Установка текущего индекса такта
   */
  setCurrentBarIndex(barIndex) {
    this.currentBarIndex = barIndex;
  }

  /**
   * Получение текущего индекса такта
   */
  getCurrentBarIndex() {
    return this.currentBarIndex;
  }

  destroy() {
    this.eventBus.off('playback:started');
    this.eventBus.off('playback:stopped');
    this.eventBus.off('playback:beat');
    this.eventBus.off('playback:bar');
    this.eventBus.off('songText:updated');
    this.container.innerHTML = '';
  }
}

export default ArrowDisplay;