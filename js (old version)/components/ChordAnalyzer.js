// === ДОКУМЕНТАЦИЯ ДЛЯ РАСШИРЕНИЯ СИСТЕМЫ АККОРДОВ ===

/*
## РАСШИРЕНИЕ СИСТЕМЫ АККОРДОВ

### 1. ДОБАВЛЕНИЕ НОВЫХ ТИПОВ АККОРДОВ

Чтобы добавить новый тип аккорда, добавьте запись в this.chordTypes в конструкторе ChordAnalyzer:

this.chordTypes['новый_тип'] = [интервал1, интервал2, интервал3, ...];

Интервалы указываются в полутоннах от корневой ноты (0).
Примеры:
- '7sus4': [0, 5, 7, 10]  // корень, кварта, квинта, септима
- 'add9': [0, 4, 7, 14]   // мажор + нона
- '6/9': [0, 4, 7, 9, 14] // мажор + секста + нона

### 2. ДОБАВЛЕНИЕ НОВЫХ НОТ

Добавить ноты в this.noteFrequencies:
this.noteFrequencies['новая_нота'] = частота_в_герцах;

Для второй октавы используйте суффикс '2':
this.noteFrequencies['новая_нота2'] = частота_в_герцах * 2;

### 3. ДОБАВЛЕНИЕ НОВЫХ ПРАВИЛ ПАРСИНГА

Если нужен новый формат названия аккордов, модифицируйте parseChordName().
Текущий regex: /^([A-G][#b]?)(.*?)\/?([A-G][#b]?)?$/

### 4. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

// Добавление нового типа аккорда
this.chordTypes['11'] = [0, 4, 7, 10, 14, 17]; // доминант 11

// Теперь можно использовать: C11, Dm11, etc.

// Добавление новой ноты
this.noteFrequencies['C##'] = this.noteFrequencies['D']; // двойной диез
this.noteFrequencies['C##2'] = this.noteFrequencies['D2'];

### 5. ТЕСТИРОВАНИЕ

Для тестирования новых аккордов используйте:
const cm = new ChordManager();
const notes = cm.getChordNotes('Cновый_тип');
console.log(notes);

### 6. ОБРАТНАЯ СОВМЕСТИМОСТЬ

Система сохраняет старые статические аккорды в this.chords для совместимости.
Новые динамические аккорды имеют приоритет, но fallback работает на старые.
*/

// --- АНАЛИЗАТОР АККОРДОВ ДЛЯ ДИНАМИЧЕСКОГО ОПРЕДЕЛЕНИЯ ---

export class ChordAnalyzer {
  constructor() {
    // Частоты нот в двух октавах (основана на A=220)
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
    // Структура: [интервалы для triad/base, дополнительные интервалы для расширений]
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

  // Парсинг названия аккорда
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

  // Получение частоты ноты
  getNoteFrequency(note, octave = 0) {
    // Для второй октавы используем суффикс 2
    const noteKey = octave === 1 ? note + '2' : note;
    return this.noteFrequencies[noteKey] || null;
  }

  // Вычисление частот аккорда
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

  // Основной метод получения нот аккорда
  getChordNotes(chordName) {
    const parsed = this.parseChordName(chordName);
    if (!parsed) return null;

    return this.calculateChordFrequencies(parsed.root, parsed.type, parsed.bass);
  }

  // Проверка валидности аккорда
  isValidChord(chordName) {
    const parsed = this.parseChordName(chordName);
    if (!parsed) return false;

    const rootFreq = this.getNoteFrequency(parsed.root);
    const intervals = this.chordTypes[parsed.type];
    const bassFreq = parsed.bass ? this.getNoteFrequency(parsed.bass) : true;

    return rootFreq && intervals && bassFreq;
  }

  // Получение всех поддерживаемых типов аккордов
  getSupportedTypes() {
    return Object.keys(this.chordTypes);
  }

  // Получение всех поддерживаемых нот
  getSupportedNotes() {
    return Object.keys(this.noteFrequencies);
  }
}