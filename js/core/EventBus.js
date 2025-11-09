export class EventBus {
  constructor(options = {}) {
    this.events = new Map();
    this.onceEvents = new Map();
    this.middlewares = [];
    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    this.debug = options.debug || false;

    // Статистика событий
    this.stats = {
      emitted: 0,
      handled: 0,
      errors: 0,
    };
  }

  /**
   * Подписка на событие
   * @param {string} eventName - Название события
   * @param {Function} callback - Обработчик события
   * @param {Object} options - Опции подписки
   * @returns {Function} Функция отписки
   */
  on(eventName, callback, options = {}) {
    if (typeof callback !== "function") {
      throw new Error("Callback must be a function");
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    const listener = {
      callback,
      priority: options.priority || 0,
      context: options.context || null,
      once: options.once || false,
      id: this.generateListenerId(),
    };

    this.events.get(eventName).add(listener);

    // Сортируем по приоритету (чем выше, тем раньше)
    const listeners = Array.from(this.events.get(eventName));
    listeners.sort((a, b) => b.priority - a.priority);
    this.events.set(eventName, new Set(listeners));

    this.log(`Event subscribed: ${eventName}`, { listenerId: listener.id });

    // Возвращаем функцию отписки
    return () => this.off(eventName, listener.id);
  }

  /**
   * Подписка на событие с обработкой один раз
   * @param {string} eventName - Название события
   * @param {Function} callback - Обработчик события
   * @param {Object} options - Опции подписки
   * @returns {Function} Функция отписки
   */
  once(eventName, callback, options = {}) {
    return this.on(eventName, callback, { ...options, once: true });
  }

  /**
   * Отписка от события
   * @param {string} eventName - Название события
   * @param {string} listenerId - ID обработчика
   */
  off(eventName, listenerId) {
    if (this.events.has(eventName)) {
      const listeners = this.events.get(eventName);
      for (const listener of listeners) {
        if (listener.id === listenerId) {
          listeners.delete(listener);
          this.log(`Event unsubscribed: ${eventName}`, { listenerId });
          break;
        }
      }

      if (listeners.size === 0) {
        this.events.delete(eventName);
      }
    }
  }

  /**
   * Отписка от всех событий
   * @param {Function} callback - Конкретный обработчик (опционально)
   */
  offAll(callback = null) {
    if (callback) {
      // Удаляем конкретный обработчик из всех событий
      for (const [eventName, listeners] of this.events) {
        for (const listener of listeners) {
          if (listener.callback === callback) {
            listeners.delete(listener);
          }
        }
        if (listeners.size === 0) {
          this.events.delete(eventName);
        }
      }
    } else {
      // Удаляем все события
      this.events.clear();
      this.onceEvents.clear();
    }
  }

  /**
   * Генерация события
   * @param {string} eventName - Название события
   * @param {*} data - Данные события
   * @param {Object} options - Опции генерации
   */
  emit(eventName, data = null, options = {}) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      source: options.source || "unknown",
      preventDefault: false,
      stopPropagation: false,
    };

    // Применяем middleware
    if (this.middlewares.length > 0) {
      for (const middleware of this.middlewares) {
        try {
          const result = middleware(event);
          if (result === false) {
            return; // Прерываем выполнение
          }
        } catch (error) {
          this.handleError("Middleware error", error, event);
        }
      }
    }

    // Сохраняем в историю
    this.addToHistory(event);

    // Обрабатываем событие
    this.processEvent(event);

    this.stats.emitted++;
    this.log(`Event emitted: ${eventName}`, { data, source: event.source });
  }

  /**
   * Асинхронная генерация события
   * @param {string} eventName - Название события
   * @param {*} data - Данные события
   * @param {Object} options - Опции генерации
   */
  async emitAsync(eventName, data = null, options = {}) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      source: options.source || "unknown",
      preventDefault: false,
      stopPropagation: false,
    };

    // Применяем middleware
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware(event);
        if (result === false) {
          return;
        }
      } catch (error) {
        this.handleError("Async middleware error", error, event);
      }
    }

    // Асинхронная обработка
    await this.processEventAsync(event);

    this.stats.emitted++;
    this.log(`Async event emitted: ${eventName}`, {
      data,
      source: event.source,
    });
  }

  /**
   * Добавление middleware
   * @param {Function} middleware - Функция middleware
   */
  use(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Middleware must be a function");
    }
    this.middlewares.push(middleware);
  }

  /**
   * Получение списка подписчиков
   * @param {string} eventName - Название события
   * @returns {Array} Массив подписчиков
   */
  getListeners(eventName) {
    const listeners = this.events.get(eventName);
    return listeners ? Array.from(listeners) : [];
  }

  /**
   * Получение всех событий
   * @returns {Array} Массив названий событий
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Получение истории событий
   * @param {number} limit - Ограничение количества
   * @returns {Array} Массив событий
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  /**
   * Очистка истории
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Получение статистики
   * @returns {Object} Статистика событий
   */
  getStats() {
    return {
      ...this.stats,
      eventsCount: this.events.size,
      listenersCount: Array.from(this.events.values()).reduce(
        (total, listeners) => total + listeners.size,
        0
      ),
      historySize: this.history.length,
    };
  }

  /**
   * Очистка всех событий
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
    this.history = [];
    this.stats = {
      emitted: 0,
      handled: 0,
      errors: 0,
    };
  }

  /**
   * Обработка события
   * @private
   */
  processEvent(event) {
    const listeners = this.events.get(event.name);

    if (!listeners || listeners.size === 0) {
      return;
    }

    const onceListeners = [];
    const listenersArray = Array.from(listeners);

    for (const listener of listenersArray) {
      try {
        if (event.stopPropagation) {
          break;
        }

        const context = listener.context || null;
        listener.callback.call(context, event);

        if (listener.once) {
          onceListeners.push(listener.id);
        }

        this.stats.handled++;
      } catch (error) {
        this.handleError("Event handler error", error, event, listener);
      }
    }

    // Удаляем once обработчики
    for (const listenerId of onceListeners) {
      this.off(event.name, listenerId);
    }
  }

  /**
   * Асинхронная обработка события
   * @private
   */
  async processEventAsync(event) {
    const listeners = this.events.get(event.name);

    if (!listeners || listeners.size === 0) {
      return;
    }

    const onceListeners = [];
    const listenersArray = Array.from(listeners);

    for (const listener of listenersArray) {
      try {
        if (event.stopPropagation) {
          break;
        }

        const context = listener.context || null;
        await listener.callback.call(context, event);

        if (listener.once) {
          onceListeners.push(listener.id);
        }

        this.stats.handled++;
      } catch (error) {
        this.handleError("Async event handler error", error, event, listener);
      }
    }

    // Удаляем once обработчики
    for (const listenerId of onceListeners) {
      this.off(event.name, listenerId);
    }
  }

  /**
   * Добавление события в историю
   * @private
   */
  addToHistory(event) {
    this.history.push({
      name: event.name,
      data: event.data,
      timestamp: event.timestamp,
      source: event.source,
    });

    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Обработка ошибок
   * @private
   */
  handleError(message, error, event, listener = null) {
    this.stats.errors++;

    const errorInfo = {
      message,
      error: error.message,
      stack: error.stack,
      event: event.name,
      listener: listener ? listener.id : null,
      timestamp: Date.now(),
    };

    this.log("EventBus Error", errorInfo);

    // Генерируем событие об ошибке только если это не ошибка EventBus
    if (event.name !== "eventbus:error") {
      this.emit("eventbus:error", errorInfo, { source: "EventBus" });
    }
  }

  /**
   * Логирование
   * @private
   */
  log(message, data = null) {
    if (this.debug) {
      console.log(`[EventBus] ${message}`, data);
    }
  }

  /**
   * Генерация ID обработчика
   * @private
   */
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default EventBus;