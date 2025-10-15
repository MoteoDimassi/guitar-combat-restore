import { BeatUnit } from './BeatUnit.js';
import { ChordChange } from './ChordChange.js';
import { LyricSyllable } from './LyricSyllable.js';
import { PlayStatus } from './PlayStatus.js';

/**
 * Класс Bar представляет такт в музыкальной композиции
 * Объединяет длительности (BeatUnit), аккорды (ChordChange) и слоги (LyricSyllable)
 */
export class Bar {
  constructor(barIndex = 0, beatCount = 4) {
    this.barIndex = barIndex;
    this.beatCount = beatCount;
    
    // Массив длительностей в такте
    this.beatUnits = [];
    
    // Массив аккордов в такте
    this.chordChanges = [];
    
    // Массив слогов в такте
    this.lyricSyllables = [];
    
    // Инициализируем длительности
    this.initializeBeatUnits();
  }

  /**
   * Инициализирует массив длительностей для такта
   */
  initializeBeatUnits() {
    this.beatUnits = [];
    for (let i = 0; i < this.beatCount; i++) {
      // Создаем BeatUnit с правильным статусом по умолчанию
      // Первая доля - PLAY, остальные - SKIP
      const status = i === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      const playStatus = new PlayStatus(status);
      this.beatUnits.push(new BeatUnit(i, playStatus));
    }
  }


  /**
   * Устанавливает статус воспроизведения для длительности
   * @param {number} beatIndex - Индекс длительности
   * @param {PlayStatus} playStatus - Статус воспроизведения
   */
  setBeatPlayStatus(beatIndex, playStatus) {
    if (beatIndex >= 0 && beatIndex < this.beatCount) {
      // Если передано число, создаем объект PlayStatus
      if (typeof playStatus === 'number') {
        playStatus = new PlayStatus(playStatus);
      }
      this.beatUnits[beatIndex].setPlayStatus(playStatus);
    }
  }


  /**
   * Получает статус воспроизведения для длительности
   * @param {number} beatIndex - Индекс длительности
   * @returns {PlayStatus|null} Статус воспроизведения
   */
  getBeatPlayStatus(beatIndex) {
    if (beatIndex >= 0 && beatIndex < this.beatCount) {
      return this.beatUnits[beatIndex].getPlayStatus();
    }
    return null;
  }

  /**
   * Переключает статус воспроизведения для длительности
   * @param {number} beatIndex - Индекс длительности
   */
  toggleBeatStatus(beatIndex) {
    if (beatIndex >= 0 && beatIndex < this.beatCount) {
      this.beatUnits[beatIndex].toggleStatus();
    }
  }

  /**
   * Добавляет смену аккорда в такт
   * @param {string} chordName - Название аккорда
   * @param {number} startBeat - Начальная длительность
   * @param {number} endBeat - Конечная длительность
   */
  addChordChange(chordName, startBeat, endBeat) {
    const chordChange = new ChordChange(chordName, startBeat, endBeat);
    this.chordChanges.push(chordChange);
    this.sortChordChanges();
    
    // Обновляем связи с BeatUnit
    this.syncChordLinks(chordChange);
  }

  /**
   * Удаляет смену аккорда
   * @param {number} index - Индекс смены аккорда
   */
  removeChordChange(index) {
    if (index >= 0 && index < this.chordChanges.length) {
      this.chordChanges.splice(index, 1);
    }
  }

  /**
   * Получает аккорд для указанной длительности
   * @param {number} beatIndex - Индекс длительности
   * @returns {string|null} Название аккорда или null
   */
  getChordForBeat(beatIndex) {
    for (const chordChange of this.chordChanges) {
      if (chordChange.isActiveAt(beatIndex)) {
        return chordChange.name;
      }
    }
    return null;
  }

  /**
   * Добавляет слог в такт
   * @param {string} text - Текст слога
   * @param {number} startBeat - Начальная длительность
   * @param {number} duration - Длительность слога
   */
  addLyricSyllable(text, startBeat, duration) {
    const syllable = new LyricSyllable(text, startBeat, duration);
    this.lyricSyllables.push(syllable);
    this.sortLyricSyllables();
    
    // Обновляем связи с BeatUnit
    this.syncSyllableLinks(syllable);
  }

  /**
   * Удаляет слог
   * @param {number} index - Индекс слога
   */
  removeLyricSyllable(index) {
    if (index >= 0 && index < this.lyricSyllables.length) {
      this.lyricSyllables.splice(index, 1);
    }
  }

