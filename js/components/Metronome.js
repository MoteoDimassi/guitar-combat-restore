import { ChordManager } from './ChordManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { AudioEngine } from '../audio/AudioEngine.js';

/**
 * Metronome - main component for synchronizing visual highlights and guitar sounds.
 * Uses Web Audio API for precise timing and guitar chord playback.
 * Manages beat scheduling, audio playback, and visual synchronization.
 */
export class Metronome {
  /**
   * Creates a new Metronome instance.
   * Initializes audio components, scheduling parameters, and chord management.
   */
  constructor() {
    /** @type {AudioManager} */
    this.audioManager = new AudioManager();
    /** @type {AudioEngine} */
    this.audioEngine = new AudioEngine(this.audioManager);

    /** @type {boolean} */
    this.isPlaying = false;
    /** @type {number} */
    this.currentBeat = 0;
    /** @type {number} */
    this.bpm = 90;

    /** @type {number} Always 4 beats per bar (time signature) */
    this.beatCount = 4;
    /** @type {number} Actual number of arrows in one bar (fight cycle) */
    this.actualBeatCount = 4;
    /** @type {number} Bar counter */
    this.barIndex = 0;

    // Scheduling parameters
    /** @type {number} Scheduler lookahead time in milliseconds */
    this.lookahead = 25;
    /** @type {number} How far ahead to schedule audio in seconds */
    this.scheduleAheadTime = 0.1;
    /** @type {number} When the next note is due */
    this.nextNoteTime = 0.0;
    /** @type {number|null} Scheduler timer ID */
    this.timerID = null;

    // Chords
    /** @type {ChordManager} */
    this.chordManager = new ChordManager();
  }

  /**
   * Initializes the metronome component.
   * @returns {boolean} Always returns true
   */
  init() {
    return true;
  }

  /**
   * Starts the metronome playback.
   * Initializes audio context, resets beat counters, and begins scheduling.
   * @async
   * @returns {Promise<void>}
   * @throws {Error} If audio initialization fails
   */
  async start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Initialize AudioManager
    const audioInitialized = await this.audioManager.initialize();
    if (!audioInitialized) {
      console.error('Metronome: Failed to initialize audio');
      this.isPlaying = false;
      return;
    }

