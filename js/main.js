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
import { TemplateSetter } from './Strum/TemplateSetter.js';
import { TemplateManager } from './Functions/TemplateManager.js';
import { AudioController } from './Audio/AudioController.js';

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
this.templateSetter = new TemplateSetter();
    this.tempoManager = new TempoManager();
    this.importStrumFromJSON = new ImportStrumFromJSON(this);
    this.templateManager = new TemplateManager();
    this.audioController = new AudioController();
    
    // Массив тактов
    this.bars = [];
    
    // Текущие настройки
    this.settings = {
      beatCount: 4,        // количество долей в такте
      bpm: 120,           // темп
      chordChanges: {},   // правила смены аккордов
      isPlaying: false,   // состояние воспроизведения
      audioVolume: 0.7    // громкость аудио
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
    // Инициализация TemplateSetter
    await this.initTemplateSetter();

    // Инициализация менеджера шаблонов
    this.templateManager.init();
    
    // Инициализация аудио системы
    await this.initAudioSystem();
      
      // Загрузка сохраненных данных
      this.loadSavedData();
      
      // Первоначальное обновление интерфейса
      this.updateDisplay();
      
      // Парсинг начальных аккордов из поля ввода
      this.parseInitialChords();
      
    } catch (error) {
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
    
  }

  /**
   * Инициализирует менеджер темпа
   */
  initTempoManager() {
    try {
      // Инициализируем менеджер темпа
      this.tempoManager.init();
      
     // Устанавливаем колбэк для изменения темпа
     this.tempoManager.setOnTempoChange((bpm) => {
       this.handleTempoChange(bpm);
     });

   } catch (error) {
     // Не прерываем инициализацию приложения, если TempoManager не инициализировался
   }
 }

/**
 * Инициализирует TemplateSetter
 */
