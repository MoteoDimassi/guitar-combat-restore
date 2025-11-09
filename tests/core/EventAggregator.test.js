import { EventAggregator } from '../../js/core/EventAggregator.js';
import { EventBus } from '../../js/core/EventBus.js';

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

  describe('Инициализация', () => {
    test('должен создаваться с EventBus', () => {
      expect(aggregator.eventBus).toBe(eventBus);
      expect(aggregator.aggregatedEvents.size).toBe(0);
      expect(aggregator.timers.size).toBe(0);
    });
  });

  describe('Агрегация по времени', () => {
    test('должен агрегировать события по времени', (done) => {
      const mockCallback = jest.fn((events) => {
        expect(events).toHaveLength(2);
        expect(events[0].data.value).toBe(1);
        expect(events[1].data.value).toBe(2);
        expect(events[0].name).toBe('test:event');
        expect(events[1].name).toBe('test:event');
        done();
      });
      
      aggregator.aggregateByTime('test:event', 50, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
    });

    test('должен сбрасывать таймер при каждом событии', (done) => {
      const mockCallback = jest.fn((events) => {
        expect(events).toHaveLength(1);
        expect(events[0].data.value).toBe(3);
        done();
      });
      
      aggregator.aggregateByTime('test:event', 100, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      setTimeout(() => {
        eventBus.emit('test:event', { value: 2 });
      }, 50);
      
      setTimeout(() => {
        eventBus.emit('test:event', { value: 3 });
      }, 120);
    });

    test('должен очищать таймер после вызова callback', (done) => {
      const mockCallback = jest.fn((events) => {
        expect(events).toHaveLength(1);
        expect(aggregator.timers.has('test:event')).toBe(false);
        expect(aggregator.aggregatedEvents.has('test:event')).toBe(false);
        done();
      });
      
      aggregator.aggregateByTime('test:event', 50, mockCallback);
      eventBus.emit('test:event', { value: 1 });
    });

    test('должен обрабатывать несколько типов событий одновременно', (done) => {
      let callbackCount = 0;
      const callback1 = jest.fn((events) => {
        expect(events).toHaveLength(2);
        expect(events[0].data.value).toBe(1);
        expect(events[1].data.value).toBe(2);
        callbackCount++;
        if (callbackCount === 2) done();
      });
      
      const callback2 = jest.fn((events) => {
        expect(events).toHaveLength(1);
        expect(events[0].data.value).toBe('a');
        callbackCount++;
        if (callbackCount === 2) done();
      });
      
      aggregator.aggregateByTime('event1', 50, callback1);
      aggregator.aggregateByTime('event2', 50, callback2);
      
      eventBus.emit('event1', { value: 1 });
      eventBus.emit('event2', { value: 'a' });
      eventBus.emit('event1', { value: 2 });
    });

    test('должен обрабатывать пустые события', (done) => {
      const mockCallback = jest.fn((events) => {
        expect(events).toHaveLength(2);
        expect(events[0].data).toBeNull();
        expect(events[1].data).toBeUndefined();
        done();
      });
      
      aggregator.aggregateByTime('test:event', 50, mockCallback);
      
      eventBus.emit('test:event', null);
      eventBus.emit('test:event', undefined);
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

    test('должен очищать агрегированные события после вызова callback', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', 2, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(aggregator.aggregatedEvents.has('test:event')).toBe(false);
    });

    test('должен начинать новую агрегацию после завершения предыдущей', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', 2, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      eventBus.emit('test:event', { value: 3 });
      eventBus.emit('test:event', { value: 4 });
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    test('должен обрабатывать количество 1', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', 1, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: { value: 1 } })
        ])
      );
    });
  });

  describe('Агрегация по условию', () => {
    test('должен агрегировать события по условию', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCondition('test:event', (events) => {
        return events.length >= 3 && events.every(e => e.data.value > 5);
      }, mockCallback);
      
      eventBus.emit('test:event', { value: 3 });
      eventBus.emit('test:event', { value: 6 });
      eventBus.emit('test:event', { value: 7 });
      
      expect(mockCallback).not.toHaveBeenCalled();
      
      eventBus.emit('test:event', { value: 8 });
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: { value: 6 } }),
          expect.objectContaining({ data: { value: 7 } }),
          expect.objectContaining({ data: { value: 8 } })
        ])
      );
    });

    test('должен очищать агрегированные события после выполнения условия', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCondition('test:event', (events) => {
        return events.length >= 2;
      }, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(aggregator.aggregatedEvents.has('test:event')).toBe(false);
    });

    test('должен обрабатывать сложные условия', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCondition('test:event', (events) => {
        const sum = events.reduce((acc, e) => acc + e.data.value, 0);
        return sum >= 10;
      }, mockCallback);
      
      eventBus.emit('test:event', { value: 3 });
      eventBus.emit('test:event', { value: 4 });
      
      expect(mockCallback).not.toHaveBeenCalled();
      
      eventBus.emit('test:event', { value: 5 });
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен обрабатывать условия с доступом к метаданным события', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCondition('test:event', (events) => {
        return events.some(e => e.source === 'test-source');
      }, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 }, { source: 'test-source' });
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Очистка агрегации', () => {
    test('должен очищать агрегацию для конкретного события', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', 100, mockCallback);
      aggregator.aggregateByTime('other:event', 100, jest.fn());
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('other:event', { value: 2 });
      
      expect(aggregator.aggregatedEvents.has('test:event')).toBe(true);
      expect(aggregator.aggregatedEvents.has('other:event')).toBe(true);
      expect(aggregator.timers.has('test:event')).toBe(true);
      expect(aggregator.timers.has('other:event')).toBe(true);
      
      aggregator.clear('test:event');
      
      expect(aggregator.aggregatedEvents.has('test:event')).toBe(false);
      expect(aggregator.aggregatedEvents.has('other:event')).toBe(true);
      expect(aggregator.timers.has('test:event')).toBe(false);
      expect(aggregator.timers.has('other:event')).toBe(true);
    });

    test('должен очищать всю агрегацию', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      aggregator.aggregateByTime('event1', 100, mockCallback1);
      aggregator.aggregateByTime('event2', 100, mockCallback2);
      
      eventBus.emit('event1', { value: 1 });
      eventBus.emit('event2', { value: 2 });
      
      expect(aggregator.aggregatedEvents.size).toBe(2);
      expect(aggregator.timers.size).toBe(2);
      
      aggregator.clear();
      
      expect(aggregator.aggregatedEvents.size).toBe(0);
      expect(aggregator.timers.size).toBe(0);
    });

    test('должен очищать таймеры', (done) => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', 50, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(aggregator.timers.has('test:event')).toBe(true);
      
      aggregator.clear('test:event');
      
      setTimeout(() => {
        expect(mockCallback).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать ошибки в callback', (done) => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      aggregator.aggregateByTime('test:event', 50, () => {
        throw new Error('Callback error');
      });
      
      eventBus.emit('test:event', { value: 1 });
      
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error in event aggregator callback:',
          expect.any(Error)
        );
        consoleSpy.mockRestore();
        done();
      }, 100);
    });

    test('должен продолжать работу после ошибки в callback', (done) => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', 50, errorCallback);
      aggregator.aggregateByTime('test:event2', 50, normalCallback);
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event2', { value: 2 });
      
      setTimeout(() => {
        expect(normalCallback).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать нулевую задержку', (done) => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', 0, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 10);
    });

    test('должен обрабатывать отрицательную задержку', (done) => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', -10, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        done();
      }, 10);
    });

    test('должен обрабатывать количество 0', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', 0, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен обрабатывать отрицательное количество', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', -1, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен обрабатывать пустое условие', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCondition('test:event', () => true, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Интеграция с EventBus', () => {
    test('должен работать с различными типами событий EventBus', () => {
      const mockCallback = jest.fn();
      
      aggregator.aggregateByTime('test:event', 50, mockCallback);
      
      // Тестируем с разными опциями события
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 }, { source: 'test' });
      
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalled();
        const events = mockCallback.mock.calls[0][0];
        expect(events[0].name).toBe('test:event');
        expect(events[1].name).toBe('test:event');
        expect(events[1].source).toBe('test');
      }, 100);
    });

    test('должен работать с middleware EventBus', () => {
      const mockCallback = jest.fn();
      const middleware = jest.fn((event) => {
        event.data.transformed = true;
      });
      
      eventBus.use(middleware);
      aggregator.aggregateByTime('test:event', 50, mockCallback);
      
      eventBus.emit('test:event', { value: 1 });
      
      setTimeout(() => {
        expect(middleware).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalled();
        const events = mockCallback.mock.calls[0][0];
        expect(events[0].data.transformed).toBe(true);
      }, 100);
    });
  });

  describe('Производительность', () => {
    test('должен эффективно обрабатывать большое количество событий', (done) => {
      const eventCount = 1000;
      const mockCallback = jest.fn();
      
      aggregator.aggregateByCount('test:event', eventCount, mockCallback);
      
      const startTime = performance.now();
      
      for (let i = 0; i < eventCount; i++) {
        eventBus.emit('test:event', { value: i });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(mockCallback).toHaveBeenCalled();
      expect(duration).toBeLessThan(100); // Должно выполняться быстро
      
      done();
    });

    test('должен эффективно обрабатывать множество агрегаций', () => {
      const aggregationCount = 100;
      
      for (let i = 0; i < aggregationCount; i++) {
        aggregator.aggregateByCount(`event${i}`, 2, jest.fn());
      }
      
      const startTime = performance.now();
      
      for (let i = 0; i < aggregationCount; i++) {
        eventBus.emit(`event${i}`, { value: 1 });
        eventBus.emit(`event${i}`, { value: 2 });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Должно выполняться быстро
    });
  });
});