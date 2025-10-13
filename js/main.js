// Главный файл приложения Guitar Combat
// Объединяет все компоненты и управляет общей логикой

// Импорты компонентов
import { ChordBuilder } from './Chords/ChordBuilder.js';
import { ChordParser } from './Chords/ChordParser.js';
import { ChordDisplay } from './Chords/ChordDisplay.js';
import { Bar } from './Measure/Bar.js';
import { BeatUnit } from './Measure/BeatUnit.js';
import { ChordChange } from './Measure/ChordChange.js';
import { LyricSyllable } from './Measure/LyricSyllable.js';
import { BarSequenceBuilder } from './Measure/BarSequenceBuilder.js';
import { BarNavigation } from './Measure/BarNavigation.js';
import { BarDisplay } from './View/BarDisplay.js';
import { ArrowDisplay } from './Strum/ArrowDisplay.js';
import { RandomStrumGenerator } from './Strum/RandomStrumGenerator.js';
import { Modal } from './ModalWindows/Modal.js';
import { PrivacyPolicyModal } from './ModalWindows/PrivacyPolicyModal.js';
import { TermsOfUseModal } from './ModalWindows/TermsOfUseModal.js';
import { PlayStatus } from './Measure/PlayStatus.js';
import { DownloadManager } from './Functions/DownloadManager.js';
import { TempoManager } from './Functions/TempoManager.js';
import { ImportStrumFromJSON } from './Functions/ImportStrumFromJSON.js';
import { TemplateManager } from './Functions/TemplateManager.js';

/**
 * Главный класс приложения Guitar Combat
 * Управляет всеми компонентами и координирует их работу
 */
export class GuitarCombatApp {
  constructor() {
    // Инициализация компонентов
    this.chordBuilder = new ChordBuilder();
    this.chordParser = new ChordParser();
    this.chordDisplay = new ChordDisplay();
    this.barSequenceBuilder = new BarSequenceBuilder();
    this.barNavigation = new BarNavigation();
    this.barDisplay = new BarDisplay();
    this.arrowDisplay = new ArrowDisplay();
    this.randomStrumGenerator = new RandomStrumGenerator();
    this.modal = new Modal();
    this.privacyModal = new PrivacyPolicyModal();
    this.termsModal = new TermsOfUseModal();
    this.downloadManager = new DownloadManager();
    this.tempoManager = new TempoManager();
    this.importStrumFromJSON = new ImportStrumFromJSON(this);
    this.templateManager = new TemplateManager();
    
    // Массив тактов
    this.bars = [];
    
    // Текущие настройки
    this.settings = {
      beatCount: 4,        // количество долей в такте
      bpm: 120,           // темп
      chordChanges: {},   // правила смены аккордов
      isPlaying: false    // состояние воспроизведения
    };
    
    // DOM элементы
    this.domElements = {
      chordsInput: null,
      beatCountInput: null,
      bpmInput: null,
      countSelect: null,
      nextLineBtn: null,
      prevLineBtn: null,
      playBtn: null,
      barContainer: null,
      barInfo: null,
      arrowContainer: null
    };
    
    // Колбэки
    this.callbacks = {
      onChordsChange: null,
      onBarChange: null,
      onPlaybackStart: null,
      onPlaybackStop: null
    };
  }

  /**
   * Инициализирует приложение
   */
  async init() {
    try {
      console.log('🎸 Инициализация Guitar Combat...');
      
      // Инициализация DOM элементов
      this.initDOMElements();
      
      // Синхронизируем настройки с DOM элементами
      this.syncSettingsWithDOM();
      
    // Инициализация компонентов
    this.initComponents();
    
    // Привязка событий
    this.bindEvents();
    
    // Инициализация менеджера темпа
    this.initTempoManager();
    
    // Инициализация импорта JSON
    this.importStrumFromJSON.init();
    
    // Инициализация менеджера шаблонов
    this.templateManager.init();
      
      // Загрузка сохраненных данных
      this.loadSavedData();
      
      // Первоначальное обновление интерфейса
      this.updateDisplay();
      
      // Парсинг начальных аккордов из поля ввода
      this.parseInitialChords();
      
      console.log('✅ Guitar Combat успешно инициализирован');
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      this.showError('Ошибка инициализации приложения');
    }
  }

