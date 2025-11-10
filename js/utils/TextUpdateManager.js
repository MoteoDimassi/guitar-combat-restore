/**
 * @fileoverview TextUpdateManager - модуль для умного обновления привязок слогов при редактировании текста
 * Анализирует изменения в тексте и сохраняет существующие привязки слогов
 */

export class TextUpdateManager {
  constructor() {
    this.syllableDragDrop = null;
  }

  /**
   * Инициализация с ссылкой на SyllableDragDrop
   * @param {SyllableDragDrop} syllableDragDrop - экземпляр SyllableDragDrop
   */
  init(syllableDragDrop) {
    this.syllableDragDrop = syllableDragDrop;
  }

  /**
   * Сравнивает старый и новый текст, находит изменения
   * @param {string} oldText - старый текст
   * @param {string} newText - новый текст
   * @returns {Object} объект с изменениями
   */
  compareTexts(oldText, newText) {
    if (!oldText || !newText) {
      return { type: 'full_replace', changes: [] };
    }

    const oldLines = this.splitIntoLines(oldText);
    const newLines = this.splitIntoLines(newText);

    const changes = this.detectChangedLines(oldLines, newLines);
    
    return {
      type: changes.length === oldLines.length ? 'full_replace' : 'partial_update',
      changes: changes
    };
  }

  /**
   * Разбивает текст на строки
   * @param {string} text - текст для разбивки
   * @returns {Array} массив строк
   */
  splitIntoLines(text) {
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }

