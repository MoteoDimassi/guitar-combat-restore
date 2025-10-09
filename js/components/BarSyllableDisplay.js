/**
 * @fileoverview Компонент для отображения слогов текущего такта под стрелочками.
 * Связывает текст песни с визуализацией боя.
 */

import { SyllableHighlighter } from '../utils/SyllableHighlighter.js';

/**
 * Класс BarSyllableDisplay - управляет отображением слогов под стрелочками
 */
export class BarSyllableDisplay {
  constructor(beatRow, barManager) {
    this.beatRow = beatRow;
    this.barManager = barManager;
    this.currentBarIndex = 0;
    this.currentSyllableIndex = 0;
    this.lineToBarMap = new Map(); // Карта: номер строки -> индекс такта
    this.syllableElements = []; // Массив всех элементов слогов
    this.activeLine = null; // Текущая активная строка текста
    this.syllableHighlighter = new SyllableHighlighter(); // Для разбиения на слоги
  }

  /**
   * Инициализация компонента
   */
  init() {
    this.buildLineToBarMap();
    this.bindSyllableClickEvents();
  }

  /**
   * Строит карту соответствия строк текста и тактов
   */
  buildLineToBarMap() {
    this.lineToBarMap.clear();
    
    if (!this.barManager || this.barManager.getBarCount() === 0) {
      return;
    }

    const bars = this.barManager.getAllBars();
    const songContent = document.getElementById('song-content');
    
    if (!songContent) return;

    // Получаем все строки текста (разделённые <br>)
    const innerHTML = songContent.innerHTML;
    const lines = innerHTML.split('<br>');
    
    // Убираем заголовок песни (первые две строки: название и пустая строка)
    const textLines = lines.slice(2);

    // Создаём карту: каждая строка текста соответствует такту
    let barIndex = 0;
    for (let lineIndex = 0; lineIndex < textLines.length && barIndex < bars.length; lineIndex++) {
      const line = textLines[lineIndex];
      // Пропускаем пустые строки
      if (line.trim()) {
        this.lineToBarMap.set(lineIndex, barIndex);
        barIndex++;
      }
    }
  }

