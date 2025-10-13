import { ChordBuilder } from './ChordBuilder.js';

/**
 * Класс для парсинга аккордов из поля ввода
 * Обрабатывает строку аккордов и создает объекты аккордов через ChordBuilder
 */
export class ChordParser {
  constructor() {
    this.chordBuilder = new ChordBuilder();
    this.parsedChords = []; // массив названий аккордов
    this.validatedChords = []; // массив валидных аккордов с нотами
    this.chordMaps = []; // карты аккордов для каждого такта
  }

  /**
   * Парсит строку аккордов из поля ввода
   * @param {string} chordsString - Строка с аккордами (например, "Am F C G")
   * @returns {Array} Массив названий аккордов
   */
  parseChords(chordsString) {
    if (!chordsString || typeof chordsString !== 'string') {
      this.parsedChords = [];
      return this.parsedChords;
    }

    // Разделяем строку на отдельные аккорды
    this.parsedChords = chordsString
      .split(/[\s,;]+/) // разделяем по пробелам, запятым, точкам с запятой
      .map(chord => chord.trim())
      .filter(chord => chord.length > 0)
      .filter(chord => this.isValidChordName(chord)); // валидация названий

    return this.parsedChords;
  }

  /**
   * Проверяет валидность названия аккорда
   * @param {string} chordName - Название аккорда
   * @returns {boolean} true если название валидно
   */
  isValidChordName(chordName) {
    return this.chordBuilder.isValidChord(chordName);
  }

  /**
   * Создает объекты аккордов с нотами для всех парсенных аккордов
   * @returns {Array} Массив объектов с информацией об аккордах
   */
  buildChords() {
    this.validatedChords = [];

    this.parsedChords.forEach((chordName, index) => {
      const chordInfo = this.chordBuilder.getChordInfo(chordName);
      if (chordInfo) {
        this.validatedChords.push({
          index: index,
          name: chordName,
          frequencies: chordInfo.frequencies,
          noteCount: chordInfo.noteCount,
          isValid: true
        });
      } else {
        // Добавляем невалидный аккорд для отслеживания ошибок
        this.validatedChords.push({
          index: index,
          name: chordName,
          frequencies: null,
          noteCount: 0,
          isValid: false,
          error: 'Невалидное название аккорда'
        });
      }
    });

    return this.validatedChords;
  }

  /**
   * Получает аккорд по индексу
   * @param {number} index - Индекс аккорда
   * @returns {Object|null} Информация об аккорде или null
   */
  getChordByIndex(index) {
    if (index >= 0 && index < this.validatedChords.length) {
      return this.validatedChords[index];
    }
    return null;
  }

  /**
   * Получает аккорд для такта (с зацикливанием)
   * @param {number} barIndex - Индекс такта
   * @returns {Object|null} Информация об аккорде или null
   */
  getChordForBar(barIndex) {
    if (this.validatedChords.length === 0) return null;
    
    const chordIndex = barIndex % this.validatedChords.length;
    return this.validatedChords[chordIndex];
  }

  /**
   * Генерирует карты аккордов для тактов
   * @param {number} beatCount - Количество длительностей в такте
   * @param {Object} chordChanges - Правила смены аккордов внутри такта
   */
  generateChordMaps(beatCount, chordChanges = {}) {
    this.chordMaps = [];
    
    if (this.validatedChords.length === 0) return;
    if (!Number.isInteger(beatCount) || beatCount <= 0) beatCount = 1;

    for (let barIndex = 0; barIndex < this.validatedChords.length; barIndex++) {
      const baseChord = this.validatedChords[barIndex];
      const nextChord = this.validatedChords[(barIndex + 1) % this.validatedChords.length];

      const chordMap = {};
      
      // Базовый аккорд на первой длительности
      chordMap[0] = baseChord.name;

      // Применяем правила смены аккордов внутри такта
      for (const [beatPosition, changeRule] of Object.entries(chordChanges)) {
        const position = parseInt(beatPosition, 10);
        if (!(position >= 0 && position < beatCount)) continue;
        if (position === 0) continue; // 0 уже занят базовым аккордом

        if (changeRule === 1) {
          chordMap[position] = nextChord.name; // смена на следующий аккорд
        } else if (typeof changeRule === 'string' && changeRule.trim()) {
          if (this.isValidChordName(changeRule.trim())) {
            chordMap[position] = changeRule.trim();
          }
        }
      }

      this.chordMaps.push(chordMap);
    }
  }