  /**
   * Инициализирует DOM элементы
   */
  initDOMElements() {
    this.domElements = {
      chordsInput: document.getElementById('chordsInput'),
      beatCountInput: document.getElementById('beatCountInput'),
      bpmInput: document.getElementById('bpmInput'),
      countSelect: document.getElementById('countSelect'),
      nextLineBtn: document.getElementById('nextLineBtn'),
      prevLineBtn: document.getElementById('prevLineBtn'),
      playBtn: document.getElementById('playBtn'),
      barContainer: document.getElementById('barContainer'),
      barInfo: document.getElementById('barInfo'),
      arrowContainer: document.getElementById('beatRow') // Используем beatRow как контейнер для стрелочек
    };

    // Проверяем наличие критически важных элементов
    const criticalElements = ['chordsInput', 'countSelect', 'arrowContainer'];
    const missingCriticalElements = criticalElements.filter(id => !this.domElements[id]);
    
    if (missingCriticalElements.length > 0) {
      throw new Error(`Отсутствуют критически важные DOM элементы: ${missingCriticalElements.join(', ')}`);
    }

    // Проверяем наличие опциональных элементов
    const optionalElements = ['nextLineBtn', 'prevLineBtn', 'playBtn', 'barContainer', 'barInfo', 'beatCountInput', 'bpmInput'];
    const missingOptionalElements = optionalElements.filter(id => !this.domElements[id]);
    
    if (missingOptionalElements.length > 0) {
      console.warn('⚠️ Отсутствуют опциональные DOM элементы:', missingOptionalElements.join(', '));
    }
  }

  /**
   * Синхронизирует настройки с DOM элементами
   */
  syncSettingsWithDOM() {
    // Синхронизируем количество стрелочек с выпадающим меню
    if (this.domElements.countSelect) {
      this.settings.beatCount = parseInt(this.domElements.countSelect.value) || 8;
    }
    
    // Синхронизируем BPM с полем ввода (если есть)
    if (this.domElements.bpmInput) {
      this.settings.bpm = parseInt(this.domElements.bpmInput.value) || 120;
    }
    
    // Синхронизируем BPM с TempoManager (если инициализирован)
    if (this.tempoManager && this.tempoManager.isReady()) {
      this.tempoManager.setTempo(this.settings.bpm);
    }
    
    console.log('🔄 Настройки синхронизированы с DOM:', this.settings);
  }

  /**
   * Инициализирует менеджер темпа
   */
  initTempoManager() {
    try {
      console.log('🎼 Инициализация TempoManager...');
      
      // Инициализируем менеджер темпа
      this.tempoManager.init();
      
      // Устанавливаем колбэк для изменения темпа
      this.tempoManager.setOnTempoChange((bpm) => {
        this.handleTempoChange(bpm);
      });
      
      console.log('✅ TempoManager успешно инициализирован');
      
    } catch (error) {
      console.error('❌ Ошибка инициализации TempoManager:', error);
      // Не прерываем инициализацию приложения, если TempoManager не инициализировался
    }
  }

  /**
   * Инициализирует компоненты
   */
  initComponents() {
    // Инициализация модальных окон
    this.modal.init();
    this.privacyModal.init();
    this.termsModal.init();
    
    // Инициализация отображения тактов (если есть контейнер)
    if (this.domElements.barContainer) {
      const containerSelector = '#barContainer';
      const infoSelector = this.domElements.barInfo ? '#barInfo' : null;
      this.barDisplay.init(containerSelector, infoSelector);
      
      // Настройка колбэков для BarDisplay
      this.barDisplay.setOnBarChange((barIndex, bar) => {
        this.handleBarChange(barIndex, bar);
      });
      
      this.barDisplay.setOnPlaybackStart(() => {
        this.handlePlaybackStart();
      });
      
      this.barDisplay.setOnPlaybackStop(() => {
        this.handlePlaybackStop();
      });
    } else {
      console.warn('⚠️ BarDisplay не инициализирован - отсутствует контейнер barContainer');
    }
    
    // Инициализация отображения стрелочек
    this.arrowDisplay.init('#beatRow', '#countSelect');
    
    // Устанавливаем callback для изменения состояний воспроизведения
    this.arrowDisplay.setOnPlayStatusChange((index, playStatus) => {
      this.handlePlayStatusChange(index, playStatus);
    });
    
    // Включаем сохранение состояний по умолчанию
    this.arrowDisplay.setPreservePlayStatuses(true);
    
    // Инициализация отображения аккордов
    this.chordDisplay.init('#chordDisplay');
    console.log('🎵 ChordDisplay инициализирован:', this.chordDisplay.isInitialized());
    
    // Инициализация навигации по тактам
    this.barNavigation.init();
    
    // Настройка колбэков для BarNavigation
    this.barNavigation.setOnBarChange((barIndex) => {
      this.handleBarNavigationChange(barIndex);
    });
  }

