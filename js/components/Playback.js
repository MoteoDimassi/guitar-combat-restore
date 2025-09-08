// Компонент воспроизведения - управляет запуском и остановкой метронома
// Синхронизирует состояние интерфейса с состоянием воспроизведения
export class Playback {
  constructor(beatRow) {
    this.beatRow = beatRow;
    this.playing = false;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Кнопка Play/Pause
    document.getElementById('toggleBtn').addEventListener('click', () => {
      this.togglePlayback();
    });
  }

  async togglePlayback() {
    if (this.playing) {
      this.stopPlayback();
    } else {
      await this.startPlayback();
    }
  }

  async startPlayback() {
    this.playing = true;
    this.updateButtonState();

    const bpm = Number(document.getElementById('bpm').value) || 90;
    const count = window.app ? window.app.state.count : 8;
    const currentIndex = window.app ? window.app.state.currentIndex : 0;
    
    // Используем метроном вместо собственной логики
    if (window.app && window.app.metronome) {
      window.app.metronome.setBpm(bpm);
      window.app.metronome.setBeatCount(count);
      
      // Устанавливаем текущую позицию перед запуском
      if (currentIndex >= 0) {
        // Рассчитываем, какой удар метронома соответствует текущей стрелочке
        const ratio = window.app.metronome.getBeatRatio();
        const beatIndex = Math.floor(currentIndex / ratio);
        window.app.metronome.setCurrentBeat(beatIndex);
      }
      
      window.app.metronome.start();
      
      // Подписываемся на события метронома
      window.app.metronome.onBeatCallback = (arrowIndex) => {
        // Передаем информацию в beatRow для правильной подсветки
        this.beatRow.setCurrentIndex(arrowIndex);
        
        // Обновление глобального состояния
        if (window.app) {
          window.app.state.currentIndex = arrowIndex;
          window.app.state.playing = this.playing;
        }
      };
    }
  }

  stopPlayback() {
    this.playing = false;
    this.updateButtonState();
    
    // Останавливаем метроном
    if (window.app && window.app.metronome) {
      window.app.metronome.stop();
    }
    
    // Не сбрасываем подсветку, чтобы сохранить текущую позицию
    // this.beatRow.setCurrentIndex(-1);
    
    // Обновление глобального состояния
    if (window.app) {
      window.app.state.playing = this.playing;
    }
  }

  updateButtonState() {
    const toggleBtn = document.getElementById('toggleBtn');
    if (!toggleBtn) return;
    
    if (this.playing) {
      // Изменяем иконку на паузу
      toggleBtn.innerHTML = `
        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
        </svg>
      `;
    } else {
      // Изменяем иконку на play
      toggleBtn.innerHTML = `
        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      `;
    }
  }

  isPlaying() {
    return this.playing;
  }
}
