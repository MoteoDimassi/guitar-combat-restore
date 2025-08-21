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
    // Кнопки выбора количества битов
    document.querySelectorAll('.count-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setCount(Number(btn.getAttribute('data-count')));
      });
    });

    // Кнопка генерации случайных битов
    document.getElementById('generateBtn').addEventListener('click', () => {
      this.generateRandom();
    });

    // Изменение BPM
    document.getElementById('bpm').addEventListener('input', () => {
      this.updateBpmLabel();
    });
  }

  setCount(n) {
    this.count = n;
    const beats = this.makeBeats(n);
    this.beatRow.setBeats(beats);
    this.beatRow.setCount(n);
    
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
  document.querySelectorAll('.count-btn').forEach(btn => {
    const count = Number(btn.getAttribute('data-count'));
    if (count === activeCount) {
      btn.classList.add('active', 'bg-indigo-600', 'text-white');
      btn.classList.remove('bg-gray-100');
    } else {
      btn.classList.remove('active', 'bg-indigo-600', 'text-white');
      btn.classList.add('bg-gray-100');
    }
  });
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
    for (let i = 1; i < beats.length; i++) {
      beats[i].play = Math.random() > 0.5;
    }
    this.beatRow.setBeats(beats);
    
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
}
