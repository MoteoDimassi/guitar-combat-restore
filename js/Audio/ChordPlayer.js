import { PlaybackAnimator } from './PlaybackAnimator.js';

/**
 * Класс ChordPlayer - управляет воспроизведением последовательностей аккордов
 * Отвечает за логику воспроизведения, навигацию по тактам и координацию с AudioEngine
 */
export class ChordPlayer {
  constructor(audioEngine = null, barNavigation = null, playbackAnimator = null) {
    // Зависимости
    this.audioEngine = audioEngine;
    this.barNavigation = barNavigation;
    this.playbackAnimator = playbackAnimator || new PlaybackAnimator();

    // Состояние воспроизведения
    this.isPlaying = false;
    this.currentBars = [];
    this.settings = {
      bpm: 120
    };

    // Интервал воспроизведения
    this.playbackInterval = null;

    // Колбэки
    this.onPlaybackStart = null;
    this.onPlaybackStop = null;
  }

  /**
   * Устанавливает AudioEngine
   * @param {AudioEngine} audioEngine - Экземпляр AudioEngine
   */
  setAudioEngine(audioEngine) {
    this.audioEngine = audioEngine;
  }

  /**
   * Устанавливает BarNavigation
   * @param {BarNavigation} barNavigation - Экземпляр BarNavigation
   */
  setBarNavigation(barNavigation) {
    this.barNavigation = barNavigation;
  }

  /**
   * Устанавливает PlaybackAnimator
   * @param {PlaybackAnimator} playbackAnimator - Экземпляр PlaybackAnimator
   */
  setPlaybackAnimator(playbackAnimator) {
    this.playbackAnimator = playbackAnimator;
  }

  /**
   * Устанавливает последовательность тактов для воспроизведения
   * @param {Array} bars - Массив тактов
   */
  setBars(bars) {
    this.currentBars = bars || [];
  }

  /**
   * Устанавливает настройки воспроизведения
   * @param {Object} settings - Настройки (bpm и др.)
   */
  setSettings(settings) {
    if (settings && typeof settings.bpm === 'number') {
      this.settings.bpm = settings.bpm;
    }
  }

  /**
   * Переключает состояние воспроизведения
   */
  togglePlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  /**
   * Запускает воспроизведение аккордов
   */
  async startPlayback() {
     if (this.isPlaying || !this.audioEngine) return;

     try {
       this.isPlaying = true;

       // Синхронизируем настройки с PlaybackAnimator
       this.playbackAnimator.setSettings(this.settings);

       // Запускаем анимацию стрелок
       this.playbackAnimator.startAnimation();

       // Вызываем колбэк начала воспроизведения
       if (this.onPlaybackStart) {
         this.onPlaybackStart();
       }

       // Запускаем цикл воспроизведения
       this.startPlaybackLoop();

     } catch (error) {
       console.error('Ошибка при запуске воспроизведения:', error);
       this.stopPlayback();
     }
   }

  /**
   * Останавливает воспроизведение
   */
  stopPlayback() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Останавливаем анимацию стрелок
    this.playbackAnimator.stopAnimation();

