/**
 * @fileoverview Класс Bar представляет один такт в песне.
 * Объединяет стрелочки боя, аккорд и текстовую строку.
 */

/**
 * Класс Bar - структура данных для одного такта
 */
export class Bar {
  /**
   * @param {Object} config - Конфигурация такта
   * @param {number} config.index - Индекс такта в песне
   * @param {Array} config.beats - Массив стрелочек (направление и состояние)
   * @param {string} config.chord - Аккорд текущего такта
   * @param {string} config.textLine - Текстовая строка (набор слогов)
   * @param {number} config.arrowCount - Количество стрелочек в такте (по умолчанию 8)
   */
  constructor(config = {}) {
    this.index = config.index || 0;
    this.arrowCount = config.arrowCount || 8;
    this.beats = config.beats || this.generateDefaultBeats();
    this.chord = config.chord || '';
    this.textLine = config.textLine || '';
  }

  /**
   * Генерирует стрелочки по умолчанию
   * @returns {Array} Массив стрелочек
   */
  generateDefaultBeats() {
    const beats = [];
    for (let i = 0; i < this.arrowCount; i++) {
      beats.push({
        direction: i % 2 === 0 ? 'down' : 'up',
        play: 1 // 0 = выкл, 1 = вкл, 2 = приглушённые
      });
    }
    return beats;
  }

  /**
   * Устанавливает количество стрелочек в такте
   * @param {number} count - Новое количество стрелочек
   */
  setArrowCount(count) {
    if (count < 1 || count > 32) {
      console.warn('Некорректное количество стрелочек:', count);
      return;
    }

    const oldCount = this.arrowCount;
    this.arrowCount = count;

    // Если увеличили количество - добавляем новые стрелочки
    if (count > oldCount) {
      for (let i = oldCount; i < count; i++) {
        this.beats.push({
          direction: i % 2 === 0 ? 'down' : 'up',
          play: 1
        });
      }
    } else {
      // Если уменьшили - обрезаем массив
      this.beats = this.beats.slice(0, count);
    }
  }

  /**
   * Устанавливает аккорд для такта
   * @param {string} chord - Название аккорда
   */
  setChord(chord) {
    this.chord = chord || '';
  }

  /**
   * Устанавливает текстовую строку для такта
   * @param {string} textLine - Текстовая строка
   */
  setTextLine(textLine) {
    this.textLine = textLine || '';
  }

  /**
   * Устанавливает направление конкретной стрелочки
   * @param {number} beatIndex - Индекс стрелочки в такте
   * @param {string} direction - Направление ('up' или 'down')
   */
  setBeatDirection(beatIndex, direction) {
    if (beatIndex >= 0 && beatIndex < this.beats.length) {
      this.beats[beatIndex].direction = direction;
    }
  }

  /**
   * Устанавливает состояние конкретной стрелочки
   * @param {number} beatIndex - Индекс стрелочки в такте
   * @param {number} playState - Состояние (0, 1 или 2)
   */
  setBeatPlayState(beatIndex, playState) {
    if (beatIndex >= 0 && beatIndex < this.beats.length) {
      this.beats[beatIndex].play = playState;
    }
  }

  /**
   * Получает стрелочки такта
   * @returns {Array} Массив стрелочек
   */
  getBeats() {
    return this.beats;
  }

  /**
   * Получает аккорд такта
   * @returns {string} Аккорд
   */
  getChord() {
    return this.chord;
  }

  /**
   * Получает текстовую строку такта
   * @returns {string} Текстовая строка
   */
  getTextLine() {
    return this.textLine;
  }

  /**
   * Экспортирует такт в JSON-формат
   * @returns {Object} JSON-представление такта
   */
  toJSON() {
    return {
      index: this.index,
      arrowCount: this.arrowCount,
      beats: this.beats,
      chord: this.chord,
      textLine: this.textLine
    };
  }

  /**
   * Создаёт такт из JSON-данных
   * @param {Object} json - JSON-данные
   * @returns {Bar} Новый экземпляр такта
   */
  static fromJSON(json) {
    return new Bar({
      index: json.index,
      arrowCount: json.arrowCount,
      beats: json.beats,
      chord: json.chord,
      textLine: json.textLine
    });
  }

  /**
   * Клонирует текущий такт
   * @returns {Bar} Копия такта
   */
  clone() {
    return new Bar({
      index: this.index,
      arrowCount: this.arrowCount,
      beats: JSON.parse(JSON.stringify(this.beats)),
      chord: this.chord,
      textLine: this.textLine
    });
  }
}

