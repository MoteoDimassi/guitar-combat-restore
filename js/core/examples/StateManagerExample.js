import StateManager from '../StateManager.js';
import StateHooks from '../StateHooks.js';
import CommonMiddleware from '../StateMiddleware.js';

/**
 * Пример использования системы управления состоянием
 */
export class StateManagerExample {
  constructor() {
    // Создаем экземпляр StateManager
    this.stateManager = new StateManager({
      // Инициализируем с начальным состоянием
      on: (event, callback) => console.log(`Event: ${event}`),
      emit: (event, data) => console.log(`Emit: ${event}`, data),
    });

    // Создаем экземпляр StateHooks для удобного использования
    this.stateHooks = new StateHooks(this.stateManager);

    // Настраиваем middleware
    this.setupMiddleware();
  }

  /**
   * Настройка middleware
   */
  setupMiddleware() {
    // Добавляем middleware для логирования
    this.stateManager.use(CommonMiddleware.logger({
      logLevel: 'info',
      includeOldValue: true,
      filter: (path) => path.startsWith('settings') || path.startsWith('playback'),
    }));

    // Добавляем middleware для сохранения в localStorage
    this.stateManager.use(CommonMiddleware.localStorage({
      key: 'guitar_combat_state',
      debounceMs: 500,
      filter: (path) => !path.startsWith('ui'), // Не сохраняем UI состояние
    }));

    // Добавляем middleware для валидации
    this.stateManager.use(CommonMiddleware.validator({
      schema: {
        'settings.bpm': (value) => value >= 40 && value <= 300,
        'settings.beatCount': (value) => value >= 1 && value <= 16,
        'playback.currentBar': (value) => value >= 0,
      },
      strict: false,
    }));
  }

  /**
   * Пример базового использования StateManager
   */
  basicUsageExample() {
    console.log('=== Базовое использование StateManager ===');

    // Получение состояния
    const currentBPM = this.stateManager.getState('settings.bpm');
    console.log('Текущий BPM:', currentBPM);

    // Установка состояния
    this.stateManager.setState('settings.bpm', 140);
    console.log('Новый BPM:', this.stateManager.getState('settings.bpm'));

    // Обновление состояния через функцию
    this.stateManager.updateState('settings.volume.strum', (volume) => Math.min(100, volume + 10));
    console.log('Новая громкость перебора:', this.stateManager.getState('settings.volume.strum'));

    // Подписка на изменения
    const unsubscribe = this.stateManager.subscribe('settings.bpm', (newValue, oldValue) => {
      console.log(`BPM изменен с ${oldValue} на ${newValue}`);
    });

    // Изменяем значение, чтобы увидеть срабатывание подписки
    this.stateManager.setState('settings.bpm', 130);

    // Отписываемся
    unsubscribe();
  }

  /**
   * Пример использования StateHooks
   */
  stateHooksExample() {
    console.log('=== Использование StateHooks ===');

    // Использование хука useState
    const [arrowsCount, setArrowsCount, unsubscribe] = this.stateHooks.useState(
      'ui.arrowsCount',
      (value) => console.log('Количество стрелок изменено:', value)
    );

    console.log('Текущее количество стрелок:', arrowsCount);
    setArrowsCount(12);

    // Использование хука useForm
    const chordForm = this.stateHooks.useForm('chordInput', {
      chordName: '',
      chordType: 'major',
    });

    chordForm.setValue('chordName', 'C');
    chordForm.setValue('chordType', 'minor');
    console.log('Данные формы аккорда:', chordForm.getValues());

    // Использование хука useArray
    const barsArray = this.stateHooks.useArray('bars');
    barsArray.addItem({ id: 1, chords: ['C', 'G', 'Am', 'F'] });
    barsArray.addItem({ id: 2, chords: ['D', 'A', 'Bm', 'G'] });
    console.log('Такты:', barsArray.getArray());

    // Использование хука useHistory
    const history = this.stateHooks.useHistory();
    console.log('Можно отменить:', history.canUndo());
    console.log('Можно повторить:', history.canRedo());

    // Отмена последнего изменения
    history.undo();
    console.log('После отмены:', this.stateManager.getState('ui.arrowsCount'));

    // Повтор изменения
    history.redo();
    console.log('После повтора:', this.stateManager.getState('ui.arrowsCount'));
  }

