import { EventMiddleware } from '../../js/core/EventMiddleware.js';
import { EventBus } from '../../js/core/EventBus.js';

describe('EventMiddleware', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus({ debug: false });
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('Logger middleware', () => {
    test('должен логировать события с уровнем info по умолчанию', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      eventBus.use(EventMiddleware.logger());
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен логировать события с уровнем debug', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ logLevel: 'debug' }));
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен логировать события с уровнем warn', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ logLevel: 'warn' }));
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен логировать события с уровнем error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ logLevel: 'error' }));
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен логировать события с уровнем по умолчанию', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ logLevel: 'invalid' }));
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен исключать указанные события из логирования', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ 
        logLevel: 'info',
        excludeEvents: ['excluded:event']
      }));
      
      eventBus.emit('test:event', { data: 'test' });
      eventBus.emit('excluded:event', { data: 'excluded' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { data: 'test' }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен исключать данные из логирования', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      eventBus.use(EventMiddleware.logger({ 
        includeData: false
      }));
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        undefined
      );
      
      consoleSpy.mockRestore();
    });

    test('должен возвращать true для продолжения обработки', () => {
      const middleware = EventMiddleware.logger();
      const event = { name: 'test:event', data: 'test' };
      
      const result = middleware(event);
      
      expect(result).toBe(true);
    });
  });

  describe('Performance middleware', () => {
    test('должен измерять производительность', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      eventBus.use(EventMiddleware.performance({ 
        threshold: 0,
        includeEvents: ['test:event']
      }));
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] test:event:'),
        expect.any(String)
      );
      
      consoleSpy.mockRestore();
    });

    test('должен измерять только события выше порога', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      eventBus.use(EventMiddleware.performance({ 
        threshold: 1000 // Высокий порог
      }));
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('должен измерять указанные события', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      eventBus.use(EventMiddleware.performance({ 
        includeEvents: ['measured:event']
      }));
      
      eventBus.emit('test:event', { data: 'test' });
      eventBus.emit('measured:event', { data: 'measured' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] measured:event:'),
        expect.any(String)
      );
      
      consoleSpy.mockRestore();
    });

    test('должен возвращать функцию для завершения измерения', () => {
      const middleware = EventMiddleware.performance();
      const event = { name: 'test:event', data: 'test' };
      
      const result = middleware(event);
      
      expect(typeof result).toBe('function');
    });
  });

  describe('Validator middleware', () => {
    test('должен валидировать данные события', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
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

    test('должен обрабатывать события без валидатора', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.validator({
        'other:event': (data) => data.value > 0
      }));
      
      eventBus.emit('test:event', { value: -1 });
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен возвращать false для невалидных данных', () => {
      const middleware = EventMiddleware.validator({
        'test:event': (data) => data.value > 0
      });
      const event = { name: 'test:event', data: { value: -1 } };
      
      const result = middleware(event);
      
      expect(result).toBe(false);
    });

    test('должен возвращать true для валидных данных', () => {
      const middleware = EventMiddleware.validator({
        'test:event': (data) => data.value > 0
      });
      const event = { name: 'test:event', data: { value: 5 } };
      
      const result = middleware(event);
      
      expect(result).toBe(true);
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

    test('должен возвращать false отфильтрованных событий', () => {
      const middleware = EventMiddleware.filter(() => false);
      const event = { name: 'test:event', data: 'test' };
      
      const result = middleware(event);
      
      expect(result).toBe(false);
    });

    test('должен возвращать true для пропущенных событий', () => {
      const middleware = EventMiddleware.filter(() => true);
      const event = { name: 'test:event', data: 'test' };
      
      const result = middleware(event);
      
      expect(result).toBe(true);
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

    test('должен изменять данные события', () => {
      const middleware = EventMiddleware.transformer({
        'test:event': (data) => ({ ...data, transformed: true })
      });
      const event = { name: 'test:event', data: { original: true } };
      
      middleware(event);
      
      expect(event.data).toEqual({ original: true, transformed: true });
    });

    test('должен обрабатывать события без трансформера', () => {
      const originalData = { original: true };
      const middleware = EventMiddleware.transformer({
        'other:event': (data) => ({ ...data, transformed: true })
      });
      const event = { name: 'test:event', data: originalData };
      
      middleware(event);
      
      expect(event.data).toBe(originalData);
    });
  });

  describe('Debounce middleware', () => {
    test('должен откладывать события', (done) => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.debounce(50));
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
      
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { value: 2 }
          })
        );
        done();
      }, 100);
    });

    test('должен возвращать false для отложенных событий', () => {
      const middleware = EventMiddleware.debounce(50);
      const event = { name: 'test:event', data: 'test' };
      
      const result = middleware(event);
      
      expect(result).toBe(false);
    });

    test('должен обрабатывать разные типы событий отдельно', (done) => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventBus.on('event1', mockCallback1);
      eventBus.on('event2', mockCallback2);
      eventBus.use(EventMiddleware.debounce(50));
      
      eventBus.emit('event1', { value: 1 });
      eventBus.emit('event2', { value: 2 });
      
      setTimeout(() => {
        expect(mockCallback1).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });
  });

  describe('Throttle middleware', () => {
    test('должен ограничивать частоту событий', (done) => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.throttle(50));
      
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
      
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { value: 1 }
          })
        );
        
        setTimeout(() => {
          eventBus.emit('test:event', { value: 3 });
          expect(mockCallback).toHaveBeenCalledTimes(2);
          done();
        }, 60);
      }, 10);
    });

    test('должен возвращать false для пропущенных событий', () => {
      const middleware = EventMiddleware.throttle(50);
      const event = { name: 'test:event', data: 'test' };
      
      // Первое событие должно пройти
      expect(middleware(event)).toBe(true);
      
      // Второе событие должно быть пропущено
      expect(middleware(event)).toBe(false);
    });

    test('должен обрабатывать разные типы событий отдельно', () => {
      const middleware = EventMiddleware.throttle(50);
      const event1 = { name: 'event1', data: 'test1' };
      const event2 = { name: 'event2', data: 'test2' };
      
      expect(middleware(event1)).toBe(true);
      expect(middleware(event2)).toBe(true);
    });
  });

  describe('Композиция middleware', () => {
    test('должен работать несколько middleware вместе', () => {
      const mockCallback = jest.fn();
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.logger());
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => ({ ...data, transformed: true })
      }));
      eventBus.use(EventMiddleware.filter((event) => event.data.allowed));
      
      eventBus.emit('test:event', { allowed: true, original: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] test:event',
        { allowed: true, original: true, transformed: true }
      );
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { allowed: true, original: true, transformed: true }
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('должен обрабатывать порядок middleware', () => {
      const callOrder = [];
      
      eventBus.use(EventMiddleware.logger({
        logLevel: 'info'
      }));
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => {
          callOrder.push('transformer');
          return data;
        }
      }));
      eventBus.use(EventMiddleware.filter((event) => {
        callOrder.push('filter');
        return true;
      }));
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(callOrder).toEqual(['transformer', 'filter']);
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать ошибки в валидаторе', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      eventBus.use(EventMiddleware.validator({
        'test:event': (data) => {
          throw new Error('Validator error');
        }
      }));
      
      eventBus.emit('test:event', { value: 1 });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Validator] Invalid data for event: test:event',
        { value: 1 }
      );
      
      consoleSpy.mockRestore();
    });

    test('должен обрабатывать ошибки в трансформере', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => {
          throw new Error('Transformer error');
        }
      }));
      
      expect(() => {
        eventBus.emit('test:event', { value: 1 });
      }).not.toThrow();
      
      expect(mockCallback).toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки в фильтре', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.filter((event) => {
        throw new Error('Filter error');
      }));
      
      expect(() => {
        eventBus.emit('test:event', { value: 1 });
      }).not.toThrow();
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать null данные', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => ({ transformed: true })
      }));
      
      eventBus.emit('test:event', null);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { transformed: true }
        })
      );
    });

    test('должен обрабатывать undefined данные', () => {
      const mockCallback = jest.fn();
      
      eventBus.on('test:event', mockCallback);
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => ({ transformed: true })
      }));
      
      eventBus.emit('test:event', undefined);
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { transformed: true }
        })
      );
    });

    test('должен обрабатывать пустые опции', () => {
      const middleware = EventMiddleware.logger({});
      const event = { name: 'test:event', data: 'test' };
      
      expect(() => middleware(event)).not.toThrow();
    });

    test('должен обрабатывать отсутствующие опции', () => {
      const middleware = EventMiddleware.logger();
      const event = { name: 'test:event', data: 'test' };
      
      expect(() => middleware(event)).not.toThrow();
    });
  });
});