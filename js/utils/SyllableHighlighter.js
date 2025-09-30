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
      // нераспознан — просто экранируем и вернём
      return `<span class="syllable">${this.escapeHtml(rawWord)}</span>`;
    }
    const [, prefix = '', wordBody = '', suffix = ''] = m;

    const syllables = this.splitIntoSyllables(wordBody);

    if (!syllables || syllables.length <= 1) {
      return `${this.escapeHtml(prefix)}<span class="syllable">${this.escapeHtml(wordBody)}</span>${this.escapeHtml(suffix)}`;
    }

    const spans = syllables.map((s, i) => `<span class="syllable" data-syllable-index="${i}">${this.escapeHtml(s)}</span>`).join('');
    return `${this.escapeHtml(prefix)}${spans}${this.escapeHtml(suffix)}`;
  }

  splitIntoSyllables(word) {
  if (!word) return [word];

  const isRussian = /[а-яё]/i.test(word);

  // 1. hyphenation (если словарь дал результат — используем его)
  if ((isRussian && this.hyphenRu) || (!isRussian && this.hyphenEn)) {
    try {
      const hyphenator = isRussian ? this.hyphenRu : this.hyphenEn;
      const hyphenated = hyphenator(word);
      if (typeof hyphenated === 'string' && hyphenated.includes(this.softHyphen)) {
        const sylls = hyphenated.split(this.softHyphen).filter(Boolean);
        if (sylls.length > 1) return sylls;
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

  return sylls.filter(Boolean);
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
}