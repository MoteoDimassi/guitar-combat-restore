class PlayCommand {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
  }

  async execute(params = {}) {
    try {
      this.validate(params);
      
      const playbackService = this.serviceContainer.get('playbackService');
      const audioRepository = this.serviceContainer.get('audioRepository');
      const barService = this.serviceContainer.get('barService');
      
      // Получаем все такты
      const bars = await barService.getAllBars();
      
      if (bars.length === 0) {
        this.eventBus.emit('playback:no-bars');
        return { success: false, reason: 'No bars to play' };
      }
      
      // Устанавливаем темп если указан
      if (params.tempo) {
        playbackService.setTempo(params.tempo);
      }
      
      // Устанавливаем начальную позицию если указана
      if (params.startBar !== undefined) {
        playbackService.setCurrentBar(params.startBar);
      }
      
      if (params.startBeat !== undefined) {
        playbackService.setCurrentBeat(params.startBeat);
      }
      
      // Начинаем воспроизведение
      await playbackService.play();
      
      // Запускаем таймер для воспроизведения
      this.startPlaybackTimer(bars, audioRepository, playbackService);
      
      this.eventBus.emit('playback:started', { 
        bars: bars.length,
        tempo: playbackService.getTempo()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to start playback:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось начать воспроизведение',
        error,
        type: 'audio'
      });
      
      return { success: false, error };
    }
  }

  async pause() {
    try {
      const playbackService = this.serviceContainer.get('playbackService');
      
      playbackService.pause();
      
      this.stopPlaybackTimer();
      
      this.eventBus.emit('playback:paused');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to pause playback:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось приостановить воспроизведение',
        error,
        type: 'audio'
      });
      
      return { success: false, error };
    }
  }

  async stop() {
    try {
      const playbackService = this.serviceContainer.get('playbackService');
      
      playbackService.stop();
      
      this.stopPlaybackTimer();
      
      this.eventBus.emit('playback:stopped');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to stop playback:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось остановить воспроизведение',
        error,
        type: 'audio'
      });
      
      return { success: false, error };
    }
  }

  async toggle() {
    try {
      const playbackService = this.serviceContainer.get('playbackService');
      
      if (playbackService.isCurrentlyPlaying()) {
        return await this.pause();
      } else {
        return await this.execute();
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось переключить воспроизведение',
        error,
        type: 'audio'
      });
      
      return { success: false, error };
    }
  }

  startPlaybackTimer(bars, audioRepository, playbackService) {
    // Останавливаем предыдущий таймер если есть
    this.stopPlaybackTimer();
    
    const tempo = playbackService.getTempo();
    const beatInterval = 60000 / tempo; // мс на одну долю
    
    let currentBar = playbackService.currentBar || 0;
    let currentBeat = playbackService.currentBeat || 0;
    
    this.playbackIntervalId = setInterval(() => {
      const currentBarData = bars[currentBar];
      if (!currentBarData) {
        // Достигли конца, останавливаемся
        this.stop();
        return;
      }
      
      // Воспроизводим аккорды на текущей доле
      const chordsOnBeat = currentBarData.chords.filter(chord => chord.position === currentBeat);
      chordsOnBeat.forEach(chord => {
        // Преобразуем имя аккорда в ноты для воспроизведения
        const notes = this.getNotesForChord(chord.name);
        audioRepository.playChord(notes);
      });
      
      // Уведомляем об изменении текущей доли
      this.eventBus.emit('playback:beat', { 
        bar: currentBar, 
        beat: currentBeat 
      });
      
      // Переходим к следующей доле
      currentBeat++;
      
      // Если достигли конца такта, переходим к следующему
      if (currentBeat >= currentBarData.beats) {
        currentBeat = 0;
        currentBar++;
        
        this.eventBus.emit('playback:bar', { bar: currentBar });
        
        // Если достигли конца всех тактов
        if (currentBar >= bars.length) {
          this.stop();
          return;
        }
      }
      
      // Обновляем позицию в сервисе воспроизведения
      playbackService.setCurrentBar(currentBar);
      playbackService.setCurrentBeat(currentBeat);
    }, beatInterval);
  }

  stopPlaybackTimer() {
    if (this.playbackIntervalId) {
      clearInterval(this.playbackIntervalId);
      this.playbackIntervalId = null;
    }
  }

  getNotesForChord(chordName) {
    // Упрощенная логика преобразования имени аккорда в ноты
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

  validate(params) {
    if (params.tempo !== undefined) {
      if (typeof params.tempo !== 'number' || params.tempo < 40 || params.tempo > 200) {
        throw new Error('Tempo must be a number between 40 and 200');
      }
    }
    
    if (params.startBar !== undefined) {
      if (typeof params.startBar !== 'number' || params.startBar < 0) {
        throw new Error('startBar must be a non-negative number');
      }
    }
    
    if (params.startBeat !== undefined) {
      if (typeof params.startBeat !== 'number' || params.startBeat < 0) {
        throw new Error('startBeat must be a non-negative number');
      }
    }
    
    return true;
  }

  canExecute(params) {
    try {
      this.validate(params);
      return true;
    } catch (error) {
      console.error('PlayCommand validation failed:', error);
      return false;
    }
  }

  getDescription() {
    return 'Control playback (play, pause, stop, toggle)';
  }
}

export default PlayCommand;