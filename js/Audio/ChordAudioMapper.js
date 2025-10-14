/**
 * Класс для преобразования частот аккордов в названия нот из папки audio/NotesMP3/
 * Соединяет теоретические частоты из ChordBuilder с реальными аудио файлами
 */
export class ChordAudioMapper {
  constructor() {
    // Маппинг частот на названия нот из папки
    // Основано на стандартном строе A=440 Гц
    this.frequencyToNoteMap = new Map();
    
    // Доступные ноты в папке audio/NotesMP3/
    this.availableNotes = [
      'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
      'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
      'E3', 'F3', 'F#3', 'G3', 'G#3'
    ];
    
    // Инициализируем маппинг частот
    this.initializeFrequencyMapping();
  }

  /**
   * Инициализирует маппинг частот на названия нот
   */
  initializeFrequencyMapping() {
    // Стандартные частоты для нот (A=440 Гц)
    const standardFrequencies = {
      // Первая октава
      'C1': 261.63,
      'C#1': 277.18,
      'D1': 293.66,
      'D#1': 311.13,
      'E1': 329.63,
      'F1': 349.23,
      'F#1': 369.99,
      'G1': 392.00,
      'G#1': 415.30,
      'A1': 440.00,
      'A#1': 466.16,
      'B1': 493.88,
      // Вторая октава
      'C2': 523.25,
      'C#2': 554.37,
      'D2': 587.33,
      'D#2': 622.25,
      'E2': 659.25,
      'F2': 698.46,
      'F#2': 739.99,
      'G2': 783.99,
      'G#2': 830.61,
      'A2': 880.00,
      'A#2': 932.33,
      'B2': 987.77,
      // Третья октава (только доступные ноты)
      'E3': 659.25 * 2, // 1318.51
      'F3': 698.46 * 2, // 1396.92
      'F#3': 739.99 * 2, // 1479.98
      'G3': 783.99 * 2, // 1567.98
      'G#3': 830.61 * 2  // 1661.22
    };

    // Заполняем маппинг
    this.availableNotes.forEach(noteName => {
      if (standardFrequencies[noteName]) {
        this.frequencyToNoteMap.set(standardFrequencies[noteName], noteName);
      }
    });
  }

  /**
   * Находит ближайшую доступную ноту для заданной частоты
   * @param {number} frequency - Частота в Гц
   * @returns {string|null} Название ноты или null
   */
  findClosestNote(frequency) {
    if (!frequency || typeof frequency !== 'number') {
      return null;
    }

    // Если частота точно совпадает с доступной нотой
    if (this.frequencyToNoteMap.has(frequency)) {
      return this.frequencyToNoteMap.get(frequency);
    }

    // Ищем ближайшую частоту
    let closestFrequency = null;
    let smallestDifference = Infinity;
    
    for (const [availableFrequency] of this.frequencyToNoteMap) {
      const difference = Math.abs(availableFrequency - frequency);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestFrequency = availableFrequency;
      }
    }

    // Если разница слишком большая (более полутона), считаем что нота не найдена
    const semitoneDifference = smallestDifference / (frequency * Math.pow(2, 1/12) - frequency);
    if (semitoneDifference > 0.5) {
      return null;
    }

    return closestFrequency ? this.frequencyToNoteMap.get(closestFrequency) : null;
  }

  /**
   * Преобразует массив частот в массив названий нот
   * @param {number[]} frequencies - Массив частот
   * @returns {string[]} Массив названий нот
   */
  mapFrequenciesToNotes(frequencies) {
    if (!Array.isArray(frequencies)) {
      return [];
    }

    return frequencies
      .map(frequency => this.findClosestNote(frequency))
      .filter(note => note !== null); // Убираем нуллы
  }

  /**
   * Преобразует аккорд из ChordBuilder в названия нот из папки
   * @param {string} chordName - Название аккорда
   * @param {ChordBuilder} chordBuilder - Экземпляр ChordBuilder
   * @returns {string[]} Массив названий нот для воспроизведения
   */
  mapChordToNotes(chordName, chordBuilder) {
    if (!chordName || !chordBuilder) {
      return [];
    }

    // Получаем частоты нот аккорда
    const frequencies = chordBuilder.getChordNotes(chordName);
    if (!frequencies || !Array.isArray(frequencies)) {
      return [];
    }

    // Преобразуем частоты в названия нот
    return this.mapFrequenciesToNotes(frequencies);
  }

  /**
   * Получает все доступные ноты
   * @returns {string[]} Массив доступных нот
   */
  getAvailableNotes() {
    return [...this.availableNotes];
  }

  /**
   * Проверяет, доступна ли нота
   * @param {string} noteName - Название ноты
   * @returns {boolean} true если нота доступна
   */
  isNoteAvailable(noteName) {
    return this.availableNotes.includes(noteName);
  }

  /**
   * Получает частоту для ноты
   * @param {string} noteName - Название ноты
   * @returns {number|null} Частота или null
   */
  getNoteFrequency(noteName) {
    for (const [frequency, name] of this.frequencyToNoteMap) {
      if (name === noteName) {
        return frequency;
      }
    }
    return null;
  }

  /**
   * Добавляет новую ноту в маппинг
   * @param {string} noteName - Название ноты
   * @param {number} frequency - Частота
   */
  addNote(noteName, frequency) {
    if (noteName && typeof frequency === 'number') {
      this.frequencyToNoteMap.set(frequency, noteName);
      if (!this.availableNotes.includes(noteName)) {
        this.availableNotes.push(noteName);
      }
    }
  }

  /**
   * Удаляет ноту из маппинга
   * @param {string} noteName - Название ноты
   */
  removeNote(noteName) {
    const index = this.availableNotes.indexOf(noteName);
    if (index > -1) {
      this.availableNotes.splice(index, 1);
    }
    
    // Удаляем из маппинга частот
    for (const [frequency, name] of this.frequencyToNoteMap) {
      if (name === noteName) {
        this.frequencyToNoteMap.delete(frequency);
        break;
      }
    }
  }

  /**
   * Получает статистику маппинга
   * @returns {Object} Статистика
   */
  getStats() {
    return {
      totalAvailableNotes: this.availableNotes.length,
      totalFrequencyMappings: this.frequencyToNoteMap.size,
      availableNotes: [...this.availableNotes]
    };
  }
}