  /**
   * Привязывает события к DOM элементам
   */
  bindEvents() {
    // Обработчик изменения поля аккордов (постоянный парсинг)
    if (this.domElements.chordsInput) {
      // Обработчик для мгновенного обновления при вводе
      this.domElements.chordsInput.addEventListener('input', (e) => {
        this.handleChordsInputChange(e.target.value);
      });
      
      // Дополнительный обработчик для изменения (на случай если input не сработает)
      this.domElements.chordsInput.addEventListener('change', (e) => {
        this.handleChordsInputChange(e.target.value);
      });
      
      // Обработчик для обновления при потере фокуса
      this.domElements.chordsInput.addEventListener('blur', (e) => {
        this.handleChordsInputChange(e.target.value);
      });
    }

    // Обработчик изменения количества долей
    if (this.domElements.beatCountInput) {
      this.domElements.beatCountInput.addEventListener('change', (e) => {
        this.handleBeatCountChange(parseInt(e.target.value));
      });
    }

    // Обработчик изменения темпа
    if (this.domElements.bpmInput) {
      this.domElements.bpmInput.addEventListener('input', (e) => {
        this.handleBpmChange(parseInt(e.target.value));
      });
    }

    // Обработчик изменения количества стрелочек
    if (this.domElements.countSelect) {
      this.domElements.countSelect.addEventListener('change', (e) => {
        this.handleBeatCountChange(parseInt(e.target.value));
      });
    }

    // Обработчик кнопки "Случайный бой"
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateRandomStrum();
      });
    }

    // Обработчик кнопки скачивания настроек
    const downloadJsonBtn = document.getElementById('downloadJson');
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener('click', () => {
        // По умолчанию экспортируем в новом формате v2
        this.downloadManager.downloadJson('v2');
      });
    }
    
    // Обработчики кнопок для разных форматов экспорта
    const downloadV2Btn = document.getElementById('downloadJsonV2');
    if (downloadV2Btn) {
      downloadV2Btn.addEventListener('click', () => {
        this.downloadManager.downloadJson('v2');
      });
    }
    
    const downloadCurrentBtn = document.getElementById('downloadJsonCurrent');
    if (downloadCurrentBtn) {
      downloadCurrentBtn.addEventListener('click', () => {
        this.downloadManager.downloadJson('current');
      });
    }
    
    const downloadLegacyBtn = document.getElementById('downloadJsonLegacy');
    if (downloadLegacyBtn) {
      downloadLegacyBtn.addEventListener('click', () => {
        this.downloadManager.downloadJson('legacy');
      });
    }
    
    // Обработчик кнопки применения шаблона
    const applyTemplateBtn = document.getElementById('applyTemplate');
    if (applyTemplateBtn) {
      applyTemplateBtn.addEventListener('click', () => {
        this.handleApplyTemplate();
      });
    }

    // Обработчики кнопок навигации и воспроизведения
    // Привязываются автоматически в BarDisplay
  }

  /**
   * Парсит начальные аккорды из поля ввода
   */
  parseInitialChords() {
    if (!this.domElements.chordsInput) {
      console.warn('⚠️ Поле ввода аккордов не найдено');
      return;
    }

    const chordsString = this.domElements.chordsInput.value;
    console.log('🎵 Парсинг начальных аккордов:', chordsString || '(пустое поле)');
    
    // Всегда вызываем обработчик, даже для пустой строки
    this.handleChordsInputChange(chordsString || '');
  }

  /**
   * Обрабатывает изменение поля аккордов
   * @param {string} chordsString - Строка с аккордами
   */
  handleChordsInputChange(chordsString) {
    console.log('🎵 Обновление аккордов:', chordsString);
    
    // Включаем сохранение состояний стрелочек при изменении аккордов
    if (this.arrowDisplay) {
      this.arrowDisplay.setPreservePlayStatuses(true);
    }
    
    // Обновляем парсер аккордов
    this.chordParser.updateChords(chordsString, this.settings.beatCount, this.settings.chordChanges);
    
    // Получаем статистику парсинга
    const stats = this.chordParser.getStats();
    console.log('📊 Статистика парсинга:', stats);
    
    // Создаем такты на основе аккордов
    this.createBarsFromChords();
    
    // Обновляем отображение аккордов
    this.updateChordDisplay();
    
    // Обновляем отображение
    this.updateDisplay();
    
    // Сохраняем данные
    this.saveData();
    
    // Вызываем колбэк
    if (this.callbacks.onChordsChange) {
      this.callbacks.onChordsChange(chordsString, stats);
    }
  }

  /**
   * Обрабатывает изменение количества долей в такте
   * @param {number} beatCount - Количество долей
   */
  handleBeatCountChange(beatCount) {
    if (beatCount > 0 && beatCount <= 16) {
      console.log('🥁 Изменение количества долей:', beatCount);
      this.settings.beatCount = beatCount;
      
      // Синхронизируем количество стрелочек
      if (this.domElements.countSelect) {
        this.domElements.countSelect.value = beatCount;
      }
      
      // Обновляем отображение стрелочек без сохранения состояний при явном изменении количества
      if (this.arrowDisplay) {
        this.arrowDisplay.setArrowCount(beatCount, false);
      }
      
      // Пересоздаем такты с новым количеством долей
      this.createBarsFromChords();
      this.updateDisplay();
      this.saveData();
    }
  }

  /**
   * Обрабатывает изменение темпа
   * @param {number} bpm - Темп в ударах в минуту
   */
  handleBpmChange(bpm) {
    if (bpm > 0 && bpm <= 300) {
      console.log('🎼 Изменение темпа:', bpm);
      this.settings.bpm = bpm;
      this.saveData();
    }
  }

  /**
   * Обрабатывает изменение темпа через TempoManager
   * @param {number} bpm - Темп в ударах в минуту
   */
  handleTempoChange(bpm) {
    console.log('🎼 Изменение темпа через TempoManager:', bpm);
    this.settings.bpm = bpm;
    this.saveData();
    
    // Здесь можно добавить дополнительную логику, например:
    // - Обновление метронома
    // - Пересчет интервалов воспроизведения
    // - Уведомление других компонентов об изменении темпа
  }

  /**
   * Обновляет отображение аккордов на основе текущего такта
   */
  updateChordDisplay() {
    if (!this.chordDisplay || !this.chordDisplay.isInitialized()) {
      console.warn('⚠️ ChordDisplay не инициализирован');
      return;
    }

    // Если нет тактов, пытаемся получить аккорды напрямую из парсера
    if (this.bars.length === 0) {
      const validChords = this.chordParser.getValidChords();
      if (validChords.length > 0) {
        const currentChord = validChords[0].name;
        const nextChord = validChords.length > 1 ? validChords[1].name : null;
        this.chordDisplay.updateDisplay(currentChord, nextChord);
        console.log('🎵 Отображение аккордов из парсера:', { currentChord, nextChord });
        return;
      } else {
        this.chordDisplay.clear();
        return;
      }
    }

    // Получаем текущий такт из навигации
    let currentBar = null;
    const currentBarIndex = this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0;
    
    console.log('🎵 Обновление отображения аккордов:', {
      currentBarIndex,
      totalBars: this.bars.length
    });
    
    if (this.bars.length > 0 && currentBarIndex < this.bars.length) {
      currentBar = this.bars[currentBarIndex];
      console.log('🎵 Используем такт:', currentBarIndex, 'с аккордом:', currentBar.getChordForBeat(0));
    }
    
    if (!currentBar) {
      this.chordDisplay.clear();
      return;
    }

    // Получаем аккорды из текущего такта
    const currentBarChords = this.getChordsFromBar(currentBar);
    const currentChord = currentBarChords.current;
    const nextChord = currentBarChords.next;

    // Если в текущем такте несколько аккордов, показываем их все
    const allCurrentChords = this.getAllChordsFromBar(currentBar);
    const displayCurrentChord = allCurrentChords.length > 1 ? allCurrentChords : currentChord;

    this.chordDisplay.updateDisplay(displayCurrentChord, nextChord);
    console.log('🎵 Отображение аккордов из такта:', { 
      currentChord: displayCurrentChord, 
      nextChord,
      barIndex: this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0
    });
  }

  /**
   * Получает аккорды из такта (текущий и следующий)
   * @param {Bar} bar - Текущий такт
   * @returns {Object} Объект с current и next аккордами
   */
  getChordsFromBar(bar) {
    if (!bar || !bar.chordChanges || bar.chordChanges.length === 0) {
      return { current: null, next: null };
    }

    // Получаем первый аккорд из текущего такта (аккорд на первой доле)
    const currentChord = bar.getChordForBeat(0);
    
    // Получаем следующий аккорд из следующего такта
    let nextChord = null;
    const currentBarIndex = this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0;
    
    console.log('🎵 Получение аккордов для такта:', {
      currentBarIndex,
      totalBars: this.bars.length,
      currentBar: bar.barIndex
    });
    
    if (currentBarIndex + 1 < this.bars.length) {
      const nextBar = this.bars[currentBarIndex + 1];
      nextChord = nextBar.getChordForBeat(0);
      console.log('🎵 Следующий аккорд из такта:', nextBar.barIndex, '=', nextChord);
    }

    return { current: currentChord, next: nextChord };
  }

  /**
   * Получает все аккорды из текущего такта (для поддержки нескольких аккордов в такте)
   * @param {Bar} bar - Текущий такт
   * @returns {string[]} Массив названий аккордов в такте
   */
  getAllChordsFromBar(bar) {
    if (!bar || !bar.chordChanges || bar.chordChanges.length === 0) {
      return [];
    }

    // Возвращаем все уникальные аккорды из такта
    const chords = bar.chordChanges.map(chordChange => chordChange.name);
    return [...new Set(chords)]; // Убираем дубликаты
  }

  /**
   * Создает такты на основе аккордов используя BarSequenceBuilder
   */
  createBarsFromChords() {
    const validChords = this.chordParser.getValidChords();
    
    if (validChords.length === 0) {
      // Создаем один пустой такт
      this.bars = [new Bar(0, this.settings.beatCount)];
      console.log('📊 Создан пустой такт (нет аккордов)');
    } else {
      // Используем BarSequenceBuilder для создания тактов
      this.barSequenceBuilder.beatCount = this.settings.beatCount;
      const chordNames = validChords.map(chord => chord.name);
      this.bars = this.barSequenceBuilder.buildFromChordArray(chordNames);
      console.log(`📊 Создано ${this.bars.length} тактов через BarSequenceBuilder:`, chordNames);
      
      // Проверяем аккорды в каждом такте
      this.bars.forEach((bar, index) => {
        const chord = bar.getChordForBeat(0);
        console.log(`📊 Такт ${index}: аккорд = ${chord}`);
      });
    }
    
    // Обновляем навигацию по тактам
    console.log('🧭 Обновление навигации:', {
      barsCount: this.bars.length,
      navigationState: this.barNavigation.getState()
    });
    
    this.barNavigation.setTotalBars(this.bars.length);
    this.barNavigation.setCurrentBarIndex(0);
    
    console.log('🧭 Навигация обновлена:', this.barNavigation.getState());
  }

  /**
   * Обрабатывает смену такта
   * @param {number} barIndex - Индекс нового такта
   * @param {Bar} bar - Объект такта
   */
  handleBarChange(barIndex, bar) {
    console.log('🔄 Смена такта:', barIndex);
    
    // Обновляем отображение аккордов при смене такта
    this.updateChordDisplay();
    
    if (this.callbacks.onBarChange) {
      this.callbacks.onBarChange(barIndex, bar);
    }
  }

  /**
   * Обрабатывает навигацию по тактам через BarNavigation
   * @param {number} barIndex - Индекс нового такта
   */
  handleBarNavigationChange(barIndex) {
    console.log('🧭 Навигация по тактам:', barIndex);
    
    // Синхронизируем с BarDisplay если он инициализирован
    if (this.barDisplay && this.domElements.barContainer) {
      this.barDisplay.goToBar(barIndex);
    }
    
    // Принудительно обновляем отображение аккордов
    console.log('🎵 Принудительное обновление ChordDisplay после смены такта');
    this.updateChordDisplay();
    
    // Вызываем общий колбэк смены такта
    const currentBar = this.bars[barIndex] || null;
    if (this.callbacks.onBarChange) {
      this.callbacks.onBarChange(barIndex, currentBar);
    }
  }

  /**
   * Обрабатывает начало воспроизведения
   */
  handlePlaybackStart() {
    console.log('▶️ Начало воспроизведения');
    this.settings.isPlaying = true;
    
    if (this.callbacks.onPlaybackStart) {
      this.callbacks.onPlaybackStart();
    }
  }

  /**
   * Обрабатывает остановку воспроизведения
   */
  handlePlaybackStop() {
    console.log('⏹️ Остановка воспроизведения');
    this.settings.isPlaying = false;
    
    if (this.callbacks.onPlaybackStop) {
      this.callbacks.onPlaybackStop();
    }
  }

  /**
   * Обновляет отображение
   * @param {boolean} preserveArrowStatuses - Сохранять ли состояния стрелочек (опционально)
   */
  updateDisplay(preserveArrowStatuses = true) {
    // Обновляем отображение тактов (если инициализирован)
    if (this.barDisplay && this.domElements.barContainer) {
      this.barDisplay.setBars(this.bars);
    }
    
    // Обновляем навигацию по тактам
    this.barNavigation.setTotalBars(this.bars.length);
    
    // Обновляем отображение стрелочек
    if (this.arrowDisplay) {
      // Сохраняем состояния по умолчанию при обычных обновлениях
      this.arrowDisplay.setArrowCount(this.settings.beatCount, preserveArrowStatuses);
    }
    
    // Обновляем отображение аккордов
    this.updateChordDisplay();
    
    // Обновляем информацию о состоянии
    this.updateStatusInfo();
  }

  /**
   * Обрабатывает изменение состояния воспроизведения
   * @param {number} index - Индекс стрелочки
   * @param {PlayStatus} playStatus - Новое состояние воспроизведения
   */
  handlePlayStatusChange(index, playStatus) {
    console.log(`🔄 Изменение состояния воспроизведения для стрелочки ${index + 1}:`, {
      статус: playStatus.getStatusString(),
      символ: playStatus.getDisplaySymbol(),
      играет: playStatus.isPlayed(),
      приглушен: playStatus.isMuted(),
      пропущен: playStatus.isSkipped()
    });
    
    // Здесь можно добавить логику для обновления тактов или других компонентов
    // Например, обновить текущий такт с новыми состояниями воспроизведения
    if (this.bars && this.bars.length > 0 && this.barNavigation) {
      const currentBarIndex = this.barNavigation.getCurrentBarIndex();
      if (currentBarIndex >= 0 && currentBarIndex < this.bars.length) {
        const currentBar = this.bars[currentBarIndex];
        currentBar.setBeatPlayStatus(index, playStatus);
        console.log(`📝 Обновлен такт ${currentBarIndex + 1}, позиция ${index + 1}`);
      }
    }
  }

  /**
   * Обновляет информацию о состоянии
   */
  updateStatusInfo() {
    const stats = this.chordParser.getStats();
    const state = this.barDisplay && this.domElements.barContainer ? this.barDisplay.getState() : null;
    const arrowState = this.arrowDisplay ? this.arrowDisplay.getState() : null;
    const chordDisplayState = this.chordDisplay ? this.chordDisplay.getState() : null;
    const navigationState = this.barNavigation ? this.barNavigation.getState() : null;
    
    console.log('📈 Статистика:', {
      аккорды: stats,
      такты: state,
      стрелочки: arrowState,
      отображение_аккордов: chordDisplayState,
      навигация_по_тактам: navigationState,
      настройки: this.settings
    });
  }

  /**
   * Показывает модальное окно политики конфиденциальности
   */
  showPrivacyPolicy() {
    this.privacyModal.show();
  }

  /**
   * Показывает модальное окно условий использования
   */
  showTermsOfUse() {
    this.termsModal.show();
  }

  /**
   * Показывает ошибку пользователю
   * @param {string} message - Сообщение об ошибке
   */
  showError(message) {
    console.error('❌ Ошибка:', message);
    this.modal.open('Ошибка', `<p class="text-red-400">${message}</p>`);
  }

  /**
   * Сохраняет данные в localStorage
   */
  saveData() {
    try {
      const data = {
        settings: this.settings,
        chords: this.chordParser.toJSON(),
        bars: this.bars.map(bar => bar.toJSON()),
        tempoManager: this.tempoManager ? this.tempoManager.toJSON() : null,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('guitarCombatData', JSON.stringify(data));
      console.log('💾 Данные сохранены');
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
    }
  }

  /**
   * Загружает сохраненные данные из localStorage
   */
  loadSavedData() {
    try {
      const saved = localStorage.getItem('guitarCombatData');
      if (!saved) return;
      
      const data = JSON.parse(saved);
      
      // Восстанавливаем настройки
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
      }
      
      // Восстанавливаем аккорды
      if (data.chords) {
        this.chordParser = ChordParser.fromJSON(data.chords);
      }
      
      // Восстанавливаем такты
      if (data.bars) {
        this.bars = data.bars.map(barData => Bar.fromJSON(barData));
      }
      
      // Восстанавливаем состояние TempoManager
      if (data.tempoManager && this.tempoManager) {
        this.tempoManager.fromJSON(data.tempoManager);
      }
      
      // Обновляем поля ввода
      if (this.domElements.chordsInput && this.chordParser.parsedChords.length > 0) {
        this.domElements.chordsInput.value = this.chordParser.parsedChords.join(' ');
      }
      
      if (this.domElements.beatCountInput) {
        this.domElements.beatCountInput.value = this.settings.beatCount;
      }
      
      if (this.domElements.bpmInput) {
        this.domElements.bpmInput.value = this.settings.bpm;
      }
      
      if (this.domElements.countSelect) {
        this.domElements.countSelect.value = this.settings.beatCount;
      }
      
      console.log('📂 Данные загружены');
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
    }
  }

  /**
   * Очищает все данные
   */
  clearAllData() {
    this.bars = [];
    this.chordParser.clear();
    
    if (this.domElements.chordsInput) {
      this.domElements.chordsInput.value = '';
    }
    
    this.updateDisplay();
    this.saveData();
    
    console.log('🗑️ Все данные очищены');
  }

  /**
   * Устанавливает колбэк для изменения аккордов
   * @param {Function} callback - Колбэк функция
   */
  setOnChordsChange(callback) {
    this.callbacks.onChordsChange = callback;
  }

  /**
   * Устанавливает колбэк для смены такта
   * @param {Function} callback - Колбэк функция
   */
  setOnBarChange(callback) {
    this.callbacks.onBarChange = callback;
  }

  /**
   * Устанавливает колбэк для начала воспроизведения
   * @param {Function} callback - Колбэк функция
   */
  setOnPlaybackStart(callback) {
    this.callbacks.onPlaybackStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки воспроизведения
   * @param {Function} callback - Колбэк функция
   */
  setOnPlaybackStop(callback) {
    this.callbacks.onPlaybackStop = callback;
  }

  /**
   * Получает текущее состояние приложения
   * @returns {Object} Состояние приложения
   */
  getState() {
    return {
      settings: { ...this.settings },
      chordStats: this.chordParser.getStats(),
      displayState: this.barDisplay && this.domElements.barContainer ? this.barDisplay.getState() : null,
      arrowState: this.arrowDisplay ? this.arrowDisplay.getState() : null,
      chordDisplayState: this.chordDisplay ? this.chordDisplay.getState() : null,
      navigationState: this.barNavigation ? this.barNavigation.getState() : null,
      tempoManagerState: this.tempoManager ? this.tempoManager.getState() : null,
      barsCount: this.bars.length
    };
  }

  /**
   * Получает менеджер темпа
   * @returns {TempoManager} Менеджер темпа
   */
  getTempoManager() {
    return this.tempoManager;
  }

  /**
   * Получает экземпляр приложения (синглтон)
   * @returns {GuitarCombatApp} Экземпляр приложения
   */
  static getInstance() {
    if (!GuitarCombatApp.instance) {
      GuitarCombatApp.instance = new GuitarCombatApp();
    }
    return GuitarCombatApp.instance;
  }

  /**
   * Генерирует случайный бой для текущего количества стрелочек
   */
  generateRandomStrum() {
    try {
      console.log('🎲 Генерация случайного боя...');
      
      // Отключаем сохранение состояний при генерации случайного боя
      if (this.arrowDisplay) {
        this.arrowDisplay.setPreservePlayStatuses(false);
      }
      
      // Получаем текущее количество стрелочек
      const currentCount = this.arrowDisplay.currentCount || 8;
      
      // Генерируем случайный бой
      const randomPlayStatuses = this.randomStrumGenerator.generateRandomStrum(currentCount);
      
      // Устанавливаем новые состояния в ArrowDisplay
      this.arrowDisplay.setAllPlayStatuses(randomPlayStatuses);
      
      // Анализируем сгенерированный бой
      const analysis = this.randomStrumGenerator.analyzeStrum(randomPlayStatuses);
      
      // Включаем обратно сохранение состояний после генерации
      if (this.arrowDisplay) {
        this.arrowDisplay.setPreservePlayStatuses(true);
      }
      
      console.log('✅ Случайный бой сгенерирован:', analysis);
      
      // Показываем краткую информацию пользователю
      this.showNotification(
        `Случайный бой сгенерирован! Играющих долей: ${analysis.playCount}/${analysis.total}`
      );
      
    } catch (error) {
      console.error('❌ Ошибка генерации случайного боя:', error);
      
      // Включаем обратно сохранение состояний в случае ошибки
      if (this.arrowDisplay) {
        this.arrowDisplay.setPreservePlayStatuses(true);
      }
      
      this.showError('Ошибка генерации случайного боя');
    }
  }

  /**
   * Показывает уведомление пользователю
   * @param {string} message - Сообщение
   */
  showNotification(message) {
    // Простая реализация уведомления
    console.log('📢', message);
    
    // Можно расширить для показа в UI
    if (typeof window !== 'undefined' && window.alert) {
      // Для отладки - показываем alert
      // window.alert(message);
    }
  }

  /**
   * Обрабатывает применение шаблона
   */
  async handleApplyTemplate() {
    try {
      // Показываем список доступных шаблонов
      const templates = this.templateManager.getAllTemplates();
      
      if (templates.length === 0) {
        this.showError('Нет доступных шаблонов');
        return;
      }
      
      // Создаём простое диалоговое окно для выбора шаблона
      const templateId = await this.showTemplateSelectionDialog(templates);
      
      if (templateId) {
        console.log(`🎯 Применение шаблона: ${templateId}`);
        
        // Загружаем и применяем шаблон
        const templateData = await this.templateManager.loadTemplate(templateId);
        await this.templateManager.applyTemplate(templateData);
        
        this.showNotification(`Шаблон "${templateData.templateInfo?.name || templateId}" применён`);
      }
      
    } catch (error) {
      console.error('❌ Ошибка применения шаблона:', error);
      this.showError(`Ошибка применения шаблона: ${error.message}`);
    }
  }

  /**
   * Показывает диалоговое окно для выбора шаблона
   * @param {Array} templates - Массив шаблонов
   * @returns {Promise<string|null>} ID выбранного шаблона
   */
  async showTemplateSelectionDialog(templates) {
    return new Promise((resolve) => {
      // Создаём модальное окно
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">Выберите шаблон</h3>
          <div class="space-y-2">
            ${templates.map(template => `
              <button class="template-btn w-full text-left p-3 border rounded hover:bg-gray-100 transition-colors" data-template-id="${template.id}">
                <div class="font-medium">${template.name}</div>
                <div class="text-sm text-gray-600">${template.description}</div>
                <div class="text-xs text-gray-500">Категория: ${template.category} | Формат: ${template.formats?.join(', ') || 'legacy'}</div>
              </button>
            `).join('')}
          </div>
          <div class="mt-4 flex justify-end space-x-2">
            <button class="cancel-btn px-4 py-2 text-gray-600 hover:text-gray-800">Отмена</button>
          </div>
        </div>
      `;
      
      // Добавляем обработчики событий
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('template-btn')) {
          const templateId = e.target.dataset.templateId;
          document.body.removeChild(modal);
          resolve(templateId);
        } else if (e.target.classList.contains('cancel-btn') || e.target === modal) {
          document.body.removeChild(modal);
          resolve(null);
        }
      });
      
      // Добавляем модальное окно на страницу
      document.body.appendChild(modal);
    });
  }

  /**
   * Сохраняет текущую композицию как шаблон
   * @param {string} name - Название шаблона
   * @param {string} description - Описание шаблона
   */
  async saveAsTemplate(name, description) {
    try {
      const templateData = await this.templateManager.saveAsTemplate(name, description);
      this.showNotification(`Шаблон "${name}" создан`);
      return templateData;
    } catch (error) {
      console.error('❌ Ошибка сохранения шаблона:', error);
      this.showError(`Ошибка сохранения шаблона: ${error.message}`);
    }
  }

  /**
   * Показывает ошибку пользователю
   * @param {string} error - Сообщение об ошибке
   */
  showError(error) {
    console.error('❌', error);
    
    // Можно расширить для показа в UI
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`Ошибка: ${error}`);
    }
  }
}

// Экспорт для использования в других модулях
export default GuitarCombatApp;

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = GuitarCombatApp.getInstance();
  app.init();
  
  // Делаем приложение доступным глобально для DownloadManager
  window.guitarCombatApp = app;
});

// Экспорт в глобальную область для отладки
window.GuitarCombatApp = GuitarCombatApp;
window.TempoManager = TempoManager;
