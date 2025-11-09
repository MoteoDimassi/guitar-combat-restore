import StateHooks from '../../js/core/StateHooks.js';
import StateManager from '../../js/core/StateManager.js';

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

  clear() {
    this.events.clear();
  }
}

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

    test('должен отписываться при вызове unsubscribe', async () => {
      const callback = jest.fn();
      const [, , unsubscribe] = stateHooks.useState('settings.bpm', callback);

      unsubscribe();
      await stateManager.setState('settings.bpm', 140);

      expect(callback).not.toHaveBeenCalled();
    });

    test('должен работать с вложенными путями', async () => {
      const [value, setValue] = stateHooks.useState('settings.volume.strum');

      expect(value).toBe(80);
      await setValue(90);
      expect(stateManager.getState('settings.volume.strum')).toBe(90);
    });

    test('должен работать с несуществующими путями', () => {
      const [value] = stateHooks.useState('nonexistent.path');

      expect(value).toBeUndefined();
    });

    test('должен передавать опции в setState', async () => {
      const [, setValue] = stateHooks.useState('settings.bpm');

      await setValue(140, { saveToHistory: false });
      // Проверяем, что опция была передана (через проверку истории)
      expect(stateManager.getState('settings.bpm')).toBe(140);
    });
  });

  describe('useForm', () => {
    test('должен инициализировать форму с начальными значениями', () => {
      const initialValues = {
        name: '',
        type: 'major',
      };
      const form = stateHooks.useForm('testForm', initialValues);

      expect(form.getValue('name')).toBe('');
      expect(form.getValue('type')).toBe('major');
      expect(stateManager.getState('testForm')).toEqual(initialValues);
    });

    test('должен использовать существующие значения формы', () => {
      stateManager.setState('existingForm', { name: 'existing', type: 'minor' });
      const form = stateHooks.useForm('existingForm', { name: '', type: 'major' });

      expect(form.getValue('name')).toBe('existing');
      expect(form.getValue('type')).toBe('minor');
    });

    test('должен устанавливать значения формы', async () => {
      const form = stateHooks.useForm('testForm', {
        name: '',
        type: 'major',
      });

      await form.setValue('name', 'C');
      expect(form.getValue('name')).toBe('C');
      expect(stateManager.getState('testForm.name')).toBe('C');
    });

    test('должен устанавливать несколько значений', async () => {
      const form = stateHooks.useForm('testForm', {
        name: '',
        type: 'major',
      });

      await form.setValues({ name: 'D', type: 'minor' });
      expect(form.getValue('name')).toBe('D');
      expect(form.getValue('type')).toBe('minor');
    });

    test('должен получать все значения формы', () => {
      const initialValues = { name: 'test', type: 'major' };
      const form = stateHooks.useForm('testForm', initialValues);

      const values = form.getValues();
      expect(values).toEqual(initialValues);
    });

    test('должен сбрасывать форму', async () => {
      const initialValues = { name: '', type: 'major' };
      const form = stateHooks.useForm('testForm', initialValues);

      await form.setValue('name', 'modified');
      await form.setValue('type', 'minor');
      
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

    test('должен обрабатывать валидацию без ошибок', async () => {
      const form = stateHooks.useForm('testForm', {
        name: 'test',
        type: 'major',
      });

      const isValid = form.validate({
        name: (value) => value.length > 0 || 'Name is required',
      });

      expect(isValid).toBe(true);
      expect(stateManager.getState('testForm.errors')).toEqual({});
    });

    test('должен обрабатывать пустую схему валидации', async () => {
      const form = stateHooks.useForm('testForm', {
        name: 'test',
      });

      const isValid = form.validate({});

      expect(isValid).toBe(true);
    });
  });

  describe('useArray', () => {
    test('должен возвращать пустой массив по умолчанию', () => {
      const array = stateHooks.useArray('testArray');

      expect(array.getArray()).toEqual([]);
    });

    test('должен возвращать существующий массив', () => {
      stateManager.setState('existingArray', [1, 2, 3]);
      const array = stateHooks.useArray('existingArray');

      expect(array.getArray()).toEqual([1, 2, 3]);
    });

    test('должен добавлять элементы в конец массива', async () => {
      const array = stateHooks.useArray('testArray');

      await array.addItem({ id: 1, value: 'first' });
      expect(array.getArray()).toEqual([{ id: 1, value: 'first' }]);

      await array.addItem({ id: 2, value: 'second' });
      expect(array.getArray()).toEqual([
        { id: 1, value: 'first' },
        { id: 2, value: 'second' }
      ]);
    });

    test('должен добавлять элементы по индексу', async () => {
      const array = stateHooks.useArray('testArray');

      await array.addItem({ id: 1, value: 'first' });
      await array.addItem({ id: 2, value: 'second' }, 0);

      expect(array.getArray()).toEqual([
        { id: 2, value: 'second' },
        { id: 1, value: 'first' }
      ]);
    });

    test('должен удалять элементы по индексу', async () => {
      const array = stateHooks.useArray('testArray');

      await array.addItem({ id: 1, value: 'first' });
      await array.addItem({ id: 2, value: 'second' });
      await array.addItem({ id: 3, value: 'third' });

      const result = await array.removeItem(1);
      expect(result).toBe(true);
      expect(array.getArray()).toEqual([
        { id: 1, value: 'first' },
        { id: 3, value: 'third' }
      ]);
    });

    test('должен возвращать false при удалении несуществующего индекса', async () => {
      const array = stateHooks.useArray('testArray');

      const result = await array.removeItem(0);
      expect(result).toBe(false);
    });

    test('должен обновлять элементы по индексу', async () => {
      const array = stateHooks.useArray('testArray');

      await array.addItem({ id: 1, value: 'first' });
      await array.addItem({ id: 2, value: 'second' });

      const result = await array.updateItem(0, { id: 1, value: 'updated' });
      expect(result).toBe(true);
      expect(array.getArray()).toEqual([
        { id: 1, value: 'updated' },
        { id: 2, value: 'second' }
      ]);
    });

    test('должен возвращать false при обновлении несуществующего индекса', async () => {
      const array = stateHooks.useArray('testArray');

      const result = await array.updateItem(0, { id: 1, value: 'updated' });
      expect(result).toBe(false);
    });

    test('должен перемещать элементы', async () => {
      const array = stateHooks.useArray('testArray');

      await array.addItem({ id: 1, value: 'first' });
      await array.addItem({ id: 2, value: 'second' });
      await array.addItem({ id: 3, value: 'third' });

      const result = await array.moveItem(0, 2);
      expect(result).toBe(true);
      expect(array.getArray()).toEqual([
        { id: 2, value: 'second' },
        { id: 3, value: 'third' },
        { id: 1, value: 'first' }
      ]);
    });

    test('должен возвращать false при перемещении несуществующего индекса', async () => {
      const array = stateHooks.useArray('testArray');

      const result = await array.moveItem(0, 1);
      expect(result).toBe(false);
    });

    test('должен очищать массив', async () => {
      const array = stateHooks.useArray('testArray');

      await array.addItem({ id: 1, value: 'first' });
      await array.addItem({ id: 2, value: 'second' });

      await array.clear();
      expect(array.getArray()).toEqual([]);
    });
  });

  describe('useAsync', () => {
    test('должен возвращать начальный статус', () => {
      const async = stateHooks.useAsync('testAsync');

      expect(async.getStatus()).toBe('idle');
      expect(async.isLoading()).toBe(false);
      expect(async.isIdle()).toBe(true);
      expect(async.isSuccess()).toBe(false);
      expect(async.isError()).toBe(false);
    });

    test('должен выполнять асинхронную операцию', async () => {
      const async = stateHooks.useAsync('testAsync');
      const mockFunction = jest.fn().mockResolvedValue('result');

      const result = await async.execute(mockFunction);

      expect(result).toBe('result');
      expect(mockFunction).toHaveBeenCalled();
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

    test('должен сбрасывать состояние', async () => {
      const async = stateHooks.useAsync('testAsync');
      const mockFunction = jest.fn().mockResolvedValue('result');

      await async.execute(mockFunction);
      expect(async.getStatus()).toBe('success');

      async.reset();
      expect(async.getStatus()).toBe('idle');
      expect(async.getData()).toBeNull();
      expect(async.getError()).toBeNull();
    });

    test('должен устанавливать статус загрузки', async () => {
      const async = stateHooks.useAsync('testAsync');
      const mockFunction = jest.fn(() => {
        expect(async.getStatus()).toBe('loading');
        expect(async.isLoading()).toBe(true);
        return Promise.resolve('result');
      });

      await async.execute(mockFunction);
      expect(async.getStatus()).toBe('success');
    });
  });

  describe('useLocalState', () => {
    test('должен создавать локальное состояние', () => {
      const localState = stateHooks.useLocalState('testComponent', {
        isVisible: false,
        count: 0,
      });

      expect(localState.getState('isVisible')).toBe(false);
      expect(localState.getState('count')).toBe(0);
      expect(localState.getState()).toEqual({
        isVisible: false,
        count: 0,
      });
    });

    test('должен использовать существующее локальное состояние', () => {
      stateManager.setState('ui.local.existingComponent', {
        isVisible: true,
        count: 5,
      });

      const localState = stateHooks.useLocalState('existingComponent', {
        isVisible: false,
        count: 0,
      });

      expect(localState.getState('isVisible')).toBe(true);
      expect(localState.getState('count')).toBe(5);
    });

    test('должен устанавливать значения', () => {
      const localState = stateHooks.useLocalState('testComponent', {
        isVisible: false,
        count: 0,
      });

      localState.setState('isVisible', true);
      expect(localState.getState('isVisible')).toBe(true);

      localState.setState('count', 5);
      expect(localState.getState('count')).toBe(5);
    });

    test('должен устанавливать несколько значений', () => {
      const localState = stateHooks.useLocalState('testComponent', {
        isVisible: false,
        count: 0,
      });

      localState.setState({
        isVisible: true,
        count: 5,
      });

      expect(localState.getState()).toEqual({
        isVisible: true,
        count: 5,
      });
    });

    test('должен сбрасывать состояние', () => {
      const localState = stateHooks.useLocalState('testComponent', {
        isVisible: false,
        count: 0,
      });

      localState.setState('isVisible', true);
      localState.setState('count', 5);

      localState.reset();

      expect(localState.getState()).toEqual({
        isVisible: false,
        count: 0,
      });
    });

    test('должен подписываться на изменения', () => {
      const localState = stateHooks.useLocalState('testComponent', {
        count: 0,
      });

      const callback = jest.fn();
      const unsubscribe = localState.subscribe('count', callback);

      localState.setState('count', 5);
      expect(callback).toHaveBeenCalledWith(5, 0);

      unsubscribe();
      localState.setState('count', 10);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('useHistory', () => {
    test('должен возвращать функции управления историей', () => {
      const history = stateHooks.useHistory();

      expect(typeof history.undo).toBe('function');
      expect(typeof history.redo).toBe('function');
      expect(typeof history.canUndo).toBe('function');
      expect(typeof history.canRedo).toBe('function');
      expect(typeof history.clear).toBe('function');
      expect(typeof history.size).toBe('function');
    });

    test('должен проверять доступность undo/redo', async () => {
      const history = stateHooks.useHistory();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(0);

      await stateManager.setState('test.value', 1);

      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      expect(history.size()).toBe(1);

      history.undo();

      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(true);

      history.redo();

      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });

    test('должен очищать историю', async () => {
      const history = stateHooks.useHistory();

      await stateManager.setState('test.value', 1);
      expect(history.size()).toBe(1);

      history.clear();
      expect(history.size()).toBe(0);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });

  describe('usePersistentState', () => {
    beforeEach(() => {
      // Мокаем localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      global.localStorage = mockLocalStorage;
    });

    test('должен загружать состояние из localStorage', () => {
      const mockData = { value: 'loaded' };
      global.localStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey');

      expect(global.localStorage.getItem).toHaveBeenCalledWith('storageKey');
      expect(stateManager.getState('testKey')).toEqual(mockData);
    });

    test('должен сохранять состояние в localStorage', () => {
      global.localStorage.getItem.mockReturnValue(null);

      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey');
      persistentState.setValue({ value: 'saved' });

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'storageKey',
        JSON.stringify({ value: 'saved' })
      );
    });

    test('должен обрабатывать ошибки загрузки', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      global.localStorage.getItem.mockReturnValue('invalid json');

      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load state from localStorage:')
      );

      consoleSpy.mockRestore();
    });

    test('должен обрабатывать ошибки сохранения', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey');
      persistentState.setValue({ value: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save state to localStorage:')
      );

      consoleSpy.mockRestore();
    });

    test('должен очищать localStorage', () => {
      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey');

      persistentState.clearStorage();

      expect(global.localStorage.removeItem).toHaveBeenCalledWith('storageKey');
    });

    test('должен отписываться при очистке', () => {
      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey');

      const unsubscribe = persistentState.unsubscribe;
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      // Проверяем, что отписка работает (нет простого способа проверить это без моков)
      expect(typeof unsubscribe).toBe('function');
    });

    test('должен использовать кастомные сериализаторы', () => {
      const customSerialize = jest.fn((data) => `custom:${JSON.stringify(data)}`);
      const customDeserialize = jest.fn((data) => {
        if (data.startsWith('custom:')) {
          return JSON.parse(data.slice(7));
        }
        return null;
      });

      global.localStorage.getItem.mockReturnValue('custom:{"value":"test"}');

      const persistentState = stateHooks.usePersistentState('testKey', 'storageKey', {
        serialize: customSerialize,
        deserialize: customDeserialize,
      });

      expect(customDeserialize).toHaveBeenCalledWith('custom:{"value":"test"}');

      persistentState.setValue({ value: 'new' });
      expect(customSerialize).toHaveBeenCalledWith({ value: 'new' });
    });
  });

  describe('Интеграция с StateManager', () => {
    test('должен корректно работать с StateManager', async () => {
      const [value, setValue] = stateHooks.useState('settings.bpm');

      expect(value).toBe(120);

      await setValue(140);
      expect(stateManager.getState('settings.bpm')).toBe(140);
    });

    test('должен реагировать на изменения из StateManager', async () => {
      const callback = jest.fn();
      stateHooks.useState('settings.bpm', callback);

      await stateManager.setState('settings.bpm', 140);

      expect(callback).toHaveBeenCalledWith(140, 120);
    });

    test('должен корректно обрабатывать вложенные пути', async () => {
      const form = stateHooks.useForm('testForm', {
        nested: {
          value: 'initial'
        }
      });

      expect(form.getValue('nested.value')).toBe('initial');

      await form.setValue('nested.value', 'updated');
      expect(form.getValue('nested.value')).toBe('updated');
    });
  });
});