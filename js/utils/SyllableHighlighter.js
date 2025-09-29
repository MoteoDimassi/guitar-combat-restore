/**
 * SyllableHighlighter - класс для разделения текста песни на слоги и подсветки при наведении.
 * Обрабатывает русский и английский текст, создавая интерактивные слоги.
 */
export class SyllableHighlighter {
  constructor() {
    // Гласные буквы для русского и английского языков
    this.vowels = ['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'a', 'e', 'i', 'o', 'u'];
  }

  /**
   * Основной метод для обработки текста песни.
   * Разделяет текст на слоги и создает HTML с интерактивными элементами.
   * @param {string} text - Текст песни
   * @returns {string} HTML строка с разметкой слогов
   */
  processText(text) {
    if (!text) return '';

    // Разбиваем текст на строки и обрабатываем каждую строку
    const lines = text.split('\n');
    const processedLines = lines.map(line => this.processLine(line));

    return processedLines.join('<br>');
  }

  /**
   * Обрабатывает одну строку текста.
   * @param {string} line - Строка текста
   * @returns {string} Обработанная строка с HTML
   */
  processLine(line) {
    // Разбиваем строку на слова и пробелы
    const words = line.split(/(\s+)/);

    const processedWords = words.map(word => {
      if (word.trim() === '') {
        // Сохраняем пробелы как есть
        return word;
      } else {
        // Обрабатываем слово
        return this.processWord(word);
      }
    });

    return processedWords.join('');
  }

  /**
   * Обрабатывает отдельное слово, разделяя его на слоги.
   * @param {string} word - Слово для обработки
   * @returns {string} HTML с разметкой слогов
   */
  processWord(word) {
    const syllables = this.splitIntoSyllables(word);

    if (syllables.length <= 1) {
      // Слово имеет только один слог или пустое
      return `<span class="syllable">${this.escapeHtml(word)}</span>`;
    }

    // Создаем HTML для каждого слога
    const syllableSpans = syllables.map((syllable, index) => {
      return `<span class="syllable" data-syllable-index="${index}">${this.escapeHtml(syllable)}</span>`;
    });

    return syllableSpans.join('');
  }

  /**
   * Разделяет слово на слоги с помощью регулярных выражений.
   * @param {string} word - Слово для разделения
   * @returns {string[]} Массив слогов
   */
  splitIntoSyllables(word) {
    if (!word || word.length === 0) return [word];

    // Регулярное выражение для поиска слогов (гласные + согласные)
    // Для английского и русского: согласные (необязательные) + гласная + согласные (необязательные)
    const syllableRegex = /[^aeiouаеёиоуыэюя]*[aeiouаеёиоуыэюя]+[^aeiouаеёиоуыэюя]*/gi;

    const syllables = word.match(syllableRegex);

    // Фильтруем пустые слоги и возвращаем
    return syllables && syllables.length > 0 ? syllables.filter(s => s.length > 0) : [word];
  }

  /**
   * Экранирует HTML символы в тексте.
   * @param {string} text - Текст для экранирования
   * @returns {string} Экранированный текст
   */
  escapeHtml(text) {
    const map = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  /**
   * Инициализирует обработчики событий для уже существующего текста.
   * Добавляет индивидуальные обработчики mouseenter и mouseleave для каждого слога.
   * @param {HTMLElement} container - Контейнер с текстом песни
   */
  initializeEventHandlers(container) {
    if (!container) return;

    // Находим все элементы слогов в контейнере
    const syllables = container.querySelectorAll('.syllable');

    syllables.forEach(syllable => {
      syllable.addEventListener('mouseenter', () => {
        syllable.classList.add('syllable-highlight');
      });

      syllable.addEventListener('mouseleave', () => {
        syllable.classList.remove('syllable-highlight');
      });
    });
  }
}