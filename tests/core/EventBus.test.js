import { EventBus } from '../../js/core/EventBus.js';
import { EventMiddleware } from '../../js/core/EventMiddleware.js';
import { EventAggregator } from '../../js/core/EventAggregator.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus({ debug: false });
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('Базовая функциональность', () => {
    test('должен создаваться с настройками по умолчанию', () => {
      const defaultEventBus = new EventBus();
      expect(defaultEventBus.maxHistorySize).toBe(100);
      expect(defaultEventBus.debug).toBe(false);
    });

    test('должен принимать кастомные настройки', () => {
      const customEventBus = new EventBus({ 
        debug: true, 
        maxHistorySize: 200 
      });
      expect(customEventBus.debug).toBe(true);
      expect(customEventBus.maxHistorySize).toBe(200);
    });

    test('должен подписываться на события и вызывать обработчики', () => {
      const mockCallback = jest.fn();
      eventBus.on('test:event', mockCallback);
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test:event',
          data: { data: 'test' }
        })
      );
    });

    test('должен возвращать функцию отписки', () => {
      const mockCallback = jest.fn();
      const unsubscribe = eventBus.on('test:event', mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      eventBus.emit('test:event', { data: 'test' });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('должен обрабатывать несколько подписчиков одного события', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventBus.on('test:event', mockCallback1);
      eventBus.on('test:event', mockCallback2);
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
    });
  });

  describe('Приоритеты обработчиков', () => {
    test('должен вызывать обработчики в порядке приоритета', () => {
      const callOrder = [];
      
      eventBus.on('test:event', () => callOrder.push('low'), { priority: 1 });
      eventBus.on('test:event', () => callOrder.push('high'), { priority: 10 });
      eventBus.on('test:event', () => callOrder.push('medium'), { priority: 5 });
      
      eventBus.emit('test:event');
      
      expect(callOrder).toEqual(['high', 'medium', 'low']);
    });

    test('должен использовать приоритет по умолчанию (0)', () => {
      const callOrder = [];
      
      eventBus.on('test:event', () => callOrder.push('default'));
      eventBus.on('test:event', () => callOrder.push('high'), { priority: 10 });
      
      eventBus.emit('test:event');
      
      expect(callOrder).toEqual(['high', 'default']);
    });
  });

  describe('Одноразовые подписчики', () => {
    test('должен вызывать once обработчик только один раз', () => {
      const mockCallback = jest.fn();
      
      eventBus.once('test:event', mockCallback);
      
      eventBus.emit('test:event');
      eventBus.emit('test:event');
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('должен удалять once обработчик после вызова', () => {
      const mockCallback = jest.fn();
      
      eventBus.once('test:event', mockCallback);
      
      eventBus.emit('test:event');
      
      expect(eventBus.getListeners('test:event')).toHaveLength(0);
    });
  });

  describe('Контекст выполнения', () => {
    test('должен вызывать обработчик с указанным контекстом', () => {
      const context = { name: 'test-context' };
      const mockCallback = jest.fn(function() {
        expect(this).toBe(context);
      });
      
      eventBus.on('test:event', mockCallback, { context });
      eventBus.emit('test:event');
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен вызывать обработчик с null контекстом по умолчанию', () => {
      const mockCallback = jest.fn(function() {
        expect(this).toBe(null);
      });
      
      eventBus.on('test:event', mockCallback);
      eventBus.emit('test:event');
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Middleware', () => {
    test('должен применять middleware к событиям', () => {
      const middleware = jest.fn((event) => {
        event.data.transformed = true;
      });
      
      eventBus.use(middleware);
      
      const mockCallback = jest.fn();
      eventBus.on('test:event', mockCallback);
      
      eventBus.emit('test:event', { original: true });
      
      expect(middleware).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { original: true, transformed: true }
        })
      );
    });

    test('должен прерывать обработку если middleware возвращает false', () => {
      const middleware = jest.fn(() => false);
      const mockCallback = jest.fn();
      
      eventBus.use(middleware);
      eventBus.on('test:event', mockCallback);
      
      eventBus.emit('test:event');
      
      expect(middleware).toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки в middleware', () => {
      const errorMiddleware = jest.fn(() => {
        throw new Error('Middleware error');
      });
      
      const errorCallback = jest.fn();
      eventBus.on('eventbus:error', errorCallback);
      
      eventBus.use(errorMiddleware);
      
      expect(() => {
        eventBus.emit('test:event');
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('История событий', () => {
    test('должен сохранять события в историю', () => {
      eventBus.emit('test:event1', { data: 'test1' });
      eventBus.emit('test:event2', { data: 'test2' });
      
      const history = eventBus.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        name: 'test:event1',
        data: { data: 'test1' }
      });
      expect(history[1]).toMatchObject({
        name: 'test:event2',
        data: { data: 'test2' }
      });
    });

    test('должен ограничивать размер истории', () => {
      const smallEventBus = new EventBus({ maxHistorySize: 2 });
      
      smallEventBus.emit('event1');
      smallEventBus.emit('event2');
      smallEventBus.emit('event3');
      
      const history = smallEventBus.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('event2');
      expect(history[1].name).toBe('event3');
    });

    test('должен очищать историю', () => {
      eventBus.emit('test:event');
      expect(eventBus.getHistory()).toHaveLength(1);
      
      eventBus.clearHistory();
      expect(eventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('Статистика', () => {
    test('должен отслеживать статистику событий', () => {
      const mockCallback = jest.fn();
      eventBus.on('test:event', mockCallback);
      
      eventBus.emit('test:event');
      eventBus.emit('test:event');
      
      const stats = eventBus.getStats();
      
      expect(stats.emitted).toBe(2);
      expect(stats.handled).toBe(2);
      expect(stats.errors).toBe(0);
      expect(stats.eventsCount).toBe(1);
      expect(stats.listenersCount).toBe(1);
    });

    test('должен отслеживать ошибки', () => {
      eventBus.on('test:event', () => {
        throw new Error('Test error');
      });
      
      eventBus.emit('test:event');
      
      const stats = eventBus.getStats();
      
      expect(stats.errors).toBe(1);
    });
  });

  describe('Асинхронные события', () => {
    test('должен обрабатывать асинхронные события', async () => {
      const mockCallback = jest.fn(async (event) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        event.data.processed = true;
      });
      
      eventBus.on('test:event', mockCallback);
      
      await eventBus.emitAsync('test:event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки в асинхронных обработчиках', async () => {
      const errorCallback = jest.fn();
      eventBus.on('eventbus:error', errorCallback);
      
      eventBus.on('test:event', async () => {
        throw new Error('Async error');
      });
      
      await eventBus.emitAsync('test:event');
      
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Управление подписками', () => {
    test('должен отписываться по ID', () => {
      const mockCallback = jest.fn();
      const unsubscribe = eventBus.on('test:event', mockCallback);
      
      eventBus.emit('test:event');
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      eventBus.emit('test:event');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('должен отписываться от всех событий', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventBus.on('event1', mockCallback1);
      eventBus.on('event2', mockCallback2);
      
      eventBus.offAll();
      
      expect(eventBus.getEventNames()).toHaveLength(0);
    });

    test('должен отписывать конкретный обработчик от всех событий', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('event1', mockCallback);
      eventBus.on('event2', mockCallback);
      
      eventBus.offAll(mockCallback);
      
      expect(eventBus.getEventNames()).toHaveLength(0);
    });
  });

  describe('Получение информации о событиях', () => {
    test('должен возвращать список подписчиков', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventBus.on('test:event', mockCallback1);
      eventBus.on('test:event', mockCallback2);
      
      const listeners = eventBus.getListeners('test:event');
      
      expect(listeners).toHaveLength(2);
      expect(listeners[0].callback).toBe(mockCallback1);
      expect(listeners[1].callback).toBe(mockCallback2);
    });

    test('должен возвращать пустой массив для несуществующего события', () => {
      const listeners = eventBus.getListeners('nonexistent:event');
      expect(listeners).toHaveLength(0);
    });

    test('должен возвращать список всех событий', () => {
      eventBus.on('event1', jest.fn());
      eventBus.on('event2', jest.fn());
      
      const eventNames = eventBus.getEventNames();
      
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toHaveLength(2);
    });
  });

  describe('Продвинутая функциональность', () => {
    test('должен обрабатывать preventDefault', () => {
      const mockCallback = jest.fn((event) => {
        event.preventDefault();
      });
      const mockCallback2 = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.on('test:event', mockCallback2);
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
    });

    test('должен обрабатывать stopPropagation', () => {
      const mockCallback = jest.fn((event) => {
        event.stopPropagation();
      });
      const mockCallback2 = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.on('test:event', mockCallback2);
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback2).not.toHaveBeenCalled();
    });

    test('должен генерировать уникальные ID для обработчиков', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      const unsubscribe1 = eventBus.on('test:event', mockCallback1);
      const unsubscribe2 = eventBus.on('test:event', mockCallback2);
      
      const listeners = eventBus.getListeners('test:event');
      expect(listeners[0].id).not.toBe(listeners[1].id);
      expect(typeof listeners[0].id).toBe('string');
      expect(typeof listeners[1].id).toBe('string');
    });

    test('должен обрабатывать события с null данными', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.emit('test:event', null);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test:event',
          data: null
        })
      );
    });

    test('должен обрабатывать события с undefined данными', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.emit('test:event', undefined);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test:event',
          data: undefined
        })
      );
    });

    test('должен обрабатывать сложные объекты в данных', () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        function: () => 'test',
        date: new Date(),
        regex: /test/g
      };
      
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.emit('test:event', complexData);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test:event',
          data: complexData
        })
      );
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать ошибки в синхронных обработчиках', () => {
      const errorCallback = jest.fn();
      const throwingHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();
      
      eventBus.on('eventbus:error', errorCallback);
      eventBus.on('test:event', throwingHandler);
      eventBus.on('test:event', normalHandler);
      
      eventBus.emit('test:event');
      
      expect(throwingHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки в middleware', () => {
      const errorCallback = jest.fn();
      const errorMiddleware = jest.fn(() => {
        throw new Error('Middleware error');
      });
      const mockCallback = jest.fn();
      
      eventBus.on('eventbus:error', errorCallback);
      eventBus.use(errorMiddleware);
      eventBus.on('test:event', mockCallback);
      
      eventBus.emit('test:event');
      
      expect(errorMiddleware).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });

    test('должен продолжать работу после ошибки в обработчике', () => {
      const throwingHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();
      
      eventBus.on('test:event', throwingHandler);
      eventBus.on('test:event', normalHandler);
      
      expect(() => {
        eventBus.emit('test:event');
      }).not.toThrow();
      
      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('Производительность', () => {
    test('должен эффективно обрабатывать большое количество событий', () => {
      const startTime = performance.now();
      const callbackCount = 1000;
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      
      for (let i = 0; i < callbackCount; i++) {
        eventBus.emit('test:event', { data: i });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(mockCallback).toHaveBeenCalledTimes(callbackCount);
      expect(duration).toBeLessThan(100); // Должно выполняться быстро
    });

    test('должен эффективно обрабатывать большое количество обработчиков', () => {
      const handlerCount = 100;
      const handlers = [];
      
      for (let i = 0; i < handlerCount; i++) {
        const handler = jest.fn();
        handlers.push(handler);
        eventBus.on('test:event', handler);
      }
      
      const startTime = performance.now();
      eventBus.emit('test:event');
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
      
      expect(duration).toBeLessThan(50); // Должно выполняться быстро
    });
  });

  describe('Память и очистка', () => {
    test('должен корректно очищать память при отписке', () => {
      const mockCallback = jest.fn();
      const unsubscribe = eventBus.on('test:event', mockCallback);
      
      unsubscribe();
      
      expect(eventBus.getListeners('test:event')).toHaveLength(0);
      expect(eventBus.getEventNames()).not.toContain('test:event');
    });

    test('должен корректно очищать все события', () => {
      eventBus.on('event1', jest.fn());
      eventBus.on('event2', jest.fn());
      eventBus.on('event3', jest.fn());
      
      eventBus.clear();
      
      expect(eventBus.getEventNames()).toHaveLength(0);
      expect(eventBus.getHistory()).toHaveLength(0);
      
      const stats = eventBus.getStats();
      expect(stats.eventsCount).toBe(0);
      expect(stats.listenersCount).toBe(0);
      expect(stats.emitted).toBe(0);
      expect(stats.handled).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  describe('Отладка', () => {
    test('должен логировать в режиме отладки', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const debugEventBus = new EventBus({ debug: true });
      
      debugEventBus.on('test:event', jest.fn());
      debugEventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventBus] Event subscribed: test:event'),
        expect.any(Object)
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventBus] Event emitted: test:event'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    test('должен не логировать в обычном режиме', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      eventBus.on('test:event', jest.fn());
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[EventBus]')
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('EventMiddleware', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus({ debug: false });
  });

  describe('Logger middleware', () => {
    test('должен логировать события', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      eventBus.use(EventMiddleware.logger());
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен исключать указанные события из логирования', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ excludeEvents: ['test:event'] }));
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Validator middleware', () => {
    test('должен валидировать данные события', () => {
      const errorCallback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      eventBus.on('eventbus:error', errorCallback);
      
      eventBus.use(EventMiddleware.validator({
        'test:event': (data) => data.value > 0
      }));
      
      eventBus.emit('test:event', { value: -1 });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Validator] Invalid data for event: test:event',
        { value: -1 }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен пропускать валидные данные', () => {
      const mockCallback = jest.fn();
      eventBus.on('test:event', mockCallback);
      
      eventBus.use(EventMiddleware.validator({
        'test:event': (data) => data.value > 0
      }));
      
      eventBus.emit('test:event', { value: 5 });
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Transformer middleware', () => {
    test('должен трансформировать данные события', () => {
      const mockCallback = jest.fn();
      eventBus.on('test:event', mockCallback);
      
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => ({ ...data, transformed: true })
      }));
      
      eventBus.emit('test:event', { original: true });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { original: true, transformed: true }
        })
      );
    });
  });

  describe('Filter middleware', () => {
    test('должен фильтровать события', () => {
      const mockCallback = jest.fn();
      eventBus.on('test:event', mockCallback);
      
      eventBus.use(EventMiddleware.filter((event) => {
        return event.data && event.data.allowed;
      }));
      
      eventBus.emit('test:event', { allowed: false });
      eventBus.emit('test:event', { allowed: true });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { allowed: true }
        })
      );
    });
  });
});

