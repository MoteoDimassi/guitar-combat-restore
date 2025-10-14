/**
 * Класс для импорта настроек из JSON файла
 * Поддерживает множественные форматы данных с автоматической миграцией
 * Восстанавливает функциональность кнопки importJson
 */
export class ImportStrumFromJSON {
  constructor(app) {
    this.app = app;
    this.importInput = null;
    this.supportedFormats = ['legacy', 'current', 'v2'];
  }

  /**
   * Инициализирует функциональность импорта
   */
  init() {
    this.createImportInput();
    this.bindImportEvents();
  }

  /**
   * Создает скрытый input для загрузки файлов
   */
  createImportInput() {
    // Удаляем существующий input если есть
    const existingInput = document.getElementById('importJsonInput');
    if (existingInput) {
      existingInput.remove();
    }

    // Создаем новый input
    this.importInput = document.createElement('input');
    this.importInput.type = 'file';
    this.importInput.id = 'importJsonInput';
    this.importInput.accept = 'application/json';
    this.importInput.style.display = 'none';

    this.importInput.addEventListener('change', async (e) => {
      await this.handleImport(e);
    });

    document.body.appendChild(this.importInput);
  }

  /**
   * Привязывает события импорта
   */
  bindImportEvents() {
    const importJsonBtn = document.getElementById('importJson');
    if (importJsonBtn) {
      importJsonBtn.addEventListener('click', () => {
        this.triggerImport();
      });
    }
  }

  /**
   * Запускает процесс импорта
   */
  triggerImport() {
    if (this.importInput) {
      this.importInput.click();
    }
  }

