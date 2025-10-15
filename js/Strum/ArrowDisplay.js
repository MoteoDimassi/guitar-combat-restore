import { PlayStatus } from '../Measure/PlayStatus.js';
import { BeatUnit } from '../Measure/BeatUnit.js';

/**
 * Класс для отображения стрелочек в контейнере
 * Отображает чередующиеся стрелочки (вниз-вверх) в зависимости от количества
 * Под каждой стрелочкой отображается кружок с состоянием воспроизведения
 */
export class ArrowDisplay {
  constructor() {
    this.container = null;
    this.countSelect = null;
    this.arrows = [];
    this.currentCount = 8; // по умолчанию 8 стрелочек
    this.arrowSize = 50; // размер стрелочки в пикселях (уменьшен для лучшего размещения)
    this.arrowSpacing = 15; // расстояние между стрелочками (уменьшено)
    this.playStatuses = []; // массив состояний воспроизведения для каждой стрелочки
    this.beatUnits = []; // массив BeatUnit для каждой стрелочки
    this.handleCircleClickBound = null; // привязанный обработчик клика для кружочков
    this.preservePlayStatuses = true; // флаг сохранения состояний при изменении аккордов
    this.currentBarIndex = 0; // индекс текущего такта
  }

  /**
   * Инициализирует отображение стрелочек
   * @param {string} containerSelector - Селектор контейнера для стрелочек
   * @param {string} countSelectSelector - Селектор выпадающего меню количества
   */
  init(containerSelector, countSelectSelector) {
    this.container = document.querySelector(containerSelector);
    this.countSelect = document.querySelector(countSelectSelector);

    if (!this.container) {
      throw new Error(`Контейнер не найден: ${containerSelector}`);
    }

    if (!this.countSelect) {
      throw new Error(`Выпадающее меню не найдено: ${countSelectSelector}`);
    }

    // Привязываем события
    this.bindEvents();
    
    // Создаем стрелочки
    this.createArrows();
    
    // Инициализируем состояния воспроизведения для стрелочек
    this.initializePlayStatuses();
    
    // Обновляем отображение
    this.updateDisplay();
  }

  /**
   * Привязывает события к элементам
   */
  bindEvents() {
    // Обработчик изменения количества стрелочек
    this.countSelect.addEventListener('change', (e) => {
      this.setArrowCount(parseInt(e.target.value));
    });

    // Обработчики для каждой стрелочки
    this.container.addEventListener('click', (e) => {
      const arrowElement = e.target.closest('.arrow-item');
      const circleElement = e.target.closest('.play-status-circle');
      
      // Предотвращаем всплытие события от кружочка к стрелочке
      if (circleElement) {
        e.stopPropagation();
        const index = parseInt(circleElement.dataset.index);
        this.handleCircleClick(index);
      } else if (arrowElement) {
        const index = parseInt(arrowElement.dataset.index);
        this.handleArrowClick(index);
      }
    });
  }

  /**
   * Создает HTML структуру для стрелочек
   */
  createArrows() {
    // Очищаем контейнер, но сохраняем существующие CSS классы
    this.container.innerHTML = '';
    this.container.className = 'grid grid-cols-8 gap-4 px-4'; // Используем существующие классы из HTML
  }

  /**
   * Устанавливает количество стрелочек
   * @param {number} count - Количество стрелочек
   * @param {boolean} preserveStatuses - Сохранять ли текущие состояния (опционально)
   */
  setArrowCount(count, preserveStatuses = null) {
    if (count < 1 || count > 16) {
      console.warn('Количество стрелочек должно быть от 1 до 16');
      return;
    }

    // Сохраняем текущие состояния если нужно
    const shouldPreserve = preserveStatuses !== null ? preserveStatuses : this.preservePlayStatuses;
    const savedStatuses = shouldPreserve ? this.saveCurrentPlayStatuses() : null;

    this.currentCount = count;
    this.generateArrows();
    
    if (shouldPreserve && savedStatuses) {
      this.restorePlayStatuses(savedStatuses);
    } else {
      // Всегда применяем стандартную настройку: первая стрелочка - PLAY, остальные - SKIP
      this.initializePlayStatuses();
    }
    
    this.updateDisplay();
  }

