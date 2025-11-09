import MusicUtils from '../../shared/utils/MusicUtils.js';

class ChordParserService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.parsedChords = [];
    this.currentChordIndex = 0;
    this.bars = [];
    this.beatsPerBar = 8; // По умолчанию 8 ударов в такте
  }

  /**
   * Парсит строку с аккордами и создает такты
   * @param {string} chordsString - строка с аккордами, разделенными пробелами
   * @param {number} beatsPerBar - количество ударов в такте
   * @returns {Object} результат парсинга с тактами и ошибками
   */
  parseChordsToBars(chordsString, beatsPerBar = 8) {
    this.beatsPerBar = beatsPerBar;
    
    // Используем улучшенный парсер из MusicUtils
    const parseResult = MusicUtils.parseChordsString(chordsString);
    
    // Создаем такты на основе спарсенных аккордов
    this.createBarsFromChords(parseResult.chords);
    
    return {
      bars: this.bars,
      chords: parseResult.chords,
      errors: parseResult.errors,
      totalBars: this.bars.length
    };
  }

  /**
   * Создает такты из массива аккордов
   * @param {Array} chords - массив аккордов
   */
  createBarsFromChords(chords) {
    this.bars = [];
    
    if (chords.length === 0) {
      // Создаем пустой такт с базовыми аккордами
      this.createDefaultBars();
      return;
    }
    
    // Распределяем аккорды по тактам
    let currentBar = {
      id: this.generateId(),
      chords: [],
      beatUnits: []
    };
    
    // Инициализируем beatUnits для текущего такта
    for (let i = 0; i < this.beatsPerBar; i++) {
      currentBar.beatUnits.push({
        isPlayed: () => false,
        isMuted: () => false,
        getChord: () => null,
        setChord: (chord) => { this.chord = chord; },
        chord: null
      });
    }
    
    chords.forEach((chord, index) => {
      const barIndex = Math.floor(index / this.beatsPerBar);
      const beatIndex = index % this.beatsPerBar;
      
      // Если нужно создать новый такт
      if (barIndex > this.bars.length) {
        this.bars.push(currentBar);
        currentBar = {
          id: this.generateId(),
          chords: [],
          beatUnits: []
        };
        
        // Инициализируем beatUnits для нового такта
        for (let i = 0; i < this.beatsPerBar; i++) {
          currentBar.beatUnits.push({
            isPlayed: () => false,
            isMuted: () => false,
            getChord: () => null,
            setChord: (chord) => { this.chord = chord; },
            chord: null
          });
        }
      }
      
      // Если это первый аккорд в такте, назначаем его всем ударам
      if (beatIndex === 0) {
        currentBar.chords.push(chord);
        
        // Назначаем аккорд всем beatUnits в такте
        currentBar.beatUnits.forEach(beatUnit => {
          beatUnit.chord = chord;
          beatUnit.getChord = () => chord;
        });
      }
    });
    
    // Добавляем последний такт
    if (currentBar.chords.length > 0 || currentBar.beatUnits.length > 0) {
      this.bars.push(currentBar);
    }
    
    // Если тактов не создано, создаем такт по умолчанию
    if (this.bars.length === 0) {
      this.createDefaultBars();
    }
  }

  /**
   * Создает такты по умолчанию с базовыми аккордами
   */
  createDefaultBars() {
    const defaultChords = ['Am', 'F', 'Dm', 'E'];
    const defaultBars = [];
    
    defaultChords.forEach((chordName, index) => {
      const chordData = MusicUtils.parseChordName(chordName);
      const chord = {
        id: this.generateId(),
        name: chordName,
        root: chordData.root,
        type: chordData.type,
        notes: MusicUtils.getChordNotes(chordName),
        position: 0
      };
      
      const bar = {
        id: this.generateId(),
        chords: [chord],
        beatUnits: []
      };
      
      // Инициализируем beatUnits для такта
      for (let i = 0; i < this.beatsPerBar; i++) {
        bar.beatUnits.push({
          isPlayed: () => false,
          isMuted: () => false,
          getChord: () => chord,
          setChord: (newChord) => { chord = newChord; },
          chord: chord
        });
      }
      
      defaultBars.push(bar);
    });
    
    this.bars = defaultBars;
  }

  /**
   * Получает аккорд для указанного такта и удара
   * @param {number} barIndex - индекс такта
   * @param {number} beatIndex - индекс удара
   * @returns {Object|null} аккорд или null
   */
  getChordForBeat(barIndex, beatIndex) {
    if (barIndex < 0 || barIndex >= this.bars.length) {
      return null;
    }
    
    const bar = this.bars[barIndex];
    if (!bar || beatIndex < 0 || beatIndex >= bar.beatUnits.length) {
      return null;
    }
    
    const beatUnit = bar.beatUnits[beatIndex];
    return beatUnit ? beatUnit.getChord() : null;
  }

  /**
   * Получает ноты для аккорда в указанном такте и ударе
   * @param {number} barIndex - индекс такта
   * @param {number} beatIndex - индекс удара
   * @returns {Array} массив нот или пустой массив
   */
  getNotesForBeat(barIndex, beatIndex) {
    const chord = this.getChordForBeat(barIndex, beatIndex);
    
    if (!chord) {
      return [];
    }
    
    // Получаем оптимальную октаву для аккорда
    const octave = MusicUtils.getOptimalOctaveForChord(chord.name);
    
    // Возвращаем ноты для воспроизведения
    return MusicUtils.getPlaybackNotes(chord.name, octave);
  }

  /**
   * Получает пути к аудиофайлам для аккорда в указанном такте и ударе
   * @param {number} barIndex - индекс такта
   * @param {number} beatIndex - индекс удара
   * @returns {Array} массив путей к аудиофайлам
   */
  getAudioFilesForBeat(barIndex, beatIndex) {
    const chord = this.getChordForBeat(barIndex, beatIndex);
    
    if (!chord) {
      return [];
    }
    
    // Получаем оптимальную октаву для аккорда
    const octave = MusicUtils.getOptimalOctaveForChord(chord.name);
    
    // Возвращаем пути к аудиофайлам
    return MusicUtils.getChordAudioFiles(chord.name, octave);
  }

  /**
   * Обновляет количество ударов в такте
   * @param {number} beatsPerBar - новое количество ударов в такте
   */
  updateBeatsPerBar(beatsPerBar) {
    this.beatsPerBar = beatsPerBar;
    
    // Пересоздаем такты с новым количеством ударов
    if (this.bars.length > 0) {
      const chords = this.bars.flatMap(bar => bar.chords);
      this.createBarsFromChords(chords);
    }
  }

  /**
   * Получает все такты
   * @returns {Array} массив тактов
   */
  getAllBars() {
    return this.bars;
  }

  /**
   * Получает такт по индексу
   * @param {number} index - индекс такта
   * @returns {Object|null} такт или null
   */
  getBarByIndex(index) {
    if (index < 0 || index >= this.bars.length) {
      return null;
    }
    
    return this.bars[index];
  }

  /**
   * Получает количество тактов
   * @returns {number} количество тактов
   */
  getBarsCount() {
    return this.bars.length;
  }

  /**
   * Устанавливает статус воспроизведения для удара
   * @param {number} barIndex - индекс такта
   * @param {number} beatIndex - индекс удара
   * @param {string} status - статус ('played', 'muted', 'empty')
   */
  setBeatStatus(barIndex, beatIndex, status) {
    if (barIndex < 0 || barIndex >= this.bars.length) {
      return;
    }
    
    const bar = this.bars[barIndex];
    if (!bar || beatIndex < 0 || beatIndex >= bar.beatUnits.length) {
      return;
    }
    
    const beatUnit = bar.beatUnits[beatIndex];
    if (!beatUnit) {
      return;
    }
    
    // Обновляем статус в beatUnit
    switch (status) {
      case 'played':
        beatUnit.isPlayed = () => true;
        beatUnit.isMuted = () => false;
        break;
      case 'muted':
        beatUnit.isPlayed = () => true;
        beatUnit.isMuted = () => true;
        break;
      case 'empty':
      default:
        beatUnit.isPlayed = () => false;
        beatUnit.isMuted = () => false;
        break;
    }
    
    // Генерируем событие об изменении статуса
    if (this.eventBus) {
      this.eventBus.emit('chordParser:beatStatusChanged', {
        barIndex,
        beatIndex,
        status
      });
    }
  }

  /**
   * Генерирует уникальный ID
   * @returns {string} уникальный ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Сбрасывает состояние сервиса
   */
  reset() {
    this.parsedChords = [];
    this.currentChordIndex = 0;
    this.bars = [];
  }
}

export default ChordParserService;