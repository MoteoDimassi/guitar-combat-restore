// Установи: npm install hyphen
import { hyphenateSync as hyphenateRu } from 'hyphen/ru';
import { hyphenateSync as hyphenateEn } from 'hyphen/en-us';

/**
 * SyllableHighlighter — класс для разделения текста на слоги и подсветки.
 */
export class SyllableHighlighter {
  constructor() {
    // soft hyphen (реальный символ, не HTML-entity)
    this.softHyphen = '\u00AD';
    // userSyllableMap: { [word]: [array of syllables] }
    this.userSyllableMap = {};
    try {
      // hyphenateSync возвращает строку с \u00AD между слогами (см. README hyphen).
      this.hyphenRu = hyphenateRu;
      this.hyphenEn = hyphenateEn;
    } catch (error) {
      console.warn('Hyphen initialization failed, falling back to regex:', error);
      this.hyphenRu = null;
      this.hyphenEn = null;
    }
  }

  processText(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const processedLines = lines.map(line => this.processLine(line));
    return processedLines.join('<br>');
  }

  processLine(line) {
    // разбиваем на слова/пробелы (пробелы сохраняем)
    const words = line.split(/(\s+)/);
    return words.map(word => word.trim() === '' ? word : this.processWord(word)).join('');
  }

  processWord(rawWord) {
    // Сохраняем лидирующую и конечную пунктуацию, чтобы hyphenation применялся только к "телу" слова.
    const m = rawWord.match(/^([^A-Za-zА-Яа-яЁё0-9']*)([A-Za-zА-Яа-яЁё0-9' -]+?)([^A-Za-zА-Яа-яЁё0-9']*)$/u);
    if (!m) {
      // нераспознан — просто экранируем и вернём без span (может быть знак препинания)
      return this.escapeHtml(rawWord);
    }
    const [, prefix = '', wordBody = '', suffix = ''] = m;

    // 1. Если есть пользовательская разметка — используем её
    let syllables = this.userSyllableMap[wordBody];
    if (!syllables) {
      // 2. Иначе обычный алгоритм
      syllables = this.splitIntoSyllables(wordBody);
    }

    // Если слогов нет (слово исключено фильтром), возвращаем пустую строку
    if (!syllables || syllables.length === 0) {
      return '';
    }

    // Если один слог, создаём один span
    if (syllables.length === 1) {
      return `${this.escapeHtml(prefix)}<span class="syllable">${this.escapeHtml(wordBody)}</span>${this.escapeHtml(suffix)}`;
    }

    // Несколько слогов - создаём span для каждого
    const spans = syllables.map((s, i) => `<span class="syllable" data-syllable-index="${i}" data-word="${this.escapeHtml(wordBody)}">${this.escapeHtml(s)}</span>`).join('');
    return `${this.escapeHtml(prefix)}${spans}${this.escapeHtml(suffix)}`;
  }

  splitIntoSyllables(word) {
  if (!word) return [word];

  // Фильтр: исключаем служебные слова, цифры, знаки препинания и тире
  const excludedWords = ['припев', 'предприпев', 'куплет', 'проигрыш'];
  const wordLower = word.toLowerCase().trim();
  
  // Проверяем, является ли слово служебным
  if (excludedWords.includes(wordLower)) {
    return [];
  }
  
  // Исключаем слова, состоящие только из цифр
  if (/^\d+$/.test(word)) {
    return [];
  }
  
  // Исключаем знаки препинания и тире
  if (/^[\p{P}\p{S}\-–—−]+$/u.test(word)) {
    return [];
  }

  const isRussian = /[а-яё]/i.test(word);
  
  // Проверка на односимвольные предлоги/союзы - не делим их
  const singleConsonantPrepositions = ['в', 'с', 'к', 'у', 'о', 'и', 'а', 'я'];
  if (word.length === 1 && isRussian) {
    // Односимвольное слово остаётся как есть
    return [word];
  }

  // 1. hyphenation (если словарь дал результат — используем его)
  if ((isRussian && this.hyphenRu) || (!isRussian && this.hyphenEn)) {
    try {
      const hyphenator = isRussian ? this.hyphenRu : this.hyphenEn;
      const hyphenated = hyphenator(word);
      if (typeof hyphenated === 'string' && hyphenated.includes(this.softHyphen)) {
        const sylls = hyphenated.split(this.softHyphen).filter(Boolean);
        if (sylls.length > 1) return this.mergeSingleConsonants(sylls, isRussian);
      }
    } catch (err) {
      console.warn('Hyphenation failed, fallback:', err);
    }
  }

  // 2. fallback: делим по одной гласной
  const vowels = isRussian ? 'аеёиоуыэюя' : 'aeiouy';
  const regex = new RegExp(`[^${vowels}]*[${vowels}]{1}[^${vowels}]*`, 'gi');
  let sylls = word.match(regex);

  if (!sylls || sylls.length <= 1) return [word];

  // 3. дополнительная обработка окончания:
  // если слово заканчивается гласной, а последний слог длиннее 1 символа,
  // то отщепляем последнюю гласную отдельно
  const last = sylls[sylls.length - 1];
  if (last.length > 1) {
    const lastChar = last[last.length - 1];
    if (new RegExp(`[${vowels}]`, 'i').test(lastChar)) {
      // переносим последнюю букву в отдельный слог
      const trimmed = last.slice(0, -1);
      sylls = [...sylls.slice(0, -1), trimmed, lastChar];
    }
  }

  // 4. Объединяем одиночные согласные с соседними слогами
  return this.mergeSingleConsonants(sylls.filter(Boolean), isRussian);
}

  /**
   * Объединяет одиночные согласные с соседними слогами
   * @param {string[]} syllables - Массив слогов
   * @param {boolean} isRussian - Флаг русского языка
   * @returns {string[]} Обработанный массив слогов
   */
  mergeSingleConsonants(syllables, isRussian) {
    if (!syllables || syllables.length <= 1) return syllables;

    const vowels = isRussian ? 'аеёиоуыэюя' : 'aeiouy';
    const vowelRegex = new RegExp(`[${vowels}]`, 'i');
    const result = [];

    for (let i = 0; i < syllables.length; i++) {
      const current = syllables[i];
      
      // Проверяем, является ли текущий слог одиночной согласной
      if (current.length === 1 && !vowelRegex.test(current)) {
        // Присоединяем к следующему слогу, если он есть
        if (i < syllables.length - 1) {
          syllables[i + 1] = current + syllables[i + 1];
        } else if (result.length > 0) {
          // Если это последний слог, присоединяем к предыдущему
          result[result.length - 1] = result[result.length - 1] + current;
        } else {
          // Если это единственный слог, оставляем как есть
          result.push(current);
        }
      } else {
        result.push(current);
      }
    }

    return result;
  }

  escapeHtml(text) {
    if (text == null) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  initializeEventHandlers(container) {
    if (!container) return;
    const syllables = container.querySelectorAll('.syllable');
    syllables.forEach(syllable => {
      syllable.addEventListener('mouseenter', () => syllable.classList.add('syllable-highlight'));
      syllable.addEventListener('mouseleave', () => syllable.classList.remove('syllable-highlight'));
    });
  }

  /**
   * Установить пользовательскую разметку слогов для слова
   * @param {string} word — исходное слово (без пунктуации)
   * @param {string[]} syllables — массив слогов
   */
  setUserSyllables(word, syllables) {
    if (Array.isArray(syllables) && syllables.length > 0) {
      this.userSyllableMap[word] = syllables;
    } else {
      delete this.userSyllableMap[word];
    }
  }

  /**
   * Разбить слово по пользовательскому вводу (строка с пробелами)
   * @param {string} userInput — строка, где слоги разделены пробелами
   * @returns {string[]} массив слогов
   */
  splitByUserInput(userInput) {
    if (!userInput) return [];
    // Удаляем лишние пробелы, разбиваем по пробелу
    return userInput.trim().split(/\s+/).filter(Boolean);
  }
}