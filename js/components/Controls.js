// Компонент управления - отвечает за обработку пользовательских взаимодействий с интерфейсом
// Управляет количеством битов, генерацией случайных последовательностей и настройкой BPM
export class Controls {
  constructor(beatRow) {
    this.beatRow = beatRow;
    this.count = 8;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Выбор количества стрелок
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.addEventListener('change', (e) => {
        this.setCount(Number(e.target.value));
      });
    }

    // Кнопка генерации случайных битов
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateRandom();
      });
    }

    // Изменение BPM через слайдер
    const bpmSlider = document.getElementById('bpm');
    if (bpmSlider) {
      bpmSlider.addEventListener('input', () => {
        this.updateBpmLabel();
      });
    }
  }

  setCount(n) {
    this.count = n;
    const beats = this.makeBeats(n);
    this.beatRow.setBeats(beats);
    this.beatRow.setCount(n);

    // Инициализируем состояния кружочков только если они не установлены или имеют неправильную длину
    const currentCircleStates = this.beatRow.getCircleStates();
    console.log('Controls setCount: currentCircleStates:', currentCircleStates, 'length:', currentCircleStates ? currentCircleStates.length : 'null', 'n:', n);
    if (!currentCircleStates || currentCircleStates.length !== n) {
      const circleStates = beats.map(beat => beat.play || false);
      console.log('Controls setCount: Setting new circleStates:', circleStates);
      this.beatRow.setCircleStates(circleStates);
    } else {
      console.log('Controls setCount: Keeping existing circleStates');
    }

    // Обновление глобального состояния
    if (window.app) {
      window.app.state.count = n;
      window.app.state.beats = beats;

      // Обновляем количество стрелочек в метрономе
      if (window.app.metronome) {
        window.app.metronome.setBeatCount(n);
      }
    }

    // Обновление визуального состояния кнопок
    this.updateCountButtons(n);
  }

  updateCountButtons(activeCount) {
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.value = activeCount.toString();
    }
  }

  makeBeats(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({ direction: i % 2 === 0 ? 'down' : 'up', play: false });
    }
    arr[0].play = true; // первый всегда playable
    return arr;
  }

  generateRandom() {
    const beats = this.makeBeats(this.count);
    const circleStates = [true]; // Первый кружочек всегда включен
    for (let i = 1; i < beats.length; i++) {
      const shouldPlay = Math.random() > 0.5;
      beats[i].play = shouldPlay;
      circleStates.push(shouldPlay);
    }
    this.beatRow.setBeats(beats);
    this.beatRow.setCircleStates(circleStates);
    
    // Обновление глобального состояния
    if (window.app) {
      window.app.state.beats = beats;
    }
  }

  updateBpmLabel() {
    const bpmValue = document.getElementById('bpm').value;
    document.getElementById('bpmLabel').textContent = bpmValue;
    
    // Обновление глобального состояния
    if (window.app) {
      window.app.state.bpm = Number(bpmValue) || 90;
    }
  }

  getCount() {
    return this.count;
  }

  /**
   * Применение данных шаблона без генерации новых beats
   * @param {Object} templateData - данные шаблона
   */
  applyTemplateData(templateData) {
    console.log('Controls: Применяем данные шаблона:', templateData);

    this.count = templateData.count;
    this.beatRow.setBeats(templateData.beats);
    this.beatRow.setCount(templateData.count);

    // Применяем состояния кружков из шаблона
    const circleStates = templateData.beats.map(beat => beat.play);
    this.beatRow.setCircleStates(circleStates);

    // Обновление глобального состояния
    if (window.app) {
      window.app.state.count = templateData.count;
      window.app.state.beats = templateData.beats;
      window.app.state.currentIndex = 0;

      // Обновляем количество стрелочек в метрономе
      if (window.app.metronome) {
        window.app.metronome.setBeatCount(templateData.count);
      }
    }

    // Обновление визуального состояния селектора количества
    this.updateCountButtons(templateData.count);

    console.log('Controls: Данные шаблона применены');
  }
}