  /**
   * Инициализирует состояния воспроизведения для всех стрелочек
   */
  initializePlayStatuses() {
    this.playStatuses = [];
    this.beatUnits = [];
    
    for (let i = 0; i < this.currentCount; i++) {
      // Только первая стрелочка активна по умолчанию, остальные - неактивны
      const status = i === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      const playStatus = new PlayStatus(status);
      
      // Создаем BeatUnit с текущим статусом
      const beatUnit = new BeatUnit(i, playStatus);
      
      this.playStatuses.push(playStatus);
      this.beatUnits.push(beatUnit);
    }
    console.log(`🔄 ArrowDisplay: инициализировано ${this.currentCount} BeatUnit (первая - PLAY, остальные - SKIP)`);
  }

  /**
   * Генерирует массив стрелочек с чередующимися направлениями
   */
  generateArrows() {
    this.arrows = [];
    
    for (let i = 0; i < this.currentCount; i++) {
      // Начинаем с направления вниз (true), затем чередуем
      const isDown = i % 2 === 0;
      
      this.arrows.push({
        index: i,
        direction: isDown ? 'down' : 'up',
        isActive: false,
        isHighlighted: false
      });
    }
  }

  /**
   * Обновляет отображение стрелочек
   */
  updateDisplay() {
    // Очищаем обработчики кружочков перед обновлением
    this.cleanupCircleHandlers();
    
    // Очищаем контейнер
    this.container.innerHTML = '';

    // Обновляем grid-колонки в зависимости от количества стрелочек
    this.updateGridColumns();

    // Добавляем стрелочки напрямую в контейнер
    this.arrows.forEach(arrow => {
      const arrowElement = this.createArrowElement(arrow);
      this.container.appendChild(arrowElement);
    });

    // Добавляем отдельные обработчики для кружочков
    this.addCircleClickHandlers();

    // Обновляем размеры контейнера
    this.updateContainerSize();
  }

  /**
   * Очищает обработчики кликов для кружочков
   */
  cleanupCircleHandlers() {
    const circles = this.container.querySelectorAll('.play-status-circle');
    circles.forEach(circle => {
      if (circle._circleClickHandler) {
        circle.removeEventListener('click', circle._circleClickHandler);
        delete circle._circleClickHandler;
      }
    });
  }

  /**
   * Создает HTML элемент для одной стрелочки
   * @param {Object} arrow - Объект стрелочки
   * @returns {HTMLElement} HTML элемент
   */
  createArrowElement(arrow) {
    const arrowDiv = document.createElement('div');
    arrowDiv.className = `arrow-item cursor-pointer transition-all duration-200 hover:scale-110 flex flex-col items-center justify-center p-1 flex-shrink-0 ${
      arrow.isHighlighted ? 'animate-pulse' : ''
    }`;
    arrowDiv.dataset.index = arrow.index;
    arrowDiv.dataset.direction = arrow.direction;

    // Определяем SVG для направления
    const svgContent = arrow.direction === 'down' ? this.getDownArrowSVG() : this.getUpArrowSVG();
    
    // Определяем цвет в зависимости от состояния (темные стрелочки как на изображении)
    let colorClass = 'text-gray-300';
    if (arrow.isActive) {
      colorClass = 'text-[#38e07b]';
    } else if (arrow.isHighlighted) {
      colorClass = 'text-yellow-400';
    }

    // Получаем состояние воспроизведения для этой стрелочки
    let playStatus = this.playStatuses[arrow.index];
    if (!playStatus || typeof playStatus.getStatusString !== 'function') {
      // Если playStatus не существует или не является объектом PlayStatus, создаем новый
      playStatus = new PlayStatus(arrow.index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
    }
    
    arrowDiv.innerHTML = `
      <div class="arrow-icon ${colorClass} transition-colors duration-200 mb-2" style="width: ${this.arrowSize}px; height: ${this.arrowSize}px;">
        ${svgContent}
      </div>
      <div class="play-status-circle cursor-pointer transition-all duration-200 hover:scale-110"
           data-index="${arrow.index}"
           title="Кликните для изменения: ${playStatus.getStatusString()}">
        ${playStatus.getDisplayHTML()}
      </div>
    `;

    return arrowDiv;
  }

  /**
   * Возвращает SVG для стрелочки вниз (удар по струнам)
   * @returns {string} SVG код
   */
  getDownArrowSVG() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
        <!-- Вертикальная линия -->
        <path d="M12 3v14"/>
        <!-- Стрелка вниз -->
        <path d="M19 10l-7 7-7-7"/>
      </svg>
    `;
  }

  /**
   * Возвращает SVG для стрелочки вверх (удар по струнам)
   * @returns {string} SVG код
   */
  getUpArrowSVG() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
        <!-- Вертикальная линия -->
        <path d="M12 3v14"/>
        <!-- Стрелка вверх -->
        <path d="M5 10l7-7 7 7"/>
      </svg>
    `;
  }

