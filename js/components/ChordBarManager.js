/**
 * @fileoverview Компонент для управления аккордами в тактах.
 * Связывает систему тактов с визуализацией аккордов.
 */

/**
 * Класс ChordBarManager - управляет аккордами в контексте тактов
 */
export class ChordBarManager {
  constructor(barManager, chordManager, chordDisplay, beatRow) {
    this.barManager = barManager;
    this.chordManager = chordManager;
    this.chordDisplay = chordDisplay;
    this.beatRow = beatRow;
    
    // Карта изменений аккордов: { barIndex: { arrowIndex: chordName } }
    this.chordChanges = new Map();
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.bindArrowClickEvents();
  }

  /**
   * Привязывает обработчики кликов к стрелочкам
   */
  bindArrowClickEvents() {
    if (!this.beatRow || !this.beatRow.element) return;

    // Делегируем обработку кликов на стрелки
    this.beatRow.element.addEventListener('click', (e) => {
      const arrowContainer = e.target.closest('.arrow-container');
      if (!arrowContainer) return;

      // Находим индекс стрелки
      const wrapper = arrowContainer.closest('.flex.flex-col');
      if (!wrapper) return;

      const allWrappers = Array.from(this.beatRow.element.querySelectorAll('.flex.flex-col'));
      const arrowIndex = allWrappers.indexOf(wrapper);

      if (arrowIndex >= 0) {
        this.handleArrowClick(arrowIndex);
      }
    });
  }

  /**
   * Обработчик клика на стрелку
   */
  handleArrowClick(arrowIndex) {
    // Определяем текущий такт
    const currentBarIndex = this.getCurrentBarIndex();
    const bar = this.barManager.getBar(currentBarIndex);
    
    if (!bar) return;

    const arrowCount = bar.arrowCount;
    const arrowInBar = arrowIndex % arrowCount;

    // Клик на первую стрелку такта
    if (arrowInBar === 0 && currentBarIndex > 0) {
      this.handleFirstArrowClick(currentBarIndex);
    } else {
      // Клик на любую другую стрелку
      this.handleOtherArrowClick(currentBarIndex, arrowInBar);
    }
  }

  /**
   * Обработчик клика на первую стрелку такта
   */
  handleFirstArrowClick(barIndex) {
    const currentBar = this.barManager.getBar(barIndex);
    const previousBar = this.barManager.getBar(barIndex - 1);
    
    if (!currentBar || !previousBar) return;

    const currentChord = currentBar.getChord();
    const previousChord = previousBar.getChord();

    // Показываем диалог выбора
    const choice = confirm(
      `Текущий аккорд: ${currentChord}\n` +
      `Предыдущий аккорд: ${previousChord}\n\n` +
      `Нажмите OK, чтобы оставить аккорд из предыдущего такта\n` +
      `Нажмите Отмена, чтобы оставить текущий аккорд`
    );

    if (choice) {
      // Меняем аккорд на предыдущий
      currentBar.setChord(previousChord);
      this.updateChordDisplay();
      
      // Сохраняем изменение
      this.recordChordChange(barIndex, 0, previousChord);
    }
  }

  /**
   * Обработчик клика на любую другую стрелку в такте
   */
  handleOtherArrowClick(barIndex, arrowInBar) {
    const currentBar = this.barManager.getBar(barIndex);
    if (!currentBar) return;

    const currentChord = currentBar.getChord();
    const chords = this.getAvailableChords();
    
    if (!chords || chords.length === 0) return;

    // Находим индекс текущего аккорда
    const currentIndex = chords.indexOf(currentChord);
    const nextIndex = (currentIndex + 1) % chords.length;
    const nextChord = chords[nextIndex];

    // Показываем диалог выбора
    const choice = confirm(
      `Текущий аккорд: ${currentChord}\n` +
      `Следующий в списке: ${nextChord}\n\n` +
      `Нажмите OK, чтобы сменить на следующий аккорд\n` +
      `Нажмите Отмена, чтобы оставить текущий аккорд`
    );

    if (choice) {
      // Записываем смену аккорда внутри такта
      this.recordChordChange(barIndex, arrowInBar, nextChord);
      
      // Обновляем визуальную индикацию
      this.updateChordDisplay();
      this.addChordChangeMarker(barIndex, arrowInBar);
    }
  }

  /**
   * Записывает изменение аккорда
   */
  recordChordChange(barIndex, arrowInBar, chordName) {
    if (!this.chordChanges.has(barIndex)) {
      this.chordChanges.set(barIndex, {});
    }
    
    const barChanges = this.chordChanges.get(barIndex);
    barChanges[arrowInBar] = chordName;
    
    // Сохраняем в localStorage
    this.saveChordChanges();
  }

