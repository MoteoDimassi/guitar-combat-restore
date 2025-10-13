/**
 * @fileoverview ChordStore - централизованное хранилище аккордов с привязкой к тактам и стрелкам
 */

/**
 * Класс ChordStore - управляет аккордами и их привязкой к тактам и стрелкам
 */
export class ChordStore {
  constructor() {
    // Массив аккордов из поля ввода (в порядке ввода)
    this.chordsArray = [];
    
    // Карта аккордов: Map<barIndex, Map<arrowIndex, chordName>>
    // Для каждого такта хранится карта: на какой стрелке какой аккорд
    this.chordMap = new Map();
    
    // Слушатели изменений
    this.changeListeners = [];
  }

  /**
   * Обновляет массив аккордов из строки ввода
   * @param {string} chordsString - строка с аккордами через пробел
   */
  updateFromString(chordsString) {
    if (!chordsString || typeof chordsString !== 'string') {
      this.chordsArray = [];
      this.rebuildChordMap();
      this.notifyListeners();
      return;
    }

    // Парсим строку: разделяем по пробелам, убираем пустые
    this.chordsArray = chordsString
      .split(' ')
      .map(ch => ch.trim())
      .filter(ch => ch.length > 0);

    // Перестраиваем карту аккордов для тактов
    this.rebuildChordMap();
    this.notifyListeners();
  }

  /**
   * Перестраивает карту аккордов: один такт = один аккорд (по умолчанию на стрелке 0)
   */
  rebuildChordMap() {
    this.chordMap.clear();

    if (this.chordsArray.length === 0) {
      return;
    }

    // Для каждого аккорда создаем такт
    this.chordsArray.forEach((chord, barIndex) => {
      const arrowMap = new Map();
      arrowMap.set(0, chord); // По умолчанию аккорд на первой стрелке такта
      this.chordMap.set(barIndex, arrowMap);
    });
  }

  /**
   * Получает аккорд для конкретного такта и стрелки
   * @param {number} barIndex - индекс такта
   * @param {number} arrowIndex - индекс стрелки внутри такта
   * @returns {string|null} - название аккорда или null
   */
  getChordForPosition(barIndex, arrowIndex) {
    if (this.chordsArray.length === 0) {
      return null;
    }

    // Зацикливаем такты по количеству аккордов
    const actualBarIndex = barIndex % this.chordsArray.length;
    
    const arrowMap = this.chordMap.get(actualBarIndex);
    if (!arrowMap) {
      return this.chordsArray[actualBarIndex] || null;
    }

    // Ищем последний установленный аккорд до текущей стрелки
    let currentChord = this.chordsArray[actualBarIndex];
    
    for (const [arrow, chord] of arrowMap.entries()) {
      if (arrow <= arrowIndex) {
        currentChord = chord;
      } else {
        break; // Прошли дальше текущей стрелки
      }
    }

    return currentChord;
  }

  /**
   * Устанавливает аккорд для конкретной позиции (такт + стрелка)
   * @param {number} barIndex - индекс такта
   * @param {number} arrowIndex - индекс стрелки внутри такта
   * @param {string} chordName - название аккорда
   */
  setChordForPosition(barIndex, arrowIndex, chordName) {
    const actualBarIndex = barIndex % this.chordsArray.length;
    
    if (!this.chordMap.has(actualBarIndex)) {
      this.chordMap.set(actualBarIndex, new Map());
    }

    const arrowMap = this.chordMap.get(actualBarIndex);
    arrowMap.set(arrowIndex, chordName);

    this.notifyListeners();
  }

  /**
   * Получает аккорд для такта (аккорд на первой стрелке)
   * @param {number} barIndex - индекс такта
   * @returns {string|null}
   */
  getChordForBar(barIndex) {
    return this.getChordForPosition(barIndex, 0);
  }

  /**
   * Получает массив всех аккордов
   * @returns {Array<string>}
   */
  getAllChords() {
    return [...this.chordsArray];
  }

  /**
   * Получает количество аккордов
   * @returns {number}
   */
  getChordCount() {
    return this.chordsArray.length;
  }

  /**
   * Получает следующий аккорд в последовательности
   * @param {number} currentBarIndex - текущий индекс такта
   * @returns {string|null}
   */
  getNextChord(currentBarIndex) {
    if (this.chordsArray.length === 0) {
      return null;
    }

    const nextBarIndex = (currentBarIndex + 1) % this.chordsArray.length;
    return this.chordsArray[nextBarIndex];
  }

  /**
   * Регистрирует слушателя изменений
   * @param {Function} listener - функция-слушатель
   */
  addChangeListener(listener) {
    if (typeof listener === 'function') {
      this.changeListeners.push(listener);
    }
  }

  /**
   * Удаляет слушателя изменений
   * @param {Function} listener - функция-слушатель
   */
  removeChangeListener(listener) {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Уведомляет всех слушателей об изменениях
   */
  notifyListeners() {
    this.changeListeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in chord store listener:', e);
      }
    });
  }

  /**
   * Очищает все аккорды
   */
  clear() {
    this.chordsArray = [];
    this.chordMap.clear();
    this.notifyListeners();
  }

  /**
   * Экспортирует в JSON
   * @returns {Object}
   */
  toJSON() {
    const chordMapObj = {};
    this.chordMap.forEach((arrowMap, barIndex) => {
      const arrowMapObj = {};
      arrowMap.forEach((chord, arrowIndex) => {
        arrowMapObj[arrowIndex] = chord;
      });
      chordMapObj[barIndex] = arrowMapObj;
    });

    return {
      chordsArray: this.chordsArray,
      chordMap: chordMapObj
    };
  }

  /**
   * Импортирует из JSON
   * @param {Object} data
   */
  fromJSON(data) {
    if (!data) return;

    this.chordsArray = data.chordsArray || [];
    this.chordMap.clear();

    if (data.chordMap) {
      Object.entries(data.chordMap).forEach(([barIndex, arrowMapObj]) => {
        const arrowMap = new Map();
        Object.entries(arrowMapObj).forEach(([arrowIndex, chord]) => {
          arrowMap.set(parseInt(arrowIndex), chord);
        });
        this.chordMap.set(parseInt(barIndex), arrowMap);
      });
    }

    this.notifyListeners();
  }

  /**
   * Сохраняет в localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('chordStore', JSON.stringify(this.toJSON()));
    } catch (e) {
      console.error('Error saving chord store:', e);
    }
  }

  /**
   * Загружает из localStorage
   */
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('chordStore');
      if (data) {
        this.fromJSON(JSON.parse(data));
        return true;
      }
    } catch (e) {
      console.error('Error loading chord store:', e);
    }
    return false;
  }
}

