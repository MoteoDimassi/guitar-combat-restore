class BeatUnit {
  constructor(value = 4) {
    this.value = value;
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
}

export default BeatUnit;