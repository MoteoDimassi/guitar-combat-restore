/**
 * Класс для управления аудио нотами
 * Загружает и воспроизводит отдельные ноты гитары
 */
export class NoteManager {
  constructor() {
    // Базовый путь к аудио файлам
    this.audioBasePath = 'audio/NotesMP3/';
    
    // Хранилище загруженных аудио объектов
    this.audioNotes = new Map();
    
    // Маппинг нот к файлам
    this.noteFiles = {
      // Ноты с диезами
      'A#1': 'A#1.mp3',
      'A#2': 'A#2.mp3',
      'C#1': 'C#1.mp3',
      'C#2': 'C#2.mp3',
      'D#1': 'D#1.mp3',
      'D#2': 'D#2.mp3',
      'F#1': 'F#1.mp3',
      'F#2': 'F#2.mp3',
      'F#3': 'F#3.mp3',
      'G#1': 'G#1.mp3',
      'G#2': 'G#2.mp3',
      'G#3': 'G#3.mp3',
      
      // Ноты с бемолями (энгармонически эквивалентные нотам с диезами)
      'Bb1': 'A#1.mp3', // Bb = A#
      'Bb2': 'A#2.mp3', // Bb = A#
      'Db1': 'C#1.mp3', // Db = C#
      'Db2': 'C#2.mp3', // Db = C#
      'Eb1': 'D#1.mp3', // Eb = D#
      'Eb2': 'D#2.mp3', // Eb = D#
      'Gb1': 'F#1.mp3', // Gb = F#
      'Gb2': 'F#2.mp3', // Gb = F#
      'Gb3': 'F#3.mp3', // Gb = F#
      'Ab1': 'G#1.mp3', // Ab = G#
      'Ab2': 'G#2.mp3', // Ab = G#
      'Ab3': 'G#3.mp3', // Ab = G#
      
      // Обычные ноты
      'A1': 'A1.mp3',
      'A2': 'A2.mp3',
      'B1': 'B1.mp3',
      'B2': 'B2.mp3',
      'C1': 'C1.mp3',
      'C2': 'C2.mp3',
      'D1': 'D1.mp3',
      'D2': 'D2.mp3',
      'E1': 'E1.mp3',
      'E2': 'E2.mp3',
      'E3': 'E3.mp3',
      'F1': 'F1.mp3',
      'F2': 'F2.mp3',
      'F3': 'F3.mp3',
      'G1': 'G1.mp3',
      'G2': 'G2.mp3',
      'G3': 'G3.mp3',
      
      'Mute': 'Mute.mp3'  // Звук приглушенных струн
    };
    
    // Аудио для приглушенных струн
    this.muteAudio = null;
    
    // Настройки воспроизведения
    this.volume = 0.7;
    this.isMuted = false;
    
    // Статус загрузки
    this.isLoading = false;
    this.loadProgress = 0;
    
    // Колбэки
    this.callbacks = {
      onLoadProgress: null,
      onLoadComplete: null,
      onError: null
    };
  }

