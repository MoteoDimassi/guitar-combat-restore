/**
 * @fileoverview BarManager управляет массивом тактов.
 * Отвечает за разбиение текста на такты, фильтрацию служебных слов,
 * и управление количеством стрелочек.
 */

import { Bar } from '../models/Bar.js';

/**
 * Класс BarManager - менеджер для управления тактами
 */
export class BarManager {
  constructor() {
    this.bars = []; // Массив тактов
    this.defaultArrowCount = 8; // Количество стрелочек по умолчанию
    this.serviceWords = [
      'припев',
      'куплет', 
      'куплет 1',
      'куплет 2',
      'куплет 3',
      'соло',
      'проигрыш',
      'вступление',
      'кода',
      'мост',
      'бридж',
      'интро',
      'outro',
      'chorus',
      'verse',
      'bridge',
      'intro',
      'solo'
    ];
  }

  /**
   * Инициализирует такты из текста песни
   * @param {string} songText - Текст песни
   * @param {Array} chords - Массив аккордов
   */
  initializeBarsFromText(songText, chords = []) {
    if (!songText || typeof songText !== 'string') {
      this.bars = [];
      return;
    }

    // Разбиваем текст на строки
    const lines = songText.split('\n');
    
    // Фильтруем строки: убираем пустые и служебные слова
    const filteredLines = this.filterLines(lines);

    // Создаём такты из отфильтрованных строк
    this.bars = filteredLines.map((line, index) => {
      const chord = chords[index % chords.length] || '';
      return new Bar({
        index: index,
        arrowCount: this.defaultArrowCount,
        textLine: line,
        chord: chord
      });
    });
  }

  /**
   * Фильтрует строки: убирает пустые и служебные слова
   * @param {Array} lines - Массив строк
   * @returns {Array} Отфильтрованные строки
   */
  filterLines(lines) {
    return lines
      .map(line => line.trim())
      .filter(line => {
        // Убираем пустые строки
        if (!line) return false;

        // Убираем служебные слова (регистронезависимо)
        const lowerLine = line.toLowerCase();
        return !this.serviceWords.some(word => 
          lowerLine === word || lowerLine === word + ':'
        );
      });
  }

  /**
   * Добавляет новое служебное слово в фильтр
   * @param {string} word - Служебное слово
   */
  addServiceWord(word) {
    if (word && typeof word === 'string') {
      const lowerWord = word.toLowerCase().trim();
      if (!this.serviceWords.includes(lowerWord)) {
        this.serviceWords.push(lowerWord);
      }
    }
  }

  /**
   * Удаляет служебное слово из фильтра
   * @param {string} word - Служебное слово
   */
  removeServiceWord(word) {
    if (word && typeof word === 'string') {
      const lowerWord = word.toLowerCase().trim();
      const index = this.serviceWords.indexOf(lowerWord);
      if (index > -1) {
        this.serviceWords.splice(index, 1);
      }
    }
  }

  /**
   * Получает список всех служебных слов
   * @returns {Array} Массив служебных слов
   */
  getServiceWords() {
    return [...this.serviceWords];
  }

  /**
   * Устанавливает количество стрелочек по умолчанию для новых тактов
   * @param {number} count - Количество стрелочек
   */
  setDefaultArrowCount(count) {
    if (count >= 1 && count <= 32) {
      this.defaultArrowCount = count;
    }
  }

  /**
   * Изменяет количество стрелочек во всех тактах
   * @param {number} count - Новое количество стрелочек
   */
  setArrowCountForAllBars(count) {
    this.bars.forEach(bar => bar.setArrowCount(count));
    this.defaultArrowCount = count;
  }

  /**
   * Изменяет количество стрелочек в конкретном такте
   * @param {number} barIndex - Индекс такта
   * @param {number} count - Новое количество стрелочек
   */
  setArrowCountForBar(barIndex, count) {
    if (barIndex >= 0 && barIndex < this.bars.length) {
      this.bars[barIndex].setArrowCount(count);
    }
  }

  /**
   * Получает такт по индексу
   * @param {number} index - Индекс такта
   * @returns {Bar|null} Такт или null
   */
  getBar(index) {
    if (index >= 0 && index < this.bars.length) {
      return this.bars[index];
    }
    return null;
  }

  /**
   * Получает все такты
   * @returns {Array} Массив тактов
   */
  getAllBars() {
    return this.bars;
  }

  /**
   * Получает количество тактов
   * @returns {number} Количество тактов
   */
  getBarCount() {
    return this.bars.length;
  }

