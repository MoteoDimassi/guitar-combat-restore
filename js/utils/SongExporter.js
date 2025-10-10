/**
 * @fileoverview SongExporter - модуль для экспорта всех настроек песни в JSON
 * Собирает данные из всех компонентов и создаёт единый файл с полными настройками
 */

export class SongExporter {
  constructor() {
    this.version = '1.0';
  }

  /**
   * Собирает все данные песни в единый JSON объект
   * @returns {Object} полные настройки песни
   */
  exportToJSON() {
    try {
      // Получаем метаданные
      const title = this.getTitle();
      const timestamp = new Date().toISOString();

      // Получаем текст песни
      const songText = this.getSongText();
      
      // Получаем слоги
      const syllables = this.getSyllables();
      const userSyllableMap = this.getUserSyllableMap();

      // Получаем аккорды
      const chords = this.getChords();
      const chordStore = this.getChordStore();

      // Получаем бой
      const beats = this.getBeats();
      const beatCount = this.getBeatCount();

      // Получаем настройки
      const bpm = this.getBPM();
      const speed = this.getSpeed();

      // Получаем такты
      const bars = this.getBars();

      return {
        // Метаданные
        title,
        timestamp,
        version: this.version,
        
        // Текст и слоги
        songText,
        syllables,
        userSyllableMap,
        
        // Аккорды
        chords,
        chordStore,
        
        // Бой
        beats,
        beatCount,
        
        // Настройки
        bpm,
        speed,
        
        // Такты
        bars
      };
    } catch (error) {
      console.error('Ошибка при экспорте песни:', error);
      throw new Error('Не удалось собрать данные для экспорта');
    }
  }

  /**
   * Скачивает файл с полными настройками песни
   * @param {string} filename - имя файла (опционально)
   */
  downloadSongFile(filename = null) {
    try {
      console.log('SongExporter: начинаем экспорт данных...');
      const data = this.exportToJSON();
      console.log('SongExporter: данные собраны:', data);
      
      const title = data.title || 'Песня';
      const timestamp = new Date().toISOString().split('T')[0];
      
      const finalFilename = filename || `song-${title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '-')}-${timestamp}.json`;
      console.log('SongExporter: имя файла:', finalFilename);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      console.log('SongExporter: создаём ссылку для скачивания');
      a.click();
      URL.revokeObjectURL(url);
      console.log('SongExporter: файл скачан успешно');
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      throw new Error('Не удалось скачать файл: ' + error.message);
    }
  }

  /**
   * Получает название песни из localStorage
   * @returns {string}
   */
  getTitle() {
    try {
      const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
      if (songs.length > 0) {
        return songs[songs.length - 1].title || 'Без названия';
      }
      return 'Без названия';
    } catch (e) {
      return 'Без названия';
    }
  }

  /**
   * Получает текст песни
   * @returns {string}
   */
  getSongText() {
    try {
      const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
      if (songs.length > 0) {
        return songs[songs.length - 1].text || '';
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Получает массив слогов из SyllableDragDrop
   * @returns {Array}
   */
  getSyllables() {
    if (window.app && window.app.syllableDragDrop) {
      return window.app.syllableDragDrop.allSyllables || [];
    }
    return [];
  }

  /**
   * Получает пользовательские правки слогов
   * @returns {Object}
   */
  getUserSyllableMap() {
    try {
      const title = this.getTitle();
      const stored = localStorage.getItem('userSyllables_' + title);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Получает массив аккордов
   * @returns {Array}
   */
  getChords() {
    if (window.app && window.app.chordStore) {
      return window.app.chordStore.getAllChords();
    }
    return [];
  }

  /**
   * Получает данные ChordStore
   * @returns {Object}
   */
  getChordStore() {
    if (window.app && window.app.chordStore) {
      return window.app.chordStore.toJSON();
    }
    return {};
  }

  /**
   * Получает массив стрелочек
   * @returns {Array}
   */
  getBeats() {
    if (window.app && window.app.beatRow) {
      return window.app.beatRow.getBeats();
    }
    return [];
  }

  /**
   * Получает количество стрелочек
   * @returns {number}
   */
  getBeatCount() {
    if (window.app && window.app.state) {
      return window.app.state.count || 8;
    }
    return 8;
  }

  /**
   * Получает BPM
   * @returns {number}
   */
  getBPM() {
    if (window.app && window.app.state) {
      return window.app.state.bpm || 90;
    }
    return 90;
  }

  /**
   * Получает скорость
   * @returns {number}
   */
  getSpeed() {
    if (window.app && window.app.state) {
      return window.app.state.speed || 100;
    }
    return 100;
  }

  /**
   * Получает данные тактов
   * @returns {Object}
   */
  getBars() {
    if (window.app && window.app.barManager) {
      return window.app.barManager.toJSON ? window.app.barManager.toJSON() : {};
    }
    return {};
  }
}