  /**
   * Обновляет количество grid-колонок в зависимости от количества стрелочек
   */
  updateGridColumns() {
    // Для большого количества стрелочек используем flexbox с горизонтальной прокруткой
    if (this.currentCount > 8) {
      this.container.className = 'flex items-center justify-start gap-2 px-4 overflow-x-auto';
      // Рассчитываем ширину: размер стрелочки + отступы + gap
      const arrowWidth = this.arrowSize + 16; // стрелочка + padding
      this.container.style.minWidth = `${this.currentCount * arrowWidth}px`;
      this.container.style.width = '100%';
      return;
    }
    
    // Определяем количество колонок на основе количества стрелочек
    let gridCols;
    if (this.currentCount <= 4) {
      gridCols = `grid-cols-${this.currentCount}`;
    } else {
      gridCols = 'grid-cols-8';
    }
    
    // Обновляем классы контейнера
    this.container.className = `grid ${gridCols} gap-4 px-4`;
  }

  /**
   * Обновляет размеры контейнера в зависимости от количества стрелочек
   */
  updateContainerSize() {
    // Для большого количества стрелочек размеры уже установлены в updateGridColumns
    if (this.currentCount > 8) {
      return;
    }
    
    // Вычисляем необходимую ширину для grid-раскладки
    const totalWidth = this.currentCount * this.arrowSize + (this.currentCount - 1) * this.arrowSpacing;
    
    // Устанавливаем минимальную ширину только для grid-раскладки
    this.container.style.minWidth = `${Math.max(totalWidth, 400)}px`;
  }

  /**
   * Обрабатывает клик по стрелочке
   * @param {number} index - Индекс стрелочки
   */
  handleArrowClick(index) {
    if (index >= 0 && index < this.arrows.length) {
      // Переключаем активное состояние
      this.arrows[index].isActive = !this.arrows[index].isActive;
      this.updateDisplay();
      
      console.log(`Стрелочка ${index + 1} (${this.arrows[index].direction}): ${this.arrows[index].isActive ? 'активна' : 'неактивна'}`);
    }
  }

  /**
   * Добавляет отдельные обработчики кликов для кружочков
   */
  addCircleClickHandlers() {
    const circles = this.container.querySelectorAll('.play-status-circle');
    circles.forEach(circle => {
      // Удаляем предыдущие обработчики, если они есть
      if (this.handleCircleClickBound) {
        circle.removeEventListener('click', this.handleCircleClickBound);
      }
      
      // Создаем обработчик с привязкой контекста
      const circleClickHandler = (e) => {
        e.stopPropagation(); // Предотвращаем всплытие к стрелочке
        e.preventDefault(); // Предотвращаем стандартное поведение
        const index = parseInt(e.currentTarget.dataset.index);
        this.handleCircleClick(index);
      };
      
      circle.addEventListener('click', circleClickHandler);
      
      // Сохраняем ссылку для возможности удаления
      circle._circleClickHandler = circleClickHandler;
    });
  }

  /**
   * Обрабатывает клик по кружочку состояния воспроизведения
   * @param {number} index - Индекс стрелочки
   */
  handleCircleClick(index) {
    if (index >= 0 && index < this.playStatuses.length) {
      let playStatus = this.playStatuses[index];
      if (!playStatus || typeof playStatus.toggleStatus !== 'function') {
        // Если playStatus не существует или не является объектом PlayStatus, создаем новый
        playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
        this.playStatuses[index] = playStatus;
      }
      
      // Переключаем состояние воспроизведения по кругу: ○ → ● → ⊗ → ○
      playStatus.toggleStatus();
      this.updateDisplay();
      
      console.log(`Кружок ${index + 1}: ${playStatus.getStatusString()} (${playStatus.getDisplaySymbol()})`);
      
      // Получаем полную информацию о длительности
      const fullInfo = this.getBeatFullInfo(index);
      
      // Вызываем callback для изменения статуса (обратная совместимость)
      if (this.onPlayStatusChange) {
        this.onPlayStatusChange(index, playStatus);
      }
      
      // Вызываем новый callback с полной информацией
      if (this.onBeatClick) {
        this.onBeatClick(fullInfo);
      }
    }
  }

