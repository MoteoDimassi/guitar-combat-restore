import { EventTypes } from "../../core/EventTypes.js";

class PlaybackService {
  constructor(audioEngine, barRepository, eventBus = null) {
    if (!audioEngine) {
      throw new Error('AudioEngine is required');
    }
    if (!barRepository) {
      throw new Error('BarRepository is required');
    }
    
    this.audioEngine = audioEngine;
    this.barRepository = barRepository;
    this.eventBus = eventBus;
    
    this.isPlaying = false;
    this.currentBar = 0;
    this.currentBeat = 0;
    this.tempo = 120;
    this.playbackInterval = null;
    this.currentPattern = null;
  }

  async play() {
    if (this.isPlaying) return;
    
    try {
      this.isPlaying = true;
      
      // Генерируем событие начала воспроизведения
      if (this.eventBus) {
        this.eventBus.emit(EventTypes.PLAYBACK_STARTED);
      }
      
      const bars = await this.barRepository.findAll();
      
      if (!bars || bars.length === 0) {
        this.stop();
        return;
      }

      // Начинаем воспроизведение с текущего такта
      await this.startPlaybackLoop(bars);
    } catch (error) {
      console.error('Error during playback:', error);
      this.stop();
    }
  }

  async start() {
    return this.play();
  }

  async startPlaybackLoop(bars) {
    const beatDuration = 60000 / this.tempo; // длительность одного бита в мс
    
    const playBeat = async () => {
      if (!this.isPlaying) return;
      
      const currentBar = bars[this.currentBar];
      if (!currentBar || !currentBar.beatUnits) {
        this.nextBar(bars);
        return;
      }
      
      const beatUnit = currentBar.beatUnits[this.currentBeat];
      if (beatUnit && beatUnit.isPlayed()) {
        // Воспроизводим ноту
        const note = beatUnit.isMuted() ? "Mute" : "C";
        const volume = beatUnit.isMuted() ? 0.3 : 1.0;
        
        try {
          await this.audioEngine.playNote(note, 1, {
            volume,
            startTime: 0,
            duration: 0.1
          });
        } catch (error) {
          console.error('Error playing note:', error);
        }
      }
      
      // Обновляем текущий бит
      this.currentBeat++;
      
      // Переходим к следующему такту если нужно
      if (this.currentBeat >= currentBar.beatUnits.length) {
        this.nextBar(bars);
      }
      
      // Генерируем событие об изменении позиции
      if (this.eventBus) {
        this.eventBus.emit(EventTypes.PLAYBACK_POSITION_CHANGED, {
          bar: this.currentBar,
          beat: this.currentBeat,
          tempo: this.tempo
        });
      }
    };
    
    // Запускаем цикл воспроизведения
    this.playbackInterval = setInterval(playBeat, beatDuration);
  }

  nextBar(bars) {
    this.currentBar = (this.currentBar + 1) % bars.length;
    this.currentBeat = 0;
  }

  pause() {
    this.isPlaying = false;
    
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  stop() {
    this.pause();
    this.currentBar = 0;
    this.currentBeat = 0;
    
    // Генерируем событие остановки воспроизведения
    if (this.eventBus) {
      this.eventBus.emit(EventTypes.PLAYBACK_STOPPED);
    }
  }

  setTempo(tempo) {
    this.tempo = tempo;
    
    // Если воспроизведение активно, перезапускаем с новым темпом
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  getTempo() {
    return this.tempo;
  }

  setCurrentBar(barIndex) {
    this.currentBar = barIndex;
    this.currentBeat = 0;
  }

  setCurrentBeat(beatIndex) {
    this.currentBeat = beatIndex;
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  getCurrentPosition() {
    return {
      bar: this.currentBar,
      beat: this.currentBeat,
      tempo: this.tempo,
      isPlaying: this.isPlaying
    };
  }

  async destroy() {
    this.stop();
    console.log('PlaybackService destroyed');
  }
}

export default PlaybackService;