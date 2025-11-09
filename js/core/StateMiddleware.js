/**
 * Класс для управления middleware в системе управления состоянием
 * Middleware позволяет перехватывать и обрабатывать изменения состояния
 */
export class StateMiddleware {
  constructor() {
    this.middlewares = [];
  }

  /**
   * Добавление middleware
   * @param {Function} middleware - Функция middleware
   * @param {Object} options - Опции middleware
   * @returns {Function} Функция для удаления middleware
   */
  use(middleware, options = {}) {
    const middlewareEntry = {
      id: this.generateId(),
      middleware,
      options,
      enabled: true,
    };

    this.middlewares.push(middlewareEntry);

    // Возвращаем функцию для удаления middleware
    return () => {
      const index = this.middlewares.findIndex(entry => entry.id === middlewareEntry.id);
      if (index !== -1) {
        this.middlewares.splice(index, 1);
      }
    };
  }

  /**
   * Удаление middleware по ID
   * @param {string} id - ID middleware
   * @returns {boolean} Успешность удаления
   */
  remove(id) {
    const index = this.middlewares.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Включение/выключение middleware
   * @param {string} id - ID middleware
   * @param {boolean} enabled - Состояние middleware
   * @returns {boolean} Успешность операции
   */
  toggle(id, enabled) {
    const middleware = this.middlewares.find(entry => entry.id === id);
    if (middleware) {
      middleware.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Выполнение всех middleware
   * @param {Object} context - Контекст выполнения
   * @param {Function} next - Функция для перехода к следующему middleware
   */
  async execute(context, next) {
    let index = 0;

    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }

      index = i;

      if (i >= this.middlewares.length) {
        return next();
      }

      const middlewareEntry = this.middlewares[i];
      
      if (!middlewareEntry.enabled) {
        return dispatch(i + 1);
      }

      const { middleware, options } = middlewareEntry;
      
      try {
        await middleware(context, () => dispatch(i + 1), options);
      } catch (error) {
        console.error(`Middleware error: ${error.message}`, error);
        
        // Если опция ignoreErrors не установлена, прерываем цепочку
        if (!options.ignoreErrors) {
          throw error;
        }
        
        // Иначе продолжаем выполнение
        return dispatch(i + 1);
      }
    };

    return dispatch(0);
  }

  /**
   * Очистка всех middleware
   */
  clear() {
    this.middlewares = [];
  }

  /**
   * Получение списка middleware
   * @returns {Array} Список middleware
   */
  getAll() {
    return this.middlewares.map(entry => ({
      id: entry.id,
      enabled: entry.enabled,
      options: entry.options,
    }));
  }

  /**
   * Генерация уникального ID
   * @private
   */
  generateId() {
    return `mw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Предустановленные middleware для common use cases
 */
export const CommonMiddleware = {
  /**
   * Middleware для логирования изменений состояния
   * @param {Object} options - Опции логирования
   * @returns {Function} Middleware функция
   */
  logger(options = {}) {
    const {
      logLevel = 'info',
      includeOldValue = true,
      includeTimestamp = true,
      filter = null,
    } = options;

    return (context, next, opts) => {
      const { path, value, oldValue } = context;
      
      // Применяем фильтр если он указан
      if (filter && !filter(path, value, oldValue)) {
        return next();
      }

      const logData = {
        path,
        value,
      };

      if (includeOldValue) {
        logData.oldValue = oldValue;
      }

      if (includeTimestamp) {
        logData.timestamp = Date.now();
      }

      switch (logLevel) {
        case 'debug':
          console.debug('State changed:', logData);
          break;
        case 'warn':
          console.warn('State changed:', logData);
          break;
        case 'error':
          console.error('State changed:', logData);
          break;
        default:
          console.log('State changed:', logData);
      }

      return next();
    };
  },

  /**
   * Middleware для сохранения состояния в localStorage
   * @param {Object} options - Опции сохранения
   * @returns {Function} Middleware функция
   */
  localStorage(options = {}) {
    const {
      key = 'app_state',
      serialize = JSON.stringify,
      deserialize = JSON.parse,
      filter = null,
      debounceMs = 0,
    } = options;

    let timeoutId = null;

    const saveToStorage = (state) => {
      try {
        localStorage.setItem(key, serialize(state));
      } catch (error) {
        console.warn(`Failed to save state to localStorage: ${error.message}`);
      }
    };

    return (context, next, opts) => {
      const { path, value } = context;
      
      // Применяем фильтр если он указан
      if (filter && !filter(path, value)) {
        return next();
      }

      // Отложенное сохранение с debounce
      if (debounceMs > 0) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          // Здесь нужен доступ к StateManager для получения полного состояния
          // В реальной реализации это будет решено через dependency injection
          console.log('Debounced save to localStorage');
        }, debounceMs);
      } else {
        // Немедленное сохранение
        console.log('Immediate save to localStorage');
      }

      return next();
    };
  },

  /**
   * Middleware для валидации состояния
   * @param {Object} options - Опции валидации
   * @returns {Function} Middleware функция
   */
  validator(options = {}) {
    const { schema = {}, strict = false } = options;

    return (context, next, opts) => {
      const { path, value } = context;
      
      // Проверяем схему если она определена для этого пути
      if (schema[path]) {
        const validator = schema[path];
        
        if (typeof validator === 'function') {
          const isValid = validator(value);
          
          if (!isValid) {
            const error = new Error(`Validation failed for path: ${path}`);
            error.path = path;
            error.value = value;
            
            if (strict) {
              throw error;
            } else {
              console.warn(error.message);
              return next();
            }
          }
        }
      }

      return next();
    };
  },

  /**
   * Middleware для иммутабельности состояния
   * @param {Object} options - Опции иммутабельности
   * @returns {Function} Middleware функция
   */
  immutable(options = {}) {
    const { deep = true, paths = [] } = options;

    const isObject = (obj) => obj !== null && typeof obj === 'object';
    
    const deepFreeze = (obj) => {
      if (!isObject(obj)) return obj;
      
      Object.getOwnPropertyNames(obj).forEach(prop => {
        if (isObject(obj[prop]) && !Object.isFrozen(obj[prop])) {
          deepFreeze(obj[prop]);
        }
      });
      
      return Object.freeze(obj);
    };

    return (context, next, opts) => {
      const { path, value } = context;
      
      // Проверяем, нужно ли применять к этому пути
      const shouldApply = paths.length === 0 || paths.some(p => path.startsWith(p));
      
      if (shouldApply && isObject(value)) {
        if (deep) {
          context.value = deepFreeze({ ...value });
        } else {
          context.value = Object.freeze({ ...value });
        }
      }

      return next();
    };
  },

  /**
   * Middleware для аналитики
   * @param {Object} options - Опции аналитики
   * @returns {Function} Middleware функция
   */
  analytics(options = {}) {
    const { 
      tracker = null, 
      filter = null, 
      transform = null,
      eventName = 'state_changed' 
    } = options;

    return (context, next, opts) => {
      const { path, value, oldValue } = context;
      
      // Применяем фильтр если он указан
      if (filter && !filter(path, value, oldValue)) {
        return next();
      }

      // Трансформируем данные если нужно
      let eventData = { path, value, oldValue };
      if (transform) {
        eventData = transform(eventData);
      }

      // Отправляем событие в аналитику
      if (tracker && typeof tracker.track === 'function') {
        tracker.track(eventName, eventData);
      } else {
        console.log('Analytics event:', eventName, eventData);
      }

      return next();
    };
  },

  /**
   * Middleware для синхронизации состояния с сервером
   * @param {Object} options - Опции синхронизации
   * @returns {Function} Middleware функция
   */
  sync(options = {}) {
    const { 
      apiClient = null, 
      endpoint = '/api/sync',
      debounceMs = 1000,
      filter = null,
      retryCount = 3,
    } = options;

    let timeoutId = null;
    let pendingSync = null;

    const syncToServer = async (state) => {
      try {
        if (apiClient) {
          await apiClient.post(endpoint, { state });
        } else {
          console.log('Sync to server:', state);
        }
        pendingSync = null;
      } catch (error) {
        console.error('Sync failed:', error);
        
        // Здесь можно добавить логику повторных попыток
        if (retryCount > 0) {
          setTimeout(() => syncToServer(state), 2000);
        }
      }
    };

    return (context, next, opts) => {
      const { path, value } = context;
      
      // Применяем фильтр если он указан
      if (filter && !filter(path, value)) {
        return next();
      }

      // Отложенная синхронизация с debounce
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        // Здесь нужен доступ к StateManager для получения полного состояния
        // В реальной реализации это будет решено через dependency injection
        console.log('Debounced sync to server');
      }, debounceMs);

      return next();
    };
  },
};

export default StateMiddleware;