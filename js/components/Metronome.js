// Компонент метронома с Web Audio API
export class Metronome {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentBeat = 0;
    this.currentArrowIndex = 0; // Для последовательной подсветки стрелочек
    this.bpm = 90;
    this.beatCount = 4; // Всегда 4 доли на такт (основной темп)
    this.actualBeatCount = 4; // Фактическое количество стрелочек
    
    // Параметры планирования звука
    this.lookahead = 25; // мс — как часто проверяем, что планировать
    this.scheduleAheadTime = 0.1; // сек — планируем вперед
    this.nextNoteTime = 0.0;
    this.timerID = null;
  }

  init() {
    // Инициализация Web Audio Context по запросу
    console.log('Metronome initialized with Web Audio API');
  }

  start() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    
    // Создаем AudioContext при первом запуске
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    this.currentBeat = 0;
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

  setBpm(bpm) {
    this.bpm = bpm;
    // При изменении BPM во время воспроизведения перезапуск не требуется
    // так как планирование происходит динамически
  }

  setBeatCount(count) {
    this.beatCount = 4; // Всегда 4 доли на такт (основной темп)
    this.actualBeatCount = count; // Фактическое количество стрелочек
  }
  
  getBeatCount() {
    return this.beatCount;
  }
  
  getActualBeatCount() {
    return this.actualBeatCount;
  }
  
  // Получить соотношение стрелочек к ударам метронома
  getBeatRatio() {
    // 4 стрелочки: 1:1 (1 стрелочка на 1 удар)
    // 8 стрелочек: 2:1 (2 стрелочки на 1 удар)  
    // 16 стрелочек: 4:1 (4 стрелочки на 1 удар)
    if (this.actualBeatCount === 4) return 1;
    if (this.actualBeatCount === 8) return 2;
    if (this.actualBeatCount === 16) return 4;
    return 1; // по умолчанию 1:1
  }
  
  // Получить индекс стрелочки для текущего удара метронома
  getArrowIndexForBeat(beatIndex) {
    const ratio = this.getBeatRatio();
    // Рассчитываем, какие стрелочки должны подсвечиваться для текущего удара
    const startIndex = beatIndex * ratio;
    return {
      startIndex: startIndex,
      count: ratio,
      actualBeatCount: this.actualBeatCount
    };
  }
  
  setCurrentBeat(beatIndex) {
    this.currentBeat = beatIndex;
    // Вызываем onBeat для немедленного обновления визуального состояния
    if (this.onBeat) {
      this.onBeat(beatIndex);
    }
  }

  // Переход к следующей ноте
  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat++;
    if (this.currentBeat >= this.beatCount) {
      this.currentBeat = 0;
    }
  }

  // Планирование звукового клика
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

  // Планировщик звуков и визуальных подсветок
  scheduler() {
    if (!this.audioCtx || !this.isPlaying) return;
    
    const secondsPerBeat = 60.0 / this.bpm;
    const totalArrows = this.actualBeatCount;
    const ratio = this.getBeatRatio(); // Получаем соотношение
    
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      // Планируем звуковой клик для основного удара метронома
      const isAccent = (this.currentBeat === 0);
      this.scheduleClick(this.nextNoteTime, isAccent);
      
      // Планируем последовательную подсветку стрелочек в рамках текущего удара
      const startIndex = this.currentBeat * ratio;
      
      // Для каждого удара метронома подсвечиваем нужное количество стрелочек последовательно
      for (let i = 0; i < ratio; i++) {
        const arrowIndex = startIndex + i;
        if (arrowIndex < totalArrows) {
          // Рассчитываем время подсветки для каждой стрелочки
          const arrowTime = this.nextNoteTime + (i * secondsPerBeat / ratio);
          
          // Планируем подсветку стрелочки
          setTimeout(() => {
            if (this.onBeatCallback) {
              this.onBeatCallback(arrowIndex);
            }
          }, (arrowTime - this.audioCtx.currentTime) * 1000);
        }
      }
      
      this.nextNote();
    }
    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  onBeat(beatIndex, withSound = false) {
    // Этот метод больше не используется для подсветки
    if (withSound) {
      console.log(`Beat ${beatIndex} (sound played)`);
    }
  }

  isPlaying() {
    return this.isPlaying;
  }
  
  getCurrentBeat() {
    return this.currentBeat;
  }
}
