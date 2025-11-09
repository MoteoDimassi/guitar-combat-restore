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
    this.beatUnits = []; // массив BeatUnit для каждой стрелочки
    this.handleCircleClickBound = null; // привязанный обработчик клика для кружочков
    this.preservePlayStatuses = true; // флаг сохранения состояний при изменении аккордов
    this.currentBarIndex = 0; // индекс текущего такта
    // Механизм событий для синхронизации с BeatUnit
    this.statusChangeListeners = new Map(); // Map<beatUnitIndex, listenerFunction>
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
    // Отписываемся от старых событий перед созданием новых BeatUnit
    this.clearStatusChangeListeners();
    
    this.beatUnits = [];
    
    for (let i = 0; i < this.currentCount; i++) {
      // Только первая стрелочка активна по умолчанию, остальные - неактивны
      const status = i === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      
      // Создаем BeatUnit с текущим статусом (BeatUnit сам создаст PlayStatus)
      const beatUnit = new BeatUnit(i, status);
      
      this.beatUnits.push(beatUnit);
      
      // Подписываемся на события изменения статуса этого BeatUnit
      this.subscribeToBeatUnitEvents(beatUnit, i);
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

    // Получаем состояние воспроизведения для этой стрелочки из BeatUnit
    let playStatus = null;
    if (this.beatUnits && this.beatUnits[arrow.index]) {
      playStatus = this.beatUnits[arrow.index].getPlayStatus();
    }
    
    // Если BeatUnit не существует или не имеет PlayStatus, используем статический экземпляр для отображения
    if (!playStatus || typeof playStatus.getStatusString !== 'function') {
      const status = arrow.index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      console.log(`⚠️ ArrowDisplay.createArrowElement[${arrow.index}]: BeatUnit не имеет PlayStatus, ИСПОЛЬЗУЕМ СТАТИЧЕСКИЙ экземпляр для отображения`);
      playStatus = PlayStatus.getInstance(status);
      // НЕ устанавливаем этот статус обратно в BeatUnit, чтобы избежать создания дубликатов
      console.log(`⚠️ ArrowDisplay.createArrowElement[${arrow.index}]: ИСПОЛЬЗУЕТСЯ СТАТИЧЕСКИЙ PlayStatus для отображения, ID: ${playStatus.constructor.name}_${playStatus.status}`);
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
    if (index >= 0 && index < this.beatUnits.length) {
      console.log(`🔄 ArrowDisplay.handleCircleClick(${index}): обработка клика`);
      
      // Проверяем, есть ли соответствующий BeatUnit
      if (this.beatUnits && this.beatUnits[index]) {
        const beatUnit = this.beatUnits[index];
        const playStatus = beatUnit.getPlayStatus();
        
        console.log(`🔄 ArrowDisplay.handleCircleClick(${index}): текущий статус BeatUnit: "${playStatus ? playStatus.getStatusString() : 'null'}" [${playStatus ? playStatus.status : 'null'}]`);
        
        // Используем метод BeatUnit.toggleStatus() для изменения статуса
        // Это обеспечит автоматическое уведомление всех слушателей через события
        beatUnit.toggleStatus();
        
        console.log(`🔄 ArrowDisplay.handleCircleClick(${index}): статус BeatUnit изменен через toggleStatus()`);
      } else {
        console.log(`❌ ArrowDisplay.handleCircleClick(${index}): BeatUnit не найден`);
      }
    } else {
      console.log(`❌ ArrowDisplay.handleCircleClick(${index}): индекс вне диапазона BeatUnit`);
    }
  }

  /**
   * Получает полную информацию о длительности по индексу
   * @param {number} index - Индекс длительности
   * @returns {Object} Полная информация о длительности
   */
  getBeatFullInfo(index) {
    const beatUnit = this.beatUnits[index];
    if (!beatUnit) {
      console.log(`❌ ArrowDisplay.getBeatFullInfo(${index}): BeatUnit не найден`);
      return null;
    }
    
    let playStatus = beatUnit.getPlayStatus();
    if (!playStatus || typeof playStatus.getStatusString !== 'function') {
      // Если playStatus не существует или не является объектом PlayStatus, используем статический экземпляр
      const status = index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      console.log(`⚠️ ArrowDisplay.getBeatFullInfo[${index}]: BeatUnit вернул некорректный PlayStatus, ИСПОЛЬЗУЕМ СТАТИЧЕСКИЙ экземпляр`);
      playStatus = PlayStatus.getInstance(status);
      console.log(`🆕 ArrowDisplay.getBeatFullInfo[${index}]: ИСПОЛЬЗУЕТСЯ СТАТИЧЕСКИЙ PlayStatus со статусом ${status}, ID: ${playStatus.constructor.name}_${playStatus.status} (в getBeatFullInfo)`);
      // НЕ устанавливаем этот статус обратно в BeatUnit, чтобы избежать создания дубликатов
    }
    
    return {
      barIndex: this.currentBarIndex,
      beatIndex: index,
      playStatus: playStatus,
      chord: beatUnit.getChord(),
      syllable: beatUnit.getSyllable(),
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
    // Отписываемся от старых событий перед установкой новых BeatUnit
    this.clearStatusChangeListeners();
    
    this.beatUnits = beatUnits || [];
    
    console.log(`🔄 ArrowDisplay.setBeatUnits: получено ${this.beatUnits.length} BeatUnit`);
    
    // Подписываемся на события изменения статуса каждого BeatUnit
    this.beatUnits.forEach((beatUnit, index) => {
      let playStatus = beatUnit.getPlayStatus();
      console.log(`🔄 ArrowDisplay.setBeatUnits[${index}]: PlayStatus из BeatUnit: ${playStatus ? `"${playStatus.getStatusString()}" [${playStatus.status}]` : 'null'}`);
      
      // Если у BeatUnit нет PlayStatus, создаем новый с правильным статусом по умолчанию
      if (!playStatus || typeof playStatus.getStatusString !== 'function') {
        const status = index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
        console.log(`⚠️ ArrowDisplay.setBeatUnits[${index}]: BeatUnit без PlayStatus, УСТАНАВЛИВАЕМ СТАТИЧЕСКИЙ экземпляр со статусом ${status}`);
        beatUnit.setPlayStatus(status);
      }
      
      // Подписываемся на события изменения статуса этого BeatUnit
      this.subscribeToBeatUnitEvents(beatUnit, index);
    });
    
    // Обновляем количество стрелочек
    this.currentCount = this.beatUnits.length;
    this.generateArrows();
    this.updateDisplay();
  }

  /**
   * Подписывается на события изменения статуса BeatUnit
   * @param {BeatUnit} beatUnit - BeatUnit для подписки
   * @param {number} index - Индекс BeatUnit
   */
  subscribeToBeatUnitEvents(beatUnit, index) {
    // Создаем функцию-слушателя для этого BeatUnit
    const statusChangeListener = (beatUnit, oldStatus, newStatus) => {
      this.onBeatUnitStatusChange(index, { beatUnit, oldStatus, newStatus });
    };
    
    // Подписываемся на события BeatUnit
    beatUnit.addStatusChangeListener(statusChangeListener);
    
    // Сохраняем ссылку на функцию-слушателя для возможности отписки
    this.statusChangeListeners.set(index, statusChangeListener);
    
    console.log(`📢 ArrowDisplay.subscribeToBeatUnitEvents: подписан на события BeatUnit[${index}]`);
  }

  /**
   * Отписывается от всех событий BeatUnit
   */
  clearStatusChangeListeners() {
    console.log(`📢 ArrowDisplay.clearStatusChangeListeners: отписка от ${this.statusChangeListeners.size} слушателей`);
    
    // Проходим по всем слушателям и отписываемся
    this.statusChangeListeners.forEach((listener, index) => {
      if (this.beatUnits && this.beatUnits[index]) {
        const beatUnit = this.beatUnits[index];
        const removed = beatUnit.removeStatusChangeListener(listener);
        if (removed) {
          console.log(`📢 ArrowDisplay.clearStatusChangeListeners: отписан от BeatUnit[${index}]`);
        }
      }
    });
    
    // Очищаем Map слушателей
    this.statusChangeListeners.clear();
  }

  /**
   * Обрабатывает событие изменения статуса BeatUnit
   * @param {number} index - Индекс BeatUnit
   * @param {Object} event - Объект события с beatUnit, oldStatus, newStatus
   */
  onBeatUnitStatusChange(index, event) {
    const { beatUnit, oldStatus, newStatus } = event;
    
    console.log(`📢 ArrowDisplay.onBeatUnitStatusChange[${index}]: "${oldStatus ? oldStatus.getStatusString() : 'null'}" -> "${newStatus ? newStatus.getStatusString() : 'null'}"`);
    
    // Обновляем отображение
    this.updateDisplay();
    
    // Вызываем callback для изменения статуса (обратная совместимость)
    if (this.onPlayStatusChange) {
      this.onPlayStatusChange(index, newStatus);
    }
    
    // Получаем полную информацию о длительности
    const fullInfo = this.getBeatFullInfo(index);
    
    // Вызываем новый callback с полной информацией
    if (this.onBeatClick) {
      this.onBeatClick(fullInfo);
    }
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
    if (index >= 0 && index < this.beatUnits.length) {
      const beatUnit = this.beatUnits[index];
      console.log(`🔄 ArrowDisplay.setPlayStatus(${index}): устанавливаем статус в BeatUnit`);
      
      // Устанавливаем статус напрямую в BeatUnit
      // Это обеспечит автоматическое уведомление всех слушателей через события
      beatUnit.setPlayStatus(playStatus);
    } else {
      console.log(`❌ ArrowDisplay.setPlayStatus(${index}): индекс вне диапазона BeatUnit`);
    }
  }

  /**
   * Получает состояние воспроизведения для стрелочки
   * @param {number} index - Индекс стрелочки
   * @returns {PlayStatus|null} Состояние воспроизведения
   */
  getPlayStatus(index) {
    if (index >= 0 && index < this.beatUnits.length) {
      // Получаем статус напрямую из BeatUnit
      const beatUnit = this.beatUnits[index];
      console.log(`🔄 ArrowDisplay.getPlayStatus(${index}): получаем статус из BeatUnit`);
      
      const playStatus = beatUnit.getPlayStatus();
      
      // Убеждаемся, что у нас есть корректный объект PlayStatus
      if (!playStatus || typeof playStatus.getStatusString !== 'function') {
        console.log(`🔄 ArrowDisplay.getPlayStatus(${index}): BeatUnit вернул некорректный PlayStatus, ИСПОЛЬЗУЕМ СТАТИЧЕСКИЙ экземпляр`);
        const status = index === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
        const newPlayStatus = PlayStatus.getInstance(status);
        console.log(`🆕 ArrowDisplay.getPlayStatus[${index}]: ИСПОЛЬЗУЕТСЯ СТАТИЧЕСКИЙ PlayStatus со статусом ${status}, ID: ${newPlayStatus.constructor.name}_${newPlayStatus.status} (в getPlayStatus)`);
        // НЕ устанавливаем этот статус обратно в BeatUnit, чтобы избежать создания дубликатов
        return newPlayStatus;
      }
      
      console.log(`🔄 ArrowDisplay.getPlayStatus(${index}): "${playStatus.getStatusString()}" [${playStatus.status}]`);
      console.log(`🔄 ArrowDisplay ${index + 1}: PlayStatus object ID: ${playStatus.constructor.name}_${playStatus.status}`);
      return playStatus;
    }
    return null;
  }

  /**
   * Получает все состояния воспроизведения
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  getAllPlayStatuses() {
    // Получаем все PlayStatus из BeatUnit
    return this.beatUnits.map(beatUnit => beatUnit.getPlayStatus());
  }

  /**
   * Устанавливает состояния воспроизведения для всех стрелочек
   * @param {PlayStatus[]|number[]} playStatuses - Массив состояний воспроизведения
   */
  setAllPlayStatuses(playStatuses) {
    if (Array.isArray(playStatuses)) {
      console.log('🎯 ArrowDisplay.setAllPlayStatuses: устанавливаем', playStatuses.length, 'статусов');
      
      playStatuses.forEach((status, index) => {
        if (index < this.beatUnits.length) {
          const beatUnit = this.beatUnits[index];
          
          // Устанавливаем статус напрямую в BeatUnit
          // BeatUnit сам создаст PlayStatus при необходимости
          beatUnit.setPlayStatus(status);
          
          if (typeof status === 'number') {
            console.log(`🔄 ArrowDisplay.setAllPlayStatuses[${index}]: установлен статус ${status} в BeatUnit`);
          } else if (status && typeof status.getStatusString === 'function') {
            console.log(`🔄 ArrowDisplay.setAllPlayStatuses[${index}]: установлен статус "${status.getStatusString()}" в BeatUnit`);
          } else {
            console.log(`⚠️ ArrowDisplay.setAllPlayStatuses[${index}]: некорректный статус, используется стандартный`);
          }
        } else {
          console.log(`❌ ArrowDisplay.setAllPlayStatuses[${index}]: индекс вне диапазона BeatUnit`);
        }
      });
      
      // Отображение обновится автоматически через события BeatUnit
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
    // Сохраняем статусы из BeatUnit
    return this.beatUnits.map(beatUnit => {
      const playStatus = beatUnit.getPlayStatus();
      return playStatus ? playStatus.toJSON() : { status: PlayStatus.STATUS.SKIP };
    });
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

    // Восстанавливаем статусы в BeatUnit
    savedStatuses.forEach((statusData, index) => {
      if (index < this.beatUnits.length) {
        const beatUnit = this.beatUnits[index];
        
        // Устанавливаем статус напрямую в BeatUnit
        // BeatUnit сам создаст PlayStatus при необходимости
        console.log(`🔄 ArrowDisplay.restorePlayStatuses[${index}]: УСТАНАВЛИВАЕМ СТАТУС в BeatUnit`);
        beatUnit.setPlayStatus(statusData);
        
        if (typeof statusData === 'object' && statusData !== null) {
          console.log(`🔄 ArrowDisplay.restorePlayStatuses[${index}]: восстановлен статус из JSON в BeatUnit`);
        } else if (typeof statusData === 'number') {
          console.log(`🔄 ArrowDisplay.restorePlayStatuses[${index}]: восстановлен статус ${statusData} в BeatUnit`);
        } else {
          console.log(`⚠️ ArrowDisplay.restorePlayStatuses[${index}]: некорректные данные, используется стандартный статус`);
        }
      } else {
        console.log(`❌ ArrowDisplay.restorePlayStatuses[${index}]: индекс вне диапазона BeatUnit`);
      }
    });

    // Если количество восстановленных статусов меньше количества BeatUnit,
    // устанавливаем стандартные статусы для оставшихся
    for (let i = savedStatuses.length; i < this.beatUnits.length; i++) {
      const status = i === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      console.log(`🔄 ArrowDisplay.restorePlayStatuses[${i}]: УСТАНАВЛИВАЕМ СТАНДАРТНЫЙ СТАТИЧЕСКИЙ статус ${status}`);
      this.beatUnits[i].setPlayStatus(status);
      console.log(`🔄 ArrowDisplay.restorePlayStatuses[${i}]: установлен стандартный статус ${status}`);
    }

    console.log(`🔄 ArrowDisplay: восстановлено ${Math.min(savedStatuses.length, this.beatUnits.length)} состояний в BeatUnit`);
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
      playStatuses: this.beatUnits.map(beatUnit => {
        const playStatus = beatUnit.getPlayStatus();
        return playStatus ? playStatus.toJSON() : { status: PlayStatus.STATUS.SKIP };
      })
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
      config.playStatuses.forEach((statusData, index) => {
        if (index < this.beatUnits.length) {
          const beatUnit = this.beatUnits[index];
          
          // Устанавливаем статус напрямую в BeatUnit
          // BeatUnit сам создаст PlayStatus при необходимости
          console.log(`🔄 ArrowDisplay.importConfig[${index}]: УСТАНАВЛИВАЕМ СТАТУС в BeatUnit`);
          beatUnit.setPlayStatus(statusData);
          
          if (typeof statusData === 'object' && statusData !== null) {
            console.log(`🔄 ArrowDisplay.importConfig[${index}]: восстановлен статус из JSON в BeatUnit`);
          } else if (typeof statusData === 'number') {
            console.log(`🔄 ArrowDisplay.importConfig[${index}]: установлен статус ${statusData} в BeatUnit`);
          } else {
            console.log(`⚠️ ArrowDisplay.importConfig[${index}]: некорректные данные, используется стандартный статус`);
          }
        } else {
          console.log(`❌ ArrowDisplay.importConfig[${index}]: индекс вне диапазона BeatUnit`);
        }
      });
    }
    
    this.updateDisplay();
  }
  
  /**
   * Очищает ресурсы при уничтожении объекта
   * Отписывается от всех событий BeatUnit
   */
  destroy() {
    console.log('🔄 ArrowDisplay.destroy: очистка ресурсов');
    this.clearStatusChangeListeners();
    this.container = null;
    this.countSelect = null;
    this.arrows = [];
    this.beatUnits = [];
    this.onPlayStatusChange = null;
    this.onBeatClick = null;
  }
}

/*
 * ИЗМЕНЕНИЯ В АРХИТЕКТУРЕ ARROWDISPLAY:
 *
 * 1. Удалено прямое создание экземпляров PlayStatus в ArrowDisplay:
 *    - Все PlayStatus теперь управляются через BeatUnit
 *    - Удален массив playStatuses из ArrowDisplay
 *    - BeatUnit стал единым источником правды для статусов воспроизведения
 *
 * 2. Обновлены методы для работы с BeatUnit:
 *    - initializePlayStatuses() создает BeatUnit, которые сами управляют PlayStatus
 *    - createArrowElement() получает PlayStatus из BeatUnit
 *    - handleCircleClick() изменяет статус через BeatUnit.toggleStatus()
 *    - getPlayStatus() получает статус напрямую из BeatUnit
 *    - setPlayStatus() устанавливает статус напрямую в BeatUnit
 *    - getBeatFullInfo() использует PlayStatus из BeatUnit
 *    - setAllPlayStatuses() устанавливает статусы в BeatUnit
 *    - restorePlayStatuses() восстанавливает статусы в BeatUnit
 *    - importConfig() импортирует статусы в BeatUnit
 *    - getAllPlayStatuses() получает все статусы из BeatUnit
 *    - saveCurrentPlayStatuses() сохраняет статусы из BeatUnit
 *    - exportConfig() экспортирует статусы из BeatUnit
 *
 * 3. Механизм событий для синхронизации с BeatUnit:
 *    - statusChangeListeners (Map) для хранения слушателей событий BeatUnit
 *    - subscribeToBeatUnitEvents() для подписки на события BeatUnit
 *    - clearStatusChangeListeners() для отписки от всех событий
 *    - onBeatUnitStatusChange() для обработки изменений статуса BeatUnit
 *
 * 4. Преимущества новой архитектуры:
 *    - Единый источник правды для статусов воспроизведения
 *    - Упрощенная синхронизация между компонентами
 *    - Снижение дублирования кода
 *    - Улучшенное разделение ответственности
 *
 * 5. Сохранена обратная совместимость с существующим кодом
 *
 * 6. Добавлен метод destroy() для корректной очистки ресурсов
 */