    this.currentBeat = 0;
    this.barIndex = 0;                   // Reset bar number
    this.nextNoteTime = this.audioManager.getCurrentTime() + 0.05;
    this.scheduler();
  }

  /**
   * Stops the metronome playback and clears the scheduler.
   */
  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  /**
   * Sets the beats per minute (tempo).
   * @param {number} bpm - New BPM value
   */
  setBpm(bpm) { this.bpm = bpm; }

  /**
   * Sets the beat count and regenerates chord maps.
   * Time signature remains 4/4, but actual beat count changes.
   * @param {number} count - Number of arrows/beats per bar
   */
  setBeatCount(count) {
    this.beatCount = 4;                  // Time signature (quarters) stays 4
    this.actualBeatCount = count;        // Number of arrows per bar
    // Regenerate chordMap when arrows change
    this.chordManager.generateChordMaps(this.actualBeatCount);
  }

  /**
   * Gets the time signature beat count (always 4 for 4/4).
   * @returns {number} Time signature beat count
   */
  getBeatCount() { return this.beatCount; }

  /**
   * Gets the actual number of arrows/beats per bar.
   * @returns {number} Actual beat count
   */
  getActualBeatCount() { return this.actualBeatCount; }

  /**
   * Calculates the ratio between time signature beats and actual arrows.
   * @returns {number} Beat ratio (1 for 4 beats, 2 for 8 beats, 4 for 16 beats)
   */
  getBeatRatio() {
    if (this.actualBeatCount === 4) return 1;
    if (this.actualBeatCount === 8) return 2;
    if (this.actualBeatCount === 16) return 4;
    return 1;
  }

  /**
   * Gets arrow indices for a given beat index.
   * @param {number} beatIndex - The beat index (0-3 for 4/4 time)
   * @returns {Object} Object with startIndex, count, and actualBeatCount
   * @returns {number} return.startIndex - Starting arrow index
   * @returns {number} return.count - Number of arrows for this beat
   * @returns {number} return.actualBeatCount - Total actual beat count
   */
  getArrowIndexForBeat(beatIndex) {
    const ratio = this.getBeatRatio();
    const startIndex = beatIndex * ratio;
    return { startIndex, count: ratio, actualBeatCount: this.actualBeatCount };
  }

  /**
   * Sets the current beat index.
   * @param {number} beatIndex - New beat index
   */
  setCurrentBeat(beatIndex) { this.currentBeat = beatIndex; }

  /**
   * Advances to the next note and increments bar counter when needed.
   * Updates timing for the next scheduled beat.
   */
  nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat++;
    if (this.currentBeat >= this.beatCount) {
      this.currentBeat = 0;
      this.barIndex = (this.barIndex + 1) % Number.MAX_SAFE_INTEGER; // New bar
    }
  }


  /**
   * Main scheduler for sounds and visual highlights.
   * Continuously schedules beats ahead of time to ensure precise timing.
   * Uses lookahead scheduling to prevent audio delays.
   */
  scheduler() {
    if (!this.isPlaying) return;

    // Check audio state
    if (!this.checkAudioState()) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const totalArrows = this.actualBeatCount;
    const ratio = this.getBeatRatio();

    while (this.nextNoteTime < this.audioManager.getCurrentTime() + this.scheduleAheadTime) {
      this.scheduleBeat(secondsPerBeat, totalArrows, ratio);
      this.nextNote();
    }
    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  /**
   * Checks AudioContext state and attempts to resume if suspended.
   * @returns {boolean} True if AudioContext is ready, false if suspended/failed
   * @async
   */
  checkAudioState() {
    if (!this.audioManager.isReady()) {
      // Пытаемся возобновить если приостановлен
      this.audioManager.resume().then(success => {
        if (!success) {
          console.error('Metronome: Failed to resume AudioContext in scheduler');
          this.stop();
        }
      }).catch(error => {
        console.error('Metronome: Error resuming AudioContext:', error);
        this.stop();
      });
      return false; // Пропускаем планирование в этом цикле
    }
    return true;
  }

  /**
   * Schedules one beat (hit) including click sound and arrow highlights.
   * @param {number} secondsPerBeat - Duration of one beat in seconds
   * @param {number} totalArrows - Total number of arrows
   * @param {number} ratio - Beat/arrow ratio
   */
  scheduleBeat(secondsPerBeat, totalArrows, ratio) {
    const isAccent = (this.currentBeat === 0);
    this.audioEngine.scheduleClick(this.nextNoteTime, isAccent);

    // фиксируем номер такта для всех стрелочек ЭТОГО удара
    const barAtSchedule = this.barIndex;
    const startIndex = this.currentBeat * ratio;

    for (let i = 0; i < ratio; i++) {
      const arrowIndex = startIndex + i;
      if (arrowIndex < totalArrows) {
        this.scheduleArrow(arrowIndex, barAtSchedule, secondsPerBeat, ratio, i);
      }
    }
  }

  /**
   * Schedules sound for one arrow with precise timing.
   * @param {number} arrowIndex - Arrow index
   * @param {number} barAtSchedule - Bar number at schedule time
   * @param {number} secondsPerBeat - Beat duration
   * @param {number} ratio - Beat/arrow ratio
   * @param {number} arrowOffset - Offset within the beat
   */
  scheduleArrow(arrowIndex, barAtSchedule, secondsPerBeat, ratio, arrowOffset) {
    const arrowTime = this.nextNoteTime + (arrowOffset * secondsPerBeat / ratio);
    const delay = (arrowTime - this.audioManager.getCurrentTime()) * 1000;

    setTimeout(() => {
      this.playGuitarSound(arrowIndex, barAtSchedule);
      if (this.onBeatCallback) this.onBeatCallback(arrowIndex);

      // Обновляем отображение аккордов при каждом ударе
      this.updateChordDisplay(arrowIndex, barAtSchedule);
    }, delay);
  }


  /**
   * Enhanced chord sound playback logic.
   * Plays guitar chords based on arrow position and circle states.
   * Supports chord inversions and arpeggio effects for realism.
   * @param {number} arrowIndex - Index of the arrow being played
   * @param {number} barIndex - Current bar number for chord progression
   */
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
                this.audioEngine.createGuitarSound(freq, 0.25, volume);
              }, index * 8); // Небольшая арпеджио-задержка
            });
          } else {
            // Если инверсия не удалась, используем оригинальные ноты
            chordNotes.forEach((freq, index) => {
              setTimeout(() => {
                const volumes = [0.8, 0.6, 0.7];
                const volume = volumes[index] || 0.6;
                this.audioEngine.createGuitarSound(freq, 0.25, volume);
              }, index * 8);
            });
          }
        } else {
          // Если нет аккорда, воспроизводим одиночную ноту
          const frequencies = [82.41, 110, 146.83, 196, 246.94, 329.63];
          const f = frequencies[arrowIndex % frequencies.length] || 220;
          this.audioEngine.createGuitarSound(f, 0.3, 0.9);
        }
      }
    }
  }

  /**
   * Updates chords from input field and regenerates chord maps immediately.
   * Called when user changes chord progression in the UI.
   * @param {string} chordsString - Chord progression string (e.g., "Cm F G")
   */
  updateChords(chordsString) {
    this.chordManager.updateChords(chordsString, this.actualBeatCount);
  }

  /**
   * Gets the current parsed chords array.
   * @returns {Array} Array of parsed chord objects
   */
  getChords() {
    return this.chordManager.parsedChords;
  }

  /**
   * Updates chord display with current and next chords.
   * @param {number} arrowIndex - Current arrow index
   * @param {number} barIndex - Current bar index
   */
  updateChordDisplay(arrowIndex, barIndex) {
    if (window.app && window.app.chordDisplay) {
      // Получаем текущий аккорд для данной позиции
      const currentChord = this.chordManager.getChordNameForPosition(barIndex, arrowIndex, this.actualBeatCount);
      if (currentChord) {
        window.app.chordDisplay.updateCurrentChord(currentChord, barIndex, arrowIndex);
      }
    }
  }
}
