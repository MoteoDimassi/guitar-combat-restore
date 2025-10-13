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
      console.log('✅ TemplateManager инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации TemplateManager:', error);
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
      console.log('📋 Манифест шаблонов загружен:', this.manifest);
    } catch (error) {
      console.error('❌ Ошибка загрузки манифеста:', error);
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
    
    console.log(`📂 Загружено ${this.categories.size} категорий`);
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
      console.error(`❌ Ошибка загрузки шаблона ${templateId}:`, error);
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
      console.log('🎯 Применение шаблона:', templateData.templateInfo?.name || 'Без названия');
      
      // Отключаем сохранение состояний при применении шаблона
      if (app.arrowDisplay) {
        app.arrowDisplay.setPreservePlayStatuses(false);
      }
      
      // Применяем метаданные
      if (templateData.metadata) {
        await this.applyMetadata(templateData.metadata);
      }
      
      // Применяем структуру песни
      if (templateData.songStructure) {
        await this.applySongStructure(templateData.songStructure);
      }
      
      // Применяем такты
      if (templateData.bars && templateData.bars.length > 0) {
        await this.applyBarsFromTemplate(templateData.bars);
      }
      
      // Применяем шаблоны
      if (templateData.templates) {
        await this.applyTemplateSettings(templateData.templates);
      }
      
      // Обновляем отображение без сохранения состояний
      app.updateDisplay(false);
      
      // Включаем обратно сохранение состояний после применения шаблона
      if (app.arrowDisplay) {
        app.arrowDisplay.setPreservePlayStatuses(true);
      }
      
      console.log('✅ Шаблон успешно применён');
      
    } catch (error) {
      console.error('❌ Ошибка применения шаблона:', error);
      
      // Включаем обратно сохранение состояний в случае ошибки
      if (app.arrowDisplay) {
        app.arrowDisplay.setPreservePlayStatuses(true);
      }
      
      throw error;
    }
  }

  /**
   * Применяет метаданные из шаблона
   * @param {Object} metadata - Метаданные
   */
  async applyMetadata(metadata) {
    const app = window.guitarCombatApp;
    
    // Импорт темпа
    if (metadata.tempo && app.tempoManager) {
      app.tempoManager.setTempo(metadata.tempo);
      console.log(`🎵 Установлен темп: ${metadata.tempo} BPM`);
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
      console.log(`🥁 Установлено количество долей: ${songStructure.beatCount}`);
    }
    
    // Обновляем общее количество тактов
    if (songStructure.totalBars && app.barNavigation) {
      app.barNavigation.setTotalBars(songStructure.totalBars);
      console.log(`📊 Установлено количество тактов: ${songStructure.totalBars}`);
    }
  }

  /**
   * Применяет такты из шаблона
   * @param {Array} bars - Массив тактов из шаблона
   */
  async applyBarsFromTemplate(bars) {
    const app = window.guitarCombatApp;
    const { Bar } = await import('../Measure/Bar.js');
    const { PlayStatus } = await import('../Measure/PlayStatus.js');
    
    // Очищаем существующие такты
    app.bars = [];
    
    // Создаём новые такты
    for (const barData of bars) {
      const bar = new Bar(barData.index, barData.beatUnits?.length || 4);
      
      // Применяем beatUnits
      if (barData.beatUnits) {
        barData.beatUnits.forEach(beatUnitData => {
          if (beatUnitData.index < bar.beatUnits.length) {
            bar.beatUnits[beatUnitData.index].setPlayStatus(beatUnitData.playStatus.status);
          }
        });
      }
      
      // Применяем аккорды
      if (barData.chordChanges) {
        barData.chordChanges.forEach(chordData => {
          bar.addChordChange(chordData.name, chordData.startBeat, chordData.endBeat);
        });
      }
      
      // Применяем слоги
      if (barData.lyricSyllables) {
        barData.lyricSyllables.forEach(syllableData => {
          bar.addLyricSyllable(syllableData.text, syllableData.startBeat, syllableData.duration);
        });
      }
      
      app.bars.push(bar);
    }
    
    // Обновляем навигацию
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
        console.log('🎯 Обновлены статусы воспроизведения в ArrowDisplay из шаблона:', playStatuses.length);
      }
    }
    
    // Обновляем аккорды из тактов
    await this.importChordsFromBars(bars);
    
    console.log(`📊 Создано ${bars.length} тактов из шаблона`);
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

      console.log('🎸 Аккорды импортированы из тактов шаблона:', chordsString);
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
      console.log(`🎸 Установлен паттерн: ${templates.strummingPattern}`);
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
    
    console.log('💾 Шаблон создан:', templateData.templateInfo);
    
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
    
    console.log(`📤 Шаблон экспортирован: ${filename}`);
  }
}