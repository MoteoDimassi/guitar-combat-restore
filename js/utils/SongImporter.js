/**
 * @fileoverview SongImporter - модуль для импорта полных настроек песни из JSON
 * Восстанавливает все компоненты приложения из единого файла экспорта
 */

export class SongImporter {
  constructor() {
    this.supportedVersion = '1.0';
  }

  /**
   * Основной метод импорта полных настроек песни
   * @param {Object} data - данные из JSON файла
   * @returns {boolean} успешность импорта
   */
  importFromJSON(data) {
    try {
      // Валидируем данные
      if (!this.validateSongData(data)) {
        throw new Error('Неверный формат файла песни');
      }

      // Восстанавливаем компоненты в правильном порядке
      this.restoreSettings(data.bpm, data.speed);
      this.restoreBeats(data.beats, data.beatCount);
      this.restoreChords(data.chordStore);
      this.restoreSongText(data.title, data.songText);
      this.restoreUserSyllableMap(data.userSyllableMap);
      this.restoreSyllables(data.syllables);
      this.restoreBars(data.bars);

      console.log('Песня успешно импортирована');
      
      // Обновляем видимость кнопок песни после импорта
      if (window.app && window.app.updateSongButtons) {
        window.app.updateSongButtons();
      }

      // Обновляем кнопки в открытом меню опций (если оно открыто)
      if (window.app && window.app.optionsMenu) {
        window.app.optionsMenu.updateOpenMenuButtons();
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при импорте песни:', error);
      throw error;
    }
  }

  /**
   * Валидирует структуру данных песни
   * @param {Object} data - данные для проверки
   * @returns {boolean}
   */
  validateSongData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Проверяем обязательные поля
    const requiredFields = ['title', 'songText', 'beats', 'bpm'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Отсутствует обязательное поле: ${field}`);
        return false;
      }
    }

    // Проверяем версию
    if (data.version && data.version !== this.supportedVersion) {
      console.warn(`Версия файла ${data.version} может быть несовместима с текущей ${this.supportedVersion}`);
    }

    return true;
  }

  /**
   * Восстанавливает настройки (BPM, скорость)
   * @param {number} bpm - темп
   * @param {number} speed - скорость
   */
  restoreSettings(bpm, speed) {
    if (typeof bpm === 'number' && bpm > 0) {
      // Обновляем BPM в UI
      const bpmSlider = document.getElementById('bpm');
      const bpmLabel = document.getElementById('bpmLabel');
      if (bpmSlider && bpmLabel) {
        bpmSlider.value = bpm;
        bpmLabel.textContent = bpm;
      }
      
      // Обновляем глобальное состояние
      if (window.app && window.app.state) {
        window.app.state.bpm = bpm;
      }
    }

    if (typeof speed === 'number' && speed > 0) {
      if (window.app && window.app.state) {
        window.app.state.speed = speed;
      }
    }
  }

  /**
   * Восстанавливает бой (стрелочки)
   * @param {Array} beats - массив стрелочек
   * @param {number} beatCount - количество стрелочек
   */
  restoreBeats(beats, beatCount) {
    if (!Array.isArray(beats) || !window.app || !window.app.beatRow) {
      return;
    }

    // Нормализуем биты (как в ImportUtils)
    const normalizedBeats = beats.map(beat => {
      let playState;
      if (typeof beat.play === 'number') {
        playState = beat.play;
      } else if (beat.play === true) {
        playState = 1;
      } else {
        playState = 0;
      }
      
      return {
        direction: beat.direction || 'down',
        play: playState
      };
    });

    // Сбрасываем подсветку
    window.app.beatRow.highlightedIndices.clear();

    // Применяем состояния к кружкам
    const circleStates = normalizedBeats.map(beat => beat.play);
    window.app.beatRow.setCircleStates(circleStates);

    // Устанавливаем биты
    window.app.beatRow.setBeats(normalizedBeats);

    // Обновляем количество стрелок
    if (window.app.controls && beatCount) {
      window.app.controls.setCount(beatCount);
    }

    // Обновляем глобальное состояние
    if (window.app.state) {
      window.app.state.beats = normalizedBeats;
      window.app.state.count = beatCount || beats.length;
      window.app.state.currentIndex = 0;
    }
  }

  /**
   * Восстанавливает аккорды
   * @param {Object} chordStoreData - данные ChordStore
   */
  restoreChords(chordStoreData) {
    if (!chordStoreData || !window.app || !window.app.chordStore) {
      return;
    }

    // Восстанавливаем ChordStore
    window.app.chordStore.fromJSON(chordStoreData);
    window.app.chordStore.saveToLocalStorage();

    // Обновляем поле ввода аккордов
    const chordsInput = document.getElementById('chordsInput');
    if (chordsInput) {
      const chords = window.app.chordStore.getAllChords();
      chordsInput.value = chords.join(' ');
    }

    // Обновляем метроном
    if (window.app.metronome) {
      window.app.metronome.updateChords(chordsInput.value);
    }

    // Обновляем отображение аккордов
    if (window.app.chordDisplay) {
      const currentBarIndex = window.app.state.currentBarIndex || 0;
      const currentChord = window.app.chordStore.getChordForBar(currentBarIndex);
      const nextChord = window.app.chordStore.getNextChord(currentBarIndex);
      
      if (currentChord) {
        window.app.chordDisplay.setChords(currentChord, nextChord || currentChord);
      } else {
        window.app.chordDisplay.setChords('--', '--');
      }
    }
  }

  /**
   * Восстанавливает текст песни
   * @param {string} title - название песни
   * @param {string} songText - текст песни
   */
  restoreSongText(title, songText) {
    if (!title || !songText || !window.app || !window.app.modal) {
      return;
    }

    // Сохраняем песню в localStorage
    const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
    songs.push({ title, text: songText, date: new Date().toISOString() });
    localStorage.setItem('userSongs', JSON.stringify(songs));

    // Отображаем текст песни
    window.app.modal.displaySongText(title, songText);

    // Показываем drop-зоны
    if (window.app.syllableDragDrop) {
      window.app.syllableDragDrop.showDropZones();
    }

    // Скрываем панель управления и показываем кнопку опций
    if (window.app.optionsMenu) {
      window.app.optionsMenu.hideControlPanel();
      window.app.optionsMenu.showOptionsButton();
    }
  }

  /**
   * Восстанавливает пользовательские правки слогов
   * @param {Object} userSyllableMap - карта пользовательских слогов
   */
  restoreUserSyllableMap(userSyllableMap) {
    if (!userSyllableMap || typeof userSyllableMap !== 'object') {
      return;
    }

    try {
      const title = this.getTitle();
      localStorage.setItem('userSyllables_' + title, JSON.stringify(userSyllableMap));
    } catch (e) {
      console.error('Ошибка сохранения пользовательских слогов:', e);
    }
  }

  /**
   * Восстанавливает привязки слогов к стрелочкам
   * @param {Array} syllables - массив слогов
   */
  restoreSyllables(syllables) {
    if (!Array.isArray(syllables) || !window.app || !window.app.syllableDragDrop) {
      return;
    }

    // Загружаем слоги в SyllableDragDrop
    window.app.syllableDragDrop.allSyllables = syllables;
    window.app.syllableDragDrop.saveSyllablesToStorage();

    // Восстанавливаем отображение для текущего такта
    const currentBarIndex = window.app.state.currentBarIndex || 0;
    window.app.syllableDragDrop.renderBarSyllables(currentBarIndex);
  }

  /**
   * Восстанавливает такты
   * @param {Object} barsData - данные тактов
   */
  restoreBars(barsData) {
    if (!barsData || !window.app || !window.app.barManager) {
      return;
    }

    try {
      // Восстанавливаем такты из данных
      if (window.app.barManager.fromJSON) {
        window.app.barManager.fromJSON(barsData);
      }
    } catch (e) {
      console.error('Ошибка восстановления тактов:', e);
    }
  }

  /**
   * Получает название текущей песни
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
}
