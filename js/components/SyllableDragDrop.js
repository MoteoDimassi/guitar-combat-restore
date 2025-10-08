/**
 * @fileoverview Компонент для управления перетаскиванием слогов под стрелки.
 * Позволяет пользователю перетаскивать слоги из текста песни и размещать их под стрелками боя.
 */

export class SyllableDragDrop {
  constructor(beatRow) {
    this.beatRow = beatRow;
    this.draggedElement = null;
    this.draggedSyllableData = null;
    this.dropZones = [];
    this.syllablePositions = {}; // { arrowIndex: { text: string, element: HTMLElement } }
  }

  init() {
    this.initializeSyllables();
    this.updateDropZones();
    this.updateDropZonesVisibility();
  }

  /**
   * Инициализация drag-and-drop для всех слогов в тексте песни
   */
  initializeSyllables() {
    const songContent = document.getElementById('song-content');
    if (!songContent) return;

    const syllables = songContent.querySelectorAll('.syllable');
    syllables.forEach(syllable => {
      this.makeSyllableDraggable(syllable);
    });
  }

  /**
   * Делает слог перетаскиваемым
   * @param {HTMLElement} syllable - элемент слога
   */
  makeSyllableDraggable(syllable) {
    syllable.draggable = true;
    syllable.style.cursor = 'pointer';

    syllable.addEventListener('dragstart', (e) => {
      this.draggedElement = syllable;
      this.draggedSyllableData = {
        text: syllable.textContent,
        word: syllable.getAttribute('data-word') || '',
        index: syllable.getAttribute('data-syllable-index') || '0'
      };

      // Добавляем визуальный эффект при начале перетаскивания
      syllable.classList.add('dragging');
      syllable.style.opacity = '0.5';

      // Устанавливаем данные для передачи
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', syllable.textContent);
    });

    syllable.addEventListener('dragend', (e) => {
      // Убираем визуальный эффект
      syllable.classList.remove('dragging');
      syllable.style.opacity = '1';
      this.draggedElement = null;
      this.draggedSyllableData = null;
    });

    // Добавляем эффект наведения
    syllable.addEventListener('mouseenter', () => {
      if (!syllable.classList.contains('dragging')) {
        syllable.classList.add('syllable-hover');
      }
    });

    syllable.addEventListener('mouseleave', () => {
      syllable.classList.remove('syllable-hover');
    });
  }

  /**
   * Обновляет drop-зоны под стрелками
   */
  updateDropZones() {
    if (!this.beatRow || !this.beatRow.element) return;

    // Получаем все wrapper-ы стрелок
    const wrappers = this.beatRow.element.querySelectorAll('.beat-wrapper, .flex.flex-col');
    
    wrappers.forEach((wrapper, index) => {
      // Проверяем, есть ли уже drop-зона
      let dropZone = wrapper.querySelector('.syllable-drop-zone');
      
      if (!dropZone) {
        // Создаем drop-зону
        dropZone = document.createElement('div');
        dropZone.className = 'syllable-drop-zone';
        dropZone.setAttribute('data-arrow-index', index);
        wrapper.appendChild(dropZone);
      }

      // Если уже есть размещенный слог, восстанавливаем его
      if (this.syllablePositions[index]) {
        this.renderPlacedSyllable(dropZone, index);
      }

      // Настраиваем обработчики drop-зоны
      this.setupDropZone(dropZone, index);
    });

    this.dropZones = Array.from(this.beatRow.element.querySelectorAll('.syllable-drop-zone'));
    
    // Обновляем видимость drop-зон после их создания/обновления
    this.updateDropZonesVisibility();
  }

