// Компонент управления аккордами
export class ChordManager {
  constructor() {
    // Словарь аккордов: название -> массив частот (3 ноты)
    this.chords = {
      'Am': [220, 261.63, 329.63],      // A, C, E
      'A': [220, 277.18, 329.63],       // A, C#, E
      'Dm': [293.66, 349.23, 440],      // D, F, A
      'D': [293.66, 369.99, 440],       // D, F#, A
      'Em': [329.63, 392, 493.88],      // E, G, B
      'E': [329.63, 415.3, 493.88],     // E, G#, B
      'G': [392, 493.88, 587.33],       // G, B, D
      'C': [261.63, 329.63, 392],       // C, E, G
      'F': [349.23, 440, 523.25],       // F, A, C
      'B': [493.88, 622.25, 739.99],    // B, D#, F#
      'Bm': [493.88, 587.33, 739.99],   // B, D, F#
      'F#m': [369.99, 440, 554.37]      // F#, A, C#
    };

    this.parsedChords = [];     // массив распарсенных аккордов (по тактам)
    this.chordMaps = [];        // массив карт: на каждый такт объект вида {0: "Am", ...}
    this.changesGlobal = {0: 0};   // по умолчанию аккорд с 0-й стрелки, без смен внутри
    this.perBarOverrides = [];     // переопределения для отдельных тактов (опционально)
  }

  // --- Парсинг строки аккордов из поля ввода ---
  parseChords(chordsString) {
    if (!chordsString || typeof chordsString !== 'string') {
      this.parsedChords = [];
      return this.parsedChords;
    }
    this.parsedChords = chordsString
      .split('|')
      .map(ch => ch.trim())
      .filter(ch => ch.length > 0)
      .filter(ch => this.hasChord(ch)); // валидация
    return this.parsedChords;
  }

  // --- Обновление списка аккордов (+ немедленная регенерация chordMap при известном arrowCount) ---
  updateChords(chordsString, arrowCount = null) {
    this.parseChords(chordsString);
    if (Number.isInteger(arrowCount) && arrowCount > 0) {
      this.generateChordMaps(arrowCount);
    }
    console.log('Аккорды обновлены:', this.parsedChords);
  }

  // --- Настройка правил смен (на будущее; можно не трогать) ---
  setChangesGlobal(obj) {
    this.changesGlobal = obj || {0: 0};
  }
  setPerBarOverrides(arr) {
    this.perBarOverrides = Array.isArray(arr) ? arr : [];
  }

  // --- Генерация chordMaps: по умолчанию аккорд держится целый такт ---
  generateChordMaps(arrowCount) {
    this.chordMaps = [];
    if (!Array.isArray(this.parsedChords) || this.parsedChords.length === 0) return;
    if (!Number.isInteger(arrowCount) || arrowCount <= 0) arrowCount = 1;

    for (let bar = 0; bar < this.parsedChords.length; bar++) {
      const baseChord = this.parsedChords[bar];
      const nextChord = this.parsedChords[(bar + 1) % this.parsedChords.length];

      const map = {};
      // БАЗА: на старте такта (стрелка 0) — базовый аккорд целого такта
      map[0] = baseChord;

      // (необязательно) глобальные точки смены внутри такта — по умолчанию их нет
      for (const [posStr, val] of Object.entries(this.changesGlobal || {})) {
        const pos = parseInt(posStr, 10);
        if (!(pos >= 0 && pos < arrowCount)) continue;
        if (pos === 0) continue; // 0 уже занят базой

        if (val === 1) {
          map[pos] = nextChord; // смена на следующий аккорд прогрессии
        } else if (typeof val === 'string' && val.trim()) {
          if (this.hasChord(val.trim())) map[pos] = val.trim();
        }
      }

      // (необязательно) переопределения для конкретного такта
      const override = this.perBarOverrides[bar];
      if (override && typeof override === 'object') {
        for (const [posStr, chordName] of Object.entries(override)) {
          const pos = parseInt(posStr, 10);
          if (!(pos >= 0 && pos < arrowCount)) continue;
          if (typeof chordName === 'string' && chordName.trim() && this.hasChord(chordName.trim())) {
            map[pos] = chordName.trim();
          }
        }
      }

      this.chordMaps.push(map);
    }
    console.log('ChordMaps сгенерированы:', this.chordMaps);
  }

  // --- Получение имени аккорда по позиции (тактовая логика) ---
  getChordNameForPosition(barIndex, arrowInBar, arrowCount) {
    if (!Array.isArray(this.parsedChords) || this.parsedChords.length === 0) return null;

    const baseChord = this.parsedChords[barIndex % this.parsedChords.length];

    // если карт нет — держим аккорд весь такт
    if (!Array.isArray(this.chordMaps) || this.chordMaps.length === 0) {
      return baseChord;
    }

    const map = this.chordMaps[barIndex % this.chordMaps.length] || {};
    // ищем последнюю заявленную точку <= arrowInBar
    let chosen = baseChord;
    let lastPos = -1;
    for (const key of Object.keys(map)) {
      const pos = parseInt(key, 10);
      if (pos <= arrowInBar && pos >= 0 && pos > lastPos) {
        chosen = map[key];
        lastPos = pos;
      }
    }
    return chosen || baseChord;
  }

  // --- Ноты аккорда по позиции ---
  getNotesForPosition(barIndex, arrowInBar, arrowCount) {
    const chordName = this.getChordNameForPosition(barIndex, arrowInBar, arrowCount);
    if (!chordName) return null;
    return this.getChordNotes(chordName);
  }

  // --- УЛУЧШЕННАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ АККОРДОВ С УЧЕТОМ ПРОГРЕССИИ ---
  getChordProgressionForBar(barIndex) {
    if (!Array.isArray(this.parsedChords) || this.parsedChords.length === 0) {
      return null;
    }
    return this.parsedChords[barIndex % this.parsedChords.length];
  }

  // --- ПОЛУЧЕНИЕ ВСЕХ НОТ ДЛЯ АККОРДА С ВОЗМОЖНОСТЬЮ ИНВЕРСИЙ ---
  getChordNotesWithInversion(chordName, inversion = 0) {
    const notes = this.getChordNotes(chordName);
    if (!notes) return null;
    
    // Применяем инверсию (перестановку нот для разного звучания)
    if (inversion === 0) return notes; // Основное положение
    if (inversion === 1) return [notes[1], notes[2], notes[0] * 2]; // Первая инверсия
    if (inversion === 2) return [notes[2], notes[0] * 2, notes[1] * 2]; // Вторая инверсия
    
    return notes;
  }

  // --- БАЗОВЫЕ УТИЛИТЫ ---
  getChordNotes(chordName) {
    return this.chords[chordName] || null;
  }
  getAvailableChords() {
    return Object.keys(this.chords);
  }
  hasChord(chordName) {
    return this.chords.hasOwnProperty(chordName);
  }

}