  /**
   * Получает полную информацию о длительности по индексу
   * @param {number} index - Индекс длительности
   * @returns {Object} Полная информация о длительности
   */
  getBeatFullInfo(index) {
    let playStatus = this.playStatuses[index];
    if (!playStatus || typeof playStatus.getStatusString !== 'function') {
      // Если playStatus не существует или не является объектом PlayStatus, создаем новый
      playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
    }
    const beatUnit = this.beatUnits[index];
    
    return {
      barIndex: this.currentBarIndex,
      beatIndex: index,
      playStatus: playStatus,
      chord: beatUnit ? beatUnit.getChord() : null,
      syllable: beatUnit ? beatUnit.getSyllable() : null,
      isPlayed: playStatus.isPlayed(),
      isMuted: playStatus.isMuted(),
      isSkipped: playStatus.isSkipped(),
      typeString: playStatus.getStatusString(),
      displaySymbol: playStatus.getDisplaySymbol(),
      cssClass: playStatus.getCSSClass()
    };
  }

  /**
   * Получает BeatUnit по индексу
   * @param {number} index - Индекс длительности
   * @returns {BeatUnit|null} BeatUnit или null
   */
  getBeatUnit(index) {
    if (index >= 0 && index < this.beatUnits.length) {
      return this.beatUnits[index];
    }
    return null;
  }

  /**
   * Устанавливает массив BeatUnit для отображения
   * @param {BeatUnit[]} beatUnits - Массив BeatUnit
   */
  setBeatUnits(beatUnits) {
    this.beatUnits = beatUnits || [];
    
    // Обновляем массив состояний воспроизведения из BeatUnit
    // Используем статусы из BeatUnit, которые должны быть правильно установлены в Bar
    this.playStatuses = this.beatUnits.map((beatUnit, index) => {
      let playStatus = beatUnit.getPlayStatus();
      // Если у BeatUnit нет PlayStatus, создаем новый с правильным статусом по умолчанию
      if (!playStatus || typeof playStatus.getStatusString !== 'function') {
        playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
      }
      return playStatus;
    });
    
    // Обновляем количество стрелочек
    this.currentCount = this.beatUnits.length;
    this.generateArrows();
    this.updateDisplay();
  }

  /**
   * Устанавливает индекс текущего такта
   * @param {number} barIndex - Индекс такта
   */
  setCurrentBarIndex(barIndex) {
    this.currentBarIndex = barIndex;
  }

  /**
   * Устанавливает callback для клика по длительности с полной информацией
   * @param {Function} callback - Функция обратного вызова
   */
  setOnBeatClick(callback) {
    this.onBeatClick = callback;
  }

  /**
   * Подсвечивает стрелочку
   * @param {number} index - Индекс стрелочки
   * @param {boolean} highlight - Подсвечивать или нет
   */
  highlightArrow(index, highlight = true) {
    if (index >= 0 && index < this.arrows.length) {
      this.arrows[index].isHighlighted = highlight;
      this.updateDisplay();
    }
  }

  /**
   * Подсвечивает все активные стрелочки
   */
  highlightActiveArrows() {
    this.arrows.forEach((arrow, index) => {
      arrow.isHighlighted = arrow.isActive;
    });
    this.updateDisplay();
  }

  /**
   * Снимает подсветку со всех стрелочек
   */
  clearHighlight() {
    this.arrows.forEach(arrow => {
      arrow.isHighlighted = false;
    });
    this.updateDisplay();
  }

  /**
   * Устанавливает активное состояние для стрелочки
   * @param {number} index - Индекс стрелочки
   * @param {boolean} active - Активное состояние
   */
  setArrowActive(index, active) {
    if (index >= 0 && index < this.arrows.length) {
      this.arrows[index].isActive = active;
      this.updateDisplay();
    }
  }

  /**
   * Получает активные стрелочки
   * @returns {Array} Массив индексов активных стрелочек
   */
  getActiveArrows() {
    return this.arrows
      .map((arrow, index) => ({ arrow, index }))
      .filter(item => item.arrow.isActive)
      .map(item => item.index);
  }

