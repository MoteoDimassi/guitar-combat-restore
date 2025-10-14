/**
 * TemplateManager - класс для управления шаблонами
 * Поддерживает множественные форматы и категории
 */
export class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.categories = new Map();
    this.currentFormat = 'v2';
    this.manifest = null;
    this.templatesPath = 'templates/';
  }

  /**
   * Инициализирует менеджер шаблонов
   */
  async init() {
    try {
      await this.loadManifest();
      await this.loadCategories();
    } catch (error) {
    }
  }

  /**
   * Загружает манифест шаблонов
   */
  async loadManifest() {
    try {
      const response = await fetch(`${this.templatesPath}manifest.json`);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки манифеста: ${response.status}`);
      }
      
      this.manifest = await response.json();
    } catch (error) {
      // Ошибка загрузки манифеста
      // Создаём базовый манифест если загрузка не удалась
      this.manifest = {
        version: "2.0",
        templates: [],
        categories: []
      };
    }
  }

  /**
   * Загружает категории из манифеста
   */
  async loadCategories() {
    if (!this.manifest || !this.manifest.categories) {
      return;
    }
    
    this.manifest.categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Загружает шаблон из файла
   * @param {string} templateId - ID шаблона
   * @param {string} format - Формат шаблона
   * @returns {Object} Данные шаблона
   */
  async loadTemplate(templateId, format = 'v2') {
    try {
      // Ищем шаблон в манифесте
      const templateInfo = this.findTemplateInfo(templateId);
      if (!templateInfo) {
        throw new Error(`Шаблон с ID "${templateId}" не найден`);
      }
      
      // Определяем путь к файлу
      const filePath = `${this.templatesPath}${templateInfo.file}`;
      
      // Загружаем файл шаблона
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки шаблона: ${response.status}`);
      }
      
      const templateData = await response.json();
      
      // Мигрируем если нужно
      if (templateData.version !== '2.0') {
        return this.migrateTemplate(templateData);
      }
      
      return templateData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ищет информацию о шаблоне в манифесте
   * @param {string} templateId - ID шаблона
   * @returns {Object|null} Информация о шаблоне
   */
  findTemplateInfo(templateId) {
    if (!this.manifest || !this.manifest.templates) {
      return null;
    }
    
    return this.manifest.templates.find(template => template.id === templateId) || null;
  }

  /**
   * Мигрирует шаблон в новый формат
   * @param {Object} templateData - Данные шаблона
   * @returns {Object} Сконвертированные данные
   */
  migrateTemplate(templateData) {
    // Используем существующую логику миграции из ImportStrumFromJSON
    if (window.guitarCombatApp && window.guitarCombatApp.importStrumFromJSON) {
      const format = window.guitarCombatApp.importStrumFromJSON.detectDataFormat(templateData);
      if (format !== 'v2') {
        return window.guitarCombatApp.importStrumFromJSON.migrateData(templateData, format);
      }
    }
    
    return templateData;
  }

  /**
   * Применяет шаблон к текущей композиции
   * @param {Object} templateData - Данные шаблона
   */
  async applyTemplate(templateData) {
    const app = window.guitarCombatApp;
    if (!app) {
      throw new Error('Приложение Guitar Combat не найдено');
    }

    try {
      // Используем метод importData из ImportStrumFromJSON для полного импорта шаблона
      // Этот метод уже содержит всю логику определения формата, миграции и применения
      await app.importStrumFromJSON.importData(templateData);

    } catch (error) {
      // Уведомления об ошибках уже показывает ImportStrumFromJSON.importData()
      throw error;
    }
  }

  /**
   * Применяет метаданные из шаблона
   * @param {Object} metadata - Метаданные
   */
  async applyMetadata(metadata) {
    if (!metadata) return;

    const app = window.guitarCombatApp;

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
      app.songTitle = metadata.title;
    }

    if (metadata.artist) {
      app.songArtist = metadata.artist;
    }
  }

  /**
   * Применяет структуру песни из шаблона
   * @param {Object} songStructure - Структура песни
   */
  async applySongStructure(songStructure) {
    const app = window.guitarCombatApp;
    
    // Устанавливаем количество долей
    if (songStructure.beatCount) {
      app.settings.beatCount = songStructure.beatCount;
      if (app.arrowDisplay) {
        // При применении шаблона не сохраняем состояния
        app.arrowDisplay.setArrowCount(songStructure.beatCount, false);
      }
    }
    
    // Обновляем общее количество тактов
    if (songStructure.totalBars && app.barNavigation) {
      app.barNavigation.setTotalBars(songStructure.totalBars);
    }
  }

  /**
   * Применяет такты из шаблона
   * @param {Array} bars - Массив тактов из шаблона
   */
  async applyBarsFromTemplate(bars) {
    if (!Array.isArray(bars) || bars.length === 0) {
      return;
    }

    const app = window.guitarCombatApp;

    // Очищаем существующие такты
    app.bars = [];

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

      app.bars.push(bar);
    }

    // Обновляем навигацию по тактам
    if (app.barNavigation) {
      app.barNavigation.setTotalBars(bars.length);
      app.barNavigation.setCurrentBarIndex(0);
    }

    // Обновляем ArrowDisplay статусами из первого такта
    if (bars.length > 0 && app.arrowDisplay) {
      const firstBar = bars[0];
      if (firstBar.beatUnits && Array.isArray(firstBar.beatUnits)) {
        const playStatuses = firstBar.beatUnits.map(beatUnitData => {
          return new PlayStatus(beatUnitData.playStatus.status);
        });
        // При применении шаблона явно устанавливаем статусы без сохранения
        app.arrowDisplay.setAllPlayStatuses(playStatuses);
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
    const app = window.guitarCombatApp;

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
      if (app.chordParser) {
        app.chordParser.parseChords(chordsString);
        app.chordParser.buildChords();
      }

      // Обновляем ChordDisplay
      if (app.chordDisplay) {
        // Получаем валидные аккорды для отображения
        const validChords = app.chordParser.getValidChords();
        if (validChords && validChords.length > 0) {
          const firstChord = validChords[0].name;
          const secondChord = validChords[1] ? validChords[1].name : validChords[0].name;
          app.chordDisplay.updateDisplay(firstChord, secondChord);
        } else {
          app.chordDisplay.updateDisplay('--', '--');
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
   * Импортирует BPM
   * @param {number} bpm - Темп
   */
  importBPM(bpm) {
    const app = window.guitarCombatApp;
    if (app.tempoManager) {
      app.tempoManager.setTempo(bpm);
    }

    // Также обновляем DOM элементы напрямую
    const bpmSlider = document.getElementById('bpm');
    const bpmLabel = document.getElementById('bpmLabel');
    if (bpmSlider && bpmLabel) {
      bpmSlider.value = bpm;
      bpmLabel.textContent = bpm;
    }

    // Обновляем настройки приложения
    if (app.settings) {
      app.settings.bpm = bpm;
    }
  }

  /**
   * Импортирует количество долей в такте
   * @param {number} count - Количество долей
   */
  importBeatCount(count) {
    const app = window.guitarCombatApp;
    if (app.arrowDisplay) {
      // При импорте не сохраняем состояния
      app.arrowDisplay.setArrowCount(count, false);
    }

    // Обновляем настройки
    app.settings.beatCount = count;

    // Обновляем DOM элемент
    const countSelect = document.getElementById('countSelect');
    if (countSelect) {
      countSelect.value = count;
    }
  }

  /**
   * Применяет настройки шаблона
   * @param {Object} templates - Данные шаблонов
   */
  async applyTemplateSettings(templates) {
    const app = window.guitarCombatApp;
    
    // Импорт паттерна боя
    if (templates.strummingPattern) {
      app.currentStrummingPattern = templates.strummingPattern;
    }
    
    // Импорт кастомизаций
    if (templates.customizations) {
      app.customizations = templates.customizations;
    }
  }

  /**
   * Получает список шаблонов по категории
   * @param {string} categoryId - ID категории
   * @returns {Array} Массив шаблонов
   */
  getTemplatesByCategory(categoryId) {
    if (!this.manifest || !this.manifest.templates) {
      return [];
    }
    
    return this.manifest.templates.filter(template => 
      template.category === categoryId
    );
  }

  /**
   * Получает список всех шаблонов
   * @returns {Array} Массив шаблонов
   */
  getAllTemplates() {
    return this.manifest?.templates || [];
  }

  /**
   * Получает список всех категорий
   * @returns {Array} Массив категорий
   */
  getAllCategories() {
    return this.manifest?.categories || [];
  }

  /**
   * Сохраняет текущую композицию как шаблон
   * @param {string} name - Название шаблона
   * @param {string} description - Описание шаблона
   * @param {string} category - Категория шаблона
   * @returns {Object} Данные созданного шаблона
   */
  async saveAsTemplate(name, description, category = 'custom') {
    const app = window.guitarCombatApp;
    if (!app) {
      throw new Error('Приложение Guitar Combat не найдено');
    }
    
    // Используем DownloadManager для сбора данных
    const templateData = app.downloadManager.collectBattleSettingsV2();
    
    // Добавляем информацию о шаблоне
    templateData.templateInfo = {
      name: name,
      id: name.toLowerCase().replace(/\s+/g, '-'),
      category: category,
      difficulty: 'custom',
      description: description,
      tags: ['custom', 'user-created'],
      author: 'User',
      createdAt: new Date().toISOString()
    };
    
    return templateData;
  }

  /**
   * Экспортирует шаблон в файл
   * @param {Object} templateData - Данные шаблона
   * @param {string} filename - Имя файла
   */
  exportTemplate(templateData, filename = null) {
    if (!filename) {
      const name = templateData.templateInfo?.name || 'template';
      filename = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    }

    const jsonString = JSON.stringify(templateData, null, 2);

    // Создаем blob с JSON данными
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Добавляем ссылку в DOM, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Освобождаем память
    URL.revokeObjectURL(url);

  }

}