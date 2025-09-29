/**
 * ChordDisplay - компонент для отображения текущего и следующего аккорда над стрелочками
 * Показывает основной аккорд зеленым цветом большим шрифтом и следующий аккорд белым
 */
export class ChordDisplay {
  constructor() {
    this.currentChord = null;
    this.nextChord = null;
    this.currentBarIndex = 0;
    this.currentArrowIndex = 0;
    this.isVisible = true;
  }

  init() {
    this.createDisplayElement();
    this.updateDisplay();
  }

  createDisplayElement() {
    // Используем существующий контейнер из HTML
    this.container = document.getElementById('chordDisplay');
    if (!this.container) {
      // Fallback: создаем контейнер если его нет в HTML
      this.container = document.createElement('div');
      this.container.id = 'chordDisplay';
      this.container.className = 'absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-10';

      const beatVisualization = document.querySelector('.layout-content-container .relative');
      if (beatVisualization) {
        beatVisualization.insertBefore(this.container, beatVisualization.firstChild);
      }
    }

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Создаем элементы для текущего и следующего аккорда
    this.currentChordElement = document.createElement('div');
    this.currentChordElement.className = 'text-[#38e07b] font-bold text-2xl tracking-wider transition-all duration-200';
    this.currentChordElement.textContent = '--';

    this.nextChordElement = document.createElement('div');
    this.nextChordElement.className = 'text-white font-medium text-lg tracking-wide opacity-80 transition-all duration-200';
    this.nextChordElement.textContent = '--';

    this.container.appendChild(this.currentChordElement);
    this.container.appendChild(this.nextChordElement);
  }

  updateCurrentChord(chord, barIndex, arrowIndex) {
    this.currentChord = chord;
    this.currentBarIndex = barIndex;
    this.currentArrowIndex = arrowIndex;
    this.updateDisplay();

    // Обновляем следующий аккорд
    this.updateNextChord();
  }

  updateNextChord() {
    if (window.app && window.app.metronome && window.app.metronome.chordManager) {
      const chordManager = window.app.metronome.chordManager;
      const parsedChords = chordManager.getChords();

      if (parsedChords && parsedChords.length > 0) {
        const nextBarIndex = (this.currentBarIndex + 1) % parsedChords.length;
        this.nextChord = parsedChords[nextBarIndex];
      } else {
        this.nextChord = null;
      }
    }

    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.container) return;

    // Обновляем текущий аккорд
    if (this.currentChordElement) {
      this.currentChordElement.textContent = this.currentChord || '--';
    }

    // Обновляем следующий аккорд
    if (this.nextChordElement) {
      this.nextChordElement.textContent = this.nextChord || '--';
    }
  }

  show() {
    this.isVisible = true;
    this.updateDisplay();
  }

  hide() {
    this.isVisible = false;
    this.updateDisplay();
  }

  setChords(currentChord, nextChord) {
    this.currentChord = currentChord;
    this.nextChord = nextChord;
    this.updateDisplay();
  }

  // Метод для получения текущего и следующего аккорда из позиции
  getChordsFromPosition(barIndex, arrowIndex) {
    if (!window.app || !window.app.metronome || !window.app.metronome.chordManager) {
      return { current: null, next: null };
    }

    const chordManager = window.app.metronome.chordManager;
    const parsedChords = chordManager.getChords();

    if (!parsedChords || parsedChords.length === 0) {
      return { current: null, next: null };
    }

    const currentChord = chordManager.getChordNameForPosition(barIndex, arrowIndex, window.app.metronome.getActualBeatCount());
    const nextBarIndex = (barIndex + 1) % parsedChords.length;
    const nextChord = parsedChords[nextBarIndex];

    return { current: currentChord, next: nextChord };
  }
}