  /**
   * Добавляет визуальный маркер смены аккорда на стрелку
   */
  addChordChangeMarker(barIndex, arrowInBar) {
    if (!this.beatRow || !this.beatRow.element) return;

    const bar = this.barManager.getBar(barIndex);
    if (!bar) return;

    // Вычисляем глобальный индекс стрелки
    let globalArrowIndex = 0;
    for (let i = 0; i < barIndex; i++) {
      const prevBar = this.barManager.getBar(i);
      if (prevBar) {
        globalArrowIndex += prevBar.arrowCount;
      }
    }
    globalArrowIndex += arrowInBar;

    // Находим элемент стрелки
    const allWrappers = Array.from(this.beatRow.element.querySelectorAll('.flex.flex-col'));
    const wrapper = allWrappers[globalArrowIndex];
    
    if (!wrapper) return;

    // Добавляем визуальный маркер (звёздочка или точка)
    const arrowContainer = wrapper.querySelector('.arrow-container');
    if (!arrowContainer) return;

    // Проверяем, есть ли уже маркер
    if (arrowContainer.querySelector('.chord-change-marker')) {
      return;
    }

    // Создаём маркер
    const marker = document.createElement('div');
    marker.className = 'chord-change-marker';
    marker.innerHTML = '★';
    marker.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      color: #38e07b;
      font-size: 16px;
      font-weight: bold;
    `;
    
    arrowContainer.style.position = 'relative';
    arrowContainer.appendChild(marker);
  }

  /**
   * Получает аккорд для конкретной стрелки с учётом изменений внутри такта
   */
  getChordForArrow(arrowIndex) {
    const barIndex = this.getBarIndexByArrowIndex(arrowIndex);
    const bar = this.barManager.getBar(barIndex);
    
    if (!bar) return null;

    const arrowInBar = this.getArrowInBar(arrowIndex, barIndex);
    
    // Проверяем, есть ли изменения аккорда для этого такта
    if (this.chordChanges.has(barIndex)) {
      const barChanges = this.chordChanges.get(barIndex);
      
      // Ищем последнее изменение аккорда до текущей стрелки
      let currentChord = bar.getChord();
      for (let i = 0; i <= arrowInBar; i++) {
        if (barChanges[i]) {
          currentChord = barChanges[i];
        }
      }
      return currentChord;
    }

    return bar.getChord();
  }

  /**
   * Определяет индекс такта по индексу стрелки
   */
  getBarIndexByArrowIndex(arrowIndex) {
    let totalArrows = 0;
    const bars = this.barManager.getAllBars();
    
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      totalArrows += bar.arrowCount;
      
      if (arrowIndex < totalArrows) {
        return i;
      }
    }
    
    return bars.length - 1;
  }

  /**
   * Определяет индекс стрелки внутри такта
   */
  getArrowInBar(globalArrowIndex, barIndex) {
    let totalArrows = 0;
    
    for (let i = 0; i < barIndex; i++) {
      const bar = this.barManager.getBar(i);
      if (bar) {
        totalArrows += bar.arrowCount;
      }
    }
    
    return globalArrowIndex - totalArrows;
  }

  /**
   * Получает текущий индекс такта
   */
  getCurrentBarIndex() {
    if (window.app && window.app.state) {
      return window.app.state.currentBarIndex || 0;
    }
    return 0;
  }

  /**
   * Получает список доступных аккордов
   */
  getAvailableChords() {
    const chordsInput = document.getElementById('chordsInput');
    if (!chordsInput) return [];

    const chordsString = chordsInput.value;
    return chordsString.split(' ')
      .map(ch => ch.trim())
      .filter(ch => ch.length > 0);
  }

  /**
   * Обновляет отображение аккордов
   */
  updateChordDisplay() {
    if (!this.chordDisplay) return;

    const currentBarIndex = this.getCurrentBarIndex();
    const currentBar = this.barManager.getBar(currentBarIndex);
    const nextBar = this.barManager.getBar(currentBarIndex + 1);

    if (currentBar) {
      const currentChord = currentBar.getChord();
      const nextChord = nextBar ? nextBar.getChord() : currentChord;
      
      this.chordDisplay.setChords(currentChord, nextChord);
    }
  }

  /**
   * Очищает все изменения аккордов
   */
  clearAllChordChanges() {
    this.chordChanges.clear();
    this.removeAllChordChangeMarkers();
    this.saveChordChanges();
  }

  /**
   * Удаляет все визуальные маркеры изменений аккордов
   */
  removeAllChordChangeMarkers() {
    if (!this.beatRow || !this.beatRow.element) return;

    const markers = this.beatRow.element.querySelectorAll('.chord-change-marker');
    markers.forEach(marker => marker.remove());
  }

  /**
   * Сохраняет изменения аккордов в localStorage
   */
  saveChordChanges() {
    try {
      const data = {};
      this.chordChanges.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem('chordChanges', JSON.stringify(data));
    } catch (e) {
      console.error('Ошибка сохранения изменений аккордов:', e);
    }
  }

  /**
   * Загружает изменения аккордов из localStorage
   */
  loadChordChanges() {
    try {
      const data = localStorage.getItem('chordChanges');
      if (data) {
        const parsed = JSON.parse(data);
        this.chordChanges.clear();
        
        Object.keys(parsed).forEach(key => {
          this.chordChanges.set(parseInt(key), parsed[key]);
        });
        
        // Восстанавливаем визуальные маркеры
        this.restoreChordChangeMarkers();
      }
    } catch (e) {
      console.error('Ошибка загрузки изменений аккордов:', e);
    }
  }

  /**
   * Восстанавливает визуальные маркеры изменений аккордов
   */
  restoreChordChangeMarkers() {
    this.chordChanges.forEach((barChanges, barIndex) => {
      Object.keys(barChanges).forEach(arrowInBar => {
        this.addChordChangeMarker(barIndex, parseInt(arrowInBar));
      });
    });
  }
}