  /**
   * Получает информацию о стрелочке
   * @param {number} index - Индекс стрелочки
   * @returns {Object|null} Информация о стрелочке
   */
  getArrowInfo(index) {
    if (index >= 0 && index < this.arrows.length) {
      return { ...this.arrows[index] };
    }
    return null;
  }

  /**
   * Получает информацию о всех стрелочках
   * @returns {Array} Массив информации о стрелочках
   */
  getAllArrowsInfo() {
    return this.arrows.map(arrow => ({ ...arrow }));
  }

  /**
   * Сбрасывает все стрелочки в неактивное состояние
   */
  resetArrows() {
    this.arrows.forEach(arrow => {
      arrow.isActive = false;
      arrow.isHighlighted = false;
    });
    this.updateDisplay();
  }

  /**
   * Анимирует стрелочки в последовательности
   * @param {number} delay - Задержка между стрелочками в мс
   */
  animateSequence(delay = 500) {
    this.clearHighlight();
    
    this.arrows.forEach((arrow, index) => {
      setTimeout(() => {
        this.highlightArrow(index, true);
        
        // Убираем подсветку через delay/2
        setTimeout(() => {
          this.highlightArrow(index, false);
        }, delay / 2);
      }, index * delay);
    });
  }

  /**
   * Получает текущее состояние отображения
   * @returns {Object} Состояние
   */
  getState() {
    return {
      currentCount: this.currentCount,
      arrows: this.getAllArrowsInfo(),
      activeArrows: this.getActiveArrows(),
      containerSize: {
        width: this.container?.offsetWidth || 0,
        height: this.container?.offsetHeight || 0
      }
    };
  }

  /**
   * Обновляет размер стрелочек
   * @param {number} size - Новый размер в пикселях
   */
  setArrowSize(size) {
    if (size > 0 && size <= 200) {
      this.arrowSize = size;
      this.updateDisplay();
    }
  }

  /**
   * Обновляет расстояние между стрелочками
   * @param {number} spacing - Новое расстояние в пикселях
   */
  setArrowSpacing(spacing) {
    if (spacing >= 0 && spacing <= 100) {
      this.arrowSpacing = spacing;
      this.updateDisplay();
    }
  }

  /**
   * Устанавливает состояние воспроизведения для стрелочки
   * @param {number} index - Индекс стрелочки
   * @param {PlayStatus|number} playStatus - Состояние воспроизведения
   */
  setPlayStatus(index, playStatus) {
    if (index >= 0 && index < this.playStatuses.length) {
      // Если передано число, создаем объект PlayStatus
      if (typeof playStatus === 'number') {
        this.playStatuses[index] = new PlayStatus(playStatus);
      } else {
        this.playStatuses[index] = playStatus;
      }
      this.updateDisplay();
    }
  }

  /**
   * Получает состояние воспроизведения для стрелочки
   * @param {number} index - Индекс стрелочки
   * @returns {PlayStatus|null} Состояние воспроизведения
   */
  getPlayStatus(index) {
    if (index >= 0 && index < this.playStatuses.length) {
      let playStatus = this.playStatuses[index];
      // Убеждаемся, что у нас есть корректный объект PlayStatus
      if (!playStatus || typeof playStatus.getStatusString !== 'function') {
        playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
        this.playStatuses[index] = playStatus;
      }
      return playStatus;
    }
    return null;
  }

  /**
   * Получает все состояния воспроизведения
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  getAllPlayStatuses() {
    return [...this.playStatuses];
  }

  /**
   * Устанавливает состояния воспроизведения для всех стрелочек
   * @param {PlayStatus[]|number[]} playStatuses - Массив состояний воспроизведения
   */
  setAllPlayStatuses(playStatuses) {
    if (Array.isArray(playStatuses)) {
      console.log('🎯 ArrowDisplay.setAllPlayStatuses: устанавливаем', playStatuses.length, 'статусов');
      
      this.playStatuses = playStatuses.map((status, index) => {
        // Если передано число, создаем объект PlayStatus
        if (typeof status === 'number') {
          return new PlayStatus(status);
        }
        // Убеждаемся, что у нас есть корректный объект PlayStatus
        if (!status || typeof status.getStatusString !== 'function') {
          return new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
        }
        return status;
      });
      this.updateDisplay();
    } else {
      console.warn('⚠️ setAllPlayStatuses получил не массив:', playStatuses);
    }
  }

