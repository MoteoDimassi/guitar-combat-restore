export class EventAggregator {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.aggregatedEvents = new Map();
    this.timers = new Map();
  }

  /**
   * Агрегация событий по времени
   * @param {string} eventName - Название события
   * @param {number} delay - Задержка агрегации
   * @param {Function} callback - Обработчик агрегированных событий
   */
  aggregateByTime(eventName, delay, callback) {
    this.eventBus.on(eventName, (event) => {
      if (!this.aggregatedEvents.has(eventName)) {
        this.aggregatedEvents.set(eventName, []);
      }

      this.aggregatedEvents.get(eventName).push(event);

      // Сбрасываем таймер
      if (this.timers.has(eventName)) {
        clearTimeout(this.timers.get(eventName));
      }

      // Устанавливаем новый таймер
      const timerId = setTimeout(() => {
        const events = this.aggregatedEvents.get(eventName) || [];
        callback(events);
        this.aggregatedEvents.delete(eventName);
        this.timers.delete(eventName);
      }, delay);

      this.timers.set(eventName, timerId);
    });
  }

  /**
   * Агрегация событий по количеству
   * @param {string} eventName - Название события
   * @param {number} count - Количество событий для агрегации
   * @param {Function} callback - Обработчик агрегированных событий
   */
  aggregateByCount(eventName, count, callback) {
    this.eventBus.on(eventName, (event) => {
      if (!this.aggregatedEvents.has(eventName)) {
        this.aggregatedEvents.set(eventName, []);
      }

      const events = this.aggregatedEvents.get(eventName);
      events.push(event);

      if (events.length >= count) {
        callback(events);
        this.aggregatedEvents.delete(eventName);
      }
    });
  }

  /**
   * Агрегация событий по условию
   * @param {string} eventName - Название события
   * @param {Function} condition - Условие агрегации
   * @param {Function} callback - Обработчик агрегированных событий
   */
  aggregateByCondition(eventName, condition, callback) {
    this.eventBus.on(eventName, (event) => {
      if (!this.aggregatedEvents.has(eventName)) {
        this.aggregatedEvents.set(eventName, []);
      }

      const events = this.aggregatedEvents.get(eventName);
      events.push(event);

      if (condition(events)) {
        callback(events);
        this.aggregatedEvents.delete(eventName);
      }
    });
  }

  /**
   * Очистка агрегации
   * @param {string} eventName - Название события (опционально)
   */
  clear(eventName = null) {
    if (eventName) {
      this.aggregatedEvents.delete(eventName);
      if (this.timers.has(eventName)) {
        clearTimeout(this.timers.get(eventName));
        this.timers.delete(eventName);
      }
    } else {
      this.aggregatedEvents.clear();
      this.timers.forEach((timerId) => clearTimeout(timerId));
      this.timers.clear();
    }
  }
}

export default EventAggregator;