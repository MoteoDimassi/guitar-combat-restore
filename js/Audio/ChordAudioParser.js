/**
 * Класс ChordAudioParser - парсит аккорды и сопоставляет их ноты с аудиофайлами
 * Интегрируется с ChordBuilder для получения нот аккорда и NoteMapper для сопоставления с аудиофайлами
 */
export class ChordAudioParser {
  constructor(chordBuilder = null, noteMapper = null) {
    // Используем переданные зависимости или создаем новые
    this.chordBuilder = chordBuilder;
    this.noteMapper = noteMapper;

    // Настройки по умолчанию
    this.defaultOctave = 1;
    this.fallbackOctave = 2;

    // Асинхронная инициализация зависимостей, если они не переданы
    this.initializeDependencies();
  }

  /**
   * Асинхронная инициализация зависимостей
   */
  async initializeDependencies() {
    if (!this.chordBuilder) {
      const { ChordBuilder } = await import('../Chords/ChordBuilder.js');
      this.chordBuilder = new ChordBuilder();
    }

    if (!this.noteMapper) {
      const { NoteMapper } = await import('./NoteMapper.js');
      this.noteMapper = new NoteMapper();
    }
  }

  /**
   * Парсит строку аккордов, разделенных пробелами
   * @param {string} chordString - Строка с аккордами (например, "C G Am F")
   * @returns {Array<string>} Массив названий аккордов
   */
  parseChordString(chordString) {
    if (!chordString || typeof chordString !== 'string') {
      return [];
    }

    // Разделяем по пробелам, фильтруем пустые строки и убираем лишние пробелы
    return chordString
      .split(/\s+/)
      .map(chord => chord.trim())
      .filter(chord => chord.length > 0);
  }

  /**
   * Получает названия нот для аккорда
   * @param {string} chordName - Название аккорда
   * @returns {Array<string>|null} Массив названий нот или null
   */
  async getChordNotes(chordName) {
    // Убеждаемся, что зависимости инициализированы
    await this.initializeDependencies();

    if (!this.chordBuilder || !this.chordBuilder.getChordNoteNames) {
      console.error('ChordBuilder не инициализирован или не имеет метода getChordNoteNames');
      return null;
    }

    return this.chordBuilder.getChordNoteNames(chordName);
  }

  /**
   * Сопоставляет ноты аккорда с аудиофайлами
   * @param {Array<string>} notes - Массив названий нот
   * @param {number} octave - Октава по умолчанию
   * @returns {Array<Object>} Массив объектов с информацией о нотах и путями к файлам
   */
  mapNotesToAudio(notes, octave = this.defaultOctave) {
    if (!Array.isArray(notes)) return [];

    const mappedNotes = [];

    for (const note of notes) {
      const audioPath = this.findAudioFile(note, octave);

      mappedNotes.push({
        note: note,
        octave: octave,
        audioPath: audioPath,
        found: audioPath !== null
      });
    }

    return mappedNotes;
  }

  /**
   * Находит аудиофайл для ноты с учетом fallback октав
   * @param {string} note - Название ноты
   * @param {number} preferredOctave - Предпочитаемая октава
   * @returns {string|null} Путь к аудиофайлу или null
   */
  findAudioFile(note, preferredOctave = this.defaultOctave) {
    if (!this.noteMapper || !this.noteMapper.getAudioPath) {
      console.error('NoteMapper не инициализирован или не имеет метода getAudioPath');
      return null;
    }

    // Сначала пробуем предпочтительную октаву
    let audioPath = this.noteMapper.getAudioPath(note, preferredOctave);
    if (audioPath) return audioPath;

    // Если не нашли, пробуем fallback октаву
    if (preferredOctave !== this.fallbackOctave) {
      audioPath = this.noteMapper.getAudioPath(note, this.fallbackOctave);
      if (audioPath) return audioPath;
    }

    // Если всё еще не нашли, пробуем другие доступные октавы
    const availableOctaves = [1, 2, 3].filter(oct => oct !== preferredOctave && oct !== this.fallbackOctave);
    for (const octave of availableOctaves) {
      audioPath = this.noteMapper.getAudioPath(note, octave);
      if (audioPath) return audioPath;
    }

    // Если ничего не нашли, возвращаем null
    return null;
  }

  /**
   * Получает список аудиофайлов для аккорда
   * @param {string} chordName - Название аккорда
   * @param {number} octave - Октава по умолчанию
   * @returns {Promise<Array<Object>>} Массив объектов с информацией о нотах и путями к файлам
   */
  async getChordAudioFiles(chordName, octave = this.defaultOctave) {
    const notes = await this.getChordNotes(chordName);
    if (!notes) return [];

    return this.mapNotesToAudio(notes, octave);
  }

  /**
   * Получает аудиофайлы для нескольких аккордов
   * @param {Array<string>} chordNames - Массив названий аккордов
   * @param {number} octave - Октава по умолчанию
   * @returns {Promise<Object>} Объект с аккордами и их аудиофайлами
   */
  async getMultipleChordsAudio(chordNames, octave = this.defaultOctave) {
    const result = {};

    for (const chordName of chordNames) {
      result[chordName] = await this.getChordAudioFiles(chordName, octave);
    }

    return result;
  }

  /**
   * Парсит строку аккордов и возвращает полную информацию с аудиофайлами
   * @param {string} chordString - Строка с аккордами
   * @param {number} octave - Октава по умолчанию
   * @returns {Promise<Object>} Объект с разобранными аккордами и их аудиофайлами
   */
  async parseChordsWithAudio(chordString, octave = this.defaultOctave) {
    const chordNames = this.parseChordString(chordString);
    const audioData = await this.getMultipleChordsAudio(chordNames, octave);

    return {
      originalString: chordString,
      chords: chordNames,
      audioMapping: audioData,
      summary: {
        totalChords: chordNames.length,
        validChords: Object.keys(audioData).length,
        totalNotes: Object.values(audioData).reduce((sum, notes) => sum + notes.length, 0),
        foundNotes: Object.values(audioData).flat().filter(note => note.found).length,
        missingNotes: Object.values(audioData).flat().filter(note => !note.found).length
      }
    };
  }

  /**
   * Устанавливает октаву по умолчанию
   * @param {number} octave - Новая октава по умолчанию
   */
  setDefaultOctave(octave) {
    if (octave >= 1 && octave <= 3) {
      this.defaultOctave = octave;
    }
  }

  /**
   * Устанавливает fallback октаву
   * @param {number} octave - Новая fallback октава
   */
  setFallbackOctave(octave) {
    if (octave >= 1 && octave <= 3) {
      this.fallbackOctave = octave;
    }
  }

  /**
   * Проверяет, все ли ноты аккорда имеют соответствующие аудиофайлы
   * @param {string} chordName - Название аккорда
   * @param {number} octave - Октава по умолчанию
   * @returns {Promise<boolean>} true если все ноты найдены
   */
  async isChordFullySupported(chordName, octave = this.defaultOctave) {
    const audioFiles = await this.getChordAudioFiles(chordName, octave);
    return audioFiles.length > 0 && audioFiles.every(note => note.found);
  }

  /**
   * Синхронная версия метода для проверки поддержки аккорда (без проверки существования файлов)
   * @param {string} chordName - Название аккорда
   * @returns {boolean} true если аккорд может быть поддержан (независимо от существования файлов)
   */
  canSupportChord(chordName) {
    const notes = this.chordBuilder ? this.chordBuilder.getChordNoteNames(chordName) : null;
    return notes && notes.length > 0;
  }
}