/**
 * Класс для создания аккордов из названий
 * Парсит название аккорда и определяет необходимые ноты для построения аккорда
 */
export class ChordBuilder {
  constructor() {
    // Частоты нот в двух октавах (основана на A=440)
    this.noteFrequencies = {
      // Первая октава
      'C': 261.63,
      'C#': 277.18,
      'Db': 277.18,
      'D': 293.66,
      'D#': 311.13,
      'Eb': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99,
      'Gb': 369.99,
      'G': 392.00,
      'G#': 415.30,
      'Ab': 415.30,
      'A': 440.00,
      'A#': 466.16,
      'Bb': 466.16,
      'B': 493.88,
      // Вторая октава (умножено на 2)
      'C2': 523.25,
      'C#2': 554.37,
      'Db2': 554.37,
      'D2': 587.33,
      'D#2': 622.25,
      'Eb2': 622.25,
      'E2': 659.25,
      'F2': 698.46,
      'F#2': 739.99,
      'Gb2': 739.99,
      'G2': 783.99,
      'G#2': 830.61,
      'Ab2': 830.61,
      'A2': 880.00,
      'A#2': 932.33,
      'Bb2': 932.33,
      'B2': 987.77
    };

    // Интервалы для разных типов аккордов (в полутоннах)
    this.chordTypes = {
      // Основные трезвучия
      '': [0, 4, 7],           // мажор (major)
      'maj': [0, 4, 7],        // мажор (явный)
      'm': [0, 3, 7],          // минор (minor)
      'min': [0, 3, 7],        // минор (явный)
      'dim': [0, 3, 6],        // уменьшенный (diminished)
      'aug': [0, 4, 8],        // увеличенный (augmented)

      // Суспенды
      'sus2': [0, 2, 7],       // суспенд 2
      'sus4': [0, 5, 7],       // суспенд 4

      // Сексты
      '6': [0, 4, 7, 9],       // мажор 6
      'm6': [0, 3, 7, 9],      // минор 6

      // Септаккорды
      '7': [0, 4, 7, 10],      // доминант 7
      'maj7': [0, 4, 7, 11],   // мажор 7
      'm7': [0, 3, 7, 10],     // минор 7
      'dim7': [0, 3, 6, 9],     // уменьшенный 7
      'm7b5': [0, 3, 6, 10],   // минор 7 с пониженной квинтой
      '7sus4': [0, 5, 7, 10],   // 7 суспенд 4

      // Расширенные аккорды
      '9': [0, 4, 7, 10, 14],  // доминант 9
      'maj9': [0, 4, 7, 11, 14], // мажор 9
      'm9': [0, 3, 7, 10, 14],  // минор 9
      '11': [0, 4, 7, 10, 14, 17], // доминант 11
      '13': [0, 4, 7, 10, 14, 17, 21] // доминант 13
    };
  }

