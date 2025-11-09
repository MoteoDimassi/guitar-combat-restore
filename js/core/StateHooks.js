import StateManager from './StateManager.js';

/**
 * Класс для предоставления хуков управления состоянием
 * Упрощает использование StateManager в компонентах
 */
export class StateHooks {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Хук для получения состояния и подписки на его изменения
   * @param {string} path - Путь к состоянию
   * @param {Function} callback - Функция обратного вызова при изменении
   * @returns {Array} [значение, функция установки, функция отписки]
   */
  useState(path, callback) {
    const value = this.stateManager.getState(path);
    
    const setValue = (newValue, options = {}) => {
      return this.stateManager.setState(path, newValue, options);
    };

    const unsubscribe = this.stateManager.subscribe(path, (newValue, oldValue) => {
      if (callback) {
        callback(newValue, oldValue);
      }
    });

    return [value, setValue, unsubscribe];
  }

  /**
   * Хук для работы с формами
   * @param {string} basePath - Базовый путь к состоянию формы
   * @param {Object} initialValues - Начальные значения формы
   * @returns {Object} Объект с методами для работы с формой
   */
  useForm(basePath, initialValues = {}) {
    // Инициализируем форму если нужно
    if (!this.stateManager.getState(basePath)) {
      this.stateManager.setState(basePath, initialValues);
    }

    const getValue = (field) => {
      return this.stateManager.getState(`${basePath}.${field}`);
    };

    const setValue = (field, value) => {
      return this.stateManager.setState(`${basePath}.${field}`, value);
    };

    const setValues = (values) => {
      Object.entries(values).forEach(([field, value]) => {
        setValue(field, value);
      });
    };

    const reset = () => {
      return this.stateManager.setState(basePath, initialValues);
    };

    const getValues = () => {
      return this.stateManager.getState(basePath) || {};
    };

    const validate = (validationSchema) => {
      const values = getValues();
      const errors = {};

      Object.entries(validationSchema).forEach(([field, validator]) => {
        if (typeof validator === 'function') {
          const error = validator(values[field]);
          if (error) {
            errors[field] = error;
          }
        }
      });

      this.stateManager.setState(`${basePath}.errors`, errors);
      return Object.keys(errors).length === 0;
    };

    return {
      getValue,
      setValue,
      setValues,
      reset,
      getValues,
      validate,
    };
  }

  /**
   * Хук для работы со списками/массивами
   * @param {string} path - Путь к состоянию массива
   * @returns {Object} Объект с методами для работы с массивом
   */
  useArray(path) {
    const getArray = () => {
      return this.stateManager.getState(path) || [];
    };

    const addItem = (item, index = null) => {
      const array = getArray();
      const newArray = [...array];
      
      if (index !== null && index >= 0 && index <= array.length) {
        newArray.splice(index, 0, item);
      } else {
        newArray.push(item);
      }
      
      return this.stateManager.setState(path, newArray);
    };

    const removeItem = (index) => {
      const array = getArray();
      if (index >= 0 && index < array.length) {
        const newArray = [...array];
        newArray.splice(index, 1);
        return this.stateManager.setState(path, newArray);
      }
      return false;
    };

    const updateItem = (index, item) => {
      const array = getArray();
      if (index >= 0 && index < array.length) {
        const newArray = [...array];
        newArray[index] = item;
        return this.stateManager.setState(path, newArray);
      }
      return false;
    };

    const moveItem = (fromIndex, toIndex) => {
      const array = getArray();
      if (
        fromIndex >= 0 && 
        fromIndex < array.length && 
        toIndex >= 0 && 
        toIndex < array.length
      ) {
        const newArray = [...array];
        const [item] = newArray.splice(fromIndex, 1);
        newArray.splice(toIndex, 0, item);
        return this.stateManager.setState(path, newArray);
      }
      return false;
    };

    const clear = () => {
      return this.stateManager.setState(path, []);
    };

    return {
      getArray,
      addItem,
      removeItem,
      updateItem,
      moveItem,
      clear,
    };
  }