  /**
   * Устанавливает callback для изменения состояния воспроизведения
   * @param {Function} callback - Функция обратного вызова
   */
  setOnPlayStatusChange(callback) {
    this.onPlayStatusChange = callback;
  }

  /**
   * Устанавливает флаг сохранения состояний при изменении аккордов
   * @param {boolean} preserve - Сохранять состояния
   */
  setPreservePlayStatuses(preserve) {
    this.preservePlayStatuses = preserve;
    console.log(`🔄 ArrowDisplay: флаг сохранения состояний установлен в ${preserve}`);
  }

  /**
   * Сохраняет текущие состояния воспроизведения
   * @returns {Array} Массив сохраненных состояний
   */
  saveCurrentPlayStatuses() {
    return this.playStatuses.map(status => status.toJSON());
  }

  /**
   * Восстанавливает состояния воспроизведения
   * @param {Array} savedStatuses - Массив сохраненных состояний
   */
  restorePlayStatuses(savedStatuses) {
    if (!Array.isArray(savedStatuses)) {
      console.warn('⚠️ savedStatuses должен быть массивом');
      return;
    }

    this.playStatuses = savedStatuses.map((statusData, index) => {
      let playStatus;
      if (typeof statusData === 'object' && statusData !== null) {
        // Если это объект, пытаемся восстановить из JSON
        playStatus = PlayStatus.fromJSON(statusData);
      } else if (typeof statusData === 'number') {
        // Если это число, создаем новый PlayStatus
        playStatus = new PlayStatus(statusData);
      } else {
        // Иначе создаем PlayStatus по умолчанию
        playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
      }
      
      // Убеждаемся, что у нас есть корректный объект PlayStatus
      if (!playStatus || typeof playStatus.getStatusString !== 'function') {
        playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
      }
      
      return playStatus;
    });

    // Если количество изменилось, дополняем или обрезаем массив
    while (this.playStatuses.length < this.currentCount) {
      const newIndex = this.playStatuses.length;
      this.playStatuses.push(new PlayStatus(newIndex === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP));
    }
    
    if (this.playStatuses.length > this.currentCount) {
      this.playStatuses = this.playStatuses.slice(0, this.currentCount);
    }

    console.log(`🔄 ArrowDisplay: восстановлено ${this.playStatuses.length} состояний`);
  }

  /**
   * Экспортирует конфигурацию стрелочек
   * @returns {Object} Конфигурация
   */
  exportConfig() {
    return {
      count: this.currentCount,
      size: this.arrowSize,
      spacing: this.arrowSpacing,
      arrows: this.getAllArrowsInfo(),
      playStatuses: this.playStatuses.map(status => status.toJSON())
    };
  }

  /**
   * Импортирует конфигурацию стрелочек
   * @param {Object} config - Конфигурация
   */
  importConfig(config) {
    if (config.count) {
      this.setArrowCount(config.count);
    }
    
    if (config.size) {
      this.setArrowSize(config.size);
    }
    
    if (config.spacing) {
      this.setArrowSpacing(config.spacing);
    }
    
    if (config.arrows && Array.isArray(config.arrows)) {
      config.arrows.forEach((arrowConfig, index) => {
        if (index < this.arrows.length) {
          this.arrows[index].isActive = arrowConfig.isActive || false;
          this.arrows[index].isHighlighted = arrowConfig.isHighlighted || false;
        }
      });
    }

    if (config.playStatuses && Array.isArray(config.playStatuses)) {
      this.playStatuses = config.playStatuses.map((statusData, index) => {
        let playStatus;
        if (typeof statusData === 'object' && statusData !== null) {
          // Если это объект, пытаемся восстановить из JSON
          playStatus = PlayStatus.fromJSON(statusData);
        } else if (typeof statusData === 'number') {
          // Если это число, создаем новый PlayStatus
          playStatus = new PlayStatus(statusData);
        } else {
          // Иначе создаем PlayStatus по умолчанию
          playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
        }
        
        // Убеждаемся, что у нас есть корректный объект PlayStatus
        if (!playStatus || typeof playStatus.getStatusString !== 'function') {
          playStatus = new PlayStatus(index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
        }
        
        return playStatus;
      });
    }
    
    this.updateDisplay();
  }
}
