/**
 * Controls component - handles user interactions with the interface.
 * Manages beat count, random sequence generation, and BPM settings.
 * Serves as the main control panel for the guitar combat application.
 */
export class Controls {
  /**
   * Creates a new Controls instance.
   * @param {BeatRow} beatRow - The beat row component to control
   */
  constructor(beatRow) {
    /** @type {BeatRow} */
    this.beatRow = beatRow;
    /** @type {number} */
    this.count = 8;
  }

  /**
   * Initializes the controls component.
   * Binds event listeners for user interactions.
   */
  init() {
    this.bindEvents();
  }

  /**
   * Binds event listeners to DOM elements for user interactions.
   * Sets up handlers for count selection, random generation, and BPM slider.
   */
  bindEvents() {
    // Beat count selection
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.addEventListener('change', (e) => {
        this.setCount(Number(e.target.value));
      });
    }

    // Random generation button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateRandom();
      });
    }

    // BPM slider changes
    const bpmSlider = document.getElementById('bpm');
    if (bpmSlider) {
      bpmSlider.addEventListener('input', () => {
        this.updateBpmLabel();
      });
    }

    // BPM increment/decrement buttons
    const bpmIncrement = document.getElementById('bpmIncrement');
    const bpmDecrement = document.getElementById('bpmDecrement');
    
    if (bpmIncrement) {
      bpmIncrement.addEventListener('click', () => {
        this.adjustBpm(1);
      });
    }
    
    if (bpmDecrement) {
      bpmDecrement.addEventListener('click', () => {
        this.adjustBpm(-1);
      });
    }

    // Add song text button
    const addSongTextBtn = document.getElementById('addSongTextBtn');
    if (addSongTextBtn) {
      addSongTextBtn.addEventListener('click', () => {
        this.showAddSongTextModal();
      });
    }
  }

  /**
   * Sets the number of beats and updates all related components.
   * Creates new beats array, updates beat row, circle states, and metronome.
   * @param {number} n - Number of beats to set (must be positive integer)
   */
  setCount(n) {
    this.count = n;
    const beats = this.makeBeats(n);
    this.beatRow.setBeats(beats);
    this.beatRow.setCount(n);

    // Initialize circle states only if not set or incorrect length
    const currentCircleStates = this.beatRow.getCircleStates();
    if (!currentCircleStates || currentCircleStates.length !== n) {
      const circleStates = beats.map(beat => {
        // Преобразуем в числовое значение: 0 или 1
        if (typeof beat.play === 'number') return beat.play;
        return beat.play ? 1 : 0;
      });
      this.beatRow.setCircleStates(circleStates);
    }

    // Update global state
    if (window.app) {
      window.app.state.count = n;
      window.app.state.beats = beats;

      // Update metronome beat count and chords
      if (window.app.metronome) {
        window.app.metronome.setBeatCount(n);

        // Обновляем аккорды с новым количеством стрелочек
        const chordsInput = document.getElementById('chordsInput');
        if (chordsInput) {
          window.app.metronome.updateChords(chordsInput.value);
        }

        // Обновляем отображение аккордов
        if (window.app.chordDisplay) {
          const chords = window.app.metronome.getChords();
          if (chords && chords.length > 0) {
            window.app.chordDisplay.setChords(chords[0], chords[1] || chords[0]);
          }
        }
      }
    }

    // Update UI button states
    this.updateCountButtons(n);
  }

  /**
   * Updates the count selector UI to reflect the current active count.
   * @param {number} activeCount - The currently selected beat count
   */
  updateCountButtons(activeCount) {
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.value = activeCount.toString();
    }
  }

  /**
   * Creates an array of beat objects with alternating directions.
   * First beat is always set to play.
   * @param {number} n - Number of beats to create
   * @returns {Array<{direction: string, play: boolean}>} Array of beat objects
   */
  makeBeats(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({ direction: i % 2 === 0 ? 'down' : 'up', play: 0 }); // 0 = не играем
    }
    arr[0].play = 1; // First beat is always playable (1 = играем)
    return arr;
  }

  /**
   * Generates a random beat sequence with random play states.
   * First beat is always enabled, others have 50% chance to play.
   */
  generateRandom() {
    const beats = this.makeBeats(this.count);
    const circleStates = [1]; // First circle always enabled (1 = играем)
    for (let i = 1; i < beats.length; i++) {
      const shouldPlay = Math.random() > 0.5 ? 1 : 0; // 1 = играем, 0 = не играем
      beats[i].play = shouldPlay;
      circleStates.push(shouldPlay);
    }
    this.beatRow.setBeats(beats);
    this.beatRow.setCircleStates(circleStates);

    // Update global state
    if (window.app) {
      window.app.state.beats = beats;
    }
  }

  /**
   * Updates the BPM label display with current slider value.
   * Also updates the global state with the new BPM value.
   */
  updateBpmLabel() {
    const bpmValue = document.getElementById('bpm').value;
    document.getElementById('bpmLabel').textContent = bpmValue;

    // Update global state
    if (window.app) {
      window.app.state.bpm = Number(bpmValue) || 90;
    }
  }

  /**
   * Adjusts the BPM value by a specified delta.
   * Respects the min (40) and max (200) limits.
   * @param {number} delta - Amount to adjust BPM by (positive or negative)
   */
  adjustBpm(delta) {
    const bpmSlider = document.getElementById('bpm');
    if (!bpmSlider) return;

    const currentBpm = Number(bpmSlider.value);
    const minBpm = Number(bpmSlider.min);
    const maxBpm = Number(bpmSlider.max);
    
    let newBpm = currentBpm + delta;
    
    // Clamp value within min/max range
    newBpm = Math.max(minBpm, Math.min(maxBpm, newBpm));
    
    // Update slider value
    bpmSlider.value = newBpm;
    
    // Update label and global state
    this.updateBpmLabel();
  }

  /**
   * Shows the add song text modal.
   */
  showAddSongTextModal() {
    if (window.app && window.app.modal) {
      window.app.modal.showAddSongText();
    }
  }

  /**
   * Gets the current beat count.
   * @returns {number} Current number of beats
   */
  getCount() {
    return this.count;
  }

  /**
   * Applies template data without generating new beats.
   * Updates beat count, beat row, circle states, and global state.
   * @param {Object} templateData - Template data object
   * @param {number} templateData.count - Number of beats in template
   * @param {Array<{direction: string, play: boolean}>} templateData.beats - Array of beat objects
   */
  applyTemplateData(templateData) {
    this.count = templateData.count;
    this.beatRow.setBeats(templateData.beats);
    this.beatRow.setCount(templateData.count);

    // Применяем состояния кружков из шаблона
    const circleStates = templateData.beats.map(beat => beat.play);
    this.beatRow.setCircleStates(circleStates);

    // Обновление глобального состояния
    if (window.app) {
      window.app.state.count = templateData.count;
      window.app.state.beats = templateData.beats;
      window.app.state.currentIndex = 0;

      // Обновляем количество стрелочек в метрономе и аккорды
      if (window.app.metronome) {
        window.app.metronome.setBeatCount(templateData.count);

        // Обновляем аккорды с новым количеством стрелочек
        const chordsInput = document.getElementById('chordsInput');
        if (chordsInput) {
          window.app.metronome.updateChords(chordsInput.value);
        }

        // Обновляем отображение аккордов
        if (window.app.chordDisplay) {
          const chords = window.app.metronome.getChords();
          if (chords && chords.length > 0) {
            window.app.chordDisplay.setChords(chords[0], chords[1] || chords[0]);
          }
        }
      }
    }

    // Обновление визуального состояния селектора количества
    this.updateCountButtons(templateData.count);
  }
}