  /**
   * Хук для работы с асинхронными операциями
   * @param {string} path - Путь к состоянию асинхронной операции
   * @returns {Object} Объект с методами для работы с асинхронными операциями
   */
  useAsync(path) {
    const getStatus = () => {
      return this.stateManager.getState(`${path}.status`) || 'idle';
    };

    const getData = () => {
      return this.stateManager.getState(`${path}.data`);
    };

    const getError = () => {
      return this.stateManager.getState(`${path}.error`);
    };

    const isLoading = () => {
      return getStatus() === 'loading';
    };

    const isIdle = () => {
      return getStatus() === 'idle';
    };

    const isSuccess = () => {
      return getStatus() === 'success';
    };

    const isError = () => {
      return getStatus() === 'error';
    };

    const execute = async (asyncFunction) => {
      try {
        this.stateManager.setState(`${path}.status`, 'loading');
        this.stateManager.setState(`${path}.error`, null);
        
        const data = await asyncFunction();
        
        this.stateManager.setState(`${path}.data`, data);
        this.stateManager.setState(`${path}.status`, 'success');
        
        return data;
      } catch (error) {
        this.stateManager.setState(`${path}.error`, error.message || error);
        this.stateManager.setState(`${path}.status`, 'error');
        throw error;
      }
    };

    const reset = () => {
      this.stateManager.setState(`${path}.status`, 'idle');
      this.stateManager.setState(`${path}.data`, null);
      this.stateManager.setState(`${path}.error`, null);
    };

    return {
      getStatus,
      getData,
      getError,
      isLoading,
      isIdle,
      isSuccess,
      isError,
      execute,
      reset,
    };
  }

  /**
   * Хук для работы с локальным состоянием компонента
   * @param {string} componentId - ID компонента
   * @param {Object} initialState - Начальное состояние
   * @returns {Object} Объект с методами для работы с локальным состоянием
   */
  useLocalState(componentId, initialState = {}) {
    const basePath = `ui.local.${componentId}`;
    
    // Инициализируем локальное состояние если нужно
    if (!this.stateManager.getState(basePath)) {
      this.stateManager.setState(basePath, initialState);
    }

    const getState = (key) => {
      if (key) {
        return this.stateManager.getState(`${basePath}.${key}`);
      }
      return this.stateManager.getState(basePath);
    };

    const setState = (key, value) => {
      if (typeof key === 'object') {
        // Если передан объект, обновляем несколько полей
        Object.entries(key).forEach(([k, v]) => {
          this.stateManager.setState(`${basePath}.${k}`, v);
        });
      } else {
        // Обновляем одно поле
        this.stateManager.setState(`${basePath}.${key}`, value);
      }
    };

    const reset = () => {
      this.stateManager.setState(basePath, initialState);
    };

    const subscribe = (key, callback) => {
      const fullPath = key ? `${basePath}.${key}` : basePath;
      return this.stateManager.subscribe(fullPath, callback);
    };

    return {
      getState,
      setState,
      reset,
      subscribe,
    };
  }

  /**
   * Хук для работы с историей изменений
   * @returns {Object} Объект с методами для работы с историей
   */
  useHistory() {
    return {
      undo: () => this.stateManager.undo(),
      redo: () => this.stateManager.redo(),
      canUndo: () => this.stateManager.canUndo(),
      canRedo: () => this.stateManager.canRedo(),
      clear: () => this.stateManager.clearHistory(),
      size: () => this.stateManager.getHistorySize(),
    };
  }

  /**
   * Хук для работы с персистентным состоянием
   * @param {string} path - Путь к состоянию
   * @param {string} storageKey - Ключ для хранения в localStorage
   * @param {Object} options - Дополнительные опции
   * @returns {Object} Объект с методами для работы с персистентным состоянием
   */
  usePersistentState(path, storageKey, options = {}) {
    const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

    // Загружаем состояние из localStorage при инициализации
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          const value = deserialize(stored);
          this.stateManager.setState(path, value, { saveToHistory: false });
        }
      } catch (error) {
        console.warn(`Failed to load state from localStorage: ${error.message}`);
      }
    };

    // Сохраняем состояние в localStorage при изменении
    const saveToStorage = (value) => {
      try {
        localStorage.setItem(storageKey, serialize(value));
      } catch (error) {
        console.warn(`Failed to save state to localStorage: ${error.message}`);
      }
    };

    // Подписываемся на изменения состояния
    const unsubscribe = this.stateManager.subscribe(path, saveToStorage);

    // Загружаем начальное состояние
    loadFromStorage();

    const setValue = (value, options = {}) => {
      return this.stateManager.setState(path, value, options);
    };

    const clearStorage = () => {
      localStorage.removeItem(storageKey);
    };

    return {
      setValue,
      getValue: () => this.stateManager.getState(path),
      unsubscribe,
      clearStorage,
    };
  }
}

export default StateHooks;