  /**
   * Настраивает обработчики для drop-зоны
   * @param {HTMLElement} dropZone - элемент drop-зоны
   * @param {number} arrowIndex - индекс стрелки
   */
  setupDropZone(dropZone, arrowIndex) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      
      // Подсвечиваем зону при наведении
      dropZone.classList.add('drop-zone-active');
    });

    dropZone.addEventListener('dragleave', (e) => {
      // Убираем подсветку
      dropZone.classList.remove('drop-zone-active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone-active');

      if (this.draggedSyllableData) {
        this.placeSyllable(arrowIndex, this.draggedSyllableData);
      }
    });
  }

  /**
   * Размещает слог в указанной позиции
   * @param {number} arrowIndex - индекс стрелки
   * @param {Object} syllableData - данные слога
   */
  placeSyllable(arrowIndex, syllableData) {
    // Сохраняем позицию слога
    this.syllablePositions[arrowIndex] = {
      text: syllableData.text,
      word: syllableData.word,
      index: syllableData.index
    };

    // Находим drop-зону и отображаем слог
    const dropZone = this.beatRow.element.querySelector(`.syllable-drop-zone[data-arrow-index="${arrowIndex}"]`);
    if (dropZone) {
      this.renderPlacedSyllable(dropZone, arrowIndex);
    }

    // Сохраняем в localStorage
    this.saveSyllablePositions();
  }

  /**
   * Отображает размещенный слог в drop-зоне
   * @param {HTMLElement} dropZone - элемент drop-зоны
   * @param {number} arrowIndex - индекс стрелки
   */
  renderPlacedSyllable(dropZone, arrowIndex) {
    const syllableData = this.syllablePositions[arrowIndex];
    if (!syllableData) {
      dropZone.innerHTML = '';
      return;
    }

    dropZone.innerHTML = `
      <div class="placed-syllable">
        <span class="syllable-text">${syllableData.text}</span>
        <button class="remove-syllable" data-arrow-index="${arrowIndex}" title="Удалить слог">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;

    // Добавляем обработчик удаления
    const removeBtn = dropZone.querySelector('.remove-syllable');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeSyllable(arrowIndex);
      });
    }
  }

  /**
   * Удаляет слог из указанной позиции
   * @param {number} arrowIndex - индекс стрелки
   */
  removeSyllable(arrowIndex) {
    delete this.syllablePositions[arrowIndex];
    
    const dropZone = this.beatRow.element.querySelector(`.syllable-drop-zone[data-arrow-index="${arrowIndex}"]`);
    if (dropZone) {
      dropZone.innerHTML = '';
    }

    this.saveSyllablePositions();
  }

  /**
   * Сохраняет позиции слогов в localStorage
   */
  saveSyllablePositions() {
    try {
      localStorage.setItem('syllablePositions', JSON.stringify(this.syllablePositions));
    } catch (e) {
      console.error('Ошибка сохранения позиций слогов:', e);
    }
  }

  /**
   * Загружает позиции слогов из localStorage
   */
  loadSyllablePositions() {
    try {
      const saved = localStorage.getItem('syllablePositions');
      if (saved) {
        this.syllablePositions = JSON.parse(saved);
        this.updateDropZones();
      }
    } catch (e) {
      console.error('Ошибка загрузки позиций слогов:', e);
      this.syllablePositions = {};
    }
  }

  /**
   * Очищает все размещенные слоги
   */
  clearAllSyllables() {
    this.syllablePositions = {};
    this.dropZones.forEach(dropZone => {
      dropZone.innerHTML = '';
    });
    this.saveSyllablePositions();
  }

  /**
   * Получает позиции слогов
   * @returns {Object} объект с позициями слогов
   */
  getSyllablePositions() {
    return { ...this.syllablePositions };
  }

  /**
   * Устанавливает позиции слогов
   * @param {Object} positions - объект с позициями слогов
   */
  setSyllablePositions(positions) {
    this.syllablePositions = positions || {};
    this.updateDropZones();
  }

  /**
   * Обновляет количество drop-зон при изменении количества стрелок
   */
  onBeatCountChanged() {
    this.updateDropZones();
  }

  /**
   * Проверяет наличие текста песни в localStorage
   * @returns {boolean} true если текст песни существует
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
   * Обновляет видимость drop-зон в зависимости от наличия текста песни
   */
  updateDropZonesVisibility() {
    const hasSong = this.hasSongText();
    const dropZones = document.querySelectorAll('.syllable-drop-zone');
    
    dropZones.forEach(zone => {
      if (hasSong) {
        zone.style.display = '';
        zone.classList.remove('hidden');
      } else {
        zone.style.display = 'none';
        zone.classList.add('hidden');
      }
    });
  }

  /**
   * Показывает drop-зоны (вызывается после добавления текста песни)
   */
  showDropZones() {
    const dropZones = document.querySelectorAll('.syllable-drop-zone');
    dropZones.forEach(zone => {
      zone.style.display = '';
      zone.classList.remove('hidden');
    });
  }

  /**
   * Скрывает drop-зоны (вызывается после удаления текста песни)
   */
  hideDropZones() {
    const dropZones = document.querySelectorAll('.syllable-drop-zone');
    dropZones.forEach(zone => {
      zone.style.display = 'none';
      zone.classList.add('hidden');
    });
  }
}

