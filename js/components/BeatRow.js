// Компонент строки битов
export class BeatRow {
  constructor() {
    this.beats = [];
    this.highlightedIndices = new Set(); // Для подсветки нескольких стрелочек
    this.count = 8;
  }

  init() {
    this.element = document.getElementById('beatRow');
  }

  setBeats(beats) {
    this.beats = beats;
    this.render();
  }

  setCount(count) {
    this.count = count;
    this.updateLayout();
  }

  setCurrentIndex(arrowIndex) {
    // Подсвечиваем только одну стрелочку по индексу (для обратной совместимости)
    this.highlightedIndices.clear();
    if (arrowIndex >= 0 && arrowIndex < this.beats.length) {
      this.highlightedIndices.add(arrowIndex);
    }
    this.render();
  }
  
  // Новый метод для подсветки нескольких стрелочек
  setHighlightedIndices(indices) {
    this.highlightedIndices.clear();
    indices.forEach(index => {
      if (index >= 0 && index < this.beats.length) {
        this.highlightedIndices.add(index);
      }
    });
    this.render();
  }

  updateLayout() {
    if (!this.element) return;
    
    // Обновление классов flex в зависимости от количества элементов
    this.element.className = 'flex items-end justify-center gap-2 md:gap-3 px-2 py-6';
    if (this.count > 8) {
      this.element.classList.add('flex-wrap');
    }
  }

  render() {
    if (!this.element) return;
    
    this.element.innerHTML = '';
    this.updateLayout();
    
    this.beats.forEach((beat, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col items-center gap-2 select-none flex-shrink-0';
      
      // Адаптивная ширина в зависимости от количества элементов
      if (this.count <= 4) {
        wrapper.classList.add('beat-wrapper-large');
      } else if (this.count <= 8) {
        wrapper.classList.add('beat-wrapper-medium');
      } else {
        wrapper.classList.add('beat-wrapper-small');
      }

      // Стрелка (SVG)
      const arrow = document.createElement('div');
      arrow.className = 'arrow-container';
      const isHighlighted = this.highlightedIndices.has(i);
      arrow.innerHTML = this.arrowSvg(beat.direction, isHighlighted);
      
      // Добавляем обработчик клика на стрелку для установки текущей позиции
      arrow.addEventListener('click', () => {
        this.onArrowClick(i);
      });

      // Круг переключения
      const circle = document.createElement('div');
      circle.className = 'circle-container';
      circle.innerHTML = this.circleSvg(beat.play);
      circle.addEventListener('click', () => {
        this.toggleBeat(i);
      });

      wrapper.appendChild(arrow);
      wrapper.appendChild(circle);
      this.element.appendChild(wrapper);
    });
  }

  arrowSvg(dir, highlighted) {
    const stroke = highlighted ? '#06b6d4' : '#374151';
    const opacity = highlighted ? '1' : '0.9';
    if (dir === 'down') return `
      <svg width="36" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v14" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
        <path d="M19 10l-7 7-7-7" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
      </svg>`;
    return `
      <svg width="36" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21V7" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
        <path d="M5 14l7-7 7 7" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
      </svg>`;
  }

  circleSvg(on) {
    if (on) return `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ef4444" /></svg>`;
    return `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5" /></svg>`;
  }

  toggleBeat(index) {
    if (this.beats[index]) {
      this.beats[index].play = !this.beats[index].play;
      this.render();
    }
  }

  getBeats() {
    return this.beats;
  }
  
  onArrowClick(index) {
    // Устанавливаем текущую позицию воспроизведения
    this.highlightedIndices.clear();
    this.highlightedIndices.add(index);
    this.render();
    
    // Обновляем глобальное состояние
    if (window.app) {
      window.app.state.currentIndex = index;
    }
    
    // Если воспроизведение активно, обновляем метроном
    if (window.app && window.app.metronome && window.app.playback && window.app.playback.isPlaying()) {
      // Рассчитываем, какой удар метронома соответствует этой стрелочке
      const ratio = window.app.metronome.getBeatRatio();
      const beatIndex = Math.floor(index / ratio);
      window.app.metronome.setCurrentBeat(beatIndex);
    }
    
    // Вызываем callback, если он установлен
    if (this.onPositionChange) {
      this.onPositionChange(index);
    }
  }
  
  setOnPositionChange(callback) {
    this.onPositionChange = callback;
  }
}