  /**
   * Получает слог для указанной длительности
   * @param {number} beatIndex - Индекс длительности
   * @returns {LyricSyllable|null} Слог или null
   */
  getSyllableForBeat(beatIndex) {
    for (const syllable of this.lyricSyllables) {
      if (syllable.isActiveAt(beatIndex)) {
        return syllable;
      }
    }
    return null;
  }

  /**
   * Сортирует смены аккордов по начальной позиции
   */
  sortChordChanges() {
    this.chordChanges.sort((a, b) => a.startBeat - b.startBeat);
  }

  /**
   * Сортирует слоги по начальной позиции
   */
  sortLyricSyllables() {
    this.lyricSyllables.sort((a, b) => a.startBeat - b.startBeat);
  }

  /**
   * Синхронизирует связи между аккордами и BeatUnit
   * @param {ChordChange} chordChange - Аккорд для синхронизации
   */
  syncChordLinks(chordChange) {
    for (let beatIndex = chordChange.startBeat; beatIndex < chordChange.endBeat && beatIndex < this.beatUnits.length; beatIndex++) {
      this.beatUnits[beatIndex].setChord(chordChange);
    }
  }

  /**
   * Синхронизирует связи между слогами и BeatUnit
   * @param {LyricSyllable} syllable - Слог для синхронизации
   */
  syncSyllableLinks(syllable) {
    for (let beatIndex = syllable.startBeat; beatIndex < syllable.endBeat && beatIndex < this.beatUnits.length; beatIndex++) {
      this.beatUnits[beatIndex].setSyllable(syllable);
    }
  }

  /**
   * Обновляет все связи между BeatUnit, аккордами и слогами
   */
  syncAllLinks() {
    // Очищаем существующие связи, но сохраняем статусы
    this.beatUnits.forEach(beatUnit => {
      beatUnit.setChord(null);
      beatUnit.setSyllable(null);
    });

    // Восстанавливаем связи аккордов
    this.chordChanges.forEach(chordChange => {
      this.syncChordLinks(chordChange);
    });

    // Восстанавливаем связи слогов
    this.lyricSyllables.forEach(syllable => {
      this.syncSyllableLinks(syllable);
    });
  }

  /**
   * Получает полную информацию о длительности
   * @param {number} beatIndex - Индекс длительности
   * @returns {Object|null} Полная информация о длительности
   */
  getBeatFullInfo(beatIndex) {
    if (beatIndex >= 0 && beatIndex < this.beatUnits.length) {
      const beatUnit = this.beatUnits[beatIndex];
      return {
        barIndex: this.barIndex,
        beatIndex: beatIndex,
        beatUnit: beatUnit,
        playStatus: beatUnit.getPlayStatus(),
        chord: beatUnit.getChord(),
        syllable: beatUnit.getSyllable(),
        fullInfo: beatUnit.getFullInfo()
      };
    }
    return null;
  }

  /**
   * Устанавливает BeatUnit для такта (заменяет существующие)
   * @param {BeatUnit[]} beatUnits - Массив BeatUnit
   */
  setBeatUnits(beatUnits) {
    this.beatUnits = beatUnits || [];
    this.beatCount = this.beatUnits.length;
    
    // Обновляем связи на основе существующих аккордов и слогов
    this.syncAllLinks();
  }

  /**
   * Применяет стандартную настройку для BeatUnit
   * @param {Object} options - Опции настройки
   */
  applyStandardSetup(options = {}) {
    const {
      defaultStatus = PlayStatus.STATUS.SKIP, // по умолчанию - не играть (пустой кружок)
      firstBeatStatus = PlayStatus.STATUS.PLAY, // первая доля - играть (закрашенный круг)
      chordStatus = PlayStatus.STATUS.PLAY, // при наличии аккорда - играть
      syllableStatus = PlayStatus.STATUS.PLAY // при наличии слога - играть
    } = options;

    this.beatUnits.forEach((beatUnit, index) => {
      let status = defaultStatus;
      
      // Первая доля всегда должна быть PLAY (закрашенный круг)
      if (index === 0) {
        status = firstBeatStatus;
      }
      
      // Если есть аккорд
      if (beatUnit.hasChord()) {
        status = chordStatus;
      }
      
      // Если есть слог
      if (beatUnit.hasSyllable()) {
        status = syllableStatus;
      }
      
      // Создаем объект PlayStatus вместо числового значения
      beatUnit.setPlayStatus(new PlayStatus(status));
    });
  }