  /**
   * Привязывает обработчики кликов к слогам
   */
  bindSyllableClickEvents() {
    const songContent = document.getElementById('song-content');
    if (!songContent) return;

    // Получаем все элементы слогов
    this.syllableElements = Array.from(songContent.querySelectorAll('.syllable'));

    // Группируем слоги по строкам
    const lineElements = this.getLineElements(songContent);

    lineElements.forEach((lineEl, lineIndex) => {
      const syllablesInLine = Array.from(lineEl.querySelectorAll('.syllable'));
      
      syllablesInLine.forEach((syllable, syllableIndex) => {
        syllable.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onSyllableClick(lineIndex, syllableIndex, syllable);
        });

        // Добавляем визуальный эффект при наведении
        syllable.style.cursor = 'pointer';
      });
    });
  }

  /**
   * Получает элементы строк из контента
   */
  getLineElements(songContent) {
    const innerHTML = songContent.innerHTML;
    const lines = innerHTML.split('<br>');
    
    // Убираем заголовок (первые 2 элемента)
    const textLines = lines.slice(2);
    
    return textLines.map((lineHtml, index) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = lineHtml;
      tempDiv.setAttribute('data-line-index', index);
      return tempDiv;
    }).filter(div => div.textContent.trim());
  }

  /**
   * Обработчик клика на слог
   */
  onSyllableClick(lineIndex, syllableIndex, syllableElement) {
    // Определяем такт по номеру строки
    const barIndex = this.lineToBarMap.get(lineIndex);
    
    if (barIndex === undefined) {
      console.warn('Такт не найден для строки:', lineIndex);
      return;
    }

    // Обновляем текущий такт и слог
    this.currentBarIndex = barIndex;
    this.currentSyllableIndex = syllableIndex;

    // Визуально выделяем выбранный слог
    this.highlightSyllable(syllableElement);

    // Визуально выделяем активную строку (такт)
    this.highlightActiveLine(lineIndex);

    // Отображаем слоги такта под стрелочками
    this.displayBarSyllables(barIndex);

    // Обновляем глобальное состояние
    if (window.app) {
      window.app.state.currentBarIndex = barIndex;
    }

    // Обновляем отображение аккордов для нового такта
    this.updateChordDisplayForBar(barIndex);

    // Вызываем callback если установлен
    if (this.onBarChanged) {
      this.onBarChanged(barIndex);
    }
  }

  /**
   * Визуально выделяет выбранный слог
   */
  highlightSyllable(syllableElement) {
    // Убираем выделение со всех слогов
    this.syllableElements.forEach(el => {
      el.classList.remove('syllable-selected');
      el.style.backgroundColor = '';
      el.style.color = '';
    });

    // Выделяем текущий слог
    if (syllableElement) {
      syllableElement.classList.add('syllable-selected');
      syllableElement.style.backgroundColor = '#38e07b';
      syllableElement.style.color = '#111827';
      syllableElement.style.padding = '2px 4px';
      syllableElement.style.borderRadius = '3px';
    }
  }

  /**
   * Визуально выделяет активную строку
   */
  highlightActiveLine(lineIndex) {
    const songContent = document.getElementById('song-content');
    if (!songContent) return;

    // Убираем выделение со всех строк
    const allLines = this.getLineElements(songContent);
    allLines.forEach(lineEl => {
      const syllables = lineEl.querySelectorAll('.syllable');
      syllables.forEach(syl => {
        if (!syl.classList.contains('syllable-selected')) {
          syl.style.opacity = '0.5';
        }
      });
    });

    // Выделяем текущую строку
    if (lineIndex >= 0 && lineIndex < allLines.length) {
      this.activeLine = allLines[lineIndex];
      const syllables = this.activeLine.querySelectorAll('.syllable');
      syllables.forEach(syl => {
        if (!syl.classList.contains('syllable-selected')) {
          syl.style.opacity = '1';
        }
      });
    }
  }

  /**
   * Отображает слоги такта под стрелочками
   */
  displayBarSyllables(barIndex) {
    const bar = this.barManager.getBar(barIndex);
    if (!bar) return;

    const textLine = bar.getTextLine();
    if (!textLine) return;

    // Очищаем ВСЕ слоги (и автоматические, и вручную перемещённые)
    if (window.app && window.app.syllableDragDrop) {
      window.app.syllableDragDrop.clearAllSyllables();
    }

    // Разбиваем строку на слова
    const words = textLine.trim().split(/\s+/);
    const syllables = [];
    
    // Разбиваем каждое слово на слоги
    words.forEach(word => {
      if (!word) return;
      
      // Используем SyllableHighlighter для правильного разбиения на слоги
      const wordSyllables = this.syllableHighlighter.splitIntoSyllables(word);
      
      // Добавляем все слоги слова в общий массив
      // Фильтруем пустые массивы (исключённые слова возвращают [])
      if (wordSyllables && wordSyllables.length > 0) {
        syllables.push(...wordSyllables);
      }
    });

    // Отображаем автоматические слоги под стрелочками
    this.renderSyllablesUnderArrows(syllables, barIndex);
    
    // Восстанавливаем вручную перемещённые слоги для этого такта
    this.restoreManualSyllables(barIndex);
  }

  /**
   * Рендерит слоги под стрелочками
   */
  renderSyllablesUnderArrows(syllables, barIndex) {
    if (!this.beatRow || !this.beatRow.element) return;

    const dropZones = this.beatRow.element.querySelectorAll('.syllable-drop-zone');
    
    dropZones.forEach((zone, index) => {
      // Проверяем, есть ли уже размещённый слог
      const hasPlacedSyllable = zone.querySelector('.placed-syllable');
      
      // Если есть размещённый слог, не трогаем эту зону
      if (hasPlacedSyllable) {
        return;
      }
      
      // Если есть слог для этой позиции, размещаем его автоматически
      if (index < syllables.length && syllables[index]) {
        this.placeAutoSyllable(index, syllables[index], barIndex);
      }
    });
  }
  
  /**
   * Автоматически размещает слог используя систему SyllableDragDrop
   */
  placeAutoSyllable(arrowIndex, syllableText, barIndex) {
    if (!window.app || !window.app.syllableDragDrop) return;
    
    const syllableData = {
      text: syllableText,
      word: '',
      index: arrowIndex.toString()
    };
    
    // Используем метод placeSyllable из SyllableDragDrop
    // с флагом isAuto = true, чтобы слоги выглядели одинаково
    window.app.syllableDragDrop.placeSyllable(arrowIndex, syllableData, true, barIndex);
  }

  /**
   * Восстанавливает вручную перемещённые слоги для конкретного такта
   */
  restoreManualSyllables(barIndex) {
    if (!window.app || !window.app.syllableDragDrop) return;
    
    // Получаем сохранённые позиции для этого такта
    const savedPositions = window.app.syllableDragDrop.getBarSyllablePositions(barIndex);
    
    // Восстанавливаем каждый вручную размещённый слог
    Object.keys(savedPositions).forEach(arrowIndex => {
      const syllableData = savedPositions[arrowIndex];
      
      // Размещаем слог как вручную перемещённый (isAuto = false)
      window.app.syllableDragDrop.placeSyllable(
        parseInt(arrowIndex),
        syllableData,
        false,
        barIndex
      );
    });
  }

  /**
   * Переходит к следующей строке (такту)
   */
  nextLine() {
    const nextBarIndex = this.currentBarIndex + 1;
    if (nextBarIndex < this.barManager.getBarCount()) {
      this.goToBar(nextBarIndex);
    }
  }

  /**
   * Переходит к предыдущей строке (такту)
   */
  previousLine() {
    const prevBarIndex = this.currentBarIndex - 1;
    if (prevBarIndex >= 0) {
      this.goToBar(prevBarIndex);
    }
  }

  /**
   * Переходит к указанному такту
   */
  goToBar(barIndex) {
    if (barIndex < 0 || barIndex >= this.barManager.getBarCount()) {
      return;
    }

    this.currentBarIndex = barIndex;
    this.currentSyllableIndex = 0;

    // Находим соответствующую строку
    let lineIndex = -1;
    for (const [line, bar] of this.lineToBarMap.entries()) {
      if (bar === barIndex) {
        lineIndex = line;
        break;
      }
    }

    if (lineIndex >= 0) {
      this.highlightActiveLine(lineIndex);
    }

    this.displayBarSyllables(barIndex);

    // Обновляем глобальное состояние
    if (window.app) {
      window.app.state.currentBarIndex = barIndex;
    }

    // Обновляем отображение аккордов для нового такта
    this.updateChordDisplayForBar(barIndex);

    // Вызываем callback если установлен
    if (this.onBarChanged) {
      this.onBarChanged(barIndex);
    }
  }

  /**
   * Обновляет отображение аккордов для указанного такта
   */
  updateChordDisplayForBar(barIndex) {
    if (!window.app || !window.app.chordDisplay) {
      return;
    }

    // Получаем текущий и следующий такт
    const currentBar = this.barManager.getBar(barIndex);
    const nextBar = this.barManager.getBar(barIndex + 1);

    if (!currentBar) {
      return;
    }

    // Получаем аккорды из тактов
    const currentChord = currentBar.getChord();
    
    // Если есть следующий такт, берем его аккорд, иначе используем текущий
    let nextChord = currentChord;
    if (nextBar) {
      nextChord = nextBar.getChord();
    } else {
      // Если это последний такт, берем аккорд первого такта (зацикливание)
      const firstBar = this.barManager.getBar(0);
      if (firstBar) {
        nextChord = firstBar.getChord();
      }
    }

    // Обновляем ChordDisplay
    window.app.chordDisplay.updateCurrentChord(currentChord, barIndex, 0);
  }

  /**
   * Обновляет отображение при изменении текста песни
   */
  refresh() {
    this.buildLineToBarMap();
    this.bindSyllableClickEvents();
    
    if (this.currentBarIndex >= 0) {
      this.displayBarSyllables(this.currentBarIndex);
    }
  }

  /**
   * Устанавливает callback для изменения такта
   */
  setOnBarChanged(callback) {
    this.onBarChanged = callback;
  }

  /**
   * Получает текущий индекс такта
   */
  getCurrentBarIndex() {
    return this.currentBarIndex;
  }

  /**
   * Очищает отображение слогов
   */
  clear() {
    if (!this.beatRow || !this.beatRow.element) return;

    // Очищаем все размещённые слоги
    if (window.app && window.app.syllableDragDrop) {
      window.app.syllableDragDrop.clearAllSyllables();
      // Очищаем также историю позиций для тактов
      window.app.syllableDragDrop.clearBarSyllablePositions();
    }

    // Убираем выделение со всех слогов в тексте песни
    this.syllableElements.forEach(el => {
      el.classList.remove('syllable-selected');
      el.style.backgroundColor = '';
      el.style.color = '';
      el.style.opacity = '';
      el.style.padding = '';
      el.style.borderRadius = '';
    });
  }
}