async initTemplateSetter() {
  try {
    await this.templateSetter.init(this.templateManager, this.arrowDisplay);
    this.templateSetter.bindTemplateSelect('#templates-select');
    // TemplateSetter инициализирован
  } catch (error) {
    // Ошибка инициализации TemplateSetter
  }
}

  /**
   * Инициализирует аудио систему
   */
  async initAudioSystem() {
    try {
      // Устанавливаем колбэки для аудио системы
      this.audioController.setOnLoadProgress((progress) => {
        // Загрузка аудио
      });
      
      this.audioController.setOnLoadComplete(() => {
        // Аудио система загружена и готова к работе
      });
      
      this.audioController.setOnError((error) => {
        // Ошибка аудио системы
        this.showError(`Ошибка аудио системы: ${error.message}`);
      });
      
      this.audioController.setOnPlayStart(() => {
        this.settings.isPlaying = true;
        
        // Обновляем кнопку воспроизведения
        this.updateToggleBtn(true);
        
        if (this.callbacks.onPlaybackStart) {
          this.callbacks.onPlaybackStart();
        }
      });
      
      this.audioController.setOnPlayStop(() => {
        this.settings.isPlaying = false;
        
        // Обновляем кнопку воспроизведения
        this.updateToggleBtn(false);
        
        if (this.callbacks.onPlaybackStop) {
          this.callbacks.onPlaybackStop();
        }
      });
      
      this.audioController.setOnBeat((barIndex, beatIndex, chordData) => {
        // Обновляем визуальное отображение текущего удара
        this.updateCurrentBeat(barIndex, beatIndex);
      });
      
      // Инициализируем аудио систему с необходимыми зависимостями
      await this.audioController.init({
        chordParser: this.chordParser,
        chordBuilder: this.chordBuilder,
        tempoManager: this.tempoManager
      });
      
      // Устанавливаем начальную громкость
      this.audioController.setVolume(this.settings.audioVolume);
      
    } catch (error) {
      // Ошибка инициализации аудио системы
      this.showError(`Ошибка инициализации аудио системы: ${error.message}`);
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
    
    // Обработчик кнопки toggleBtn (основная кнопка воспроизведения)
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.settings.isPlaying) {
          this.stopAudioPlayback();
        } else {
          this.startAudioPlayback();
        }
      });
    }
    
    // Обработчик ползунка громкости
    const volumeSlider = document.getElementById('audioVolumeSlider');
    const volumeLabel = document.getElementById('audioVolumeLabel');
    
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value) / 100;
        this.setAudioVolume(volume);
        
        // Обновляем метку
        if (volumeLabel) {
          volumeLabel.textContent = e.target.value + '%';
        }
      });
      
      // Устанавливаем начальное значение
      volumeSlider.value = this.settings.audioVolume * 100;
      
      // Обновляем метку
      if (volumeLabel) {
        volumeLabel.textContent = Math.round(this.settings.audioVolume * 100) + '%';
      }
    }

    // Обработчик кнопки "Политика конфиденциальности"
    const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
    if (privacyPolicyBtn) {
      privacyPolicyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPrivacyPolicy();
      });
    }

    // Обработчик кнопки "Условия использования"
    const termsOfUseBtn = document.getElementById('termsOfUseBtn');
    if (termsOfUseBtn) {
      termsOfUseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showTermsOfUse();
      });
    }
  }

  /**
   * Парсит начальные аккорды из поля ввода
   */
  parseInitialChords() {
    if (!this.domElements.chordsInput) {
      return;
    }

    const chordsString = this.domElements.chordsInput.value;
    // Всегда вызываем обработчик, даже для пустой строки
    this.handleChordsInputChange(chordsString || '');
  }

  /**
   * Обрабатывает изменение поля аккордов
   * @param {string} chordsString - Строка с аккордами
   */
  handleChordsInputChange(chordsString) {
    // Включаем сохранение состояний стрелочек при изменении аккордов
    if (this.arrowDisplay) {
      this.arrowDisplay.setPreservePlayStatuses(true);
    }
    
    // Обновляем парсер аккордов
    this.chordParser.updateChords(chordsString, this.settings.beatCount, this.settings.chordChanges);
    
    // Получаем статистику парсинга
    const stats = this.chordParser.getStats();
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
      this.settings.bpm = bpm;
      this.saveData();
    }
  }

  /**
   * Обрабатывает изменение темпа через TempoManager
   * @param {number} bpm - Темп в ударах в минуту
   */
  handleTempoChange(bpm) {
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
      return;
    }

    // Если нет тактов, пытаемся получить аккорды напрямую из парсера
    if (this.bars.length === 0) {
      const validChords = this.chordParser.getValidChords();
      if (validChords.length > 0) {
        const currentChord = validChords[0].name;
        const nextChord = validChords.length > 1 ? validChords[1].name : null;
        this.chordDisplay.updateDisplay(currentChord, nextChord);
        // Отображение аккордов из парсера
        return;
      } else {
        this.chordDisplay.clear();
        return;
      }
    }

    // Получаем текущий такт из навигации
    let currentBar = null;
    const currentBarIndex = this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0;

    if (this.bars.length > 0 && currentBarIndex < this.bars.length) {
      currentBar = this.bars[currentBarIndex];
      // Используем такт с аккордом
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

    if (currentBarIndex + 1 < this.bars.length) {
      const nextBar = this.bars[currentBarIndex + 1];
      nextChord = nextBar.getChordForBeat(0);
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
    } else {
      // Используем BarSequenceBuilder для создания тактов
      this.barSequenceBuilder.beatCount = this.settings.beatCount;
      const chordNames = validChords.map(chord => chord.name);
      this.bars = this.barSequenceBuilder.buildFromChordArray(chordNames);
    }

    // Обновляем навигацию по тактам
    this.barNavigation.setTotalBars(this.bars.length);
    this.barNavigation.setCurrentBarIndex(0);
  }

  /**
   * Обрабатывает смену такта
   * @param {number} barIndex - Индекс нового такта
   * @param {Bar} bar - Объект такта
   */
  handleBarChange(barIndex, bar) {
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
    // Синхронизируем с BarDisplay если он инициализирован
    if (this.barDisplay && this.domElements.barContainer) {
      this.barDisplay.goToBar(barIndex);
    }
    
    // Принудительно обновляем отображение аккордов
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
    this.settings.isPlaying = true;
    if (this.callbacks.onPlaybackStart) {
      this.callbacks.onPlaybackStart();
    }
  }

  /**
   * Обрабатывает остановку воспроизведения
   */
  handlePlaybackStop() {
    this.settings.isPlaying = false;
    if (this.callbacks.onPlaybackStop) {
      this.callbacks.onPlaybackStop();
    }
  }

  /**
   * Начинает воспроизведение с аудио
   */
  startAudioPlayback() {
    if (!this.audioController || !this.audioController.isInitialized) {
      this.showError('Аудио система не инициализирована');
      return;
    }
    
    try {
      // Убедимся, что такты содержат правильные статусы из ArrowDisplay
      this.syncBarsWithArrowDisplay();
      
      this.audioController.startPlayback({
        beatCount: this.settings.beatCount,
        bars: this.bars
      });
    } catch (error) {
      // Ошибка начала воспроизведения
      this.showError(`Ошибка начала воспроизведения: ${error.message}`);
    }
  }

  /**
   * Синхронизирует статусы в тактах с текущими состояниями ArrowDisplay
   */
  syncBarsWithArrowDisplay() {
    if (!this.arrowDisplay || !this.bars || this.bars.length === 0) {
      return;
    }
    
    // Получаем текущие статусы из ArrowDisplay
    const arrowStatuses = this.arrowDisplay.getAllPlayStatuses();
    
    // Обновляем статусы в текущем такте
    const currentBarIndex = this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0;
    if (currentBarIndex < this.bars.length) {
      const currentBar = this.bars[currentBarIndex];
      
      arrowStatuses.forEach((playStatus, beatIndex) => {
        if (beatIndex < currentBar.beatUnits.length) {
          currentBar.setBeatPlayStatus(beatIndex, playStatus);
        }
      });
    }
  }

  /**
   * Останавливает воспроизведение с аудио
   */
  stopAudioPlayback() {
    if (this.audioController) {
      this.audioController.stopPlayback();
    }
  }

  /**
   * Обновляет текущий удар в интерфейсе
   * @param {number} barIndex - Индекс такта
   * @param {number} beatIndex - Индекс удара
   */
  updateCurrentBeat(barIndex, beatIndex) {
    // Обновляем навигацию по тактам
    if (this.barNavigation) {
      this.barNavigation.setCurrentBarIndex(barIndex);
    }
    
    // Обновляем отображение стрелочек - подсвечиваем текущую
    if (this.arrowDisplay) {
      this.arrowDisplay.setCurrentBeat(beatIndex);
      
      // Добавляем небольшую задержку для визуального эффекта
      setTimeout(() => {
        if (this.arrowDisplay) {
          this.arrowDisplay.clearCurrentBeatHighlight();
        }
      }, 200); // Подсветка на 200мс
    }
  }

  /**
   * Устанавливает громкость аудио
   * @param {number} volume - Громкость от 0 до 1
   */
  setAudioVolume(volume) {
    this.settings.audioVolume = Math.max(0, Math.min(1, volume));
    
    if (this.audioController) {
      this.audioController.setVolume(this.settings.audioVolume);
    }
    
    this.saveData();
  }

  /**
   * Получает текущую громкость аудио
   * @returns {number} Текущая громкость
   */
  getAudioVolume() {
    return this.settings.audioVolume;
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
    // Здесь можно добавить логику для обновления тактов или других компонентов
    // Например, обновить текущий такт с новыми состояниями воспроизведения
    if (this.bars && this.bars.length > 0 && this.barNavigation) {
      const currentBarIndex = this.barNavigation.getCurrentBarIndex();
      if (currentBarIndex >= 0 && currentBarIndex < this.bars.length) {
        const currentBar = this.bars[currentBarIndex];
        currentBar.setBeatPlayStatus(index, playStatus);
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
    } catch (error) {
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
      
    } catch (error) {
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

      // Показываем краткую информацию пользователю
      this.showNotification(
        `Случайный бой сгенерирован! Играющих долей: ${analysis.playCount}/${analysis.total}`
      );
      
    } catch (error) {
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
        // Загружаем и применяем шаблон
        const templateData = await this.templateManager.loadTemplate(templateId);
        await this.templateManager.applyTemplate(templateData);
        
        this.showNotification(`Шаблон "${templateData.templateInfo?.name || templateId}" применён`);
      }
      
    } catch (error) {
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
      this.showError(`Ошибка сохранения шаблона: ${error.message}`);
    }
  }

  /**
   * Показывает ошибку пользователю (дублированный метод - удалить)
   * @param {string} error - Сообщение об ошибке
   */
  // showError(error) {
  //   // Можно расширить для показа в UI
  //   if (typeof window !== 'undefined' && window.alert) {
  //     window.alert(`Ошибка: ${error}`);
  //   }
  // }

  /**
   * Обновляет состояние кнопки toggleBtn
   * @param {boolean} isPlaying - Состояние воспроизведения
   */
  updateToggleBtn(isPlaying) {
    const toggleBtn = document.getElementById('toggleBtn');
    if (!toggleBtn) return;
    
    if (isPlaying) {
      // Изменяем иконку на паузу
      toggleBtn.innerHTML = `
        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
      toggleBtn.classList.remove('bg-[#38e07b]');
      toggleBtn.classList.add('bg-red-600');
    } else {
      // Изменяем иконку на play
      toggleBtn.innerHTML = `
        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      `;
      toggleBtn.classList.remove('bg-red-600');
      toggleBtn.classList.add('bg-[#38e07b]');
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

// Глобальные функции для тестирования аудио
window.testAudioNote = async function(noteName) {
  const app = GuitarCombatApp.getInstance();
  if (app.audioController) {
    try {
      await app.audioController.testNote(noteName);
    } catch (error) {
      // Ошибка тестирования ноты
    }
  }
};

window.testAudioChord = async function(chordName) {
  const app = GuitarCombatApp.getInstance();
  if (app.audioController) {
    try {
      await app.audioController.testChord(chordName);
    } catch (error) {
      // Ошибка тестирования аккорда
    }
  }
};

window.getAvailableNotes = function() {
  const app = GuitarCombatApp.getInstance();
  if (app.audioController) {
    return app.audioController.getAvailableTestNotes();
  }
  return [];
};

window.getAudioStatus = function() {
  const app = GuitarCombatApp.getInstance();
  if (app.audioController) {
    return app.audioController.getLoadStatus();
  }
  return null;
};

// Тестовые функции для отладки воспроизведения
window.testPlayback = function() {
  const app = GuitarCombatApp.getInstance();
  if (app.audioController && app.audioController.isInitialized) {
    // Тестовое воспроизведение
    try {
      app.startAudioPlayback();
    } catch (error) {
      // Ошибка тестового воспроизведения
    }
  } else {
    // Аудио система не инициализирована
  }
};

window.testMuteSound = function() {
  const app = GuitarCombatApp.getInstance();
  if (app.audioController && app.audioController.audioEngine && app.audioController.audioEngine.noteManager) {
    // Тестирование звука приглушения
    try {
      app.audioController.audioEngine.noteManager.playMute();
    } catch (error) {
      // Ошибка тестирования приглушения
    }
  } else {
    // Аудио система не инициализирована
  }
};

window.getBarsInfo = function() {
  const app = GuitarCombatApp.getInstance();
  if (app.bars && app.bars.length > 0) {
    // Информация о тактах
    app.bars.forEach((bar, index) => {
      // Информация о такте
    });
  } else {
    // Такты не найдены
  }
};

window.getArrowDisplayInfo = function() {
  const app = GuitarCombatApp.getInstance();
  if (app.arrowDisplay) {
    // Информация о стрелочках
  } else {
    // ArrowDisplay не найден
  }
};
