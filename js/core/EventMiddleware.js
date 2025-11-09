export class EventMiddleware {
  /**
   * Middleware для логирования событий
   */
  static logger(options = {}) {
    const {
      logLevel = "info",
      excludeEvents = [],
      includeData = true,
    } = options;

    return (event) => {
      if (excludeEvents.includes(event.name)) {
        return;
      }

      const logData = includeData ? event.data : undefined;

      switch (logLevel) {
        case "debug":
          console.debug(`[Event] ${event.name}`, logData);
          break;
        case "info":
          console.info(`[Event] ${event.name}`, logData);
          break;
        case "warn":
          console.warn(`[Event] ${event.name}`, logData);
          break;
        case "error":
          console.error(`[Event] ${event.name}`, logData);
          break;
        default:
          console.log(`[Event] ${event.name}`, logData);
      }
      
      return true; // Возвращаем true для продолжения обработки
    };
  }

  /**
   * Middleware для измерения производительности
   */
  static performance(options = {}) {
    const {
      threshold = 100, // ms
      includeEvents = [],
    } = options;

    return (event) => {
      const startTime = performance.now();

      // Возвращаем функцию для завершения измерения
      return () => {
        const duration = performance.now() - startTime;

        if (duration > threshold || includeEvents.includes(event.name)) {
          console.log(`[Performance] ${event.name}: ${duration.toFixed(2)}ms`);
        }
      };
    };
  }

  /**
   * Middleware для валидации событий
   */
  static validator(validatorMap) {
    return (event) => {
      const validator = validatorMap[event.name];
      if (validator && typeof validator === "function") {
        const isValid = validator(event.data);
        if (!isValid) {
          console.error(
            `[Validator] Invalid data for event: ${event.name}`,
            event.data
          );
          return false; // Прерываем обработку
        }
      }
      
      return true; // Возвращаем true для продолжения обработки
    };
  }

  /**
   * Middleware для фильтрации событий
   */
  static filter(filterFn) {
    return (event) => {
      return filterFn(event);
    };
  }

  /**
   * Middleware для трансформации данных события
   */
  static transformer(transformerMap) {
    return (event) => {
      const transformer = transformerMap[event.name];
      if (transformer && typeof transformer === "function") {
        event.data = transformer(event.data);
      }
    };
  }

  /**
   * Middleware для дебаунсинга событий
   */
  static debounce(delay = 300) {
    const debouncedEvents = new Map();

    return (event) => {
      const key = event.name;

      if (debouncedEvents.has(key)) {
        clearTimeout(debouncedEvents.get(key));
      }

      const timeoutId = setTimeout(() => {
        debouncedEvents.delete(key);
        // Продолжаем обработку события
        return true;
      }, delay);

      debouncedEvents.set(key, timeoutId);

      // Прерываем первоначальную обработку
      return false;
    };
  }

  /**
   * Middleware для троттлинга событий
   */
  static throttle(delay = 300) {
    const throttledEvents = new Map();

    return (event) => {
      const key = event.name;
      const now = Date.now();

      if (throttledEvents.has(key)) {
        const lastTime = throttledEvents.get(key);
        if (now - lastTime < delay) {
          return false; // Пропускаем событие
        }
      }

      throttledEvents.set(key, now);
      return true;
    };
  }
}

export default EventMiddleware;