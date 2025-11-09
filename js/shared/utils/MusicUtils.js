class MusicUtils {
  // Ноты в порядке по квинтам
  static NOTES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
  
  // Диатонические интервалы
  static INTERVALS = {
    'unison': 0,
    'minor 2nd': 1,
    'major 2nd': 2,
    'minor 3rd': 3,
    'major 3rd': 4,
    'perfect 4th': 5,
    'tritone': 6,
    'perfect 5th': 7,
    'minor 6th': 8,
    'major 6th': 9,
    'minor 7th': 10,
    'major 7th': 11
  };

  // Получение нот для аккорда
  static getChordNotes(chordName) {
    const chordPatterns = {
      'major': [0, 4, 7],
      'minor': [0, 3, 7],
      'dim': [0, 3, 6],
      'aug': [0, 4, 8],
      'maj7': [0, 4, 7, 11],
      'min7': [0, 3, 7, 10],
      'dom7': [0, 4, 7, 10],
      'maj6': [0, 4, 7, 9],
      'min6': [0, 3, 7, 9]
    };

    // Парсим имя аккорда
    const { root, type } = this.parseChordName(chordName);
    
    if (!root || !type) {
      return [];
    }

    const pattern = chordPatterns[type] || chordPatterns['major'];
    const rootIndex = this.NOTES.indexOf(root);
    
    if (rootIndex === -1) {
      return [];
    }

    // Строим ноты аккорда
    const notes = pattern.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return this.NOTES[noteIndex];
    });

    return notes;
  }

  // Парсинг имени аккорда с улучшенным регулярным выражением
  static parseChordName(chordName) {
    if (!chordName || typeof chordName !== 'string') {
      return { root: null, type: null };
    }

    // Улучшенное регулярное выражение для парсинга аккордов
    // Поддерживает: C, C#, Cb, Cm, Cm7, Cmaj7, C7, C6, Cdim, Caug, Cm7b5, C7#9, etc.
    const chordRegex = /^([A-G])([#b]?)((m|min|maj|dim|aug|sus|add)?[0-9]*(b|#)?[0-9]*)?$/;
    const match = chordName.match(chordRegex);
    
    if (!match) {
      return { root: null, type: null };
    }

    const [, root, accidental, modifier = ''] = match;
    const fullRoot = root + accidental;

    // Определяем тип аккорда на основе модификатора
    let type = 'major';
    
    if (modifier.includes('m') && !modifier.includes('maj')) {
      if (modifier.includes('7')) {
        type = 'min7';
      } else if (modifier.includes('6')) {
        type = 'min6';
      } else if (modifier.includes('dim') || modifier.includes('m7b5')) {
        type = 'dim';
      } else {
        type = 'minor';
      }
    } else if (modifier.includes('dim')) {
      type = 'dim';
    } else if (modifier.includes('aug')) {
      type = 'aug';
    } else if (modifier.includes('maj7')) {
      type = 'maj7';
    } else if (modifier.includes('7')) {
      type = 'dom7';
    } else if (modifier.includes('6')) {
      type = 'maj6';
    } else if (modifier.includes('sus')) {
      type = 'sus';
    } else if (modifier.includes('add')) {
      type = 'add';
    }

    return { root: fullRoot, type };
  }

  // Парсинг строки с аккордами, разделенными пробелами
  static parseChordsString(chordsString) {
    if (!chordsString || typeof chordsString !== 'string') {
      return { chords: [], errors: [] };
    }

    // Разделяем строку на аккорды по пробелам
    const chordNames = chordsString.trim().split(/\s+/).filter(name => name.length > 0);
    const chords = [];
    const errors = [];

    chordNames.forEach((chordName, index) => {
      const parsed = this.parseChordName(chordName);
      
      if (parsed.root && parsed.type) {
        chords.push({
          name: chordName,
          root: parsed.root,
          type: parsed.type,
          notes: this.getChordNotes(chordName),
          position: index
        });
      } else {
        errors.push({
          chord: chordName,
          position: index,
          message: `Нераспознанный аккорд: ${chordName}`
        });
      }
    });

    return { chords, errors };
  }

  // Преобразование имени ноты в индекс
  static noteToIndex(note) {
    return this.NOTES.indexOf(note);
  }

  // Преобразование индекса в ноту
  static indexToNote(index) {
    return this.NOTES[index % 12];
  }

  // Транспозиция ноты на количество полутонов
  static transposeNote(note, semitones) {
    const index = this.noteToIndex(note);
    if (index === -1) return note;
    
    const newIndex = (index + semitones) % 12;
    return this.indexToNote(newIndex);
  }

  // Транспозиция аккорда
  static transposeChord(chordName, semitones) {
    const { root, type } = this.parseChordName(chordName);
    if (!root) return chordName;
    
    const newRoot = this.transposeNote(root, semitones);
    
    // Восстанавливаем тип аккорда
    let suffix = '';
    if (type === 'minor') suffix = 'm';
    else if (type === 'dim') suffix = 'dim';
    else if (type === 'aug') suffix = 'aug';
    else if (type === 'maj7') suffix = 'maj7';
    else if (type === 'min7') suffix = 'm7';
    else if (type === 'dom7') suffix = '7';
    else if (type === 'maj6') suffix = '6';
    else if (type === 'min6') suffix = 'm6';
    
    return newRoot + suffix;
  }

  // Получение всех аккордов для тональности
  static getScaleChords(key, scaleType = 'major') {
    const majorScalePattern = [0, 2, 4, 5, 7, 9, 11];
    const minorScalePattern = [0, 2, 3, 5, 7, 8, 10];
    
    const pattern = scaleType === 'minor' ? minorScalePattern : majorScalePattern;
    const rootIndex = this.noteToIndex(key);
    
    if (rootIndex === -1) return [];
    
    const scaleNotes = pattern.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return this.indexToNote(noteIndex);
    });
    
    // Строим аккорды для каждой ступени
    const chordTypes = scaleType === 'minor' 
      ? ['minor', 'dim', 'major', 'minor', 'minor', 'major', 'major']
      : ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
    
    return scaleNotes.map((note, index) => {
      const type = chordTypes[index];
      const suffix = type === 'major' ? '' : type === 'minor' ? 'm' : type;
      return note + suffix;
    });
  }

  // Определение интервала между двумя нотами
  static getInterval(note1, note2) {
    const index1 = this.noteToIndex(note1);
    const index2 = this.noteToIndex(note2);
    
    if (index1 === -1 || index2 === -1) return null;
    
    let interval = index2 - index1;
    if (interval < 0) interval += 12;
    
    return interval;
  }

  // Проверка, являются ли ноты consonant (консонанс)
  static isConsonant(note1, note2) {
    const interval = this.getInterval(note1, note2);
    
    // Консонансные интервалы
    const consonantIntervals = [0, 3, 4, 5, 7, 8, 9];
    return consonantIntervals.includes(interval);
  }

  // Преобразование темпа в длительность доли в миллисекундах
  static tempoToBeatDuration(tempo) {
    return 60000 / tempo; // мс
  }

  // Преобразование длительности доли в темп
  static beatDurationToTempo(duration) {
    return 60000 / duration; // BPM
  }

  // Получение нот для воспроизведения (с октавами)
  static getPlaybackNotes(chordName, octave = 2) {
    const chordNotes = this.getChordNotes(chordName);
    
    return chordNotes.map(note => {
      // Добавляем октаву к ноте
      let noteWithOctave = note + octave;
      
      // Корректируем октаву для некоторых нот
      if (note === 'C#' || note === 'D#' || note === 'F#' || note === 'G#' || note === 'A#') {
        noteWithOctave = note + octave;
      }
      
      return noteWithOctave;
    });
  }

  // Преобразование ноты в путь к аудиофайлу
  static getAudioFilePath(note, octave = 2) {
    if (note === 'Mute') {
      return `./audio/NotesMP3/Mute.mp3`;
    }
    return `./audio/NotesMP3/${note}${octave}.mp3`;
  }

  // Получение путей к аудиофайлам для аккорда
  static getChordAudioFiles(chordName, octave = 2) {
    const playbackNotes = this.getPlaybackNotes(chordName, octave);
    return playbackNotes.map(note => this.getAudioFilePath(note, octave));
  }

  // Определение октавы для ноты на основе доступных файлов
  static getAvailableOctave(note) {
    // Проверяем, какие октавы доступны для данной ноты
    const availableOctaves = {
      'C': [1, 2],
      'C#': [1, 2],
      'D': [1, 2],
      'D#': [1, 2],
      'E': [1, 2, 3],
      'F': [1, 2, 3],
      'F#': [1, 2, 3],
      'G': [1, 2, 3],
      'G#': [1, 2, 3],
      'A': [1, 2],
      'A#': [1, 2],
      'B': [1, 2]
    };
    
    return availableOctaves[note] || [2]; // По умолчанию октава 2
  }

  // Получение оптимальной октавы для ноты в аккорде
  static getOptimalOctaveForChord(chordName) {
    const notes = this.getChordNotes(chordName);
    const octaves = notes.map(note => this.getAvailableOctave(note));
    
    // Находим общую октаву для всех нот
    const commonOctaves = octaves.reduce((common, noteOctaves) => {
      return common.filter(octave => noteOctaves.includes(octave));
    }, octaves[0] || [2]);
    
    // Возвращаем первую доступную общую октаву или 2 по умолчанию
    return commonOctaves.length > 0 ? commonOctaves[0] : 2;
  }

  // Получение всех доступных аккордов
  static getAllChordTypes() {
    return [
      { name: 'major', symbol: '', description: 'Мажорный аккорд' },
      { name: 'minor', symbol: 'm', description: 'Минорный аккорд' },
      { name: 'dim', symbol: 'dim', description: 'Уменьшенный аккорд' },
      { name: 'aug', symbol: 'aug', description: 'Увеличенный аккорд' },
      { name: 'maj7', symbol: 'maj7', description: 'Мажорный септ-аккорд' },
      { name: 'min7', symbol: 'm7', description: 'Минорный септ-аккорд' },
      { name: 'dom7', symbol: '7', description: 'Доминантсепт-аккорд' },
      { name: 'maj6', symbol: '6', description: 'Мажорный аккорд с секстой' },
      { name: 'min6', symbol: 'm6', description: 'Минорный аккорд с секстой' }
    ];
  }

  // Получение всех доступных нот
  static getAllNotes() {
    return ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  }
}

export default MusicUtils;