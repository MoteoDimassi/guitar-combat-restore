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
    
    // Инициализируем или обновляем syllableDragDrop если он доступен
    if (window.app && window.app.syllableDragDrop) {
      // Обновляем drop-зоны после инициализации
      window.app.syllableDragDrop.updateDropZones();
    }
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
   * Привязывает обработчики кликов к слогам и добавляет функциональность перетаскивания
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
        // Добавляем необходимые data-атрибуты для корректной работы перетаскивания
        this.addSyllableDataAttributes(syllable, lineIndex, syllableIndex);
        
        // Добавляем обработчик клика
        syllable.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onSyllableClick(lineIndex, syllableIndex, syllable);
        });

        // Добавляем визуальный эффект при наведении
        syllable.style.cursor = 'pointer';
        
        // Добавляем класс для стилизации
        syllable.classList.add('song-syllable');
        
        // Добавляем функциональность перетаскивания, если доступен syllableDragDrop
        if (window.app && window.app.syllableDragDrop) {
          window.app.syllableDragDrop.makeSyllableDraggable(syllable);
        }
      });
    });
  }

  /**
   * Добавляет необходимые data-атрибуты для слога
   * @param {HTMLElement} syllable - элемент слога
   * @param {number} lineIndex - индекс строки
   * @param {number} syllableIndex - индекс слога в строке
   */
  addSyllableDataAttributes(syllable, lineIndex, syllableIndex) {
    // Получаем текст слога
    const syllableText = syllable.textContent || '';
    
    // Определяем исходное слово (для простоты берем весь текст строки)
    const lineElement = syllable.closest('div') || syllable.parentElement;
    const lineText = lineElement ? lineElement.textContent : '';
    
    // Устанавливаем data-атрибуты
    syllable.setAttribute('data-syllable-text', syllableText);
    syllable.setAttribute('data-word', lineText);
    syllable.setAttribute('data-syllable-index', syllableIndex.toString());
    
    // Добавляем дополнительный атрибут для идентификации строки
    syllable.setAttribute('data-line-index', lineIndex.toString());
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
      // Сбрасываем индекс стрелочки на начало такта
      window.app.state.currentIndex = 0;
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
      el.style.transform = '';
    });

    // Выделяем текущий слог с улучшенной анимацией
    if (syllableElement) {
      syllableElement.classList.add('syllable-selected');
      syllableElement.style.backgroundColor = '#38e07b';
      syllableElement.style.color = '#111827';
      syllableElement.style.padding = '2px 4px';
      syllableElement.style.borderRadius = '3px';
      syllableElement.style.transform = 'scale(1.05)';
      syllableElement.style.boxShadow = '0 4px 8px rgba(56, 224, 123, 0.3)';
      
      // Добавляем пульсирующую анимацию для выделенного слога
      syllableElement.style.animation = 'pulse 1s infinite';
    }
  }

  /**
   * Визуально выделяет активную строку
   */
  highlightActiveLine(lineIndex) {
    const songContent = document.getElementById('song-content');
    if (!songContent) return;

    // Убираем выделение со всех строк с плавной анимацией
    const allLines = this.getLineElements(songContent);
    allLines.forEach(lineEl => {
      const syllables = lineEl.querySelectorAll('.syllable');
      syllables.forEach(syl => {
        if (!syl.classList.contains('syllable-selected')) {
          syl.style.opacity = '0.5';
          syl.style.transform = 'scale(0.95)';
          syl.style.transition = 'all 0.3s ease';
        }
      });
    });

    // Выделяем текущую строку с плавной анимацией
    if (lineIndex >= 0 && lineIndex < allLines.length) {
      this.activeLine = allLines[lineIndex];
      const syllables = this.activeLine.querySelectorAll('.syllable');
      syllables.forEach(syl => {
        if (!syl.classList.contains('syllable-selected')) {
          syl.style.opacity = '1';
          syl.style.transform = 'scale(1)';
          syl.style.transition = 'all 0.3s ease';
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

    // Отображаем слоги для этого такта используя систему перетаскивания
    if (window.app && window.app.syllableDragDrop) {
      // Убеждаемся, что drop-зоны обновлены
      window.app.syllableDragDrop.updateDropZones();
      
      // Отображаем слоги для текущего такта
      window.app.syllableDragDrop.renderBarSyllables(barIndex);
    }
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
      // Сбрасываем индекс стрелочки на начало такта
      window.app.state.currentIndex = 0;
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

    // Используем ChordStore для получения аккордов
    if (window.app.chordStore) {
      const currentChord = window.app.chordStore.getChordForBar(barIndex);
      const nextChord = window.app.chordStore.getNextChord(barIndex);

      if (currentChord) {
        window.app.chordDisplay.updateCurrentChord(currentChord, barIndex, 0);
        return;
      }
    }

    // Fallback на старую логику через BarManager
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
    
    // Обновляем syllableDragDrop при изменении текста
    if (window.app && window.app.syllableDragDrop) {
      // Пересоздаем слоги из обновленного текста
      window.app.syllableDragDrop.recreateSyllables();
      // Обновляем drop-зоны
      window.app.syllableDragDrop.updateDropZones();
    }
    
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

    // Очищаем все слоги
    if (window.app && window.app.syllableDragDrop) {
      window.app.syllableDragDrop.clearAllSyllables();
    }

    // Убираем выделение со всех слогов в тексте песни
    this.syllableElements.forEach(el => {
      el.classList.remove('syllable-selected');
      el.style.backgroundColor = '';
      el.style.color = '';
      el.style.opacity = '';
      el.style.padding = '';
      el.style.borderRadius = '';
      el.style.transform = '';
      el.style.boxShadow = '';
      el.style.animation = '';
      el.style.transition = '';
    });
  }
}