  /**
   * Добавляет новый такт
   * @param {Bar|Object} bar - Такт или конфигурация такта
   * @returns {Bar} Добавленный такт
   */
  addBar(bar) {
    if (bar instanceof Bar) {
      this.bars.push(bar);
      return bar;
    } else {
      const newBar = new Bar({
        index: this.bars.length,
        arrowCount: this.defaultArrowCount,
        ...bar
      });
      this.bars.push(newBar);
      return newBar;
    }
  }

  /**
   * Вставляет такт в определённую позицию
   * @param {number} index - Позиция для вставки
   * @param {Bar|Object} bar - Такт или конфигурация такта
   */
  insertBar(index, bar) {
    const newBar = bar instanceof Bar ? bar : new Bar({
      index: index,
      arrowCount: this.defaultArrowCount,
      ...bar
    });

    if (index >= 0 && index <= this.bars.length) {
      this.bars.splice(index, 0, newBar);
      this.reindexBars();
    }
  }

  /**
   * Удаляет такт по индексу
   * @param {number} index - Индекс такта
   */
  removeBar(index) {
    if (index >= 0 && index < this.bars.length) {
      this.bars.splice(index, 1);
      this.reindexBars();
    }
  }

  /**
   * Объединяет два такта
   * @param {number} index1 - Индекс первого такта
   * @param {number} index2 - Индекс второго такта
   */
  mergeBars(index1, index2) {
    if (index1 >= 0 && index1 < this.bars.length &&
        index2 >= 0 && index2 < this.bars.length &&
        index1 !== index2) {
      
      const bar1 = this.bars[index1];
      const bar2 = this.bars[index2];

      // Объединяем текстовые строки
      bar1.setTextLine(bar1.getTextLine() + ' ' + bar2.getTextLine());

      // Удаляем второй такт
      this.removeBar(index2);
    }
  }

  /**
   * Разделяет такт на два
   * @param {number} barIndex - Индекс такта для разделения
   * @param {string} firstPart - Текст первой части
   * @param {string} secondPart - Текст второй части
   */
  splitBar(barIndex, firstPart, secondPart) {
    if (barIndex >= 0 && barIndex < this.bars.length) {
      const originalBar = this.bars[barIndex];
      
      // Обновляем текст первого такта
      originalBar.setTextLine(firstPart);

      // Создаём новый такт для второй части
      const newBar = new Bar({
        index: barIndex + 1,
        arrowCount: originalBar.arrowCount,
        textLine: secondPart,
        chord: originalBar.chord,
        beats: JSON.parse(JSON.stringify(originalBar.beats))
      });

      // Вставляем новый такт после текущего
      this.bars.splice(barIndex + 1, 0, newBar);
      this.reindexBars();
    }
  }

  /**
   * Переиндексирует все такты
   */
  reindexBars() {
    this.bars.forEach((bar, index) => {
      bar.index = index;
    });
  }

  /**
   * Сбрасывает к базовому состоянию (1 строка = 1 такт)
   * @param {string} songText - Текст песни
   * @param {Array} chords - Массив аккордов
   */
  resetToDefault(songText, chords = []) {
    this.initializeBarsFromText(songText, chords);
  }

  /**
   * Экспортирует такты в JSON-формат
   * @returns {Array} Массив JSON-объектов
   */
  toJSON() {
    return this.bars.map(bar => bar.toJSON());
  }

  /**
   * Импортирует такты из JSON-формата
   * @param {Array} jsonData - Массив JSON-объектов
   */
  fromJSON(jsonData) {
    if (Array.isArray(jsonData)) {
      this.bars = jsonData.map(json => Bar.fromJSON(json));
    }
  }

  /**
   * Сохраняет текущее состояние в localStorage
   * @param {string} key - Ключ для сохранения (по умолчанию 'bars')
   */
  saveToLocalStorage(key = 'bars') {
    try {
      const data = this.toJSON();
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Ошибка сохранения тактов:', e);
    }
  }

  /**
   * Загружает состояние из localStorage
   * @param {string} key - Ключ для загрузки (по умолчанию 'bars')
   * @returns {boolean} true если загрузка успешна
   */
  loadFromLocalStorage(key = 'bars') {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        this.fromJSON(JSON.parse(data));
        return true;
      }
    } catch (e) {
      console.error('Ошибка загрузки тактов:', e);
    }
    return false;
  }

  /**
   * Очищает все такты
   */
  clear() {
    this.bars = [];
  }
}