  /**
   * Определяет изменённые строки
   * @param {Array} oldLines - старые строки
   * @param {Array} newLines - новые строки
   * @returns {Array} массив изменений
   */
  detectChangedLines(oldLines, newLines) {
    const changes = [];
    const maxLength = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        changes.push({
          lineIndex: i,
          oldLine,
          newLine,
          type: oldLine === '' ? 'added' : newLine === '' ? 'removed' : 'modified'
        });
      }
    }

    return changes;
  }

  /**
   * Объединяет изменения слов в строке
   * @param {string} oldLine - старая строка
   * @param {string} newLine - новая строка
   * @param {Array} existingSyllables - существующие слоги для этой строки
   * @returns {Object} результат объединения
   */
  mergeWordChanges(oldLine, newLine, existingSyllables = []) {
    const oldWords = this.extractWords(oldLine);
    const newWords = this.extractWords(newLine);
    
    const result = {
      addedWords: [],
      removedWords: [],
      modifiedWords: [],
      unchangedWords: []
    };

    // Создаём карту существующих слогов по словам
    const syllableMap = new Map();
    existingSyllables.forEach(syllable => {
      if (syllable.word) {
        if (!syllableMap.has(syllable.word)) {
          syllableMap.set(syllable.word, []);
        }
        syllableMap.get(syllable.word).push(syllable);
      }
    });

    // Анализируем изменения
    for (let i = 0; i < Math.max(oldWords.length, newWords.length); i++) {
      const oldWord = oldWords[i];
      const newWord = newWords[i];

      if (!oldWord && newWord) {
        // Новое слово
        result.addedWords.push({
          word: newWord,
          position: i
        });
      } else if (oldWord && !newWord) {
        // Удалённое слово
        result.removedWords.push({
          word: oldWord,
          position: i,
          syllables: syllableMap.get(oldWord) || []
        });
      } else if (oldWord && newWord && oldWord !== newWord) {
        // Изменённое слово
        result.modifiedWords.push({
          oldWord,
          newWord,
          position: i,
          existingSyllables: syllableMap.get(oldWord) || []
        });
      } else if (oldWord && newWord && oldWord === newWord) {
        // Неизменённое слово
        result.unchangedWords.push({
          word: oldWord,
          position: i,
          syllables: syllableMap.get(oldWord) || []
        });
      }
    }

    return result;
  }

  /**
   * Извлекает слова из строки
   * @param {string} line - строка текста
   * @returns {Array} массив слов
   */
  extractWords(line) {
    if (!line) return [];
    
    // Убираем HTML теги и извлекаем только слова
    const cleanLine = line.replace(/<[^>]*>/g, '');
    return cleanLine.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Добавляет новые слова с автоматической привязкой к стрелочкам
   * @param {Array} addedWords - массив новых слов
   * @param {number} barIndex - индекс такта
   */
  addNewWords(addedWords, barIndex) {
    if (!this.syllableDragDrop || !Array.isArray(addedWords)) {
      return;
    }

    addedWords.forEach(({ word, position }) => {
      // Создаём слоги для нового слова
      const syllables = this.createSyllablesForWord(word);
      
      // Размещаем слоги под стрелочками
      syllables.forEach((syllable, syllableIndex) => {
        const arrowIndex = (position + syllableIndex) % 8; // Зацикливаем по 8 стрелочкам
        
        const syllableData = {
          id: `syllable-${Date.now()}-${Math.random()}`,
          text: syllable,
          barIndex: barIndex,
          arrowIndex: arrowIndex,
          word: word,
          syllableIndex: syllableIndex
        };

        this.syllableDragDrop.allSyllables.push(syllableData);
      });
    });

    // Сохраняем изменения
    this.syllableDragDrop.saveSyllablesToStorage();
  }

  /**
   * Удаляет слова и их слоги
   * @param {Array} removedWords - массив удалённых слов
   */
  removeDeletedWords(removedWords) {
    if (!this.syllableDragDrop || !Array.isArray(removedWords)) {
      return;
    }

    removedWords.forEach(({ word, syllables }) => {
      // Удаляем слоги из массива
      syllables.forEach(syllable => {
        const index = this.syllableDragDrop.allSyllables.findIndex(s => s.id === syllable.id);
        if (index !== -1) {
          this.syllableDragDrop.allSyllables.splice(index, 1);
        }
      });
    });

    // Сохраняем изменения
    this.syllableDragDrop.saveSyllablesToStorage();
  }

  /**
   * Обновляет слоги для изменённых слов
   * @param {Array} modifiedWords - массив изменённых слов
   * @param {number} barIndex - индекс такта
   */
  updateExistingSyllables(modifiedWords, barIndex) {
    if (!this.syllableDragDrop || !Array.isArray(modifiedWords)) {
      return;
    }

    modifiedWords.forEach(({ oldWord, newWord, existingSyllables }) => {
      // Создаём новые слоги для изменённого слова
      const newSyllables = this.createSyllablesForWord(newWord);
      
      // Обновляем существующие слоги
      existingSyllables.forEach((syllable, index) => {
        if (index < newSyllables.length) {
          // Обновляем текст слога
          syllable.text = newSyllables[index];
          syllable.word = newWord;
        } else {
          // Удаляем лишние слоги
          const syllableIndex = this.syllableDragDrop.allSyllables.findIndex(s => s.id === syllable.id);
          if (syllableIndex !== -1) {
            this.syllableDragDrop.allSyllables.splice(syllableIndex, 1);
          }
        }
      });

      // Добавляем новые слоги, если их больше чем было
      for (let i = existingSyllables.length; i < newSyllables.length; i++) {
        const newSyllable = {
          id: `syllable-${Date.now()}-${Math.random()}`,
          text: newSyllables[i],
          barIndex: barIndex,
          arrowIndex: existingSyllables[0]?.arrowIndex || 0,
          word: newWord,
          syllableIndex: i
        };
        this.syllableDragDrop.allSyllables.push(newSyllable);
      }
    });

    // Сохраняем изменения
    this.syllableDragDrop.saveSyllablesToStorage();
  }

  /**
   * Создаёт слоги для слова (упрощённая версия)
   * @param {string} word - слово для разбивки
   * @returns {Array} массив слогов
   */
  createSyllablesForWord(word) {
    if (!word) return [];

    // Убираем лишние пробелы
    const cleanWord = word.trim();
    if (!cleanWord) return [];

    // Простая логика разбивки на слоги
    // В реальной реализации здесь должен быть вызов SyllableHighlighter
    const vowels = /[аеёиоуыэюя]/i;
    const syllables = [];
    let currentSyllable = '';

    for (let i = 0; i < cleanWord.length; i++) {
      currentSyllable += cleanWord[i];
      
      // Если следующий символ - гласная, завершаем слог
      if (i < cleanWord.length - 1 && vowels.test(cleanWord[i + 1])) {
        syllables.push(currentSyllable.trim());
        currentSyllable = '';
      }
    }

    // Добавляем последний слог
    if (currentSyllable) {
      syllables.push(currentSyllable.trim());
    }

    return syllables.length > 0 ? syllables : [cleanWord];
  }

  /**
   * Обрабатывает полное обновление текста (при добавлении новой песни)
   * @param {string} newText - новый текст
   */
  handleFullTextReplace(newText) {
    if (!this.syllableDragDrop) {
      return;
    }

    // Очищаем все существующие слоги
    this.syllableDragDrop.clearAllSyllables();
    
    // Пересоздаём слоги из нового текста
    this.syllableDragDrop.createAllSyllablesFromText();
  }

  /**
   * Обрабатывает частичное обновление текста (при редактировании)
   * @param {string} oldText - старый текст
   * @param {string} newText - новый текст
   */
  handlePartialTextUpdate(oldText, newText) {
    if (!this.syllableDragDrop) {
      return;
    }

    const comparison = this.compareTexts(oldText, newText);
    
    if (comparison.type === 'full_replace') {
      this.handleFullTextReplace(newText);
      return;
    }

    // Обрабатываем изменения построчно
    comparison.changes.forEach(change => {
      const existingSyllables = this.syllableDragDrop.getBarSyllables(change.lineIndex);
      const wordChanges = this.mergeWordChanges(change.oldLine, change.newLine, existingSyllables);
      
      // Применяем изменения
      this.addNewWords(wordChanges.addedWords, change.lineIndex);
      this.removeDeletedWords(wordChanges.removedWords);
      this.updateExistingSyllables(wordChanges.modifiedWords, change.lineIndex);
    });

    // Перерисовываем текущий такт
    const currentBarIndex = window.app?.state?.currentBarIndex || 0;
    this.syllableDragDrop.renderBarSyllables(currentBarIndex);
  }
}