  /**
   * Инициализирует менеджер нот
   * @returns {Promise<void>}
   */
  async init() {
    try {
      this.isLoading = true;
      await this.loadAllNotes();
      await this.loadMuteSound(); // Загружаем звук приглушения
      this.isLoading = false;
      
      if (this.callbacks.onLoadComplete) {
        this.callbacks.onLoadComplete();
      }
    } catch (error) {
      this.isLoading = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Загружает все ноты асинхронно
   * @returns {Promise<void>}
   */
  async loadAllNotes() {
    const noteNames = Object.keys(this.noteFiles);
    const totalNotes = noteNames.length;
    let loadedNotes = 0;

    // Создаем промисы для загрузки каждой ноты
    const loadPromises = noteNames.map(async (noteName) => {
      try {
        const audio = await this.loadNote(noteName);
        this.audioNotes.set(noteName, audio);
        loadedNotes++;
        
        // Обновляем прогресс загрузки
        this.loadProgress = (loadedNotes / totalNotes) * 100;
        if (this.callbacks.onLoadProgress) {
          this.callbacks.onLoadProgress(this.loadProgress);
        }
        
        return audio;
      } catch (error) {
        // Нота не загружена, продолжаем без вывода в консоль
        return null;
      }
    });

    // Ждем загрузки всех нот
    await Promise.all(loadPromises);
  }

  /**
   * Загружает звук приглушенных струн
   * @returns {Promise<void>}
   */
  async loadMuteSound() {
    try {
      this.muteAudio = await this.loadNote('Mute');
      // Звук приглушения струн загружен
    } catch (error) {
      // Не удалось загрузить звук приглушения
      this.muteAudio = null;
    }
  }

  /**
   * Загружает отдельную ноту
   * @param {string} noteName - Название ноты
   * @returns {Promise<HTMLAudioElement>}
   */
  async loadNote(noteName) {
    return new Promise((resolve, reject) => {
      const fileName = this.noteFiles[noteName];
      if (!fileName) {
        reject(new Error(`Не найден файл для ноты: ${noteName}`));
        return;
      }

      const audio = new Audio();
      // Кодируем URL для правильной обработки специальных символов
      const encodedFileName = encodeURIComponent(fileName);
      audio.src = this.audioBasePath + encodedFileName;
      audio.volume = this.volume;
      audio.preload = 'auto';

      audio.addEventListener('canplaythrough', () => {
        resolve(audio);
      }, { once: true });

      audio.addEventListener('error', (e) => {
        reject(new Error(`Ошибка загрузки аудио ${fileName}: ${e.message}`));
      }, { once: true });
    });
  }

  /**
   * Воспроизводит ноту
   * @param {string} noteName - Название ноты
   * @param {number} startTime - Время начала воспроизведения в секундах
   * @param {number} duration - Длительность воспроизведения в секундах
   * @returns {Promise<void>}
   */
  async playNote(noteName, startTime = 0, duration = null) {
    if (this.isMuted) {
      return;
    }

    const audio = this.audioNotes.get(noteName);
    if (!audio) {
      throw new Error(`Нота ${noteName} не загружена`);
    }

    try {
      // Клонируем аудио объект для параллельного воспроизведения
      const audioClone = audio.cloneNode();
      audioClone.volume = this.volume;
      audioClone.currentTime = startTime;

      await audioClone.play();

      // Если указана длительность, останавливаем воспроизведение после нее
      if (duration && duration > 0) {
        setTimeout(() => {
          audioClone.pause();
          audioClone.currentTime = 0;
        }, duration * 1000);
      }

      return audioClone;
    } catch (error) {
      // Ошибка воспроизведения ноты
      throw error;
    }
  }

  /**
   * Воспроизводит несколько нот одновременно (аккорд)
   * @param {string[]} noteNames - Массив названий нот
   * @param {number} startTime - Время начала воспроизведения в секундах
   * @param {number} duration - Длительность воспроизведения в секундах
   * @returns {Promise<HTMLAudioElement[]>}
   */
  async playChord(noteNames, startTime = 0, duration = null) {
    if (this.isMuted) {
      return [];
    }

    const playPromises = noteNames.map(noteName => 
      this.playNote(noteName, startTime, duration).catch(error => {
        // Ошибка воспроизведения ноты в аккорде
        return null;
      })
    );

    const results = await Promise.all(playPromises);
    return results.filter(audio => audio !== null);
  }

  /**
   * Воспроизводит звук приглушенных струн
   * @returns {Promise<HTMLAudioElement|null>} Аудио элемент или null
   */
  async playMute() {
    if (this.isMuted) {
      return null;
    }

    if (!this.muteAudio) {
      // Звук приглушения не загружен, пытаемся загрузить
      try {
        await this.loadMuteSound();
        if (!this.muteAudio) {
          throw new Error('Не удалось загрузить звук приглушения');
        }
      } catch (error) {
        // Не удалось загрузить звук приглушения
        return null;
      }
    }

    try {
      // Клонируем аудио объект для параллельного воспроизведения
      const audioClone = this.muteAudio.cloneNode();
      audioClone.volume = this.volume;
      audioClone.currentTime = 0;

      await audioClone.play();
      return audioClone;
    } catch (error) {
      // Ошибка воспроизведения приглушения
      // Не выбрасываем ошибку, а возвращаем null, чтобы не прерывать воспроизведение
      return null;
    }
  }

  /**
   * Останавливает все воспроизводимые ноты
   */
  stopAllNotes() {
    // Останавливаем все аудио элементы на странице
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  /**
   * Устанавливает громкость
   * @param {number} volume - Громкость от 0 до 1
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Обновляем громкость для всех загруженных нот
    this.audioNotes.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  /**
   * Включает/выключает звук
   * @param {boolean} muted - Выключить звук
   */
  setMuted(muted) {
    this.isMuted = muted;
  }

  /**
   * Получает список доступных нот
   * @returns {string[]}
   */
  getAvailableNotes() {
    return Array.from(this.audioNotes.keys());
  }

  /**
   * Проверяет, загружена ли нота
   * @param {string} noteName - Название ноты
   * @returns {boolean}
   */
  isNoteLoaded(noteName) {
    return this.audioNotes.has(noteName);
  }

  /**
   * Получает статус загрузки
   * @returns {Object}
   */
  getLoadStatus() {
    return {
      isLoading: this.isLoading,
      progress: this.loadProgress,
      totalNotes: Object.keys(this.noteFiles).length,
      loadedNotes: this.audioNotes.size
    };
  }

  /**
   * Устанавливает колбэк для прогресса загрузки
   * @param {Function} callback - Функция колбэка
   */
  setOnLoadProgress(callback) {
    this.callbacks.onLoadProgress = callback;
  }

  /**
   * Устанавливает колбэк для завершения загрузки
   * @param {Function} callback - Функция колбэка
   */
  setOnLoadComplete(callback) {
    this.callbacks.onLoadComplete = callback;
  }

  /**
   * Устанавливает колбэк для ошибок
   * @param {Function} callback - Функция колбэка
   */
  setOnError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    this.stopAllNotes();
    this.audioNotes.clear();
    this.muteAudio = null;
    this.callbacks = {};
  }
}