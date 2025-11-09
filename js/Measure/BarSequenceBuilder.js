import { Bar } from './Bar.js';
import { ChordChange } from './ChordChange.js';
import { PlayStatus } from './PlayStatus.js';

/**
 * Класс для построения тактовой последовательности на основе введённых аккордов
 * Создаёт такты для каждого аккорда с базовой настройкой: один аккорд = один такт
 */
export class BarSequenceBuilder {
  constructor(beatCount = 4) {
    this.beatCount = beatCount;
    this.bars = [];
  }

  /**
   * Создаёт тактовую последовательность на основе массива аккордов
   * @param {string[]} chordNames - Массив названий аккордов
   * @returns {Bar[]} Массив созданных тактов
   */
  buildFromChordArray(chordNames) {
    this.bars = [];
    
    if (!Array.isArray(chordNames) || chordNames.length === 0) {
      return this.bars;
    }

    // Создаём такт для каждого аккорда
    chordNames.forEach((chordName, index) => {
      const bar = this.createBarForChord(chordName, index);
      this.bars.push(bar);
    });

    return this.bars;
  }

  /**
   * Создаёт тактовую последовательность на основе строки аккордов
   * @param {string} chordString - Строка с аккордами (разделёнными пробелами или запятыми)
   * @returns {Bar[]} Массив созданных тактов
   */
  buildFromChordString(chordString) {
    if (!chordString || typeof chordString !== 'string') {
      return [];
    }

    // Парсим строку аккордов
    const chordNames = this.parseChordString(chordString);
    return this.buildFromChordArray(chordNames);
  }

  /**
   * Парсит строку аккордов в массив названий
   * @param {string} chordString - Строка с аккордами
   * @returns {string[]} Массив названий аккордов
   */
  parseChordString(chordString) {
    // Удаляем лишние пробелы и разбиваем по разделителям
    const cleaned = chordString.trim();
    
    // Поддерживаем разделители: пробел, запятая, вертикальная черта
    const chords = cleaned.split(/[\s,|]+/)
      .map(chord => chord.trim())
      .filter(chord => chord.length > 0);

    return chords;
  }

  /**
   * Создаёт такт для одного аккорда
   * @param {string} chordName - Название аккорда
   * @param {number} barIndex - Индекс такта
   * @param {PlayStatus[]|number[]} playStatuses - Массив статусов воспроизведения для каждой длительности
   * @returns {Bar} Созданный такт
   */
  createBarForChord(chordName, barIndex, playStatuses = null) {
    const bar = new Bar(barIndex, this.beatCount);
    
    // Создаём смену аккорда на весь такт (от 0 до beatCount)
    const chordChange = new ChordChange(chordName, 0, this.beatCount);
    bar.chordChanges.push(chordChange);

    // Устанавливаем статусы воспроизведения для каждой длительности
    for (let i = 0; i < this.beatCount; i++) {
      if (playStatuses && playStatuses[i] !== undefined) {
        // Используем переданные статусы
        bar.setBeatPlayStatus(i, playStatuses[i]);
      } else {
        // По умолчанию все длительности в такте имеют статус "играть"
        bar.setBeatPlayStatus(i, PlayStatus.INSTANCES.PLAY);
      }
    }

    return bar;
  }

  /**
   * Добавляет новый аккорд в последовательность
   * @param {string} chordName - Название аккорда
   * @param {number} position - Позиция вставки (по умолчанию в конец)
   * @returns {Bar} Созданный такт
   */
  addChord(chordName, position = null) {
    const barIndex = position !== null ? position : this.bars.length;
    const bar = this.createBarForChord(chordName, barIndex);
    
    if (position !== null && position < this.bars.length) {
      this.bars.splice(position, 0, bar);
      // Обновляем индексы тактов после вставки
      this.updateBarIndexes();
    } else {
      this.bars.push(bar);
    }

    return bar;
  }

  /**
   * Удаляет такт из последовательности
   * @param {number} barIndex - Индекс удаляемого такта
   * @returns {Bar|null} Удалённый такт или null
   */
  removeBar(barIndex) {
    if (barIndex >= 0 && barIndex < this.bars.length) {
      const removedBar = this.bars.splice(barIndex, 1)[0];
      this.updateBarIndexes();
      return removedBar;
    }
    return null;
  }

  /**
   * Обновляет аккорд в указанном такте
   * @param {number} barIndex - Индекс такта
   * @param {string} newChordName - Новое название аккорда
   * @returns {boolean} true если обновление прошло успешно
   */
  updateChordInBar(barIndex, newChordName) {
    if (barIndex >= 0 && barIndex < this.bars.length) {
      const bar = this.bars[barIndex];
      
      // Удаляем старые аккорды
      bar.chordChanges = [];
      
      // Добавляем новый аккорд на весь такт
      const chordChange = new ChordChange(newChordName, 0, this.beatCount);
      bar.chordChanges.push(chordChange);
      
      return true;
    }
    return false;
  }

  /**
   * Обновляет индексы всех тактов в последовательности
   */
  updateBarIndexes() {
    this.bars.forEach((bar, index) => {
      bar.barIndex = index;
    });
  }

