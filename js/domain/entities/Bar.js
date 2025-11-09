import BeatUnit from './BeatUnit.js';

class Bar {
  constructor(id, beats = 4, beatUnit = 4) {
    this.id = id;
    this.beats = beats;
    this.beatUnit = beatUnit;
    this.chords = [];
    this.beatUnits = []; // Массив объектов BeatUnit
    
    // Инициализация beatUnits
    for (let i = 0; i < beats; i++) {
      this.beatUnits.push(new BeatUnit(beatUnit));
    }
  }

  addChord(chord) {
    this.chords.push(chord);
  }

  removeChord(chordId) {
    this.chords = this.chords.filter(chord => chord.id !== chordId);
  }

  getChordByPosition(position) {
    return this.chords.find(chord => chord.position === position);
  }

  /**
   * Получает BeatUnit по индексу
   * @param {number} index - индекс BeatUnit
   * @returns {BeatUnit|null} объект BeatUnit или null
   */
  getBeatUnitByIndex(index) {
    if (index >= 0 && index < this.beatUnits.length) {
      return this.beatUnits[index];
    }
    return null;
  }

  /**
   * Обновляет BeatUnit по индексу
   * @param {number} index - индекс BeatUnit
   * @param {Object} updates - объект с обновлениями
   */
  updateBeatUnit(index, updates) {
    const beatUnit = this.getBeatUnitByIndex(index);
    if (beatUnit) {
      Object.assign(beatUnit, updates);
    }
  }

  /**
   * Устанавливает аккорд для BeatUnit по индексу
   * @param {number} index - индекс BeatUnit
   * @param {Object} chord - аккорд
   */
  setChordToBeat(index, chord) {
    const beatUnit = this.getBeatUnitByIndex(index);
    if (beatUnit) {
      beatUnit.setChord(chord);
    }
  }

  /**
   * Устанавливает слог для BeatUnit по индексу
   * @param {number} index - индекс BeatUnit
   * @param {string} syllable - слог
   */
  setSyllableToBeat(index, syllable) {
    const beatUnit = this.getBeatUnitByIndex(index);
    if (beatUnit) {
      beatUnit.setSyllable(syllable);
    }
  }

  /**
   * Устанавливает статус воспроизведения для BeatUnit по индексу
   * @param {number} index - индекс BeatUnit
   * @param {string} status - статус ('played', 'muted', 'empty')
   */
  setBeatStatus(index, status) {
    const beatUnit = this.getBeatUnitByIndex(index);
    if (beatUnit) {
      beatUnit.setCircleStatus(status);
    }
  }

  /**
   * Получает все BeatUnit
   * @returns {Array} массив объектов BeatUnit
   */
  getAllBeatUnits() {
    return [...this.beatUnits];
  }

  /**
   * Устанавливает все BeatUnit
   * @param {Array} beatUnits - массив объектов BeatUnit
   */
  setAllBeatUnits(beatUnits) {
    this.beatUnits = [...beatUnits];
  }

  /**
   * Получает статусы всех кружочков
   * @returns {Array} массив статусов
   */
  getAllCircleStatuses() {
    return this.beatUnits.map(beatUnit => beatUnit.getCircleStatus());
  }

  /**
   * Устанавливает статусы всех кружочков
   * @param {Array} statuses - массив статусов
   */
  setAllCircleStatuses(statuses) {
    for (let i = 0; i < Math.min(statuses.length, this.beatUnits.length); i++) {
      this.setBeatStatus(i, statuses[i]);
    }
  }
}

export default Bar;