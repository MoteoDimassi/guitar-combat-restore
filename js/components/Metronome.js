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
    
    // Для гитарных звуков
    this.guitarSounds = [];
  }

  init() {
    // Инициализация Web Audio Context по запросу
    console.log('Metronome initialized with Web Audio API');
    return true; // Возвращаем true при успешной инициализации
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
      // и воспроизводим звуки для активных стрелочек
      for (let i = 0; i < ratio; i++) {
        const arrowIndex = startIndex + i;
        if (arrowIndex < totalArrows) {
          // Рассчитываем время подсветки для каждой стрелочки
          const arrowTime = this.nextNoteTime + (i * secondsPerBeat / ratio);
          
          // Планируем подсветку стрелочки и воспроизведение звука
          setTimeout(() => {
            // Воспроизводим гитарный звук для активной стрелочки
            this.playGuitarSound(arrowIndex);
            
            // Обновляем визуальное состояние
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
  
  // Создание гитарного звука с помощью осцилляторов
  createGuitarSound(frequency = 330, duration = 0.1, volume = 0.3) {
    if (!this.audioCtx) return;
    
    // Создаем осцилляторы для создания богатого тембра
    const fundamental = this.audioCtx.createOscillator();
    const harmonic2 = this.audioCtx.createOscillator();
    const harmonic3 = this.audioCtx.createOscillator();
    
    // Создаем узлы усиления для огибающей звука
    const gainNode = this.audioCtx.createGain();
    const fundamentalGain = this.audioCtx.createGain();
    const harmonic2Gain = this.audioCtx.createGain();
    const harmonic3Gain = this.audioCtx.createGain();
    
    // Настройка основной частоты (фундаментальной ноты)
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    
    // Настройка гармоник (октавы и квинты)
    harmonic2.type = 'sine';
    harmonic2.frequency.setValueAtTime(frequency * 2, this.audioCtx.currentTime); // Октава выше
    
    harmonic3.type = 'sine';
    harmonic3.frequency.setValueAtTime(frequency * 3, this.audioCtx.currentTime); // Квинта
    
    // Настройка уровней гармоник
    fundamentalGain.gain.setValueAtTime(volume * 0.6, this.audioCtx.currentTime);
    harmonic2Gain.gain.setValueAtTime(volume * 0.3, this.audioCtx.currentTime);
    harmonic3Gain.gain.setValueAtTime(volume * 0.1, this.audioCtx.currentTime);
    
    // Создание огибающей ADSR (Attack, Decay, Sustain, Release)
    const now = this.audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Attack - быстрый подъем
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.03); // Decay - спад
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + duration - 0.02); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release - затухание
    
    // Подключение осцилляторов к их усилителям
    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);
    
    // Подключение усилителей к общему усилителю
    fundamentalGain.connect(gainNode);
    harmonic2Gain.connect(gainNode);
    harmonic3Gain.connect(gainNode);
    
    // Создание фильтра для создания более гитарного тембра
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.setValueAtTime(1, now);
    
    // Подключение к фильтру и затем к выходу
    gainNode.connect(filter);
    filter.connect(this.audioCtx.destination);
    
    // Запуск осцилляторов
    const startTime = this.audioCtx.currentTime;
    fundamental.start(startTime);
    harmonic2.start(startTime);
    harmonic3.start(startTime);
    
    // Остановка осцилляторов
    fundamental.stop(startTime + duration);
    harmonic2.stop(startTime + duration);
    harmonic3.stop(startTime + duration);
    
    // Очистка после завершения
    fundamental.onended = () => {
      fundamental.disconnect();
      harmonic2.disconnect();
      harmonic3.disconnect();
      gainNode.disconnect();
      fundamentalGain.disconnect();
      harmonic2Gain.disconnect();
      harmonic3Gain.disconnect();
      filter.disconnect();
    };
  }
  
  // Воспроизведение гитарного звука для конкретной стрелочки
  playGuitarSound(arrowIndex) {
    // Получаем состояние стрелочки из глобального состояния
    if (window.app && window.app.state && window.app.state.beats) {
      const beat = window.app.state.beats[arrowIndex];
      if (beat && beat.play) {
        // Стрелочка активна - воспроизводим звук
        
        // Выбираем частоту в зависимости от позиции или случайно для разнообразия
        const frequencies = [82.41, 110, 146.83, 196, 246.94, 329.63]; // Частоты гитарных струн E A D G B e
        const frequency = frequencies[arrowIndex % frequencies.length] || 220;
        
        // Добавляем небольшое случайное изменение для естественности
        const variedFrequency = frequency * (0.95 + Math.random() * 0.1);
        
        // Воспроизводим звук
        this.createGuitarSound(variedFrequency, 0.15, 0.4);
      }
      // Если beat.play === false или beat не существует, звук не воспроизводится
    }
  }
}
