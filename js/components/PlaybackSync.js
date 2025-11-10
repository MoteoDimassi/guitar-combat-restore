/**
 * @fileoverview Компонент для синхронизации воспроизведения с тактами и слогами.
 * Обеспечивает визуальную синхронизацию между стрелками, слогами и аккордами.
 */

/**
 * Класс PlaybackSync - синхронизирует воспроизведение с системой тактов
 */
export class PlaybackSync {
  constructor(beatRow, barManager, barSyllableDisplay, chordDisplay, chordBarManager) {
    this.beatRow = beatRow;
    this.barManager = barManager;
    this.barSyllableDisplay = barSyllableDisplay;
    this.chordDisplay = chordDisplay;
    this.chordBarManager = chordBarManager;
    
    this.currentBarIndex = 0;
    this.currentArrowIndex = 0;
    this.isPlaying = false;
  }

  /**
   * Инициализация компонента
   */
  init() {
    // Подписываемся на события воспроизведения
    this.subscribeToPlaybackEvents();
  }

  /**
   * Подписывается на события воспроизведения
   */
  subscribeToPlaybackEvents() {
    // Следим за изменением позиции стрелки через beatRow
    if (this.beatRow) {
      this.beatRow.setOnPositionChange((arrowIndex) => {
        this.onArrowPositionChanged(arrowIndex);
      });
    }
  }

  /**
   * Обработчик изменения позиции стрелки
   */
  onArrowPositionChanged(arrowIndex) {
    this.currentArrowIndex = arrowIndex;
    
    // Определяем такт по индексу стрелки
    const barIndex = this.getBarIndexByArrowIndex(arrowIndex);
    
    // Если изменился такт, обновляем отображение
    if (barIndex !== this.currentBarIndex) {
      this.onBarChanged(barIndex);
    }
    
    // Обновляем аккорд (может измениться внутри такта)
    this.updateChordForArrow(arrowIndex);
  }

  /**
   * Обработчик смены такта
   */
  onBarChanged(newBarIndex) {
    const oldBarIndex = this.currentBarIndex;
    this.currentBarIndex = newBarIndex;

    // Обновляем отображение слогов с анимацией
    this.updateBarSyllablesWithAnimation(oldBarIndex, newBarIndex);

    // Обновляем отображение аккордов
    this.updateChordDisplay(newBarIndex);

    // Обновляем глобальное состояние
    if (window.app) {
      window.app.state.currentBarIndex = newBarIndex;
    }
  }

  /**
   * Обновляет отображение слогов с анимацией
   */
  updateBarSyllablesWithAnimation(oldBarIndex, newBarIndex) {
    if (!this.barSyllableDisplay) return;

    // Получаем drop-зоны
    const dropZones = document.querySelectorAll('.syllable-drop-zone');
    if (dropZones.length === 0) return;

    // Добавляем анимацию исчезновения старых слогов
    dropZones.forEach(zone => {
      const syllable = zone.querySelector('.bar-syllable-display');
      if (syllable) {
        syllable.style.transition = 'opacity 0.2s, transform 0.2s';
        syllable.style.opacity = '0';
        syllable.style.transform = 'translateY(-10px)';
      }
    });

    // Через небольшую задержку показываем новые слоги
    setTimeout(() => {
      // Переходим к новому такту
      this.barSyllableDisplay.goToBar(newBarIndex);

      // Добавляем анимацию появления
      setTimeout(() => {
        dropZones.forEach(zone => {
          const syllable = zone.querySelector('.bar-syllable-display');
          if (syllable) {
            syllable.style.opacity = '0';
            syllable.style.transform = 'translateY(10px)';
            
            // Запускаем анимацию появления
            setTimeout(() => {
              syllable.style.transition = 'opacity 0.3s, transform 0.3s';
              syllable.style.opacity = '1';
              syllable.style.transform = 'translateY(0)';
            }, 10);
          }
        });
      }, 10);
    }, 200);
  }

  /**
   * Обновляет отображение аккордов
   */
  updateChordDisplay(barIndex) {
    if (!this.chordDisplay || !this.barManager) return;

    const currentBar = this.barManager.getBar(barIndex);
    const nextBar = this.barManager.getBar(barIndex + 1);

    if (currentBar) {
      const currentChord = currentBar.getChord();
      const nextChord = nextBar ? nextBar.getChord() : currentChord;
      
      this.chordDisplay.setChords(currentChord, nextChord);
    }
  }

  /**
   * Обновляет аккорд для конкретной стрелки (с учётом изменений внутри такта)
   */
  updateChordForArrow(arrowIndex) {
    if (!this.chordBarManager) return;

    const chord = this.chordBarManager.getChordForArrow(arrowIndex);
    if (chord && this.chordDisplay) {
      // Обновляем только текущий аккорд, следующий оставляем без изменений
      const nextBar = this.barManager.getBar(this.currentBarIndex + 1);
      const nextChord = nextBar ? nextBar.getChord() : chord;
      
      this.chordDisplay.setChords(chord, nextChord);
    }
  }

  /**
   * Определяет индекс такта по индексу стрелки
   */
  getBarIndexByArrowIndex(arrowIndex) {
    if (!this.barManager) return 0;

    let totalArrows = 0;
    const bars = this.barManager.getAllBars();
    
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      totalArrows += bar.arrowCount;
      
      if (arrowIndex < totalArrows) {
        return i;
      }
    }
    
    return Math.max(0, bars.length - 1);
  }

  /**
   * Запускает воспроизведение
   */
  start() {
    this.isPlaying = true;
    this.currentBarIndex = 0;
    this.currentArrowIndex = 0;
  }

  /**
   * Останавливает воспроизведение
   */
  stop() {
    this.isPlaying = false;
  }

  /**
   * Приостанавливает воспроизведение
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Возобновляет воспроизведение
   */
  resume() {
    this.isPlaying = true;
  }

  /**
   * Сбрасывает состояние
   */
  reset() {
    this.currentBarIndex = 0;
    this.currentArrowIndex = 0;
    this.isPlaying = false;
    
    if (this.barSyllableDisplay) {
      this.barSyllableDisplay.goToBar(0);
    }
  }

  /**
   * Получает текущий индекс такта
   */
  getCurrentBarIndex() {
    return this.currentBarIndex;
  }

  /**
   * Получает текущий индекс стрелки
   */
  getCurrentArrowIndex() {
    return this.currentArrowIndex;
  }
}

