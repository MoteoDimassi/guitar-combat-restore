// Компонент строки битов - отвечает за отображение и управление стрелками и кружками переключения
// Каждая стрелка представляет направление удара, кружок показывает включен ли звук для этой позиции
export class BeatRow {
  constructor() {
    this.beats = [];
    this.circleStates = []; // Состояние кружочков (0 = выкл, 1 = вкл, 2 = приглушённые)
    this.highlightedIndices = new Set(); // Для подсветки нескольких стрелочек
    this.count = 8;
  }

  init() {
    this.element = document.getElementById('beatRow');
  }

  setBeats(beats) {
    this.beats = beats;
    // Инициализируем состояния кружочков если они не заданы
    if (this.circleStates.length !== beats.length) {
      this.circleStates = beats.map(beat => {
        // Преобразуем старые boolean значения в новые числовые состояния
        if (typeof beat.play === 'number') return beat.play;
        return beat.play ? 1 : 0;
      });
    }
    this.render();
  }

  setCircleStates(states) {
    this.circleStates = states;
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
    
    // Обновление классов в зависимости от количества элементов
    this.element.className = 'grid gap-4 w-full px-4 beat-grid';
    
    // Адаптивное количество колонок с улучшенной логикой для больших экранов
    if (window.innerWidth <= 480) {
      // На мобильных устройствах используем авто-размер для лучшей адаптации
      this.element.style.gridTemplateColumns = 'repeat(auto-fit, minmax(24px, 1fr))';
    } else if (this.count <= 4) {
      this.element.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else if (this.count <= 8) {
      this.element.style.gridTemplateColumns = 'repeat(8, 1fr)';
    } else if (this.count <= 12) {
      this.element.style.gridTemplateColumns = 'repeat(12, 1fr)';
    } else if (this.count <= 16) {
      this.element.style.gridTemplateColumns = 'repeat(16, 1fr)';
    } else if (this.count <= 20) {
      this.element.style.gridTemplateColumns = 'repeat(20, 1fr)';
    } else {
      // Для очень большого количества стрелочек используем автоматическую адаптацию
      this.element.style.gridTemplateColumns = `repeat(${this.count}, minmax(25px, 1fr))`;
    }
  }

  render() {
    if (!this.element) return;
    
    this.element.innerHTML = '';
    this.updateLayout();
    
    this.beats.forEach((beat, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col items-center gap-2 select-none flex-shrink-0 beat-container';
      
      // Адаптивная ширина в зависимости от количества элементов и размера экрана
      if (window.innerWidth <= 480) {
        // На мобильных устройствах используем меньшие размеры
        wrapper.style.width = '24px';
      } else if (this.count <= 4) {
        wrapper.classList.add('beat-wrapper-large');
      } else if (this.count <= 8) {
        wrapper.classList.add('beat-wrapper-medium');
      } else if (this.count <= 12) {
        wrapper.classList.add('beat-wrapper-small');
        wrapper.style.width = '35px';
      } else if (this.count <= 16) {
        wrapper.classList.add('beat-wrapper-extra-small');
        wrapper.style.width = '28px';
      } else {
        // Для очень большого количества стрелочек используем автоматическую адаптацию
        wrapper.classList.add('beat-wrapper-extra-small');
        wrapper.style.width = '25px';
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
      // Используем состояние кружочка вместо beat.play
      const circleState = i < this.circleStates.length ? this.circleStates[i] : (typeof beat.play === 'number' ? beat.play : (beat.play ? 1 : 0));
      circle.innerHTML = this.circleSvg(circleState);
      circle.addEventListener('click', () => {
        this.toggleCircle(i);
      });

      wrapper.appendChild(arrow);
      wrapper.appendChild(circle);
      this.element.appendChild(wrapper);
    });
    
    // Уведомляем об обновлении (для SyllableDragDrop)
    if (this.onRenderComplete) {
      this.onRenderComplete();
    }
  }

  arrowSvg(dir, highlighted) {
    const stroke = highlighted ? '#38e07b' : '#374151';
    const opacity = highlighted ? '1' : '0.9';
    
    // Адаптивный размер SVG для мобильных устройств
    const svgWidth = window.innerWidth <= 480 ? 20 : 36;
    const svgHeight = window.innerWidth <= 480 ? 24 : 48;
    
    if (dir === 'down') return `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v14" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
        <path d="M19 10l-7 7-7-7" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
      </svg>`;
    return `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21V7" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
        <path d="M5 14l7-7 7 7" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />
      </svg>`;
  }

  circleSvg(state) {
    // Адаптивный размер SVG для мобильных устройств
    const svgSize = window.innerWidth <= 480 ? 20 : 24;
    
    // state: 0 = пустой кружок, 1 = закрашенный, 2 = крестик
    if (state === 1) {
      // Закрашенный кружок
      return `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ef4444" /></svg>`;
    } else if (state === 2) {
      // Крестик в кружке
      return `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5" />
        <line x1="8" y1="8" x2="16" y2="16" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
        <line x1="16" y1="8" x2="8" y2="16" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
      </svg>`;
    } else {
      // Пустой кружок (state === 0)
      return `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="transparent" stroke="#9ca3af" stroke-width="1.5" /></svg>`;
    }
  }

  toggleBeat(index) {
    if (this.beats[index]) {
      this.beats[index].play = !this.beats[index].play;
      this.render();
    }
  }

  toggleCircle(index) {
    if (index >= 0 && index < this.circleStates.length) {
      // Циклическое переключение: 0 → 1 → 2 → 0
      this.circleStates[index] = (this.circleStates[index] + 1) % 3;
      this.render();
    }
  }

  getBeats() {
    // Возвращаем beats с актуальным состоянием circleStates
    return this.beats.map((beat, index) => ({
      ...beat,
      play: index < this.circleStates.length ? this.circleStates[index] : (typeof beat.play === 'number' ? beat.play : (beat.play ? 1 : 0))
    }));
  }

  getCircleStates() {
    return this.circleStates;
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
  
  setOnRenderComplete(callback) {
    this.onRenderComplete = callback;
  }
}