describe('EventAggregator', () => {
  let eventBus;
  let aggregator;

  beforeEach(() => {
    eventBus = new EventBus({ debug: false });
    aggregator = new EventAggregator(eventBus);
  });

  afterEach(() => {
    aggregator.clear();
    eventBus.clear();
  });

  describe('Агрегация по времени', () => {
    test('должен агрегировать события по времени', (done) => {
      const mockCallback = jest.fn((events) => {
        expect(events).toHaveLength(2);
        expect(events[0].data.value).toBe(1);
        expect(events[1].data.value).toBe(2);
        done();
      });
      
      aggregator.aggregateByTime('test:event', 100, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
    });
  });

  describe('Агрегация по количеству', () => {
    test('должен агрегировать события по количеству', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', 3, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
      expect(mockCallback).not.toHaveBeenCalled();
      
      eventBus.emit('test:event', { value: 3 });
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: { value: 1 } }),
          expect.objectContaining({ data: { value: 2 } }),
          expect.objectContaining({ data: { value: 3 } })
        ])
      );
    });
  });

  describe('Агрегация по условию', () => {
    test('должен агрегировать события по условию', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCondition('test:event', (events) => {
        return events.length >= 2 && events.every(e => e.data.value > 5);
      }, mockCallback);
      
      eventBus.emit('test:event', { value: 3 });
      eventBus.emit('test:event', { value: 6 });
      expect(mockCallback).not.toHaveBeenCalled();
      
      eventBus.emit('test:event', { value: 7 });
      
      // Даем время на обработку события
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
      }, 10);
    });
  });

  describe('Очистка агрегации', () => {
    test('должен очищать агрегацию для конкретного события', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', 100, mockCallback);
      aggregator.clear('test:event');
      
      eventBus.emit('test:event', { value: 1 });
      
      setTimeout(() => {
        expect(mockCallback).not.toHaveBeenCalled();
      }, 150);
    });

    test('должен очищать всю агрегацию', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      aggregator.aggregateByTime('event1', 100, mockCallback1);
      aggregator.aggregateByTime('event2', 100, mockCallback2);
      aggregator.clear();
      
      eventBus.emit('event1', { value: 1 });
      eventBus.emit('event2', { value: 2 });
      
      setTimeout(() => {
        expect(mockCallback1).not.toHaveBeenCalled();
        expect(mockCallback2).not.toHaveBeenCalled();
      }, 150);
    });
  });
});