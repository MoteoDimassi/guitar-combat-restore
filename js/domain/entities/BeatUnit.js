class BeatUnit {
  constructor(value = 4, chord = null, syllable = null) {
    this.value = value;
    this.chord = chord; // Привязанный аккорд
    this.syllable = syllable; // Привязанный слог
    this.played = false; // Состояние воспроизведения
    this.muted = false; // Состояние приглушения
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }

  getDuration() {
    // Возвращает длительность в долях целой ноты
    return 1 / this.value;
  }

  // Новые методы для состояния воспроизведения
  isPlayed() {
    return this.played;
  }

  isMuted() {
    return this.muted;
  }

  setPlayed(played) {
    this.played = played;
  }

  setMuted(muted) {
    this.muted = muted;
  }

  // Методы для работы с аккордом
  setChord(chord) {
    this.chord = chord;
  }

  getChord() {
    return this.chord;
  }

  // Методы для работы со слогом
  setSyllable(syllable) {
    this.syllable = syllable;
  }

  getSyllable() {
    return this.syllable;
  }

  // Метод для получения статуса кружочка
  getCircleStatus() {
    if (this.muted) {
      return 'muted';
    } else if (this.played) {
      return 'played';
    } else {
      return 'empty';
    }
  }

  // Метод для установки статуса кружочка
  setCircleStatus(status) {
    switch (status) {
      case 'played':
        this.played = true;
        this.muted = false;
        break;
      case 'muted':
        this.played = true;
        this.muted = true;
        break;
      case 'empty':
      default:
        this.played = false;
        this.muted = false;
        break;
    }
  }
}

export default BeatUnit;