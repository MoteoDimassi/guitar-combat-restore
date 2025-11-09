import StateManager from '../../js/core/StateManager.js';
import StateHooks from '../../js/core/StateHooks.js';
import { CommonMiddleware } from '../../js/core/StateMiddleware.js';

// Мок EventBus для тестов
class MockEventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach((callback) => callback(data));
    }
  }

  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Метод для тестов
  getEventListeners(event) {
    return this.events.get(event) || [];
  }

  clear() {
    this.events.clear();
  }
}

describe('StateManager', () => {
  let stateManager;
  let eventBus;

  beforeEach(() => {
    eventBus = new MockEventBus();
    stateManager = new StateManager(eventBus);
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('Базовая функциональность', () => {
    test('должен инициализироваться с начальным состоянием', () => {
      const state = stateManager.getState();
      
      expect(state.settings.bpm).toBe(120);
      expect(state.settings.beatCount).toBe(4);
      expect(state.chords.inputString).toBe('');
      expect(state.bars).toEqual([]);
      expect(state.playback.isPlaying).toBe(false);
    });

    test('должен получать состояние по пути', () => {
      expect(stateManager.getState('settings.bpm')).toBe(120);
      expect(stateManager.getState('settings.volume.strum')).toBe(80);
      expect(stateManager.getState('chords.inputString')).toBe('');
    });

    test('должен устанавливать состояние по пути', async () => {
      await stateManager.setState('settings.bpm', 140);
      expect(stateManager.getState('settings.bpm')).toBe(140);

      await stateManager.setState('chords.inputString', 'C G Am F');
      expect(stateManager.getState('chords.inputString')).toBe('C G Am F');
    });

    test('должен обновлять состояние через функцию', async () => {
      await stateManager.updateState('settings.volume.strum', volume => volume + 10);
      expect(stateManager.getState('settings.volume.strum')).toBe(90);

      await stateManager.updateState('bars', bars => [...bars, { id: 1, chords: ['C', 'G'] }]);
      expect(stateManager.getState('bars')).toEqual([{ id: 1, chords: ['C', 'G'] }]);
    });

    test('должен генерировать событие при изменении состояния', async () => {
      const callback = jest.fn();
      eventBus.on('state:changed', callback);

      await stateManager.setState('settings.bpm', 140);

      expect(callback).toHaveBeenCalledWith({
        path: 'settings.bpm',
        value: 140,
        oldValue: 120,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Подписки', () => {
    test('должен подписываться на изменения состояния', async () => {
      const callback = jest.fn();
      const unsubscribe = stateManager.subscribe('settings.bpm', callback);

      await stateManager.setState('settings.bpm', 140);

      expect(callback).toHaveBeenCalledWith(140, 120, 'settings.bpm');

      unsubscribe();
      await stateManager.setState('settings.bpm', 150);

      // Callback не должен быть вызван после отписки
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('должен подписываться на несколько путей', async () => {
      const callback = jest.fn();
      const unsubscribe = stateManager.subscribeMultiple(
        ['settings.bpm', 'settings.beatCount'],
        callback
      );

      await stateManager.setState('settings.bpm', 140);
      expect(callback).toHaveBeenCalledWith(140, 120, 'settings.bpm');

      await stateManager.setState('settings.beatCount', 3);
      expect(callback).toHaveBeenCalledWith(3, 4, 'settings.beatCount');

      unsubscribe();
    });

    test('должен уведомлять подписчиков родительских путей', async () => {
      const callback = jest.fn();
      stateManager.subscribe('settings', callback);

      await stateManager.setState('settings.bpm', 140);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          bpm: 140,
          beatCount: 4,
          isPlaying: false,
          volume: { metronome: 100, strum: 80 },
          chordChanges: {}
        }),
        expect.objectContaining({
          bpm: 120,
          beatCount: 4,
          isPlaying: false,
          volume: { metronome: 100, strum: 80 },
          chordChanges: {}
        }),
        'settings.bpm'
      );
    });
  });

  describe('История изменений', () => {
    test('должен сохранять изменения в историю', async () => {
      await stateManager.setState('settings.bpm', 140);
      await stateManager.setState('settings.beatCount', 3);

      expect(stateManager.canUndo()).toBe(true);
      expect(stateManager.canRedo()).toBe(false);
    });

    test('должен отменять изменения', async () => {
      await stateManager.setState('settings.bpm', 140);
      expect(stateManager.getState('settings.bpm')).toBe(140);

      stateManager.undo();
      expect(stateManager.getState('settings.bpm')).toBe(120);
    });

    test('должен повторять изменения', async () => {
      await stateManager.setState('settings.bpm', 140);
      stateManager.undo();
      expect(stateManager.getState('settings.bpm')).toBe(120);

      stateManager.redo();
      expect(stateManager.getState('settings.bpm')).toBe(140);
    });

    test('должен ограничивать размер истории', async () => {
      // Устанавливаем маленький размер истории для теста
      stateManager.maxHistorySize = 3;

      await stateManager.setState('settings.bpm', 130);
      await stateManager.setState('settings.beatCount', 3);
      await stateManager.setState('settings.volume.strum', 90);
      await stateManager.setState('chords.inputString', 'C G Am F');

      // Первое изменение должно быть удалено из истории
      expect(stateManager.getHistorySize()).toBe(3);
      expect(stateManager.canUndo()).toBe(true);

      // Отменяем все изменения
      stateManager.undo();
      stateManager.undo();
      stateManager.undo();

      // Первое изменение уже недоступно
      expect(stateManager.getState('settings.bpm')).toBe(130);
    });
  });

  describe('Валидация', () => {
    test('должен валидировать BPM', async () => {
      // Валидные значения
      await expect(stateManager.setState('settings.bpm', 40)).resolves.toBe(true);
      await expect(stateManager.setState('settings.bpm', 300)).resolves.toBe(true);
      await expect(stateManager.setState('settings.bpm', 120)).resolves.toBe(true);

      // Невалидные значения
      await expect(stateManager.setState('settings.bpm', 39)).resolves.toBe(false);
      await expect(stateManager.setState('settings.bpm', 301)).resolves.toBe(false);
      await expect(stateManager.setState('settings.bpm', 'invalid')).resolves.toBe(false);
    });

    test('должен валидировать количество долей', async () => {
      // Валидные значения
      await expect(stateManager.setState('settings.beatCount', 1)).resolves.toBe(true);
      await expect(stateManager.setState('settings.beatCount', 16)).resolves.toBe(true);
      await expect(stateManager.setState('settings.beatCount', 4)).resolves.toBe(true);

      // Невалидные значения
      await expect(stateManager.setState('settings.beatCount', 0)).resolves.toBe(false);
      await expect(stateManager.setState('settings.beatCount', 17)).resolves.toBe(false);
      await expect(stateManager.setState('settings.beatCount', 'invalid')).resolves.toBe(false);
    });

    test('должен валидировать громкость', async () => {
      // Валидные значения
      await expect(stateManager.setState('settings.volume.strum', 0)).resolves.toBe(true);
      await expect(stateManager.setState('settings.volume.strum', 100)).resolves.toBe(true);
      await expect(stateManager.setState('settings.volume.strum', 80)).resolves.toBe(true);

      // Невалидные значения
      await expect(stateManager.setState('settings.volume.strum', -1)).resolves.toBe(false);
      await expect(stateManager.setState('settings.volume.strum', 101)).resolves.toBe(false);
      await expect(stateManager.setState('settings.volume.strum', 'invalid')).resolves.toBe(false);
    });
  });

  describe('Сериализация', () => {
    test('должен сериализовать состояние в JSON', async () => {
      await stateManager.setState('settings.bpm', 140);
      await stateManager.setState('chords.inputString', 'C G Am F');

      const json = stateManager.toJSON();
      
      expect(json.settings.bpm).toBe(140);
      expect(json.chords.inputString).toBe('C G Am F');
    });

    test('должен загружать состояние из JSON', () => {
      const data = {
        settings: {
          bpm: 140,
          beatCount: 3,
        },
        chords: {
          inputString: 'C G Am F',
        },
      };

      stateManager.fromJSON(data);

      expect(stateManager.getState('settings.bpm')).toBe(140);
      expect(stateManager.getState('settings.beatCount')).toBe(3);
      expect(stateManager.getState('chords.inputString')).toBe('C G Am F');
    });

    test('должен генерировать событие при загрузке состояния', () => {
      const callback = jest.fn();
      eventBus.on('state:loaded', callback);

      const data = { settings: { bpm: 140 } };
      stateManager.fromJSON(data);

      expect(callback).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Сброс состояния', () => {
    test('должен сбрасывать все состояние', async () => {
      await stateManager.setState('settings.bpm', 140);
      await stateManager.setState('chords.inputString', 'C G Am F');

      stateManager.reset();

      expect(stateManager.getState('settings.bpm')).toBe(120);
      expect(stateManager.getState('chords.inputString')).toBe('');
    });

    test('должен сбрасывать только указанный путь', async () => {
      await stateManager.setState('settings.bpm', 140);
      await stateManager.setState('chords.inputString', 'C G Am F');

      stateManager.reset('settings');

      expect(stateManager.getState('settings.bpm')).toBe(120);
      expect(stateManager.getState('chords.inputString')).toBe('C G Am F');
    });

    test('должен генерировать событие при сбросе состояния', () => {
      const callback = jest.fn();
      eventBus.on('state:reset', callback);

      stateManager.reset();

      expect(callback).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Middleware', () => {
    test('должен добавлять middleware', async () => {
      const middleware = jest.fn((ctx, next) => next());
      const remove = stateManager.use(middleware);

      expect(typeof remove).toBe('function');

      await stateManager.setState('settings.bpm', 140);
      expect(middleware).toHaveBeenCalled();
    });

    test('должен удалять middleware', async () => {
      const middleware = jest.fn((ctx, next) => next());
      const remove = stateManager.use(middleware);

      remove();
      await stateManager.setState('settings.bpm', 140);

      expect(middleware).not.toHaveBeenCalled();
    });

    test('должен выполнять middleware в порядке добавления', async () => {
      const middleware1 = jest.fn((ctx, next) => next());
      const middleware2 = jest.fn((ctx, next) => next());

      stateManager.use(middleware1);
      stateManager.use(middleware2);

      await stateManager.setState('settings.bpm', 140);

      expect(middleware1).toHaveBeenCalledBefore(middleware2);
    });

    test('должен передавать контекст в middleware', async () => {
      const middleware = jest.fn((ctx, next) => next());
      stateManager.use(middleware);

      await stateManager.setState('settings.bpm', 140);

      expect(middleware).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'settings.bpm',
          value: 140,
          oldValue: 120,
          options: {},
          state: expect.any(Object),
          timestamp: expect.any(Number),
        }),
        expect.any(Function),
        expect.any(Object)
      );
    });
  });
});

describe('StateHooks', () => {
  let stateManager;
  let stateHooks;
  let eventBus;

  beforeEach(() => {
    eventBus = new MockEventBus();
    stateManager = new StateManager(eventBus);
    stateHooks = new StateHooks(stateManager);
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('useState', () => {
    test('должен возвращать значение и функции', () => {
      const [value, setValue, unsubscribe] = stateHooks.useState('settings.bpm');

      expect(value).toBe(120);
      expect(typeof setValue).toBe('function');
      expect(typeof unsubscribe).toBe('function');
    });

    test('должен обновлять значение через setValue', async () => {
      const [, setValue] = stateHooks.useState('settings.bpm');

      await setValue(140);
      expect(stateManager.getState('settings.bpm')).toBe(140);
    });

    test('должен вызывать callback при изменении', async () => {
      const callback = jest.fn();
      const [, setValue] = stateHooks.useState('settings.bpm', callback);

      await setValue(140);
      expect(callback).toHaveBeenCalledWith(140, 120);
    });
  });

  describe('useForm', () => {
    test('должен работать с формой', async () => {
      const form = stateHooks.useForm('testForm', {
        name: '',
        type: 'major',
      });

      expect(form.getValue('name')).toBe('');
      expect(form.getValue('type')).toBe('major');

      await form.setValue('name', 'C');
      expect(form.getValue('name')).toBe('C');

      await form.setValues({ name: 'D', type: 'minor' });
      expect(form.getValue('name')).toBe('D');
      expect(form.getValue('type')).toBe('minor');

      const values = form.getValues();
      expect(values).toEqual({ name: 'D', type: 'minor' });

      form.reset();
      expect(form.getValue('name')).toBe('');
      expect(form.getValue('type')).toBe('major');
    });

    test('должен валидировать форму', async () => {
      const form = stateHooks.useForm('testForm', {
        name: '',
        type: 'major',
      });

      await form.setValue('name', '');

      const isValid = form.validate({
        name: (value) => value.length > 0 || 'Name is required',
        type: (value) => ['major', 'minor'].includes(value) || 'Invalid type',
      });

      expect(isValid).toBe(false);
      expect(stateManager.getState('testForm.errors.name')).toBe('Name is required');

      await form.setValue('name', 'C');
      const isValid2 = form.validate({
        name: (value) => value.length > 0 || 'Name is required',
        type: (value) => ['major', 'minor'].includes(value) || 'Invalid type',
      });

      expect(isValid2).toBe(true);
      expect(stateManager.getState('testForm.errors')).toEqual({});
    });
  });

  describe('useArray', () => {
    test('должен работать с массивом', async () => {
      const array = stateHooks.useArray('testArray');

      expect(array.getArray()).toEqual([]);

      await array.addItem({ id: 1, value: 'first' });
      expect(array.getArray()).toEqual([{ id: 1, value: 'first' }]);

      await array.addItem({ id: 2, value: 'second' }, 0);
      expect(array.getArray()).toEqual([
        { id: 2, value: 'second' },
        { id: 1, value: 'first' },
      ]);

      await array.updateItem(0, { id: 2, value: 'updated' });
      expect(array.getArray()).toEqual([
        { id: 2, value: 'updated' },
        { id: 1, value: 'first' },
      ]);

      await array.moveItem(0, 1);
      expect(array.getArray()).toEqual([
        { id: 1, value: 'first' },
        { id: 2, value: 'updated' },
      ]);

      await array.removeItem(0);
      expect(array.getArray()).toEqual([{ id: 2, value: 'updated' }]);

      await array.clear();
      expect(array.getArray()).toEqual([]);
    });
  });

  describe('useAsync', () => {
    test('должен работать с асинхронными операциями', async () => {
      const async = stateHooks.useAsync('testAsync');

      expect(async.getStatus()).toBe('idle');
      expect(async.isLoading()).toBe(false);
      expect(async.isSuccess()).toBe(false);
      expect(async.isError()).toBe(false);

      const mockFunction = jest.fn().mockResolvedValue('result');

      const result = await async.execute(mockFunction);

      expect(result).toBe('result');
      expect(async.getStatus()).toBe('success');
      expect(async.getData()).toBe('result');
      expect(async.isLoading()).toBe(false);
      expect(async.isSuccess()).toBe(true);
      expect(async.isError()).toBe(false);
    });

    test('должен обрабатывать ошибки', async () => {
      const async = stateHooks.useAsync('testAsync');

      const mockFunction = jest.fn().mockRejectedValue(new Error('Test error'));

      try {
        await async.execute(mockFunction);
      } catch (error) {
        expect(error.message).toBe('Test error');
      }

      expect(async.getStatus()).toBe('error');
      expect(async.getError()).toBe('Test error');
      expect(async.isLoading()).toBe(false);
      expect(async.isSuccess()).toBe(false);
      expect(async.isError()).toBe(true);
    });
  });

  describe('useHistory', () => {
    test('должен работать с историей', async () => {
      const history = stateHooks.useHistory();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(0);

      await stateManager.setState('settings.bpm', 140);

      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(1);

      history.undo();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);

      history.redo();

      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);

      history.clear();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(0);
    });
  });
});

describe('CommonMiddleware', () => {
  let stateManager;
  let eventBus;

  beforeEach(() => {
    eventBus = new MockEventBus();
    stateManager = new StateManager(eventBus);
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('logger', () => {
    test('должен логировать изменения состояния', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      stateManager.use(CommonMiddleware.logger());

      await stateManager.setState('settings.bpm', 140);

      expect(consoleSpy).toHaveBeenCalledWith(
        'State changed:',
        expect.objectContaining({
          path: 'settings.bpm',
          value: 140,
          oldValue: 120,
          timestamp: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });

    test('должен фильтровать логирование', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      stateManager.use(CommonMiddleware.logger({
        filter: (path) => path.startsWith('settings'),
      }));

      await stateManager.setState('settings.bpm', 140);
      await stateManager.setState('chords.inputString', 'C G Am F');

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'State changed:',
        expect.objectContaining({
          path: 'settings.bpm',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validator', () => {
    test('должен валидировать изменения', async () => {
      stateManager.use(CommonMiddleware.validator({
        schema: {
          'settings.bpm': (value) => value >= 60 && value <= 180,
        },
        strict: true,
      }));

      // Валидное значение
      await expect(stateManager.setState('settings.bpm', 120)).resolves.toBe(true);

      // Невалидное значение
      await expect(stateManager.setState('settings.bpm', 200)).rejects.toThrow(
        'Validation failed for path: settings.bpm'
      );
    });

    test('должен работать в нестрогом режиме', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      stateManager.use(CommonMiddleware.validator({
        schema: {
          'settings.bpm': (value) => value >= 60 && value <= 180,
        },
        strict: false,
      }));

      // Невалидное значение в нестрогом режиме
      await expect(stateManager.setState('settings.bpm', 200)).resolves.toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Validation failed for path: settings.bpm');

      consoleSpy.mockRestore();
    });
  });

  describe('immutable', () => {
    test('должен замораживать объекты', async () => {
      stateManager.use(CommonMiddleware.immutable());

      await stateManager.setState('testObject', { nested: { value: 42 } });

      const obj = stateManager.getState('testObject');
      expect(Object.isFrozen(obj)).toBe(true);
      expect(Object.isFrozen(obj.nested)).toBe(true);
    });

    test('должен применять только к указанным путям', async () => {
      stateManager.use(CommonMiddleware.immutable({
        paths: ['settings'],
      }));

      await stateManager.setState('settings.test', { value: 42 });
      await stateManager.setState('chords.test', { value: 42 });

      const settingsObj = stateManager.getState('settings.test');
      const chordsObj = stateManager.getState('chords.test');

      expect(Object.isFrozen(settingsObj)).toBe(true);
      expect(Object.isFrozen(chordsObj)).toBe(false);
    });
  });
});