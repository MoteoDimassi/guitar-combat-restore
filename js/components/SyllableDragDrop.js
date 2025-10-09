/**
 * @fileoverview Компонент для управления перетаскиванием слогов под стрелки.
 * Позволяет пользователю перетаскивать слоги из текста песни и размещать их под стрелками боя.
 */

export class SyllableDragDrop {
  constructor(beatRow) {
    this.beatRow = beatRow;
    this.draggedElement = null;
    this.draggedSyllableData = null;
    this.draggedSyllableId = null; // ID перетаскиваемого слога
    this.dropZones = [];
    
    // Новая структура: массив всех слогов с их позициями
    // { id, text, barIndex, arrowIndex, word, syllableIndex }
    this.allSyllables = [];
  }

  init() {
    this.loadAllSyllables(); // Загружаем сохранённые данные или создаём новые
    this.initializeSyllables();
    this.updateDropZones();
    this.updateDropZonesVisibility();
  }

  /**
   * Создаёт или загружает полный список всех слогов из текста песни
   */
  loadAllSyllables() {
    // Пытаемся загрузить сохранённые данные
    const saved = this.loadSyllablesFromStorage();
    if (saved && saved.length > 0) {
      this.allSyllables = saved;
      return;
    }

    // Если нет сохранённых данных, создаём с нуля
    this.createAllSyllablesFromText();
  }

  /**
   * Создаёт массив всех слогов из текста песни
   */
  createAllSyllablesFromText() {
    this.allSyllables = [];
    
    const songContent = document.getElementById('song-content');
    if (!songContent) return;

    // Получаем все строки текста (разделённые <br>)
    const innerHTML = songContent.innerHTML;
    if (!innerHTML || innerHTML.trim() === '') return;
    
    const lines = innerHTML.split('<br>');
    if (!lines || lines.length < 3) return; // Минимум: заголовок + пустая строка + текст
    
    // Убираем заголовок песни (первые две строки)
    const textLines = lines.slice(2);

    let globalSyllableId = 0;
    let barIndex = 0;

    // Проходим по каждой непустой строке (такту)
    textLines.forEach((lineHtml) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = lineHtml;
      
      if (!tempDiv.textContent.trim()) return; // Пропускаем пустые строки

      // Получаем все слоги в этой строке
      const syllableElements = tempDiv.querySelectorAll('.syllable');
      
      if (!syllableElements || syllableElements.length === 0) {
        // Если в строке нет слогов, всё равно увеличиваем barIndex
        barIndex++;
        return;
      }
      
      syllableElements.forEach((syllableEl, arrowIndex) => {
        const syllable = {
          id: `syllable-${globalSyllableId++}`,
          text: syllableEl.textContent || '',
          barIndex: barIndex,
          arrowIndex: arrowIndex,
          word: syllableEl.getAttribute('data-word') || '',
          syllableIndex: syllableEl.getAttribute('data-syllable-index') || '0'
        };
        
        this.allSyllables.push(syllable);
      });

      barIndex++;
    });

    // Сохраняем созданные данные только если есть слоги
    if (this.allSyllables.length > 0) {
      this.saveSyllablesToStorage();
    }
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
   * Делает слог перетаскиваемым (НЕ используется больше, т.к. перетаскиваются размещённые слоги)
   * @param {HTMLElement} syllable - элемент слога
   */
  makeSyllableDraggable(syllable) {
    // Слоги из текста больше не перетаскиваются напрямую
    // Вся логика работает через размещённые слоги
  }

  /**
   * Делает размещённый слог перетаскиваемым
   * @param {HTMLElement} placedSyllable - элемент размещённого слога
   * @param {string} syllableId - ID слога в массиве allSyllables
   */
  makePlacedSyllableDraggable(placedSyllable, syllableId) {
    placedSyllable.style.cursor = 'move';
    placedSyllable.setAttribute('data-syllable-id', syllableId);

    placedSyllable.addEventListener('dragstart', (e) => {
      this.draggedElement = placedSyllable;
      this.draggedSyllableId = syllableId;

      // Добавляем визуальный эффект
      placedSyllable.classList.add('dragging');
      placedSyllable.style.opacity = '0.5';

      // Устанавливаем данные для передачи
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', placedSyllable.textContent);
    });

    placedSyllable.addEventListener('dragend', (e) => {
      // Убираем визуальный эффект
      placedSyllable.classList.remove('dragging');
      placedSyllable.style.opacity = '1';
      this.draggedElement = null;
      this.draggedSyllableId = null;
    });

    // Добавляем эффект наведения
    placedSyllable.addEventListener('mouseenter', () => {
      if (!placedSyllable.classList.contains('dragging')) {
        placedSyllable.style.opacity = '0.8';
      }
    });

    placedSyllable.addEventListener('mouseleave', () => {
      if (!placedSyllable.classList.contains('dragging')) {
        placedSyllable.style.opacity = '1';
      }
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
      e.dataTransfer.dropEffect = 'move';
      
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

      if (this.draggedSyllableId && this.allSyllables && this.allSyllables.length > 0) {
        // Находим слог в массиве и меняем его arrowIndex
        const syllable = this.allSyllables.find(s => s && s.id === this.draggedSyllableId);
        if (syllable) {
          syllable.arrowIndex = arrowIndex;
          this.saveSyllablesToStorage();
          
          // Перерисовываем текущий такт
          if (typeof syllable.barIndex !== 'undefined') {
            this.renderBarSyllables(syllable.barIndex);
          }
        }
      }
    });
  }