  /**
   * Получает название аккорда для конкретной позиции в такте
   * @param {number} barIndex - Индекс такта
   * @param {number} beatIndex - Индекс длительности в такте
   * @returns {string|null} Название аккорда или null
   */
  getChordNameForPosition(barIndex, beatIndex) {
    if (this.validatedChords.length === 0) return null;

    const baseChord = this.validatedChords[barIndex % this.validatedChords.length];

    // Если карт нет, возвращаем базовый аккорд
    if (this.chordMaps.length === 0) {
      return baseChord.name;
    }

    const chordMap = this.chordMaps[barIndex % this.chordMaps.length] || {};
    
    // Ищем последнюю заявленную точку <= beatIndex
    let chosenChord = baseChord.name;
    let lastPosition = -1;
    
    for (const positionStr of Object.keys(chordMap)) {
      const position = parseInt(positionStr, 10);
      if (position <= beatIndex && position >= 0 && position > lastPosition) {
        chosenChord = chordMap[position];
        lastPosition = position;
      }
    }

    return chosenChord;
  }

  /**
   * Получает частоты нот для конкретной позиции в такте
   * @param {number} barIndex - Индекс такта
   * @param {number} beatIndex - Индекс длительности в такте
   * @returns {number[]|null} Массив частот или null
   */
  getChordFrequenciesForPosition(barIndex, beatIndex) {
    const chordName = this.getChordNameForPosition(barIndex, beatIndex);
    if (!chordName) return null;
    
    return this.chordBuilder.getChordNotes(chordName);
  }

  /**
   * Обновляет аккорды из строки ввода
   * @param {string} chordsString - Строка с аккордами
   * @param {number} beatCount - Количество длительностей в такте
   * @param {Object} chordChanges - Правила смены аккордов
   */
  updateChords(chordsString, beatCount = null, chordChanges = {}) {
    this.parseChords(chordsString);
    this.buildChords();
    
    if (Number.isInteger(beatCount) && beatCount > 0) {
      this.generateChordMaps(beatCount, chordChanges);
    }
  }

  /**
   * Получает все валидные аккорды
   * @returns {Array} Массив валидных аккордов
   */
  getValidChords() {
    return this.validatedChords.filter(chord => chord.isValid);
  }

  /**
   * Получает все невалидные аккорды
   * @returns {Array} Массив невалидных аккордов
   */
  getInvalidChords() {
    return this.validatedChords.filter(chord => !chord.isValid);
  }

  /**
   * Получает статистику парсинга
   * @returns {Object} Статистика
   */
  getStats() {
    return {
      totalChords: this.parsedChords.length,
      validChords: this.getValidChords().length,
      invalidChords: this.getInvalidChords().length,
      chordMapsGenerated: this.chordMaps.length,
      successRate: this.parsedChords.length > 0 ? 
        (this.getValidChords().length / this.parsedChords.length * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Очищает все данные
   */
  clear() {
    this.parsedChords = [];
    this.validatedChords = [];
    this.chordMaps = [];
  }

  /**
   * Возвращает объект для сериализации
   * @returns {Object} Данные для сохранения
   */
  toJSON() {
    return {
      parsedChords: this.parsedChords,
      validatedChords: this.validatedChords.map(chord => ({
        index: chord.index,
        name: chord.name,
        isValid: chord.isValid,
        error: chord.error || null
      })),
      chordMaps: this.chordMaps
    };
  }

  /**
   * Создает ChordParser из JSON объекта
   * @param {Object} data - Данные для восстановления
   * @returns {ChordParser} Восстановленный парсер
   */
  static fromJSON(data) {
    const parser = new ChordParser();
    parser.parsedChords = data.parsedChords || [];
    parser.validatedChords = data.validatedChords || [];
    parser.chordMaps = data.chordMaps || [];
    
    // Пересобираем аккорды для получения частот
    parser.buildChords();
    
    return parser;
  }
}
