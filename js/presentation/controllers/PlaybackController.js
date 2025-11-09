class PlaybackController {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.isPlaying = false;
    this.currentBar = 0;
    this.currentBeat = 0;
    this.tempo = 120;
    this.intervalId = null;
  }

  async initialize() {
    this.init();
  }

  init() {
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.eventBus.on('playback:start', () => {
      this.startPlayback();
    });

    this.eventBus.on('playback:pause', () => {
      this.pausePlayback();
    });

    this.eventBus.on('playback:stop', () => {
      this.stopPlayback();
    });

    this.eventBus.on('playback:toggle', () => {
      this.togglePlayback();
    });

    this.eventBus.on('playback:set-tempo', (data) => {
      this.setTempo(data.tempo);
    });

    this.eventBus.on('playback:jump-to-bar', (data) => {
      this.jumpToBar(data.barIndex);
    });

    this.eventBus.on('playback:jump-to-beat', (data) => {
      this.jumpToBeat(data.beatIndex);
    });

    this.eventBus.on('settings:saved', (data) => {
      if (data.tempo) {
        this.setTempo(data.tempo);
      }
    });
  }

  async startPlayback() {
    if (this.isPlaying) return;
    
    try {
      const playbackService = this.serviceContainer.get('playbackService');
      const audioRepository = this.serviceContainer.get('audioRepository');
      const barService = this.serviceContainer.get('barService');
      
      // Начинаем воспроизведение
      await playbackService.play();
      this.isPlaying = true;
      
      // Получаем все такты
      const bars = await barService.getAllBars();
      
      if (bars.length === 0) {
        console.warn('No bars to play');
        this.stopPlayback();
        return;
      }
      
      // Запускаем таймер для воспроизведения
      this.startPlaybackTimer(bars, audioRepository);
      
      this.eventBus.emit('playback:started');
    } catch (error) {
      console.error('Failed to start playback:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось начать воспроизведение',
        error 
      });
    }
  }

  pausePlayback() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    const playbackService = this.serviceContainer.get('playbackService');
    playbackService.pause();
    
    this.eventBus.emit('playback:paused');
  }

  stopPlayback() {
    this.isPlaying = false;
    this.currentBar = 0;
    this.currentBeat = 0;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    const playbackService = this.serviceContainer.get('playbackService');
    playbackService.stop();
    
    this.eventBus.emit('playback:stopped');
    this.eventBus.emit('playback:beat', { bar: this.currentBar, beat: this.currentBeat });
  }

  togglePlayback() {
    if (this.isPlaying) {
      this.pausePlayback();
    } else {
      this.startPlayback();
    }
  }

  setTempo(tempo) {
    this.tempo = tempo;
    
    const playbackService = this.serviceContainer.get('playbackService');
    playbackService.setTempo(tempo);
    
    // Если воспроизведение уже идет, перезапускаем таймер с новым темпом
    if (this.isPlaying) {
      this.pausePlayback();
      this.startPlayback();
    }
    
    this.eventBus.emit('playback:tempo-changed', { tempo });
  }

  jumpToBar(barIndex) {
    this.currentBar = barIndex;
    this.currentBeat = 0;
    
    const playbackService = this.serviceContainer.get('playbackService');
    playbackService.setCurrentBar(barIndex);
    playbackService.setCurrentBeat(0);
    
    this.eventBus.emit('playback:bar', { bar: this.currentBar });
    this.eventBus.emit('playback:beat', { bar: this.currentBar, beat: this.currentBeat });
  }

  jumpToBeat(beatIndex) {
    this.currentBeat = beatIndex;
    
    const playbackService = this.serviceContainer.get('playbackService');
    playbackService.setCurrentBeat(beatIndex);
    
    this.eventBus.emit('playback:beat', { bar: this.currentBar, beat: this.currentBeat });
  }

  startPlaybackTimer(bars, audioRepository) {
    // Вычисляем интервал в миллисекундах на основе темпа
    const beatInterval = 60000 / this.tempo; // мс на одну долю
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      
      const currentBarData = bars[this.currentBar];
      if (!currentBarData) {
        // Достигли конца, останавливаемся или зацикливаемся
        this.stopPlayback();
        return;
      }
      
      // Воспроизводим аккорды на текущей доле
      const chordsOnBeat = currentBarData.chords.filter(chord => chord.position === this.currentBeat);
      chordsOnBeat.forEach(chord => {
        // Преобразуем имя аккорда в ноты для воспроизведения
        const notes = this.getNotesForChord(chord.name);
        audioRepository.playChord(notes);
      });
      
      // Уведомляем об изменении текущей доли
      this.eventBus.emit('playback:beat', { 
        bar: this.currentBar, 
        beat: this.currentBeat 
      });
      
      // Переходим к следующей доле
      this.currentBeat++;
      
      // Если достигли конца такта, переходим к следующему
      if (this.currentBeat >= currentBarData.beats) {
        this.currentBeat = 0;
        this.currentBar++;
        
        this.eventBus.emit('playback:bar', { bar: this.currentBar });
        
        // Если достигли конца всех тактов
        if (this.currentBar >= bars.length) {
          this.stopPlayback();
        }
      }
    }, beatInterval);
  }

  getNotesForChord(chordName) {
    // Упрощенная логика преобразования имени аккорда в ноты
    // В реальном приложении здесь будет более сложная логика
    const chordNotes = {
      'C': ['C3', 'E3', 'G3'],
      'C#': ['C#3', 'F3', 'G#3'],
      'D': ['D3', 'F#3', 'A3'],
      'D#': ['D#3', 'G3', 'A#3'],
      'E': ['E3', 'G#3', 'B3'],
      'F': ['F3', 'A3', 'C4'],
      'F#': ['F#3', 'A#3', 'C#4'],
      'G': ['G3', 'B3', 'D4'],
      'G#': ['G#3', 'C4', 'D#4'],
      'A': ['A3', 'C#4', 'E4'],
      'A#': ['A#3', 'D4', 'F4'],
      'B': ['B3', 'D#4', 'F#4']
    };
    
    return chordNotes[chordName] || [];
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  getCurrentPosition() {
    return {
      bar: this.currentBar,
      beat: this.currentBeat
    };
  }

  getTempo() {
    return this.tempo;
  }

  destroy() {
    this.stopPlayback();
    
    this.eventBus.off('playback:start');
    this.eventBus.off('playback:pause');
    this.eventBus.off('playback:stop');
    this.eventBus.off('playback:toggle');
    this.eventBus.off('playback:set-tempo');
    this.eventBus.off('playback:jump-to-bar');
    this.eventBus.off('playback:jump-to-beat');
    this.eventBus.off('settings:saved');
  }
}

export default PlaybackController;