/**
 * Класс для управления воспроизведением аккордов
 * Координирует воспроизведение нот через NoteManager
 */
export class AudioEngine {
  constructor(noteManager) {
    this.noteManager = noteManager;
    
    // Настройки воспроизведения
    this.settings = {
      volume: 0.7,           // Громкость (0-1)
      chordDuration: 0.5,    // Длительность аккорда в секундах
      fadeInTime: 0.01,      // Время нарастания громкости
      fadeOutTime: 0.1,      // Время затухания громкости
      maxSimultaneousNotes: 6 // Максимальное количество одновременно воспроизводимых нот
    };
    
    // Состояние воспроизведения
    this.isPlaying = false;
    this.currentlyPlayingNotes = [];
    
    // Колбэки
    this.callbacks = {
      onPlayStart: null,
      onPlayStop: null,
      onError: null
    };
  }

  /**
   * Инициализирует аудио движок
   * @returns {Promise<void>}
   */
  async init() {
    try {
      if (!this.noteManager) {
        throw new Error('NoteManager не предоставлен');
      }
      
      // Устанавливаем громкость в NoteManager
      this.noteManager.setVolume(this.settings.volume);
      
      // AudioEngine инициализирован
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Воспроизводит аккорд
   * @param {string[]} noteNames - Массив названий нот
   * @param {Object} options - Опции воспроизведения
   * @returns {Promise<HTMLAudioElement[]>} Массив аудио элементов
   */
  async playChord(noteNames, options = {}) {
    if (!Array.isArray(noteNames) || noteNames.length === 0) {
      return [];
    }

    const mergedOptions = { ...this.settings, ...options };
    
    try {
      // Ограничиваем количество нот
      const limitedNotes = noteNames.slice(0, mergedOptions.maxSimultaneousNotes);
      
      // Воспроизводим ноты одновременно
      const audioElements = await this.noteManager.playChord(
        limitedNotes,
        0, // startTime
        mergedOptions.chordDuration
      );
      
      // Добавляем в список воспроизводимых нот
      this.currentlyPlayingNotes.push(...audioElements);
      
      // Удаляем из списка после завершения воспроизведения
      setTimeout(() => {
        this.removeNotesFromPlayingList(audioElements);
      }, mergedOptions.chordDuration * 1000);
      
      return audioElements;
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Воспроизводит одну ноту
   * @param {string} noteName - Название ноты
   * @param {Object} options - Опции воспроизведения
   * @returns {Promise<HTMLAudioElement>} Аудио элемент
   */
  async playNote(noteName, options = {}) {
    const mergedOptions = { ...this.settings, ...options };
    
    try {
      const audioElement = await this.noteManager.playNote(
        noteName,
        0, // startTime
        mergedOptions.chordDuration
      );
      
      // Добавляем в список воспроизводимых нот
      this.currentlyPlayingNotes.push(audioElement);
      
      // Удаляем из списка после завершения воспроизведения
      setTimeout(() => {
        this.removeNotesFromPlayingList([audioElement]);
      }, mergedOptions.chordDuration * 1000);
      
      return audioElement;
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Воспроизводит приглушенный аккорд (для статуса MUTED)
   * @param {string[]} noteNames - Массив названий нот
   * @param {Object} options - Опции воспроизведения
   * @returns {Promise<HTMLAudioElement[]>} Массив аудио элементов
   */
  async playMutedChord(noteNames, options = {}) {
    // Для приглушенного звука используем специальный звук Mute.mp3
    if (!this.noteManager || !this.noteManager.playMute) {
      // Метод playMute недоступен в NoteManager, используем обычное воспроизведение
      // Резервный вариант - воспроизводим обычный аккорд с пониженной громкостью
      const mutedOptions = {
        ...this.settings,
        ...options,
        volume: this.settings.volume * 0.3, // 30% от обычной громкости
        chordDuration: 0.1 // Короткая длительность
      };
      return this.playChord(noteNames, mutedOptions);
    }
    
    try {
      const mutedOptions = {
        ...this.settings,
        ...options,
        volume: this.settings.volume * 0.5 // 50% от обычной громкости
      };
      
      // Воспроизводим специальный звук приглушения
      const audioElement = await this.noteManager.playMute();
      
      if (audioElement) {
        // Применяем настройки громкости
        audioElement.volume = mutedOptions.volume;
        
        // Добавляем в список воспроизводимых нот
        this.currentlyPlayingNotes.push(audioElement);
        
        // Удаляем из списка после завершения воспроизведения
        setTimeout(() => {
          this.removeNotesFromPlayingList([audioElement]);
        }, 100); // Короткая длительность для приглушения
      }
      
      return audioElement ? [audioElement] : [];
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Воспроизводит последовательность аккордов
   * @param {Array} chordSequence - Массив аккордов [{notes: string[], delay: number}]
   * @param {Object} options - Опции воспроизведения
   * @returns {Promise<HTMLAudioElement[]>} Массив всех аудио элементов
   */
  async playChordSequence(chordSequence, options = {}) {
    if (!Array.isArray(chordSequence) || chordSequence.length === 0) {
      return [];
    }

    const allAudioElements = [];
    
    for (let i = 0; i < chordSequence.length; i++) {
      const chord = chordSequence[i];
      
      if (chord.notes && Array.isArray(chord.notes)) {
        const delay = chord.delay || 0;
        
        if (delay > 0) {
          // Ждем перед воспроизведением
          await this.sleep(delay * 1000);
        }
        
        try {
          const audioElements = await this.playChord(chord.notes, options);
          allAudioElements.push(...audioElements);
        } catch (error) {
          // Ошибка воспроизведения аккорда
        }
      }
    }
    
    return allAudioElements;
  }

  /**
   * Устанавливает громкость
   * @param {number} volume - Громкость от 0 до 1
   */
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    if (this.noteManager) {
      this.noteManager.setVolume(this.settings.volume);
    }
  }

  /**
   * Получает текущую громкость
   * @returns {number} Текущая громкость
   */
  getVolume() {
    return this.settings.volume;
  }

  /**
   * Устанавливает длительность аккорда
   * @param {number} duration - Длительность в секундах
   */
  setChordDuration(duration) {
    this.settings.chordDuration = Math.max(0.1, Math.min(5, duration));
  }

  /**
   * Получает длительность аккорда
   * @returns {number} Длительность в секундах
   */
  getChordDuration() {
    return this.settings.chordDuration;
  }

  /**
   * Останавливает все воспроизводимые ноты
   */
  stopAll() {
    if (this.noteManager) {
      this.noteManager.stopAllNotes();
    }
    
    this.currentlyPlayingNotes = [];
    this.isPlaying = false;
    
    if (this.callbacks.onPlayStop) {
      this.callbacks.onPlayStop();
    }
  }

  /**
   * Проверяет, воспроизводятся ли в данный момент ноты
   * @returns {boolean}
   */
  isCurrentlyPlaying() {
    return this.currentlyPlayingNotes.length > 0;
  }

  /**
   * Получает количество воспроизводимых нот
   * @returns {number}
   */
  getPlayingNotesCount() {
    return this.currentlyPlayingNotes.length;
  }

  /**
   * Удаляет ноты из списка воспроизводимых
   * @param {HTMLAudioElement[]} audioElements - Массив аудио элементов
   */
  removeNotesFromPlayingList(audioElements) {
    audioElements.forEach(audioElement => {
      const index = this.currentlyPlayingNotes.indexOf(audioElement);
      if (index > -1) {
        this.currentlyPlayingNotes.splice(index, 1);
      }
    });
    
    // Если больше нет воспроизводимых нот, вызываем колбэк
    if (this.currentlyPlayingNotes.length === 0 && this.isPlaying) {
      this.isPlaying = false;
      if (this.callbacks.onPlayStop) {
        this.callbacks.onPlayStop();
      }
    }
  }

  /**
   * Функция задержки
   * @param {number} ms - Задержка в миллисекундах
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Устанавливает колбэк для начала воспроизведения
   * @param {Function} callback - Функция колбэка
   */
  setOnPlayStart(callback) {
    this.callbacks.onPlayStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки воспроизведения
   * @param {Function} callback - Функция колбэка
   */
  setOnPlayStop(callback) {
    this.callbacks.onPlayStop = callback;
  }

  /**
   * Устанавливает колбэк для ошибок
   * @param {Function} callback - Функция колбэка
   */
  setOnError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Получает текущие настройки
   * @returns {Object} Настройки
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Обновляет настройки
   * @param {Object} newSettings - Новые настройки
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Применяем громкость к NoteManager
    if (newSettings.volume !== undefined && this.noteManager) {
      this.noteManager.setVolume(this.settings.volume);
    }
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    this.stopAll();
    this.callbacks = {};
  }
}