  /**
   * Отображает слоги для указанного такта
   * @param {number} barIndex - индекс такта
   */
  renderBarSyllables(barIndex) {
    if (!this.beatRow || !this.beatRow.element) return;
    if (!this.allSyllables || this.allSyllables.length === 0) return;

    // Очищаем все drop-зоны
    const dropZones = this.beatRow.element.querySelectorAll('.syllable-drop-zone');
    if (!dropZones) return;
    
    dropZones.forEach(zone => {
      if (zone) zone.innerHTML = '';
    });

    // Получаем все слоги для этого такта
    const barSyllables = this.allSyllables.filter(s => s && s.barIndex === barIndex);
    if (!barSyllables || barSyllables.length === 0) return;

    // Размещаем каждый слог в соответствующей drop-зоне
    barSyllables.forEach(syllable => {
      if (!syllable) return;
      
      const dropZone = this.beatRow.element.querySelector(
        `.syllable-drop-zone[data-arrow-index="${syllable.arrowIndex}"]`
      );
      if (dropZone) {
        this.renderSyllableInZone(dropZone, syllable);
      }
    });
  }

  /**
   * Отображает слог в drop-зоне
   * @param {HTMLElement} dropZone - элемент drop-зоны
   * @param {Object} syllable - данные слога
   */
  renderSyllableInZone(dropZone, syllable) {
    if (!dropZone || !syllable) return;
    
    const text = syllable.text || '';
    const id = syllable.id || '';
    
    dropZone.innerHTML = `
      <div class="placed-syllable" draggable="true">
        <span class="syllable-text">${text}</span>
        <button class="remove-syllable" data-syllable-id="${id}" title="Удалить слог">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;

    // Делаем слог перетаскиваемым
    const placedSyllable = dropZone.querySelector('.placed-syllable');
    if (placedSyllable && id) {
      this.makePlacedSyllableDraggable(placedSyllable, id);
    }

    // Добавляем обработчик удаления
    const removeBtn = dropZone.querySelector('.remove-syllable');
    if (removeBtn && id) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeSyllable(id);
      });
    }
  }

  /**
   * Удаляет слог по ID
   * @param {string} syllableId - ID слога
   */
  removeSyllable(syllableId) {
    if (!syllableId || !this.allSyllables || this.allSyllables.length === 0) return;
    
    const index = this.allSyllables.findIndex(s => s && s.id === syllableId);
    if (index !== -1) {
      const syllable = this.allSyllables[index];
      this.allSyllables.splice(index, 1);
      this.saveSyllablesToStorage();
      
      // Перерисовываем такт
      if (syllable && typeof syllable.barIndex !== 'undefined') {
        this.renderBarSyllables(syllable.barIndex);
      }
    }
  }

  /**
   * Сохраняет все слоги в localStorage
   */
  saveSyllablesToStorage() {
    try {
      localStorage.setItem('allSyllables', JSON.stringify(this.allSyllables));
    } catch (e) {
      console.error('Ошибка сохранения слогов:', e);
    }
  }

  /**
   * Загружает все слоги из localStorage
   * @returns {Array} массив слогов или null
   */
  loadSyllablesFromStorage() {
    try {
      const saved = localStorage.getItem('allSyllables');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Ошибка загрузки слогов:', e);
    }
    return null;
  }

  /**
   * Получает слоги для конкретного такта
   * @param {number} barIndex - индекс такта
   * @returns {Array} массив слогов такта
   */
  getBarSyllables(barIndex) {
    if (!this.allSyllables || this.allSyllables.length === 0) return [];
    return this.allSyllables.filter(s => s && s.barIndex === barIndex);
  }

  /**
   * Очищает все слоги
   */
  clearAllSyllables() {
    this.allSyllables = [];
    if (this.dropZones && this.dropZones.length > 0) {
      this.dropZones.forEach(dropZone => {
        if (dropZone) dropZone.innerHTML = '';
      });
    }
    this.saveSyllablesToStorage();
  }

  /**
   * Пересоздаёт слоги из текста (например, при обновлении текста песни)
   */
  recreateSyllables() {
    this.createAllSyllablesFromText();
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