  /**
   * Пример работы с аккордами
   */
  chordsExample() {
    console.log('=== Работа с аккордами ===');

    // Устанавливаем строку с аккордами
    this.stateManager.setState('chords.inputString', 'C G Am F Dm G C');

    // Парсим аккорды (в реальном приложении это будет делать сервис)
    const inputString = this.stateManager.getState('chords.inputString');
    const parsedChords = inputString.split(' ').filter(chord => chord.trim());
    
    // Разделяем на валидные и невалидные аккорды
    const validChords = parsedChords.filter(chord => 
      ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(chord.replace(/[mM]/g, ''))
    );
    const invalidChords = parsedChords.filter(chord => 
      !['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(chord.replace(/[mM]/g, ''))
    );

    this.stateManager.setState('chords.parsedChords', parsedChords);
    this.stateManager.setState('chords.validChords', validChords);
    this.stateManager.setState('chords.invalidChords', invalidChords);

    console.log('Распарсенные аккорды:', parsedChords);
    console.log('Валидные аккорды:', validChords);
    console.log('Невалидные аккорды:', invalidChords);

    // Создаем такты из аккордов
    const beatCount = this.stateManager.getState('settings.beatCount');
    const bars = [];
    
    for (let i = 0; i < validChords.length; i += beatCount) {
      bars.push({
        id: bars.length,
        chords: validChords.slice(i, i + beatCount),
      });
    }

    this.stateManager.setState('bars', bars);
    console.log('Созданные такты:', bars);
  }

  /**
   * Пример управления воспроизведением
   */
  playbackExample() {
    console.log('=== Управление воспроизведением ===');

    // Устанавливаем темп
    this.stateManager.setState('playback.tempo', 120);
    console.log('Темп воспроизведения:', this.stateManager.getState('playback.tempo'));

    // Начинаем воспроизведение
    this.stateManager.setState('playback.isPlaying', true);
    console.log('Состояние воспроизведения:', this.stateManager.getState('playback.isPlaying'));

    // Подписываемся на изменения воспроизведения
    this.stateManager.subscribe('playback.isPlaying', (isPlaying) => {
      if (isPlaying) {
        console.log('Начало воспроизведения');
        // Здесь можно запустить таймер для обновления текущего такта и доли
      } else {
        console.log('Остановка воспроизведения');
        // Здесь можно остановить таймер
      }
    });

    // Имитация изменения текущего такта и доли
    let currentBar = 0;
    let currentBeat = 0;
    const beatCount = this.stateManager.getState('settings.beatCount');
    const bars = this.stateManager.getState('bars');

    const interval = setInterval(() => {
      if (!this.stateManager.getState('playback.isPlaying')) {
        clearInterval(interval);
        return;
      }

      this.stateManager.setState('playback.currentBar', currentBar);
      this.stateManager.setState('playback.currentBeat', currentBeat);

      console.log(`Такт: ${currentBar + 1}, Доля: ${currentBeat + 1}`);

      currentBeat++;
      if (currentBeat >= beatCount) {
        currentBeat = 0;
        currentBar++;
        if (currentBar >= bars.length) {
          currentBar = 0; // Зацикливаем воспроизведение
        }
      }
    }, 1000); // Обновляем каждую секунду для примера

    // Останавливаем через 5 секунд для демонстрации
    setTimeout(() => {
      this.stateManager.setState('playback.isPlaying', false);
    }, 5000);
  }

  /**
   * Пример работы с шаблонами
   */
  templatesExample() {
    console.log('=== Работа с шаблонами ===');

    // Добавляем доступные шаблоны
    const availableTemplates = [
      { id: 1, name: 'Поп-песня', description: 'Простая поп-прогрессия' },
      { id: 2, name: 'Блюз', description: 'Классическая 12-тактовая блюзовая прогрессия' },
      { id: 3, name: 'Джаз', description: 'Джазовая гармония' },
    ];

    this.stateManager.setState('templates.available', availableTemplates);
    console.log('Доступные шаблоны:', availableTemplates);

    // Выбираем шаблон
    this.stateManager.setState('ui.selectedTemplate', 1);
    console.log('Выбранный шаблон:', this.stateManager.getState('ui.selectedTemplate'));

    // Подписываемся на изменение выбранного шаблона
    this.stateManager.subscribe('ui.selectedTemplate', (templateId) => {
      if (templateId) {
        console.log(`Загрузка шаблона с ID: ${templateId}`);
        // Здесь можно загрузить данные шаблона
        const template = availableTemplates.find(t => t.id === templateId);
        if (template) {
          // Добавляем в загруженные шаблоны
          const loadedTemplates = [...this.stateManager.getState('templates.loaded')];
          if (!loadedTemplates.find(t => t.id === templateId)) {
            loadedTemplates.push(template);
            this.stateManager.setState('templates.loaded', loadedTemplates);
          }
        }
      }
    });
  }

  /**
   * Пример сохранения и загрузки состояния
   */
  persistenceExample() {
    console.log('=== Сохранение и загрузка состояния ===');

    // Получаем текущее состояние в виде JSON
    const currentState = this.stateManager.toJSON();
    console.log('Текущее состояние:', currentState);

    // Создаем новое состояние и загружаем его
    const newState = {
      settings: {
        beatCount: 3,
        bpm: 100,
        isPlaying: false,
        volume: {
          strum: 70,
          metronome: 90,
        },
      },
      chords: {
        inputString: "Am F C G",
        parsedChords: ["Am", "F", "C", "G"],
        validChords: ["Am", "F", "C", "G"],
        invalidChords: [],
      },
      bars: [
        { id: 0, chords: ["Am", "F", "C"] },
        { id: 1, chords: ["G", "Am", "F"] },
      ],
    };

    this.stateManager.fromJSON(newState);
    console.log('После загрузки нового состояния:', this.stateManager.toJSON());

    // Сбрасываем состояние
    this.stateManager.reset();
    console.log('После сброса:', this.stateManager.toJSON());
  }

  /**
   * Запуск всех примеров
   */
  runAllExamples() {
    console.log('Запуск примеров использования StateManager\n');
    
    this.basicUsageExample();
    console.log('\n');
    
    this.stateHooksExample();
    console.log('\n');
    
    this.chordsExample();
    console.log('\n');
    
    this.templatesExample();
    console.log('\n');
    
    this.persistenceExample();
    console.log('\n');
    
    // Воспроизведение запускаем последним, так как оно асинхронное
    setTimeout(() => {
      this.playbackExample();
    }, 1000);
  }
}

// Экспортируем функцию для запуска примеров
export function runStateManagerExamples() {
  const example = new StateManagerExample();
  example.runAllExamples();
  return example;
}

export default StateManagerExample;