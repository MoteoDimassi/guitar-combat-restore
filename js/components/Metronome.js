import { ChordManager } from './ChordManager.js';

// Метроном - основной компонент для синхронизации визуальных подсветок и звуков
// Использует Web Audio API для точного тайминга и воспроизведения гитарных аккордов
export class Metronome {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentBeat = 0;
    this.bpm = 90;

    this.beatCount = 4;           // всегда 4 доли на такт (метр)
    this.actualBeatCount = 4;     // фактическое число стрелочек в одном такте (цикл боя)
    this.barIndex = 0;            // <<< НОВОЕ: счётчик тактов

    // планирование
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = 0.0;
    this.timerID = null;

    // аккорды
    this.chordManager = new ChordManager();
  }

  init() {
    console.log('Metronome initialized with Web Audio API');
    return true;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    this.currentBeat = 0;
    this.barIndex = 0;                   // <<< сбрасываем номер такта
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    this.scheduler();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  setBpm(bpm) { this.bpm = bpm; }

  setBeatCount(count) {
    this.beatCount = 4;                  // метр (четверти) остаётся 4
    this.actualBeatCount = count;        // число стрелочек в такте
    // <<< ПЕРЕГЕНЕРАЦИЯ chordMap при изменении стрелочек
    this.chordManager.generateChordMaps(this.actualBeatCount);
  }

  getBeatCount() { return this.beatCount; }
  getActualBeatCount() { return this.actualBeatCount; }

  getBeatRatio() {
    if (this.actualBeatCount === 4) return 1;
    if (this.actualBeatCount === 8) return 2;
    if (this.actualBeatCount === 16) return 4;
    return 1;
  }

  getArrowIndexForBeat(beatIndex) {
    const ratio = this.getBeatRatio();
    const startIndex = beatIndex * ratio;
    return { startIndex, count: ratio, actualBeatCount: this.actualBeatCount };
  }

  setCurrentBeat(beatIndex) { this.currentBeat = beatIndex; }

  // <<< инкремент такта при завершении предыдущего
  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat++;
    if (this.currentBeat >= this.beatCount) {
      this.currentBeat = 0;
      this.barIndex = (this.barIndex + 1) % Number.MAX_SAFE_INTEGER; // новый такт
    }
  }

  scheduleClick(time, isAccent) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isAccent ? 1500 : 1000, time);
    gainNode.gain.setValueAtTime(1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // Планировщик звуков и подсветок
  scheduler() {
    if (!this.audioCtx || !this.isPlaying) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const totalArrows = this.actualBeatCount;
    const ratio = this.getBeatRatio();

    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      const isAccent = (this.currentBeat === 0);
      this.scheduleClick(this.nextNoteTime, isAccent);

      // фиксируем номер такта для всех стрелочек ЭТОГО удара
      const barAtSchedule = this.barIndex;             // <<< ВАЖНО: замыкаем текущее значение
      const startIndex = this.currentBeat * ratio;

      for (let i = 0; i < ratio; i++) {
        const arrowIndex = startIndex + i;             // 0..(totalArrows-1) внутри ТАКТА
        if (arrowIndex < totalArrows) {
          const arrowTime = this.nextNoteTime + (i * secondsPerBeat / ratio);
          setTimeout(() => {
            this.playGuitarSound(arrowIndex, barAtSchedule);  // <<< передаём barIndex
            if (this.onBeatCallback) this.onBeatCallback(arrowIndex);
          }, (arrowTime - this.audioCtx.currentTime) * 1000);
        }
      }

      this.nextNote();
    }
    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  // --- УЛУЧШЕННЫЙ СИНТЕЗ ГИТАРЫ ---
  createGuitarSound(frequency = 330, duration = 0.3, volume = 0.8) {
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    
    // Создаем основной осциллятор для чистого звука струны
    const oscillator = this.audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, time);
    
    // Создаем второй осциллятор для обертона (октава выше)
    const overtone = this.audioCtx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(frequency * 2, time);
    
    // Создаем третий осциллятор для второго обертона
    const secondOvertone = this.audioCtx.createOscillator();
    secondOvertone.type = 'sine';
    secondOvertone.frequency.setValueAtTime(frequency * 3, time);
    
    // Создаем ADSR огибающую для основного звука
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, time + 0.001); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, time + 0.01); // Decay
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, time + duration * 0.7); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration); // Release
    
    // Создаем огибающую для обертонов (более короткую)
    const overtoneGain = this.audioCtx.createGain();
    overtoneGain.gain.setValueAtTime(0, time);
    overtoneGain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.001);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5);
    
    const secondOvertoneGain = this.audioCtx.createGain();
    secondOvertoneGain.gain.setValueAtTime(0, time);
    secondOvertoneGain.gain.linearRampToValueAtTime(volume * 0.1, time + 0.001);
    secondOvertoneGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.3);
    
    // Создаем фильтр для гитарного тембра
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.Q.setValueAtTime(1, time);
    
    // Соединяем узлы
    oscillator.connect(gainNode);
    overtone.connect(overtoneGain);
    secondOvertone.connect(secondOvertoneGain);
    
    gainNode.connect(filter);
    overtoneGain.connect(filter);
    secondOvertoneGain.connect(filter);
    
    filter.connect(this.audioCtx.destination);
    
    // Запускаем осцилляторы
    oscillator.start(time);
    overtone.start(time);
    secondOvertone.start(time);
    
    // Останавливаем осцилляторы
    oscillator.stop(time + duration);
    overtone.stop(time + duration * 0.8);
    secondOvertone.stop(time + duration * 0.6);
  }

  // <<< УЛУЧШЕННАЯ ЛОГИКА ВОСПРОИЗВЕДЕНИЯ ЗВУКОВ АККОРДОВ >>>
  playGuitarSound(arrowIndex, barIndex) {
    // Проверяем состояние кружочка вместо beat.play
    if (window.app && window.app.beatRow) {
      const circleStates = window.app.beatRow.getCircleStates();
      const shouldPlay = arrowIndex < circleStates.length ? circleStates[arrowIndex] : false;
      
      if (shouldPlay) {
        // Получаем аккордные ноты (можно использовать любую логику, не привязанную к beat.play)
        const arrowInBar = arrowIndex;
        const chordNotes = this.chordManager.getNotesForPosition(
          barIndex,
          arrowInBar,
          this.actualBeatCount
        );

        if (Array.isArray(chordNotes) && chordNotes.length) {
          // Определяем инверсию аккорда на основе позиции в такте для разнообразия
          const inversion = arrowInBar % 3; // 0, 1, 2 - три разных инверсии
          const invertedNotes = this.chordManager.getChordNotesWithInversion(
            this.chordManager.getChordNameForPosition(barIndex, arrowInBar, this.actualBeatCount),
            inversion
          );

          if (invertedNotes && invertedNotes.length) {
            // Воспроизводим аккорд с небольшой задержкой между нотами для реалистичности
            invertedNotes.forEach((freq, index) => {
              setTimeout(() => {
                // Разная громкость для разных нот аккорда
                const volumes = [0.8, 0.6, 0.7]; // Тоника, терция, квинта
                const volume = volumes[index] || 0.6;
                this.createGuitarSound(freq, 0.25, volume);
              }, index * 8); // Небольшая арпеджио-задержка
            });
          } else {
            // Если инверсия не удалась, используем оригинальные ноты
            chordNotes.forEach((freq, index) => {
              setTimeout(() => {
                const volumes = [0.8, 0.6, 0.7];
                const volume = volumes[index] || 0.6;
                this.createGuitarSound(freq, 0.25, volume);
              }, index * 8);
            });
          }
        } else {
          // Если нет аккорда, воспроизводим одиночную ноту
          const frequencies = [82.41, 110, 146.83, 196, 246.94, 329.63];
          const f = frequencies[arrowIndex % frequencies.length] || 220;
          this.createGuitarSound(f, 0.3, 0.9);
        }
      }
    }
  }

  // обновление аккордов из поля ввода → сразу пересоздать chordMaps
  updateChords(chordsString) {
    this.chordManager.updateChords(chordsString, this.actualBeatCount);
  }

  getChords() {
    return this.chordManager.parsedChords;
  }
}