  /**
   * Проверяет, есть ли пересечения между элементами такта
   * @returns {Object} Объект с информацией о пересечениях
   */
  checkConflicts() {
    const conflicts = {
      chordOverlaps: [],
      syllableOverlaps: [],
      chordSyllableConflicts: []
    };

    // Проверяем пересечения аккордов
    for (let i = 0; i < this.chordChanges.length; i++) {
      for (let j = i + 1; j < this.chordChanges.length; j++) {
        if (this.chordChanges[i].overlapsWith(this.chordChanges[j])) {
          conflicts.chordOverlaps.push({
            chord1: this.chordChanges[i],
            chord2: this.chordChanges[j]
          });
        }
      }
    }

    // Проверяем пересечения слогов
    for (let i = 0; i < this.lyricSyllables.length; i++) {
      for (let j = i + 1; j < this.lyricSyllables.length; j++) {
        if (this.lyricSyllables[i].overlapsWith(this.lyricSyllables[j])) {
          conflicts.syllableOverlaps.push({
            syllable1: this.lyricSyllables[i],
            syllable2: this.lyricSyllables[j]
          });
        }
      }
    }

    // Проверяем конфликты между аккордами и слогами
    for (const chord of this.chordChanges) {
      for (const syllable of this.lyricSyllables) {
        if (chord.overlapsWith(syllable)) {
          conflicts.chordSyllableConflicts.push({
            chord: chord,
            syllable: syllable
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Очищает все данные такта
   */
  clear() {
    // Вызываем initializeBeatUnits() для установки правильных статусов
    this.initializeBeatUnits();
    this.chordChanges = [];
    this.lyricSyllables = [];
  }

  /**
   * Создает копию такта
   * @returns {Bar} Копия такта
   */
  clone() {
    const clonedBar = new Bar(this.barIndex, this.beatCount);
    
    // Копируем длительности
    clonedBar.beatUnits = this.beatUnits.map(beat => beat.clone());
    
    // Копируем аккорды
    clonedBar.chordChanges = this.chordChanges.map(chord => chord.clone());
    
    // Копируем слоги
    clonedBar.lyricSyllables = this.lyricSyllables.map(syllable => syllable.clone());
    
    return clonedBar;
  }

  /**
   * Возвращает информацию о такте
   * @returns {Object} Информация о такте
   */
  getInfo() {
    return {
      barIndex: this.barIndex,
      beatCount: this.beatCount,
      beatUnits: this.beatUnits.map(beat => ({
        index: beat.index,
        type: beat.getType(),
        typeString: beat.getTypeString(),
        displaySymbol: beat.getDisplaySymbol(),
        cssClass: beat.getCSSClass(),
        playStatus: beat.getPlayStatus(),
        chord: beat.getChord() ? {
          name: beat.getChord().name,
          startBeat: beat.getChord().startBeat,
          endBeat: beat.getChord().endBeat
        } : null,
        syllable: beat.getSyllable() ? {
          text: beat.getSyllable().text,
          startBeat: beat.getSyllable().startBeat,
          duration: beat.getSyllable().duration,
          endBeat: beat.getSyllable().endBeat
        } : null,
        hasChord: beat.hasChord(),
        hasSyllable: beat.hasSyllable(),
        fullInfo: beat.getFullInfo()
      })),
      chordChanges: this.chordChanges.map(chord => ({
        name: chord.name,
        startBeat: chord.startBeat,
        endBeat: chord.endBeat,
        duration: chord.getDuration()
      })),
      lyricSyllables: this.lyricSyllables.map(syllable => ({
        text: syllable.text,
        startBeat: syllable.startBeat,
        duration: syllable.duration,
        endBeat: syllable.endBeat
      })),
      conflicts: this.checkConflicts(),
      hasLinkedElements: this.beatUnits.some(beat => beat.hasChord() || beat.hasSyllable())
    };
  }

  /**
   * Возвращает объект для сериализации
   * @returns {Object} Данные для сохранения
   */
  toJSON() {
    return {
      barIndex: this.barIndex,
      beatCount: this.beatCount,
      beatUnits: this.beatUnits.map(beat => beat.toJSON()),
      chordChanges: this.chordChanges.map(chord => chord.toJSON()),
      lyricSyllables: this.lyricSyllables.map(syllable => syllable.toJSON())
    };
  }

  /**
   * Создает Bar из JSON объекта
   * @param {Object} data - Данные для создания
   * @returns {Bar} Созданный такт
   */
  static fromJSON(data) {
    const bar = new Bar(data.barIndex, data.beatCount);
    
    bar.beatUnits = data.beatUnits ? data.beatUnits.map(beatData => BeatUnit.fromJSON(beatData)) : [];
    bar.chordChanges = data.chordChanges ? data.chordChanges.map(chordData => ChordChange.fromJSON(chordData)) : [];
    bar.lyricSyllables = data.lyricSyllables ? data.lyricSyllables.map(syllableData => LyricSyllable.fromJSON(syllableData)) : [];
    
    return bar;
  }
}
