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
      
      // Загрузка сохраненных данных
      this.loadSavedData();
      
      // Первоначальное обновление интерфейса с установкой правильных статусов
      // Первая стрелка - PLAY, остальные - SKIP
      this.updateDisplay(false);
      
      // Парсинг начальных аккордов из поля ввода
      this.parseInitialChords();
      
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.showError('Ошибка инициализации приложения: ' + error.message);
    }
  }

  /**
   * Инициализирует DOM элементы
   */
  initDOMElements() {
    try {
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
        console.warn('Отсутствуют опциональные DOM элементы:', missingOptionalElements.join(', '));
      }
    } catch (error) {
      console.error('Ошибка инициализации DOM элементов:', error);
      throw error; // Пробрасываем ошибку дальше, чтобы прервать инициализацию
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
    console.log('✅ TemplateSetter инициализирован');
  } catch (error) {
    console.error('❌ Ошибка инициализации TemplateSetter:', error);
  }
}

  /**
   * Инициализирует компоненты
   */
  initComponents() {
    try {
      // Инициализация модальных окон
      if (this.modal) {
        this.modal.init();
      }
      if (this.privacyModal) {
        this.privacyModal.init();
      }
      if (this.termsModal) {
        this.termsModal.init();
      }
      
      // Инициализация отображения тактов (если есть контейнер)
      if (this.domElements.barContainer && this.barDisplay) {
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
      }
      
      // Инициализация отображения стрелочек
      if (this.arrowDisplay) {
        this.arrowDisplay.init('#beatRow', '#countSelect');
        
        // Устанавливаем callback для изменения состояний воспроизведения
        this.arrowDisplay.setOnPlayStatusChange((index, playStatus) => {
          this.handlePlayStatusChange(index, playStatus);
        });
        
        // Устанавливаем callback для клика по длительности с полной информацией
        this.arrowDisplay.setOnBeatClick((beatInfo) => {
          this.handleBeatClick(beatInfo);
        });
        
        // Устанавливаем сохранение состояний по умолчанию
        this.arrowDisplay.setPreservePlayStatuses(true);
      }
      
      // Инициализация отображения аккордов
      if (this.chordDisplay) {
        this.chordDisplay.init('#chordDisplay');
      }
      
      // Инициализация навигации по тактам
      if (this.barNavigation) {
        this.barNavigation.init();
        
        // Настройка колбэков для BarNavigation
        this.barNavigation.setOnBarChange((barIndex) => {
          this.handleBarNavigationChange(barIndex);
        });
      }
    } catch (error) {
      console.error('Ошибка инициализации компонентов:', error);
      throw error; // Пробрасываем ошибку дальше, чтобы прервать инициализацию
    }
  }

  /**
   * Привязывает события к DOM элементам
   */
  bindEvents() {
    // Обработчик изменения поля аккордов (постоянный парсинг)
    if (this.domElements.chordsInput) {
      // Обработчик для предотвращения ввода недопустимых символов
      this.domElements.chordsInput.addEventListener('keydown', (e) => {
        // Разрешаем специальные клавиши (Backspace, Delete, Tab, Escape, Enter, стрелки)
        const specialKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        
        if (specialKeys.includes(e.key)) {
          return; // Разрешаем специальные клавиши
        }
        
        // Разрешаем Ctrl/Cmd + A (выделить всё), Ctrl/Cmd + C (копировать), Ctrl/Cmd + V (вставить), Ctrl/Cmd + X (вырезать)
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
          return; // Разрешаем стандартные комбинации клавиш
        }
        
        // Проверяем, является ли вводимый символ допустимым
        const validCharPattern = /^[A-Za-z0-9+\-\/#\u0394o\u00D8\s]$/;
        if (!validCharPattern.test(e.key)) {
          e.preventDefault(); // Предотвращаем ввод недопустимого символа
          // Добавляем визуальную индикацию ошибки
          this.domElements.chordsInput.classList.add('input-invalid');
          // Удаляем класс через короткое время
          setTimeout(() => {
            this.domElements.chordsInput.classList.remove('input-invalid');
          }, 300);
        }
      });
      
      // Обработчик для фильтрации вставляемого текста
      this.domElements.chordsInput.addEventListener('paste', (e) => {
        // Получаем вставляемый текст
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        
        // Фильтруем недопустимые символы
        const validChordPattern = /^[A-Za-z0-9+\-\/#\u0394o\u00D8\s]*$/;
        const filteredText = pastedText.replace(/[^A-Za-z0-9+\-\/#\u0394o\u00D8\s]/g, '');
        
        // Если в вставляемом тексте есть недопустимые символы
        if (pastedText !== filteredText) {
          e.preventDefault(); // Предотвращаем стандартную вставку
          
          // Добавляем визуальную индикацию ошибки
          this.domElements.chordsInput.classList.add('input-invalid');
          // Удаляем класс через короткое время
          setTimeout(() => {
            this.domElements.chordsInput.classList.remove('input-invalid');
          }, 300);
          
          // Вставляем отфильтрованный текст
          const input = e.target;
          const start = input.selectionStart;
          const end = input.selectionEnd;
          
          // Вставляем отфильтрованный текст
          input.value = input.value.substring(0, start) + filteredText + input.value.substring(end);
          
          // Восстанавливаем позицию курсора
          const newPosition = start + filteredText.length;
          input.setSelectionRange(newPosition, newPosition);
          
          // Вызываем обработчик изменения
          this.handleChordsInputChange(input.value);
        }
      });
      
      // Обработчик для валидации ввода (вставка из буфера обмена и т.д.)
      this.domElements.chordsInput.addEventListener('input', (e) => {
        // Валидация ввода - разрешаем только символы аккордов
        const validChordPattern = /^[A-Za-z0-9+\-\/#\u0394o\u00D8\s]*$/;
        const inputValue = e.target.value;
        
        if (!validChordPattern.test(inputValue)) {
          // Добавляем визуальную индикацию ошибки
          e.target.classList.add('input-invalid');
          // Удаляем класс через короткое время
          setTimeout(() => {
            e.target.classList.remove('input-invalid');
          }, 300);
          
          // Заменяем недопустимые символы на пустую строку
          e.target.value = inputValue.replace(/[^A-Za-z0-9+\-\/#\u0394o\u00D8\s]/g, '');
        }
        
        this.handleChordsInputChange(e.target.value);
      });
      
      // Дополнительный обработчик для изменения (на случай если input не сработает)
      this.domElements.chordsInput.addEventListener('change', (e) => {
        // Валидация ввода
        const validChordPattern = /^[A-Za-z0-9+\-\/#\u0394o\u00D8\s]*$/;
        const inputValue = e.target.value;
        
        if (!validChordPattern.test(inputValue)) {
          // Заменяем недопустимые символы на пустую строку
          e.target.value = inputValue.replace(/[^A-Za-z0-9+\-\/#\u0394o\u00D8\s]/g, '');
        }
        
        this.handleChordsInputChange(e.target.value);
      });
      
      // Обработчик для обновления при потере фокуса
      this.domElements.chordsInput.addEventListener('blur', (e) => {
        // Валидация ввода
        const validChordPattern = /^[A-Za-z0-9+\-\/#\u0394o\u00D8\s]*$/;
        const inputValue = e.target.value;
        
        if (!validChordPattern.test(inputValue)) {
          // Заменяем недопустимые символы на пустую строку
          e.target.value = inputValue.replace(/[^A-Za-z0-9+\-\/#\u0394o\u00D8\s]/g, '');
        }
        
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
    try {
      if (!this.domElements.chordsInput) {
        return;
      }

      const chordsString = this.domElements.chordsInput.value;
      // При первоначальном парсинге не сохраняем предыдущие статусы, чтобы установить правильные: первая стрелка - PLAY, остальные - SKIP
      // Вызываем createBarsFromChords напрямую, чтобы избежать двойного сохранения статусов
      this.chordParser.updateChords(chordsString || '', this.settings.beatCount, this.settings.chordChanges);
      this.createBarsFromChords(); // Не передаем сохраненные статусы при первоначальной загрузке
      
      // Обновляем отображение аккордов
      this.updateChordDisplay();
      
      // Обновляем отображение без сохранения статусов (установим стандартные)
      this.updateDisplay(false);
      
      // Убедимся, что установлены правильные статусы
      if (this.arrowDisplay) {
        this.arrowDisplay.initializePlayStatuses();
        this.arrowDisplay.updateDisplay();
      }
    } catch (error) {
      console.error('Ошибка парсинга начальных аккордов:', error);
    }
  }

  /**
   * Обрабатывает изменение поля аккордов
   * @param {string} chordsString - Строка с аккордами
   */
  handleChordsInputChange(chordsString) {
    try {
      console.log('🔄 handleChordsInputChange: получена строка аккордов:', chordsString);
      
      // Сохраняем текущие статусы стрелочек перед обновлением
      let savedStatuses = null;
      if (this.arrowDisplay) {
        savedStatuses = this.arrowDisplay.saveCurrentPlayStatuses();
      }
      
      // Сохраняем текущий индекс такта перед созданием новых тактов
      const currentBarIndex = this.barNavigation ? this.barNavigation.getCurrentBarIndex() : 0;
      console.log('🔄 Сохранен текущий индекс такта:', currentBarIndex);
      
      // Обновляем парсер аккордов
      this.chordParser.updateChords(chordsString, this.settings.beatCount, this.settings.chordChanges);
      
      // Получаем статистику парсинга
      const stats = this.chordParser.getStats();
      console.log('🔄 Статистика парсинга аккордов:', stats);
      
      // Получаем валидные аккорды для отладки
      const validChords = this.chordParser.getValidChords();
      console.log('🔄 Валидные аккорды после парсинга:', validChords.map(chord => chord.name));
      
      // Создаем такты на основе аккордов, передавая сохраненные статусы и индекс такта
      this.createBarsFromChords(savedStatuses, currentBarIndex);
      
      console.log('🔄 Количество тактов после создания:', this.bars.length);
      
      // Обновляем отображение аккордов
      this.updateChordDisplay();
      
      // Обновляем отображение с восстановлением сохраненных статусов
      this.updateDisplay(true);
      
      // Сохраняем данные
      this.saveData();
      
      // Вызываем колбэк
      if (this.callbacks.onChordsChange) {
        this.callbacks.onChordsChange(chordsString, stats);
      }
    } catch (error) {
      console.error('Ошибка обработки изменения аккордов:', error);
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
      
      // Сохраняем текущие статусы перед изменением количества долей
      let savedStatuses = null;
      if (this.arrowDisplay) {
        savedStatuses = this.arrowDisplay.saveCurrentPlayStatuses();
      }
      
      // При явном изменении количества долей устанавливаем стандартные статусы
      // Первая стрелка - PLAY, остальные - SKIP
      if (this.arrowDisplay) {
        this.arrowDisplay.setArrowCount(beatCount, false);
      }
      
      // Пересоздаем такты с новым количеством долей, передавая сохраненные статусы
      this.createBarsFromChords(savedStatuses);
      this.updateDisplay(false);
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

    console.log(`🎵 Обновление отображения аккордов: ${this.bars.length} тактов`);

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

    console.log(`🎵 Текущий индекс такта: ${currentBarIndex}, всего тактов: ${this.bars.length}`);

    if (this.bars.length > 0 && currentBarIndex < this.bars.length) {
      currentBar = this.bars[currentBarIndex];
      const chordForBeat = currentBar.getChordForBeat(0);
      console.log('🎵 Используем такт:', currentBarIndex, 'с аккордом:', chordForBeat);
    } else {
      console.warn('🎵 Некорректный индекс такта:', currentBarIndex, 'всего тактов:', this.bars.length);
    }
    
    if (!currentBar) {
      this.chordDisplay.clear();
      return;
    }

    // Получаем аккорды из текущего такта
    const currentBarChords = this.getChordsFromBar(currentBar);
    const currentChord = currentBarChords.current;
    const nextChord = currentBarChords.next;

    console.log('🎵 Аккорды для отображения:', { currentChord, nextChord });

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
   * @param {Array} savedStatuses - Сохраненные статусы воспроизведения (опционально)
   * @param {number} preservedBarIndex - Сохраненный индекс такта (опционально)
   */
  createBarsFromChords(savedStatuses = null, preservedBarIndex = null) {
    try {
      // Сохраняем текущие статусы из существующих тактов перед созданием новых
      const currentStatuses = this.getCurrentBarsPlayStatuses();
      
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

      // Восстанавливаем статусы воспроизведения в новых тактах
      // Приоритет: savedStatuses (из handleChordsInputChange) > currentStatuses (из существующих тактов)
      const statusesToRestore = savedStatuses || currentStatuses;
      if (statusesToRestore && statusesToRestore.length > 0) {
        this.restorePlayStatusesToBars(statusesToRestore);
      }

      // Обновляем навигацию по тактам
      if (this.barNavigation) {
        const oldTotalBars = this.barNavigation.getTotalBars();
        const newTotalBars = this.bars.length;
        
        this.barNavigation.setTotalBars(newTotalBars);
        
        // Используем сохраненный индекс такта, если он передан
        if (preservedBarIndex !== null && preservedBarIndex >= 0) {
          // Проверяем, что индекс не выходит за пределы нового количества тактов
          const targetIndex = Math.min(preservedBarIndex, newTotalBars - 1);
          this.barNavigation.setCurrentBarIndex(targetIndex);
          console.log(`🔄 Восстановлен сохраненный индекс такта: ${targetIndex} из ${newTotalBars} (было: ${preservedBarIndex})`);
        } else {
          // Если сохраненный индекс не передан, используем текущую логику
          // Если количество тактов увеличилось, и мы были на последнем такте,
          // остаемся на том же индексе (теперь это не последний такт)
          if (newTotalBars > oldTotalBars && this.barNavigation.getCurrentBarIndex() === oldTotalBars - 1) {
            // Не меняем текущий индекс, так как пользователь может захотеть перейти к новому такту
            console.log(`🔄 Увеличено количество тактов с ${oldTotalBars} до ${newTotalBars}, текущий индекс: ${this.barNavigation.getCurrentBarIndex()}`);
          } else {
            // Иначе устанавливаем первый такт
            this.barNavigation.setCurrentBarIndex(0);
            console.log(`🔄 Установлено количество тактов: ${newTotalBars}, текущий индекс: 0`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка создания тактов из аккордов:', error);
      // Создаем один пустой такт в случае ошибки
      this.bars = [new Bar(0, this.settings.beatCount)];
      
      // Обновляем навигацию по тактам
      if (this.barNavigation) {
        this.barNavigation.setTotalBars(this.bars.length);
        this.barNavigation.setCurrentBarIndex(0);
      }
    }
  }

  /**
   * Получает текущие статусы воспроизведения из всех тактов
   * @returns {Array} Массив статусов воспроизведения для каждого такта
   */
  getCurrentBarsPlayStatuses() {
    const statuses = [];
    
    if (this.bars && this.bars.length > 0) {
      this.bars.forEach(bar => {
        const barStatuses = [];
        if (bar.beatUnits && bar.beatUnits.length > 0) {
          bar.beatUnits.forEach(beatUnit => {
            const playStatus = beatUnit.getPlayStatus();
            if (playStatus) {
              barStatuses.push(playStatus.toJSON());
            } else {
              // Если у BeatUnit нет PlayStatus, создаем стандартный
              barStatuses.push({ status: 0 }); // SKIP по умолчанию
            }
          });
        }
        statuses.push(barStatuses);
      });
    }
    
    return statuses;
  }

  /**
   * Восстанавливает статусы воспроизведения в тактах
   * @param {Array} statusesArray - Массив статусов для каждого такта
   */
  restorePlayStatusesToBars(statusesArray) {
    if (!Array.isArray(statusesArray) || statusesArray.length === 0) {
      return;
    }
    
    this.bars.forEach((bar, barIndex) => {
      if (barIndex < statusesArray.length && bar.beatUnits) {
        const barStatuses = statusesArray[barIndex];
        
        if (Array.isArray(barStatuses)) {
          barStatuses.forEach((statusData, beatIndex) => {
            if (beatIndex < bar.beatUnits.length) {
              const beatUnit = bar.beatUnits[beatIndex];
              let playStatus;
              
              if (typeof statusData === 'object' && statusData !== null) {
                // Восстанавливаем из JSON
                playStatus = PlayStatus.fromJSON(statusData);
              } else if (typeof statusData === 'number') {
                // Создаем из числа
                playStatus = new PlayStatus(statusData);
              } else {
                // Создаем стандартный статус
                playStatus = new PlayStatus(beatIndex === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP);
              }
              
              beatUnit.setPlayStatus(playStatus);
            }
          });
        }
      }
    });
    
    console.log(`🔄 Восстановлены статусы воспроизведения для ${this.bars.length} тактов`);
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
   * Обновляет отображение
   * @param {boolean} preserveArrowStatuses - Сохранять ли состояния стрелочек (опционально)
   */
  updateDisplay(preserveArrowStatuses = true) {
    try {
      console.log(`🔄 Обновление отображения: ${this.bars.length} тактов, preserveArrowStatuses=${preserveArrowStatuses}`);
      
      // Обновляем отображение тактов (если инициализирован)
      if (this.barDisplay && this.domElements.barContainer) {
        this.barDisplay.setBars(this.bars);
      }
      
      // Обновляем навигацию по тактам
      if (this.barNavigation) {
        const oldTotalBars = this.barNavigation.getTotalBars();
        const newTotalBars = this.bars.length;
        this.barNavigation.setTotalBars(newTotalBars);
        
        if (oldTotalBars !== newTotalBars) {
          console.log(`🔄 Обновлено количество тактов в навигации: ${oldTotalBars} → ${newTotalBars}`);
        }
      }
      
      // Обновляем отображение стрелочек с BeatUnit из текущего такта
      if (this.arrowDisplay) {
        this.updateArrowDisplayWithCurrentBar(preserveArrowStatuses);
      }
      
      // Обновляем отображение аккордов
      this.updateChordDisplay();
      
      // Обновляем информацию о состоянии
      this.updateStatusInfo();
    } catch (error) {
      console.error('Ошибка обновления отображения:', error);
    }
  }

  /**
   * Обновляет отображение стрелочек с BeatUnit из текущего такта
   * @param {boolean} preserveArrowStatuses - Сохранять ли состояния стрелочек
   */
  updateArrowDisplayWithCurrentBar(preserveArrowStatuses = true) {
    try {
      if (this.bars && this.bars.length > 0 && this.barNavigation) {
        const currentBarIndex = this.barNavigation.getCurrentBarIndex();
        if (currentBarIndex >= 0 && currentBarIndex < this.bars.length) {
          const currentBar = this.bars[currentBarIndex];
          
          // Устанавливаем BeatUnit из текущего такта
          if (currentBar.beatUnits && this.arrowDisplay) {
            // Сохраняем текущие статусы перед обновлением
            const savedStatuses = preserveArrowStatuses ? this.arrowDisplay.saveCurrentPlayStatuses() : null;
            
            this.arrowDisplay.setBeatUnits(currentBar.beatUnits);
            this.arrowDisplay.setCurrentBarIndex(currentBarIndex);
            
            // Восстанавливаем сохраненные статусы если нужно
            if (preserveArrowStatuses && savedStatuses) {
              this.arrowDisplay.restorePlayStatuses(savedStatuses);
              this.arrowDisplay.updateDisplay();
            }
            
            console.log(`🔄 Обновлено отображение стрелочек для такта ${currentBarIndex + 1} с ${currentBar.beatUnits.length} долей`);
          }
          
          return;
        }
      }
      
      // Если нет тактов, используем стандартное поведение
      if (this.arrowDisplay) {
        // При инициализации всегда устанавливаем правильные статусы: первая стрелка - PLAY, остальные - SKIP
        this.arrowDisplay.setArrowCount(this.settings.beatCount, false);
        console.log(`🔄 Установлено стандартное количество стрелочек: ${this.settings.beatCount}`);
      }
    } catch (error) {
      console.error('Ошибка обновления отображения стрелочек:', error);
      // Если произошла ошибка, используем стандартное поведение
      if (this.arrowDisplay) {
        // При инициализации всегда устанавливаем правильные статусы: первая стрелка - PLAY, остальные - SKIP
        this.arrowDisplay.setArrowCount(this.settings.beatCount, false);
      }
    }
  }

  /**
   * Обрабатывает изменение состояния воспроизведения
   * @param {number} index - Индекс стрелочки
   * @param {PlayStatus} playStatus - Новое состояние воспроизведения
   */
  handlePlayStatusChange(index, playStatus) {
    // Обновляем текущий такт с новым состоянием
    if (this.bars && this.bars.length > 0 && this.barNavigation) {
      const currentBarIndex = this.barNavigation.getCurrentBarIndex();
      if (currentBarIndex >= 0 && currentBarIndex < this.bars.length) {
        const currentBar = this.bars[currentBarIndex];
        currentBar.setBeatPlayStatus(index, playStatus);
      }
    }
  }

  /**
   * Обрабатывает клик по длительности с полной информацией
   * @param {Object} beatInfo - Полная информация о длительности
   */
  handleBeatClick(beatInfo) {
    console.log('🎯 Клик по длительности:', beatInfo);
    
    // Обновляем текущий такт с новым состоянием
    if (this.bars && this.bars.length > 0) {
      const currentBarIndex = this.barNavigation.getCurrentBarIndex();
      if (currentBarIndex >= 0 && currentBarIndex < this.bars.length) {
        const currentBar = this.bars[currentBarIndex];
        currentBar.setBeatPlayStatus(beatInfo.beatIndex, beatInfo.playStatus);
      }
    }
    
    // Показываем информацию пользователю (для отладки)
    const chordInfo = beatInfo.chord ? `Аккорд: ${beatInfo.chord.name}` : 'Нет аккорда';
    const syllableInfo = beatInfo.syllable ? `Слог: "${beatInfo.syllable.text}"` : 'Нет слога';
    console.log(`🎵 Такт ${beatInfo.barIndex + 1}, Длительность ${beatInfo.beatIndex + 1}: ${chordInfo}, ${syllableInfo}`);
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
        chords: this.chordParser ? this.chordParser.toJSON() : null,
        bars: this.bars ? this.bars.map(bar => {
          try {
            return bar.toJSON();
          } catch (error) {
            console.error('Ошибка сериализации такта:', error);
            // Возвращаем базовый такт в случае ошибки
            return {
              barIndex: bar.barIndex || 0,
              beatCount: bar.beatCount || 4,
              beatUnits: [],
              chordChanges: [],
              lyricSyllables: []
            };
          }
        }) : [],
        tempoManager: this.tempoManager ? this.tempoManager.toJSON() : null,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('guitarCombatData', JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
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
        try {
          this.chordParser = ChordParser.fromJSON(data.chords);
        } catch (error) {
          console.error('Ошибка восстановления аккордов:', error);
          // Создаем новый парсер если восстановление не удалось
          this.chordParser = new ChordParser();
        }
      }
      
      // Восстанавливаем такты
      if (data.bars && Array.isArray(data.bars)) {
        try {
          this.bars = data.bars.map(barData => {
            try {
              return Bar.fromJSON(barData);
            } catch (error) {
              console.error('Ошибка восстановления такта:', error, barData);
              // Создаем пустой такт если восстановление не удалось
              return new Bar(0, this.settings.beatCount);
            }
          });
        } catch (error) {
          console.error('Ошибка восстановления массива тактов:', error);
          // Создаем один пустой такт если восстановление не удалось
          this.bars = [new Bar(0, this.settings.beatCount)];
        }
      }
      
      // Восстанавливаем состояние TempoManager
      if (data.tempoManager && this.tempoManager) {
        try {
          this.tempoManager.fromJSON(data.tempoManager);
        } catch (error) {
          console.error('Ошибка восстановления TempoManager:', error);
        }
      }
      
      // Обновляем поля ввода
      if (this.domElements.chordsInput && this.chordParser && this.chordParser.parsedChords && this.chordParser.parsedChords.length > 0) {
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
      
      // Устанавливаем правильные статусы: первая стрелка - PLAY, остальные - SKIP
      if (this.arrowDisplay) {
        if (this.bars.length === 0) {
          // Если нет тактов, инициализируем с правильными статусами
          this.arrowDisplay.initializePlayStatuses();
        } else if (this.bars.length > 0 && this.barNavigation) {
          // Если есть такты, обновляем отображение с правильными статусами
          const currentBarIndex = this.barNavigation.getCurrentBarIndex();
          if (currentBarIndex >= 0 && currentBarIndex < this.bars.length) {
            const currentBar = this.bars[currentBarIndex];
            if (currentBar.beatUnits) {
              this.arrowDisplay.setBeatUnits(currentBar.beatUnits);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки сохраненных данных:', error);
      // Очищаем localStorage если данные повреждены
      try {
        localStorage.removeItem('guitarCombatData');
      } catch (e) {
        console.error('Ошибка очистки localStorage:', e);
      }
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
    
    // Устанавливаем стандартные статусы: первая стрелка - PLAY, остальные - SKIP
    if (this.arrowDisplay) {
      this.arrowDisplay.initializePlayStatuses();
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
      // Получаем текущее количество стрелочек
      const currentCount = this.arrowDisplay.currentCount || 8;
      
      // Генерируем случайный бой
      const randomPlayStatuses = this.randomStrumGenerator.generateRandomStrum(currentCount);
      
      // Устанавливаем новые состояния в ArrowDisplay
      this.arrowDisplay.setAllPlayStatuses(randomPlayStatuses);
      
      // Анализируем сгенерированный бой
      const analysis = this.randomStrumGenerator.analyzeStrum(randomPlayStatuses);

      // Показываем краткую информацию пользователю
      this.showNotification(
        `Случайный бой сгенерирован! Играющих долей: ${analysis.playCount}/${analysis.total}`
      );
      
    } catch (error) {
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
