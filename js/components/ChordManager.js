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
    
    this.parsedChords = []; // Массив распарсенных аккордов
  }

  // Парсинг строки аккордов из поля ввода
  parseChords(chordsString) {
    if (!chordsString || typeof chordsString !== 'string') {
      this.parsedChords = [];
      return this.parsedChords;
    }
    
    // Разделяем по | и очищаем от пробелов
    this.parsedChords = chordsString.split('|')
      .map(chord => chord.trim())
      .filter(chord => chord.length > 0)
      .filter(chord => this.hasChord(chord)); // Валидация существования аккорда
    
    return this.parsedChords;
  }

  // Получение нот аккорда по названию
  getChordNotes(chordName) {
    return this.chords[chordName] || null;
  }

  // Получение аккорда по индексу доли (каждая доля соответствует одному аккорду)
  getChordForBeat(beatIndex, totalBeats) {
    if (this.parsedChords.length === 0) {
      return null;
    }
    
    // Каждая доля соответствует одному аккорду с циклическим повторением
    const chordIndex = beatIndex % this.parsedChords.length;
    
    return this.parsedChords[chordIndex];
  }

  // Получение нот для конкретной доли
  getNotesForBeat(beatIndex, totalBeats) {
    const chordName = this.getChordForBeat(beatIndex, totalBeats);
    if (!chordName) {
      return null;
    }
    
    return this.getChordNotes(chordName);
  }

  // Обновление списка аккордов
  updateChords(chordsString) {
    this.parseChords(chordsString);
    console.log('Аккорды обновлены:', this.parsedChords);
  }

  // Получение всех доступных аккордов
  getAvailableChords() {
    return Object.keys(this.chords);
  }

  // Проверка, существует ли аккорд
  hasChord(chordName) {
    return this.chords.hasOwnProperty(chordName);
  }
}