    // Останавливаем цикл воспроизведения
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }

    // Останавливаем все звуки в AudioEngine
    if (this.audioEngine) {
      this.audioEngine.stopAll();
    }

    // Вызываем колбэк остановки воспроизведения
    if (this.onPlaybackStop) {
      this.onPlaybackStop();
    }
  }

  /**
   * Запускает цикл воспроизведения
   */
  startPlaybackLoop() {
    // Вычисляем интервал в миллисекундах на основе BPM
    const beatInterval = 60000 / this.settings.bpm;
    let beatIndex = 0;

    this.playbackInterval = setInterval(async () => {
      if (!this.isPlaying) {
        this.stopPlayback();
        return;
      }

      // Получаем текущий такт
      const currentBarIndex = this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0;
      const currentBar = this.currentBars[currentBarIndex];

      if (!currentBar) {
        this.stopPlayback();
        return;
      }

      // Воспроизводим текущий бит в такте
      await this.playCurrentBeat(currentBar, beatIndex);

      // Переходим к следующему биту
      beatIndex++;

      // Если достигли конца такта, переходим к следующему такту
      if (beatIndex >= currentBar.beatUnits.length) {
        beatIndex = 0;
        // Переходим к следующему такту используя метод из BarNavigation
        if (this.barNavigation) {
          // Проверяем, есть ли несколько тактов
          const hasMultipleBars = this.currentBars.length > 1;
          
          // Используем goToNextBar() для цикличного перехода
          this.barNavigation.goToNextBar();
          
          // Сбрасываем анимацию только если есть несколько тактов
          // При воспроизведении одного такта избегаем постоянного сброса
          if (hasMultipleBars) {
            this.playbackAnimator.resetAnimation();
          }
          
          // Синхронизируем beatCount между компонентами
          const nextBarIndex = this.barNavigation.getCurrentBarIndex();
          const nextBar = this.currentBars[nextBarIndex];
          if (nextBar && nextBar.beatUnits) {
            this.playbackAnimator.setSettings({
              bpm: this.settings.bpm,
              beatCount: nextBar.beatUnits.length
            });
          }
        }
      }

    }, beatInterval);
  }

  /**
   * Воспроизводит текущий бит в такте
   * @param {Bar} bar - Текущий такт
   * @param {number} beatIndex - Индекс текущего бита
   */
  async playCurrentBeat(bar, beatIndex) {
    if (!bar || !bar.beatUnits || !this.audioEngine || beatIndex < 0 || beatIndex >= bar.beatUnits.length) return;

    const beatUnit = bar.beatUnits[beatIndex];
    const playStatus = beatUnit.getPlayStatus();

    // Переходим к следующей стрелке в анимации
    this.playbackAnimator.nextArrow();

    // Получаем аккорд для текущей стрелочки
    const chordName = beatUnit.getChord() || bar.getChordForBeat(beatIndex);

    if (playStatus && playStatus.isPlayed()) {
      // Состояние "играть" - останавливаем предыдущий звук и воспроизводим новый аккорд
      this.audioEngine.stopAll();

      if (chordName) {
        // Получаем ноты аккорда
        const chordNotes = await this.audioEngine.chordAudioParser.getChordNotes(chordName);

        if (chordNotes && chordNotes.length > 0) {
          // Устанавливаем громкость на 40% от оригинала
          this.audioEngine.setVolume(0.4);
          // Воспроизводим аккорд одновременно (все ноты сразу)
          await this.audioEngine.playChord(chordNotes, 1, { volume: 1.0 });
        } else {
          console.warn(`Не удалось получить ноты для аккорда ${chordName}`);
        }
      }
    } else if (playStatus && playStatus.isMuted()) {
      // Состояние "mute" - заглушаем предыдущий аккорд и воспроизводим звук mute
      this.audioEngine.stopAll();
      // Устанавливаем громкость на 40% от оригинала
      this.audioEngine.setVolume(0.4);
      await this.audioEngine.playNote('Mute', null, { volume: 1.0 });
    }
    // Для SKIP состояния - ничего не делаем со звуком, просто переходим к следующей стрелочке
  }

  /**
   * Воспроизводит аккорд с паттерном (для совместимости)
   * @param {string} chordName - Название аккорда
   * @param {BeatUnit[]} beatUnits - Массив долей с их статусами
   */
  async playChordWithPattern(chordName, beatUnits) {
    if (!beatUnits || beatUnits.length === 0 || !this.audioEngine) return;

    // Получаем ноты аккорда
    const chordNotes = await this.audioEngine.chordAudioParser.getChordNotes(chordName);

    if (!chordNotes || chordNotes.length === 0) {
      console.warn(`Не удалось получить ноты для аккорда ${chordName}`);
      return;
    }

    // Вычисляем интервал в миллисекундах на основе BPM
    const beatInterval = 60000 / this.settings.bpm;

    // Проходим по всем долям и воспроизводим в соответствии с их статусами
    for (let i = 0; i < beatUnits.length; i++) {
      const beatUnit = beatUnits[i];
      const playStatus = beatUnit.getPlayStatus();

      if (playStatus && playStatus.isPlayed()) {
        // Воспроизводим аккорд с учетом статуса
        await this.audioEngine.playWithStatus(chordNotes, playStatus);
      }

      // Ждем до следующей доли
      if (i < beatUnits.length - 1) {
        await new Promise(resolve => setTimeout(resolve, beatInterval));
      }
    }
  }

  /**
   * Устанавливает колбэк для начала воспроизведения
   * @param {Function} callback - Колбэк функция
   */
  setOnPlaybackStart(callback) {
    this.onPlaybackStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки воспроизведения
   * @param {Function} callback - Колбэк функция
   */
  setOnPlaybackStop(callback) {
    this.onPlaybackStop = callback;
  }

  /**
   * Получает текущее состояние воспроизведения
   * @returns {boolean} True если воспроизводится
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    this.stopPlayback();
    this.currentBars = [];
    this.onPlaybackStart = null;
    this.onPlaybackStop = null;
  }
}