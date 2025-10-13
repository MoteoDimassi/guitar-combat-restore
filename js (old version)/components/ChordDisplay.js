/**
 * ChordDisplay - компонент для отображения текущего и следующего аккорда над стрелочками
 * Показывает основной аккорд зеленым цветом большим шрифтом и следующий аккорд серым меньшим
 * Динамически обновляется при смене аккордов с плавными переходами
 */
export class ChordDisplay {
  constructor() {
    this.currentChord = null;
    this.nextChord = null;
    this.currentBarIndex = 0;
    this.currentArrowIndex = 0;
    this.isVisible = true;
    this.lastChordUpdate = null; // Для отслеживания изменений аккордов
  }

  init() {
    this.createDisplayElement();
    // Не обновляем дисплей здесь, так как аккорды ещё не установлены
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
    this.currentChordElement.className = 'text-[#38e07b] font-bold text-6xl tracking-wider transition-all duration-200';
    this.currentChordElement.textContent = '--';

    this.nextChordElement = document.createElement('div');
    this.nextChordElement.className = 'text-gray-400 font-medium text-3xl tracking-wide opacity-70 transition-all duration-300';
    this.nextChordElement.textContent = '--';

    this.container.appendChild(this.currentChordElement);
    this.container.appendChild(this.nextChordElement);
  }

  updateCurrentChord(chord, barIndex, arrowIndex) {
    // Всегда обновляем позицию
    const barChanged = this.currentBarIndex !== barIndex;
    this.currentBarIndex = barIndex;
    this.currentArrowIndex = arrowIndex;

    // Если такт изменился, обновляем аккорды для нового такта
    if (barChanged) {
      this.currentChord = chord;
      
      // Используем ChordStore для получения следующего аккорда
      if (window.app && window.app.chordStore) {
        this.nextChord = window.app.chordStore.getNextChord(barIndex);
        
        // Если следующий совпадает с текущим, ищем следующий уникальный
        if (this.nextChord === this.currentChord) {
          const allChords = window.app.chordStore.getAllChords();
          for (let i = 2; i <= allChords.length; i++) {
            const candidateIndex = (barIndex + i) % allChords.length;
            const candidate = allChords[candidateIndex];
            if (candidate !== this.currentChord) {
              this.nextChord = candidate;
              break;
            }
          }
        }
      } else {
        // Fallback на старую логику через метроном
        const parsedChords = window.app && window.app.metronome ? window.app.metronome.getChords() : [];
        if (parsedChords.length > 0) {
          const nextIndex = (barIndex + 1) % parsedChords.length;
          this.nextChord = parsedChords[nextIndex];
          if (this.nextChord === this.currentChord) {
            // Если следующий совпадает с текущим, ищем следующий уникальный
            for (let i = 2; i <= parsedChords.length; i++) {
              const candidateIndex = (barIndex + i) % parsedChords.length;
              const candidate = parsedChords[candidateIndex];
              if (candidate !== this.currentChord) {
                this.nextChord = candidate;
                break;
              }
            }
          }
        } else {
          this.nextChord = null;
        }
      }
      
      this.updateChordDisplay();
    }
  }

  // Новый метод для обновления дисплея с плавными переходами
  updateChordDisplay() {
    if (!this.container) return;

    // Обновляем текущий аккорд
    if (this.currentChordElement) {
      this.currentChordElement.textContent = this.currentChord || '--';
      this.currentChordElement.className = 'text-[#38e07b] font-bold text-6xl tracking-wider transition-all duration-300';
    }

    // Обновляем следующий аккорд
    if (this.nextChordElement) {
      if (this.nextChord && this.nextChord !== this.currentChord) {
        this.nextChordElement.textContent = this.nextChord;
        this.nextChordElement.style.display = 'block';
        this.nextChordElement.className = 'text-gray-400 font-medium text-3xl tracking-wide opacity-70 transition-all duration-300';
      } else {
        this.nextChordElement.style.display = 'none';
      }
    }
  }

  // Метод для анимированного перехода к следующему аккорду
  transitionToNextChord() {
    if (!this.container) return;

    // Получаем новые аккорды после перехода
    const chords = this.getChordsFromPosition(this.currentBarIndex, this.currentArrowIndex);

    // Анимируем переход: текущий становится следующим
    if (this.currentChordElement && this.nextChordElement) {
      // Текущий аккорд переходит в состояние "следующего"
      this.currentChordElement.className = 'text-gray-400 font-medium text-3xl tracking-wide opacity-70 transition-all duration-500';
      this.nextChordElement.className = 'text-[#38e07b] font-bold text-6xl tracking-wider transition-all duration-500';

      // Меняем местами контент после небольшой задержки
      setTimeout(() => {
        const tempText = this.currentChordElement.textContent;
        this.currentChordElement.textContent = this.nextChordElement.textContent;
        this.nextChordElement.textContent = tempText;

        // Восстанавливаем правильные стили
        this.updateChordDisplay();
      }, 250);
    }
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

  // Старый метод updateDisplay - оставлен для совместимости, но использует новый updateChordDisplay
  updateDisplay() {
    this.updateChordDisplay();
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

    // Находим следующий уникальный аккорд в прогрессии
    let nextChord = null;
    const currentChordIndex = parsedChords.findIndex(chord => chord === currentChord);

    if (currentChordIndex !== -1) {
      // Ищем следующий аккорд в списке, зацикливаясь
      for (let i = 1; i <= parsedChords.length; i++) {
        const nextIndex = (currentChordIndex + i) % parsedChords.length;
        const candidateChord = parsedChords[nextIndex];
        if (candidateChord !== currentChord) {
          nextChord = candidateChord;
          break;
        }
      }
    }

    return { current: currentChord, next: nextChord };
  }
}