  /**
   * Получает аккорд для указанного такта
   * @param {number} barIndex - Индекс такта
   * @returns {string|null} Название аккорда или null
   */
  getChordForBar(barIndex) {
    if (barIndex >= 0 && barIndex < this.bars.length) {
      const bar = this.bars[barIndex];
      return bar.getChordForBeat(0); // Получаем аккорд с первой длительности
    }
    return null;
  }

  /**
   * Получает все аккорды последовательности
   * @returns {string[]} Массив названий аккордов
   */
  getAllChords() {
    return this.bars.map(bar => bar.getChordForBeat(0)).filter(chord => chord !== null);
  }

  /**
   * Получает информацию о последовательности
   * @returns {Object} Информация о последовательности
   */
  getSequenceInfo() {
    return {
      barCount: this.bars.length,
      beatCount: this.beatCount,
      chords: this.getAllChords(),
      bars: this.bars.map(bar => ({
        index: bar.barIndex,
        chord: bar.getChordForBeat(0),
        beatCount: bar.beatCount
      }))
    };
  }

  /**
   * Очищает последовательность
   */
  clear() {
    this.bars = [];
  }

  /**
   * Создаёт копию последовательности
   * @returns {BarSequenceBuilder} Копия построителя
   */
  clone() {
    const cloned = new BarSequenceBuilder(this.beatCount);
    cloned.bars = this.bars.map(bar => bar.clone());
    return cloned;
  }

  /**
   * Возвращает объект для сериализации
   * @returns {Object} Данные для сохранения
   */
  toJSON() {
    return {
      beatCount: this.beatCount,
      bars: this.bars.map(bar => bar.toJSON())
    };
  }

  /**
   * Создаёт BarSequenceBuilder из JSON объекта
   * @param {Object} data - Данные для создания
   * @returns {BarSequenceBuilder} Созданный построитель
   */
  static fromJSON(data) {
    const builder = new BarSequenceBuilder(data.beatCount);
    builder.bars = data.bars.map(barData => Bar.fromJSON(barData));
    return builder;
  }

  /**
   * Создаёт последовательность по шаблону (для повторяющихся паттернов)
   * @param {string[]} pattern - Паттерн аккордов
   * @param {number} repeatCount - Количество повторений
   * @returns {Bar[]} Массив созданных тактов
   */
  buildFromPattern(pattern, repeatCount = 1) {
    const allChords = [];
    
    for (let i = 0; i < repeatCount; i++) {
      allChords.push(...pattern);
    }
    
    return this.buildFromChordArray(allChords);
  }

  /**
   * Создаёт такт с указанными статусами воспроизведения для каждой длительности
   * @param {string} chordName - Название аккорда
   * @param {number} barIndex - Индекс такта
   * @param {PlayStatus[]|number[]|string} playStatusPattern - Паттерн статусов воспроизведения
   * @returns {Bar} Созданный такт
   */
  createBarWithPlayPattern(chordName, barIndex, playStatusPattern) {
    let playStatuses = null;

    if (typeof playStatusPattern === 'string') {
      // Парсим строку паттерна (например: "○●⊗○" или "skip,play,muted,skip")
      playStatuses = this.parsePlayStatusPattern(playStatusPattern);
    } else if (Array.isArray(playStatusPattern)) {
      playStatuses = playStatusPattern;
    }

    return this.createBarForChord(chordName, barIndex, playStatuses);
  }

  /**
   * Парсит строку паттерна статусов воспроизведения
   * @param {string} pattern - Строка паттерна
   * @returns {PlayStatus[]} Массив статусов воспроизведения
   */
  parsePlayStatusPattern(pattern) {
    const statuses = [];
    
    // Поддерживаем разные форматы:
    // "○●⊗○" - символы
    // "skip,play,muted,skip" - названия
    // "0,1,2,0" - числа
    
    const parts = pattern.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length > 0);
    
    for (const part of parts) {
      statuses.push(PlayStatus.fromString(part));
    }
    
    return statuses;
  }

  /**
   * Создаёт последовательность с единым паттерном воспроизведения для всех тактов
   * @param {string[]} chordNames - Массив аккордов
   * @param {PlayStatus[]|number[]|string} playStatusPattern - Паттерн статусов воспроизведения
   * @returns {Bar[]} Массив созданных тактов
   */
  buildWithPlayPattern(chordNames, playStatusPattern) {
    this.bars = [];
    
    if (!Array.isArray(chordNames) || chordNames.length === 0) {
      return this.bars;
    }

    chordNames.forEach((chordName, index) => {
      const bar = this.createBarWithPlayPattern(chordName, index, playStatusPattern);
      this.bars.push(bar);
    });

    return this.bars;
  }

  /**
   * Вставляет последовательность в указанную позицию
   * @param {number} position - Позиция вставки
   * @param {string[]} chordNames - Аккорды для вставки
   * @returns {Bar[]} Вставленные такты
   */
  insertSequenceAt(position, chordNames) {
    const insertedBars = [];
    
    chordNames.forEach((chordName, index) => {
      const bar = this.createBarForChord(chordName, position + index);
      insertedBars.push(bar);
    });
    
    // Вставляем такты
    this.bars.splice(position, 0, ...insertedBars);
    
    // Обновляем индексы
    this.updateBarIndexes();
    
    return insertedBars;
  }
}