  /**
   * Обрабатывает импорт файла
   * @param {Event} event - Событие выбора файла
   */
  async handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await this.importData(data);
      } catch (error) {
        this.showErrorNotification('Ошибка при импорте файла: ' + error.message);
      }
    };
    reader.onerror = () => {
      this.showErrorNotification('Ошибка чтения файла');
    };
    reader.readAsText(file);

    // Сбрасываем input для возможности повторного импорта того же файла
    event.target.value = '';
  }

  /**
   * Определяет формат данных
   * @param {Object} data - Данные для анализа
   * @returns {string} Формат данных
   */
  detectDataFormat(data) {
    // Проверяем наличие полей старого формата
    if (data.beats && Array.isArray(data.beats)) {
      return 'legacy'; // Старый формат с массивом beats
    }
    
    // Проверяем наличие полей нового формата
    if (data.bars && Array.isArray(data.bars) && data.bars[0]?.beatUnits) {
      return 'v2'; // Новый формат с тактами
    }
    
    // Промежуточный формат (текущий)
    if (data.settings?.arrowStatuses || data.settings?.arrows) {
      return 'current';
    }
    
    return 'unknown';
  }

  /**
   * Мигрирует данные в новый формат
   * @param {Object} data - Исходные данные
   * @param {string} sourceFormat - Исходный формат
   * @returns {Object} Сконвертированные данные
   */
  migrateData(data, sourceFormat) {
    switch (sourceFormat) {
      case 'legacy':
        return this.migrateFromLegacyFormat(data);
      case 'current':
        return this.migrateFromCurrentFormat(data);
      default:
        throw new Error(`Неподдерживаемый формат для миграции: ${sourceFormat}`);
    }
  }

  /**
   * Мигрирует данные из старого формата (beats) в новый
   * @param {Object} data - Данные в старом формате
   * @returns {Object} Данные в новом формате
   */
  migrateFromLegacyFormat(data) {
    const beats = data.beats || [];
    const bpm = data.bpm || 120;
    
    // Определяем количество долей в такте
    const beatCount = beats.length;
    
    // Создаём один такт с данными из beats
    const migratedData = {
      version: "2.0",
      metadata: {
        title: "Migrated from legacy format",
        tempo: bpm,
        timeSignature: `${beatCount}/4`,
        createdAt: new Date().toISOString(),
        migratedFrom: "legacy"
      },
      songStructure: {
        beatCount: beatCount,
        totalBars: 1
      },
      bars: [
        {
          index: 0,
          beatUnits: beats.map((beat, index) => ({
            index: index,
            direction: beat.direction || (index % 2 === 0 ? 'down' : 'up'),
            playStatus: {
              status: beat.play || 0,
              statusString: beat.play ? 'играть' : 'не играть'
            }
          })),
          chordChanges: [],
          lyricSyllables: []
        }
      ],
      templates: {
        strummingPattern: this.detectPatternName(beats),
        customizations: {}
      }
    };
    
    return migratedData;
  }

  /**
   * Мигрирует данные из текущего формата (settings) в новый
   * @param {Object} data - Данные в текущем формате
   * @returns {Object} Данные в новом формате
   */
  migrateFromCurrentFormat(data) {
    const settings = data.settings || {};
    const arrowStatuses = settings.arrowStatuses || [];
    const arrows = settings.arrows || [];
    const chords = settings.chords || [];
    const bars = settings.bars || [];
    
    const beatCount = settings.arrowsPerBar || arrowStatuses.length || 4;
    
    // Создаём beatUnits из arrowStatuses/arrows
    const beatUnits = [];
    for (let i = 0; i < beatCount; i++) {
      const arrowStatus = arrowStatuses[i];
      const arrow = arrows[i];
      
      beatUnits.push({
        index: i,
        direction: (i % 2 === 0) ? 'down' : 'up',
        playStatus: {
          status: arrowStatus?.status || arrow?.playStatus?.status || 0,
          statusString: arrowStatus?.statusString || arrow?.playStatus?.statusString || 'не играть'
        }
      });
    }
    
    // Обрабатываем аккорды
    const chordChanges = [];
    if (chords.length > 0) {
      // Распределяем аккорды по тактам
      chords.forEach((chord, index) => {
        chordChanges.push({
          name: chord,
          startBeat: index,
          endBeat: index + 1
        });
      });
    }
    
    const migratedData = {
      version: "2.0",
      metadata: {
        title: "Migrated from current format",
        tempo: settings.tempo || 120,
        timeSignature: `${beatCount}/4`,
        createdAt: new Date().toISOString(),
        migratedFrom: "current"
      },
      songStructure: {
        beatCount: beatCount,
        totalBars: bars.length || 1
      },
      bars: [
        {
          index: 0,
          beatUnits: beatUnits,
          chordChanges: chordChanges,
          lyricSyllables: []
        }
      ],
      templates: {
        strummingPattern: "custom",
        customizations: {}
      }
    };
    
    return migratedData;
  }

  /**
   * Определяет название паттерна по массиву beats
   * @param {Array} beats - Массив ударов
   * @returns {string} Название паттерна
   */
  detectPatternName(beats) {
    if (!beats || beats.length === 0) return "custom";
    
    const pattern = beats.map(beat => beat.play ? '1' : '0').join('');
    
    // Простые паттерны
    switch (pattern) {
      case '10101010': return "Чередующийся";
      case '10110010': return "Пятерка";
      case '10110110': return "Шестерка";
      case '10010010': return "Восьмерка";
      default: return "custom";
    }
  }

  /**
   * Валидирует данные нового формата
   * @param {Object} data - Данные для валидации
   * @returns {Object} Результат валидации
   */
  validateV2Format(data) {
    const errors = [];
    const warnings = [];
    
    if (!data.bars || !Array.isArray(data.bars)) {
      errors.push('Отсутствует массив bars или он не является массивом');
    }
    
    if (!data.metadata || !data.metadata.tempo) {
      warnings.push('Отсутствует информация о темпе, будет использовано значение по умолчанию');
    }
    
    // Проверяем структуру каждого такта
    if (data.bars) {
      data.bars.forEach((bar, index) => {
        if (!bar.beatUnits || !Array.isArray(bar.beatUnits)) {
          errors.push(`Такт ${index}: отсутствует массив beatUnits`);
        }
        
        if (bar.beatUnits && bar.beatUnits.length === 0) {
          warnings.push(`Такт ${index}: пустой массив beatUnits`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Импортирует данные в новом формате v2
   * @param {Object} data - Данные для импорта
   */
  async importV2Format(data) {
    try {
      // Валидация данных
      const validation = this.validateV2Format(data);
      if (!validation.isValid) {
        throw new Error(`Ошибки валидации: ${validation.errors.join(', ')}`);
      }
      
      // Показываем предупреждения если есть
      if (validation.warnings.length > 0) {
      }
      
      // Импорт метаданных
      await this.importMetadata(data.metadata);
      
      // Импорт структуры песни
      await this.importSongStructure(data.songStructure);
      
      // Импорт тактов
      await this.importBarsV2(data.bars);
      
      // Импорт шаблонов
      await this.importTemplates(data.templates);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Импортирует метаданные
   * @param {Object} metadata - Метаданные
   */
  async importMetadata(metadata) {
    if (!metadata) return;
    
    // Импорт темпа
    if (metadata.tempo) {
      this.importBPM(metadata.tempo);
    }
    
    // Импорт размера такта
    if (metadata.timeSignature) {
      const [beats] = metadata.timeSignature.split('/');
      if (beats && !isNaN(beats)) {
        this.importBeatCount(parseInt(beats));
      }
    }
    
    // Сохраняем дополнительную информацию
    if (metadata.title) {
      this.app.songTitle = metadata.title;
    }
    
    if (metadata.artist) {
      this.app.songArtist = metadata.artist;
    }
  }

  /**
   * Импортирует структуру песни
   * @param {Object} songStructure - Структура песни
   */
  async importSongStructure(songStructure) {
    if (!songStructure) return;
    
    // Устанавливаем количество долей
    if (songStructure.beatCount) {
      this.importBeatCount(songStructure.beatCount);
    }
    
    // Обновляем общее количество тактов
    if (songStructure.totalBars && this.app.barNavigation) {
      this.app.barNavigation.setTotalBars(songStructure.totalBars);
    }
  }

  /**
   * Импортирует такты в новом формате
   * @param {Array} bars - Массив тактов
   */
  async importBarsV2(bars) {
    if (!Array.isArray(bars) || bars.length === 0) {
      return;
    }
    
    // Очищаем существующие такты
    this.app.bars = [];
    
    // Импортируем Bar из правильного модуля
    const { Bar } = await import('../Measure/Bar.js');
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    // Создаём новые такты
    for (let index = 0; index < bars.length; index++) {
      const barData = bars[index];
      const bar = new Bar(index, barData.beatUnits?.length || 4);
      
      // Импортируем beatUnits
      if (barData.beatUnits && Array.isArray(barData.beatUnits)) {
        for (let beatIndex = 0; beatIndex < barData.beatUnits.length; beatIndex++) {
          const beatUnitData = barData.beatUnits[beatIndex];
          if (beatIndex < bar.beatUnits.length) {
            bar.beatUnits[beatIndex] = await this.convertBeatUnit(beatUnitData);
          }
        }
      }
      
      // Импортируем смены аккордов
      if (barData.chordChanges && Array.isArray(barData.chordChanges)) {
        for (const chordData of barData.chordChanges) {
          const chordChange = await this.convertChordChange(chordData);
          bar.chordChanges.push(chordChange);
        }
      }
      
      // Импортируем слоги
      if (barData.lyricSyllables && Array.isArray(barData.lyricSyllables)) {
        for (const syllableData of barData.lyricSyllables) {
          const syllable = await this.convertLyricSyllable(syllableData);
          bar.lyricSyllables.push(syllable);
        }
      }
      
      this.app.bars.push(bar);
    }
    
    // Обновляем навигацию по тактам
    if (this.app.barNavigation) {
      this.app.barNavigation.setTotalBars(bars.length);
      this.app.barNavigation.setCurrentBarIndex(0);
    }
    
    // Обновляем ArrowDisplay статусами из первого такта
    if (bars.length > 0 && this.app.arrowDisplay) {
      const firstBar = bars[0];
      if (firstBar.beatUnits && Array.isArray(firstBar.beatUnits)) {
        const playStatuses = firstBar.beatUnits.map(beatUnitData => {
          return new PlayStatus(beatUnitData.playStatus.status);
        });
        // При импорте явно устанавливаем статусы без сохранения
        this.app.arrowDisplay.setAllPlayStatuses(playStatuses);
      }
    }
    
    // Обновляем аккорды из тактов
    await this.importChordsFromBars(bars);
    
  }

  /**
   * Импортирует аккорды из тактов в поле ввода
   * @param {Array} bars - Массив тактов
   */
  async importChordsFromBars(bars) {
    if (!Array.isArray(bars) || bars.length === 0) {
      return;
    }

    // Собираем все аккорды в порядке их появления в тактах
    const allChords = [];

    bars.forEach(bar => {
      if (bar.chordChanges && Array.isArray(bar.chordChanges)) {
        // Сортируем аккорды по startBeat для правильного порядка
        const sortedChords = bar.chordChanges.sort((a, b) => a.startBeat - b.startBeat);
        sortedChords.forEach(chordChange => {
          if (chordChange.name) {
            allChords.push(chordChange.name);
          }
        });
      }
    });

    if (allChords.length > 0) {
      const chordsString = allChords.join(' ');

      // Обновляем поле ввода аккордов
      const chordsInput = document.getElementById('chordsInput');
      if (chordsInput) {
        chordsInput.value = chordsString;
      }

      // Парсим аккорды через ChordParser
      if (this.app.chordParser) {
        this.app.chordParser.parseChords(chordsString);
        this.app.chordParser.buildChords();
      }

      // Обновляем ChordDisplay
      if (this.app.chordDisplay) {
        // Получаем валидные аккорды для отображения
        const validChords = this.app.chordParser.getValidChords();
        if (validChords && validChords.length > 0) {
          const firstChord = validChords[0].name;
          const secondChord = validChords[1] ? validChords[1].name : validChords[0].name;
          this.app.chordDisplay.updateDisplay(firstChord, secondChord);
        } else {
          this.app.chordDisplay.updateDisplay('--', '--');
        }
      }

    }
  }

  /**
   * Конвертирует beatUnit из JSON в объект
   * @param {Object} beatUnitData - Данные beatUnit
   * @returns {BeatUnit} Объект BeatUnit
   */
  async convertBeatUnit(beatUnitData) {
    const { BeatUnit } = await import('../Measure/BeatUnit.js');
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    let playStatus;
    if (beatUnitData.playStatus) {
      // Новый формат с объектом playStatus
      playStatus = new PlayStatus(beatUnitData.playStatus.status);
    } else {
      // Обратная совместимость
      playStatus = new PlayStatus(beatUnitData.status || 0);
    }
    
    const beatUnit = new BeatUnit(beatUnitData.index, playStatus);
    
    // Сохраняем направление если нужно
    if (beatUnitData.direction) {
      beatUnit.direction = beatUnitData.direction;
    }
    
    return beatUnit;
  }

  /**
   * Конвертирует chordChange из JSON в объект
   * @param {Object} chordData - Данные аккорда
   * @returns {ChordChange} Объект ChordChange
   */
  async convertChordChange(chordData) {
    const { ChordChange } = await import('../Measure/ChordChange.js');
    return new ChordChange(chordData.name, chordData.startBeat, chordData.endBeat);
  }

  /**
   * Конвертирует lyricSyllable из JSON в объект
   * @param {Object} syllableData - Данные слога
   * @returns {LyricSyllable} Объект LyricSyllable
   */
  async convertLyricSyllable(syllableData) {
    const { LyricSyllable } = await import('../Measure/LyricSyllable.js');
    return new LyricSyllable(syllableData.text, syllableData.startBeat, syllableData.duration);
  }

  /**
   * Импортирует шаблоны
   * @param {Object} templates - Данные шаблонов
   */
  async importTemplates(templates) {
    if (!templates) return;
    
    // Импорт паттерна боя
    if (templates.strummingPattern) {
      this.app.currentStrummingPattern = templates.strummingPattern;
    }
    
    // Импорт кастомизаций
    if (templates.customizations) {
      this.app.customizations = templates.customizations;
    }
  }

  /**
   * Импортирует данные из JSON
   * @param {Object} data - Данные для импорта
   */
  async importData(data) {
    if (!data) {
      this.showErrorNotification('Файл пуст или имеет неверный формат');
      return;
    }
    
    try {
      // Отключаем сохранение состояний при импорте (т.к. импортируем новые состояния)
      if (this.app.arrowDisplay) {
        this.app.arrowDisplay.setPreservePlayStatuses(false);
      }
      
      // Определяем формат данных
      const format = this.detectDataFormat(data);
      let processedData;
      
      // Мигрируем данные если нужно
      if (format !== 'v2') {
        processedData = this.migrateData(data, format);
      } else {
        processedData = data;
      }
      
      // Импортируем данные в новом формате
      await this.importV2Format(processedData);
      
      // Финальное обновление отображения без сохранения состояний
      if (this.app.arrowDisplay) {
        this.app.arrowDisplay.updateDisplay();
      }
      
      // Включаем обратно сохранение состояний после импорта
      if (this.app.arrowDisplay) {
        this.app.arrowDisplay.setPreservePlayStatuses(true);
      }
      
      this.showSuccessNotification('Настройки успешно импортированы!');

    } catch (error) {
      this.showErrorNotification('Ошибка при импорте данных: ' + error.message);
      
      // Включаем обратно сохранение состояний в случае ошибки
      if (this.app.arrowDisplay) {
        this.app.arrowDisplay.setPreservePlayStatuses(true);
      }
    }
  }

  /**
   * Импортирует настройки из JSON
   * @param {Object} data - Данные для импорта
   */
  async importSettings(data) {
    const settings = data.settings;
    
    // 1. Импорт количества долей в такте (сначала устанавливаем количество стрелочек)
    if (settings.arrowsPerBar && this.app.arrowDisplay) {
      this.importBeatCount(settings.arrowsPerBar);
    }

    // 2. Импорт BPM
    if (settings.tempo && this.app.tempoManager) {
      this.importBPM(settings.tempo);
    }

    // 3. Импорт аккордов
    if (settings.chords && Array.isArray(settings.chords) && this.app.chordParser) {
      this.importChords(settings.chords);
    }

    // 4. Импорт статусов стрелочек из arrowStatuses (после установки количества)
    if (settings.arrowStatuses && Array.isArray(settings.arrowStatuses)) {
      await this.importArrowStatuses(settings.arrowStatuses);
    }

    // 5. Импорт стрелок из arrows (если нужно для дополнительной информации)
    if (settings.arrows && Array.isArray(settings.arrows) && this.app.arrowDisplay) {
      await this.importArrows(settings.arrows);
    }

    // 6. Импорт настроек тактов
    if (settings.bars && Array.isArray(settings.bars)) {
      await this.importBars(settings.bars);
    }
  }

  /**
   * Импортирует BPM
   * @param {number} bpm - Темп
   */
  importBPM(bpm) {
    if (this.app.tempoManager) {
      this.app.tempoManager.setTempo(bpm);
    }

    // Также обновляем DOM элементы напрямую
    const bpmSlider = document.getElementById('bpm');
    const bpmLabel = document.getElementById('bpmLabel');
    if (bpmSlider && bpmLabel) {
      bpmSlider.value = bpm;
      bpmLabel.textContent = bpm;
    }

    // Обновляем настройки приложения
    if (this.app.settings) {
      this.app.settings.bpm = bpm;
    }
  }

  /**
   * Импортирует аккорды
   * @param {string|Array} chords - Аккорды
   */
  importChords(chords) {
    let chordsString;
    if (Array.isArray(chords)) {
      chordsString = chords.join(' ');
    } else {
      chordsString = chords;
    }

    // Обновляем поле ввода аккордов
    const chordsInput = document.getElementById('chordsInput');
    if (chordsInput) {
      chordsInput.value = chordsString;
    }

    // Парсим аккорды через ChordParser
    if (this.app.chordParser) {
      this.app.chordParser.parseChords(chordsString);
      this.app.chordParser.buildChords();
    }

    // Обновляем ChordDisplay
    if (this.app.chordDisplay) {
      // Получаем валидные аккорды для отображения
      const validChords = this.app.chordParser.getValidChords();
      if (validChords && validChords.length > 0) {
        const firstChord = validChords[0].name;
        const secondChord = validChords[1] ? validChords[1].name : validChords[0].name;
        this.app.chordDisplay.updateDisplay(firstChord, secondChord);
      } else {
        this.app.chordDisplay.updateDisplay('--', '--');
      }
    }

  }


  /**
   * Импортирует статусы стрелочек из arrowStatuses
   * @param {Array} arrowStatuses - Массив статусов стрелочек
   */
  async importArrowStatuses(arrowStatuses) {
    if (!Array.isArray(arrowStatuses)) {
      return;
    }

    // Импортируем PlayStatus один раз
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    // Извлекаем статусы из arrowStatuses и создаем объекты PlayStatus
    const playStatuses = arrowStatuses.map((statusData, index) => {
      let status;
      if (typeof statusData.status === 'number') {
        status = statusData.status;
      } else {
        status = 0; // По умолчанию не играть
      }
      
      return new PlayStatus(status);
    });

    // Устанавливаем статусы в ArrowDisplay
    if (this.app.arrowDisplay) {
      this.app.arrowDisplay.setAllPlayStatuses(playStatuses);
    }
  }

  /**
   * Импортирует стрелки из arrows
   * @param {Array} arrows - Массив стрелок
   */
  async importArrows(arrows) {
    if (!Array.isArray(arrows)) {
      return;
    }

    // Импортируем PlayStatus один раз
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    // Извлекаем статусы из playStatus и создаем объекты PlayStatus
    const playStatuses = arrows.map(arrow => {
      let status;
      if (arrow.playStatus && typeof arrow.playStatus.status === 'number') {
        status = arrow.playStatus.status;
      } else {
        status = 0; // По умолчанию не играть
      }
      
      return new PlayStatus(status);
    });

    // Устанавливаем стрелки в ArrowDisplay
    if (this.app.arrowDisplay) {
      this.app.arrowDisplay.setAllPlayStatuses(playStatuses);
    }

  }


  /**
   * Импортирует настройки тактов
   * @param {Array} bars - Массив тактов
   */
  async importBars(bars) {
    if (!Array.isArray(bars)) {
      return;
    }

    // Очищаем существующие такты
    this.app.bars = [];

    // Импортируем Bar из правильного модуля
    const { Bar } = await import('../Measure/Bar.js');
    
    // Создаем новые такты
    for (let index = 0; index < bars.length; index++) {
      const barData = bars[index];
      const bar = new Bar(index);
      // Здесь можно добавить логику восстановления тактов
      this.app.bars.push(bar);
    }

  }

  /**
   * Импортирует количество долей в такте
   * @param {number} count - Количество долей
   */
  importBeatCount(count) {
    if (this.app.arrowDisplay) {
      // При импорте не сохраняем состояния
      this.app.arrowDisplay.setArrowCount(count, false);
    }

    // Обновляем настройки
    this.app.settings.beatCount = count;

    // Обновляем DOM элемент
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.value = count;
    }
  }

  /**
   * Показывает уведомление об успехе
   * @param {string} message - Сообщение
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Показывает уведомление об ошибке
   * @param {string} message - Сообщение
   */
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Показывает уведомление
   * @param {string} message - Сообщение
   * @param {string} type - Тип уведомления
   */
  showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}