  /**
   * Парсит название аккорда и возвращает его компоненты
   * @param {string} chordName - Название аккорда (например, "Cmaj7", "Dm/G")
   * @returns {Object|null} Объект с полями root, type, bass или null
   */
  parseChordName(chordName) {
    if (!chordName || typeof chordName !== 'string') return null;

    // Разделяем на ноту и остальное
    const match = chordName.match(/^([A-G][#b]?)(.*?)\/?([A-G][#b]?)?$/);
    if (!match) return null;

    const [, root, type, bass] = match;
    return {
      root: root,
      type: type || '',
      bass: bass || null
    };
  }

  /**
   * Получает частоту ноты
   * @param {string} note - Название ноты
   * @param {number} octave - Октава (0 или 1)
   * @returns {number|null} Частота в герцах или null
   */
  getNoteFrequency(note, octave = 0) {
    // Для второй октавы используем суффикс 2
    const noteKey = octave === 1 ? note + '2' : note;
    return this.noteFrequencies[noteKey] || null;
  }

  /**
   * Вычисляет частоты аккорда на основе корневой ноты и типа
   * @param {string} root - Корневая нота
   * @param {string} type - Тип аккорда
   * @param {string|null} bass - Бассовая нота (опционально)
   * @returns {number[]|null} Массив частот или null
   */
  calculateChordFrequencies(root, type, bass = null) {
    const rootFreq = this.getNoteFrequency(root);
    if (!rootFreq) return null;

    const intervals = this.chordTypes[type];
    if (!intervals) return null;

    // Вычисляем частоты для каждой ноты аккорда
    const chordFrequencies = intervals.map(interval =>
      rootFreq * Math.pow(2, interval / 12)
    );

    // Если есть басовая нота, добавляем её
    if (bass) {
      const bassFreq = this.getNoteFrequency(bass);
      if (bassFreq) {
        // Басовая нота обычно в нижнем регистре
        chordFrequencies.unshift(bassFreq / 2); // понижаем октаву для баса
      }
    }

    return chordFrequencies;
  }

  /**
   * Основной метод получения нот аккорда по названию
   * @param {string} chordName - Название аккорда
   * @returns {number[]|null} Массив частот нот или null
   */
  getChordNotes(chordName) {
    const parsed = this.parseChordName(chordName);
    if (!parsed) return null;

    return this.calculateChordFrequencies(parsed.root, parsed.type, parsed.bass);
  }

  /**
   * Проверяет валидность названия аккорда
   * @param {string} chordName - Название аккорда
   * @returns {boolean} true если аккорд валиден
   */
  isValidChord(chordName) {
    const parsed = this.parseChordName(chordName);
    if (!parsed) return false;

    const rootFreq = this.getNoteFrequency(parsed.root);
    const intervals = this.chordTypes[parsed.type];
    const bassFreq = parsed.bass ? this.getNoteFrequency(parsed.bass) : true;

    return rootFreq && intervals && bassFreq;
  }

  /**
   * Получает все поддерживаемые типы аккордов
   * @returns {string[]} Массив типов аккордов
   */
  getSupportedTypes() {
    return Object.keys(this.chordTypes);
  }

  /**
   * Получает все поддерживаемые ноты
   * @returns {string[]} Массив названий нот
   */
  getSupportedNotes() {
    return Object.keys(this.noteFrequencies);
  }

  /**
   * Получает все доступные аккорды
   * @returns {string[]} Массив названий аккордов
   */
  getAvailableChords() {
    return this.getSupportedTypes().map(type =>
      this.getSupportedNotes().slice(0, 12).map(note => note + type)
    ).flat().filter(chord => this.isValidChord(chord));
  }

  /**
   * Добавляет новый тип аккорда
   * @param {string} type - Название типа
   * @param {number[]} intervals - Массив интервалов в полутоннах
   */
  addChordType(type, intervals) {
    this.chordTypes[type] = intervals;
  }

  /**
   * Добавляет новую ноту
   * @param {string} note - Название ноты
   * @param {number} frequency - Частота в герцах
   */
  addNote(note, frequency) {
    this.noteFrequencies[note] = frequency;
  }

  /**
   * Создает аккорд с инверсией
   * @param {string} chordName - Название аккорда
   * @param {number} inversion - Уровень инверсии (0, 1, 2)
   * @returns {number[]|null} Массив частот с инверсией
   */
  getChordWithInversion(chordName, inversion = 0) {
    const notes = this.getChordNotes(chordName);
    if (!notes) return null;
    
    // Применяем инверсию (перестановку нот для разного звучания)
    if (inversion === 0) return notes; // Основное положение
    if (inversion === 1) return [notes[1], notes[2], notes[0] * 2]; // Первая инверсия
    if (inversion === 2) return [notes[2], notes[0] * 2, notes[1] * 2]; // Вторая инверсия
    
    return notes;
  }

  /**
   * Возвращает информацию об аккорде
   * @param {string} chordName - Название аккорда
   * @returns {Object|null} Информация об аккорде
   */
  getChordInfo(chordName) {
    const notes = this.getChordNotes(chordName);
    if (!notes) return null;

    const parsed = this.parseChordName(chordName);
    if (!parsed) return null;

    return {
      name: chordName,
      root: parsed.root,
      type: parsed.type,
      bass: parsed.bass,
      frequencies: notes,
      noteCount: notes.length,
      isValid: true
    };
  }

  /**
   * Получает названия нот аккорда вместо частот
   * @param {string} chordName - Название аккорда
   * @returns {string[]|null} Массив названий нот или null
   */
  getChordNoteNames(chordName) {
    const parsed = this.parseChordName(chordName);
    if (!parsed) return null;

    const {root, type, bass} = parsed;
    const intervals = this.chordTypes[type];
    if (!intervals) return null;

    // Хроматическая шкала для расчета названий нот
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const rootIndex = chromaticScale.indexOf(root);
    if (rootIndex === -1) return null;

    const notes = intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return chromaticScale[noteIndex];
    });

    // Если есть басовая нота, добавляем её первой
    if (bass) {
      notes.unshift(bass);
    }

    return notes;
  }
}
