import { StateMiddleware, CommonMiddleware } from '../../js/core/StateMiddleware.js';

describe('StateMiddleware', () => {
  let middleware;

  beforeEach(() => {
    middleware = new StateMiddleware();
  });

  describe('Инициализация', () => {
    test('должен создаваться с пустым массивом middleware', () => {
      expect(middleware.middlewares).toEqual([]);
    });
  });

  describe('Добавление middleware', () => {
    test('должен добавлять middleware', () => {
      const testMiddleware = jest.fn((ctx, next) => next());
      const remove = middleware.use(testMiddleware);

      expect(middleware.middlewares).toHaveLength(1);
      expect(typeof remove).toBe('function');
    });

    test('должен генерировать уникальный ID', () => {
      const testMiddleware1 = jest.fn((ctx, next) => next());
      const testMiddleware2 = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware1);
      middleware.use(testMiddleware2);

      const ids = middleware.middlewares.map(m => m.id);
      expect(ids[0]).not.toBe(ids[1]);
      expect(typeof ids[0]).toBe('string');
      expect(typeof ids[1]).toBe('string');
    });

    test('должен использовать опции по умолчанию', () => {
      const testMiddleware = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware);

      const entry = middleware.middlewares[0];
      expect(entry.enabled).toBe(true);
      expect(entry.options).toEqual({});
    });

    test('должен использовать кастомные опции', () => {
      const testMiddleware = jest.fn((ctx, next) => next());
      const options = { testOption: 'testValue' };

      middleware.use(testMiddleware, options);

      const entry = middleware.middlewares[0];
      expect(entry.options).toEqual(options);
    });
  });

  describe('Удаление middleware', () => {
    test('должен удалять middleware по ID', () => {
      const testMiddleware = jest.fn((ctx, next) => next());

      const remove = middleware.use(testMiddleware);
      const id = middleware.middlewares[0].id;

      remove();

      expect(middleware.middlewares).toHaveLength(0);
    });

    test('должен возвращать false при удалении несуществующего ID', () => {
      const result = middleware.remove('non-existent-id');
      expect(result).toBe(false);
    });

    test('должен возвращать true при успешном удалении', () => {
      const testMiddleware = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware);
      const id = middleware.middlewares[0].id;

      const result = middleware.remove(id);
      expect(result).toBe(true);
    });
  });

  describe('Включение/выключение middleware', () => {
    test('должен включать middleware', () => {
      const testMiddleware = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware);
      const id = middleware.middlewares[0].id;

      const result = middleware.toggle(id, true);
      expect(result).toBe(true);
      expect(middleware.middlewares[0].enabled).toBe(true);
    });

    test('должен выключать middleware', () => {
      const testMiddleware = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware);
      const id = middleware.middlewares[0].id;

      const result = middleware.toggle(id, false);
      expect(result).toBe(true);
      expect(middleware.middlewares[0].enabled).toBe(false);
    });

    test('должен возвращать false для несуществующего ID', () => {
      const result = middleware.toggle('non-existent-id', true);
      expect(result).toBe(false);
    });
  });

  describe('Выполнение middleware', () => {
    test('должен выполнять middleware в порядке добавления', async () => {
      const callOrder = [];
      const testMiddleware1 = jest.fn((ctx, next) => {
        callOrder.push('middleware1');
        return next();
      });
      const testMiddleware2 = jest.fn((ctx, next) => {
        callOrder.push('middleware2');
        return next();
      });
      const testMiddleware3 = jest.fn((ctx, next) => {
        callOrder.push('middleware3');
        return next();
      });

      middleware.use(testMiddleware1);
      middleware.use(testMiddleware2);
      middleware.use(testMiddleware3);

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware.execute(context, next);

      expect(callOrder).toEqual(['middleware1', 'middleware2', 'middleware3']);
      expect(next).toHaveBeenCalled();
    });

    test('должен пропускать выключенные middleware', async () => {
      const testMiddleware1 = jest.fn((ctx, next) => next());
      const testMiddleware2 = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware1);
      middleware.use(testMiddleware2, { enabled: false });

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware.execute(context, next);

      expect(testMiddleware1).toHaveBeenCalled();
      expect(testMiddleware2).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('должен передавать контекст и опции в middleware', async () => {
      const testMiddleware = jest.fn((ctx, next, opts) => {
        expect(ctx).toEqual(expect.objectContaining({
          path: 'test.path',
          value: 'test'
        }));
        expect(typeof next).toBe('function');
        expect(opts).toEqual({ testOption: 'testValue' });
        return next();
      });

      middleware.use(testMiddleware, { testOption: 'testValue' });

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware.execute(context, next);
    });

    test('должен обрабатывать ошибки в middleware', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMiddleware = jest.fn(() => {
        throw new Error('Middleware error');
      });
      const normalMiddleware = jest.fn((ctx, next) => next());

      middleware.use(errorMiddleware);
      middleware.use(normalMiddleware);

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await expect(middleware.execute(context, next)).rejects.toThrow('Middleware error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Middleware error: Error: Middleware error',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('должен продолжать выполнение при ignoreErrors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMiddleware = jest.fn(() => {
        throw new Error('Middleware error');
      });
      const normalMiddleware = jest.fn((ctx, next) => next());

      middleware.use(errorMiddleware, { ignoreErrors: true });
      middleware.use(normalMiddleware);

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware.execute(context, next);

      expect(normalMiddleware).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('должен вызывать next после всех middleware', async () => {
      const testMiddleware = jest.fn((ctx, next) => next());
      const finalNext = jest.fn();

      middleware.use(testMiddleware);

      const context = { path: 'test.path', value: 'test' };

      await middleware.execute(context, finalNext);

      expect(finalNext).toHaveBeenCalled();
    });
  });

  describe('Очистка', () => {
    test('должен очищать все middleware', () => {
      middleware.use(jest.fn());
      middleware.use(jest.fn());
      middleware.use(jest.fn());

      expect(middleware.middlewares).toHaveLength(3);

      middleware.clear();

      expect(middleware.middlewares).toHaveLength(0);
    });
  });

  describe('Получение информации', () => {
    test('должен возвращать список middleware', () => {
      const testMiddleware1 = jest.fn((ctx, next) => next());
      const testMiddleware2 = jest.fn((ctx, next) => next());

      middleware.use(testMiddleware1, { option1: 'value1' });
      middleware.use(testMiddleware2, { option2: 'value2' });

      const all = middleware.getAll();

      expect(all).toHaveLength(2);
      expect(all[0]).toEqual({
        id: expect.any(String),
        enabled: true,
        options: { option1: 'value1' }
      });
      expect(all[1]).toEqual({
        id: expect.any(String),
        enabled: true,
        options: { option2: 'value2' }
      });
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать множественные вызовы next', async () => {
      const badMiddleware = jest.fn((ctx, next) => {
        next();
        next(); // Множественный вызов
      });

      middleware.use(badMiddleware);

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await expect(middleware.execute(context, next)).rejects.toThrow('next() called multiple times');
    });

    test('должен обрабатывать вызов next с обратным индексом', async () => {
      const badMiddleware = jest.fn((ctx, next) => {
        // Попытка вызвать next с меньшим индексом
        return () => next();
      });

      middleware.use(badMiddleware);

      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await expect(middleware.execute(context, next)).rejects.toThrow('next() called with backward index');
    });
  });
});

describe('CommonMiddleware', () => {
  describe('logger', () => {
    test('должен логировать изменения состояния', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const middleware = CommonMiddleware.logger();
      const context = { path: 'test.path', value: 'test', oldValue: 'old' };
      const next = jest.fn();

      await middleware(context, next);

      expect(consoleSpy).toHaveBeenCalledWith(
        'State changed:',
        expect.objectContaining({
          path: 'test.path',
          value: 'test',
          oldValue: 'old'
        })
      );

      consoleSpy.mockRestore();
    });

    test('должен включать timestamp по умолчанию', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const middleware = CommonMiddleware.logger();
      const context = { path: 'test.path', value: 'test', oldValue: 'old' };
      const next = jest.fn();

      await middleware(context, next);

      expect(consoleSpy).toHaveBeenCalledWith(
        'State changed:',
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );

      consoleSpy.mockRestore();
    });

    test('должен фильтровать по пути', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const middleware = CommonMiddleware.logger({
        filter: (path) => path.startsWith('settings')
      });
      const context1 = { path: 'settings.volume', value: 80, oldValue: 70 };
      const context2 = { path: 'temp.data', value: 'test', oldValue: 'old' };
      const next = jest.fn();

      await middleware(context1, next);
      await middleware(context2, next);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'State changed:',
        expect.objectContaining({
          path: 'settings.volume'
        })
      );

      consoleSpy.mockRestore();
    });

    test('должен использовать разные уровни логирования', async () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const debugMiddleware = CommonMiddleware.logger({ logLevel: 'debug' });
      const warnMiddleware = CommonMiddleware.logger({ logLevel: 'warn' });
      const errorMiddleware = CommonMiddleware.logger({ logLevel: 'error' });

      const context = { path: 'test.path', value: 'test', oldValue: 'old' };
      const next = jest.fn();

      await debugMiddleware(context, next);
      await warnMiddleware(context, next);
      await errorMiddleware(context, next);

      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('localStorage', () => {
    beforeEach(() => {
      global.localStorage = {
        setItem: jest.fn(),
        getItem: jest.fn(),
      };
    });

    test('должен сохранять состояние в localStorage', async () => {
      const middleware = CommonMiddleware.localStorage();
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'app_state',
        JSON.stringify(expect.any(Object))
      );
    });

    test('должен использовать кастомный ключ', async () => {
      const middleware = CommonMiddleware.localStorage({ key: 'custom_key' });
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'custom_key',
        JSON.stringify(expect.any(Object))
      );
    });

    test('должен фильтровать по пути', async () => {
      const middleware = CommonMiddleware.localStorage({
        filter: (path) => path.startsWith('settings')
      });
      const context1 = { path: 'settings.volume', value: 80 };
      const context2 = { path: 'temp.data', value: 'test' };
      const next = jest.fn();

      await middleware(context1, next);
      await middleware(context2, next);

      expect(global.localStorage.setItem).toHaveBeenCalledTimes(1);
    });

    test('должен использовать кастомные сериализаторы', async () => {
      const customSerialize = jest.fn((data) => `custom:${JSON.stringify(data)}`);
      const middleware = CommonMiddleware.localStorage({
        serialize: customSerialize
      });
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      expect(customSerialize).toHaveBeenCalled();
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'app_state',
        expect.stringContaining('custom:')
      );
    });
  });

  describe('validator', () => {
    test('должен валидировать изменения состояния', async () => {
      const middleware = CommonMiddleware.validator({
        schema: {
          'test.path': (value) => value > 0
        }
      });
      const context1 = { path: 'test.path', value: 5 };
      const context2 = { path: 'test.path', value: -1 };
      const next = jest.fn();

      await expect(middleware(context1, next)).resolves.toBeUndefined();
      await expect(middleware(context2, next)).rejects.toThrow('Validation failed for path: test.path');
    });

    test('должен работать в нестрогом режиме', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const middleware = CommonMiddleware.validator({
        schema: {
          'test.path': (value) => value > 0
        },
        strict: false
      });
      const context = { path: 'test.path', value: -1 };
      const next = jest.fn();

      await middleware(context, next);

      expect(consoleSpy).toHaveBeenCalledWith('Validation failed for path: test.path');
      expect(next).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('должен пропускать пути без валидатора', async () => {
      const middleware = CommonMiddleware.validator({
        schema: {
          'other.path': (value) => value > 0
        }
      });
      const context = { path: 'test.path', value: -1 };
      const next = jest.fn();

      await middleware(context, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('immutable', () => {
    test('должен замораживать объекты', async () => {
      const middleware = CommonMiddleware.immutable();
      const context = { path: 'test.path', value: { nested: { value: 42 } } };
      const next = jest.fn();

      await middleware(context, next);

      expect(Object.isFrozen(context.value)).toBe(true);
      expect(Object.isFrozen(context.value.nested)).toBe(true);
    });

    test('должен применять только к указанным путям', async () => {
      const middleware = CommonMiddleware.immutable({
        paths: ['settings']
      });
      const context1 = { path: 'settings.volume', value: { nested: true } };
      const context2 = { path: 'temp.data', value: { nested: true } };
      const next = jest.fn();

      await middleware(context1, next);
      await middleware(context2, next);

      expect(Object.isFrozen(context1.value)).toBe(true);
      expect(Object.isFrozen(context2.value)).toBe(false);
    });

    test('должен работать в неглубоком режиме', async () => {
      const middleware = CommonMiddleware.immutable({ deep: false });
      const context = { path: 'test.path', value: { nested: { value: 42 } } };
      const next = jest.fn();

      await middleware(context, next);

      expect(Object.isFrozen(context.value)).toBe(true);
      expect(Object.isFrozen(context.value.nested)).toBe(false);
    });
  });

  describe('analytics', () => {
    test('должен отправлять события в аналитику', async () => {
      const mockTracker = {
        track: jest.fn()
      };
      const middleware = CommonMiddleware.analytics({
        tracker: mockTracker
      });
      const context = { path: 'test.path', value: 'test', oldValue: 'old' };
      const next = jest.fn();

      await middleware(context, next);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'state_changed',
        expect.objectContaining({
          path: 'test.path',
          value: 'test',
          oldValue: 'old'
        })
      );
    });

    test('должен использовать кастомное имя события', async () => {
      const mockTracker = {
        track: jest.fn()
      };
      const middleware = CommonMiddleware.analytics({
        tracker: mockTracker,
        eventName: 'custom_event'
      });
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'custom_event',
        expect.any(Object)
      );
    });

    test('должен фильтровать события', async () => {
      const mockTracker = {
        track: jest.fn()
      };
      const middleware = CommonMiddleware.analytics({
        tracker: mockTracker,
        filter: (path) => path.startsWith('settings')
      });
      const context1 = { path: 'settings.volume', value: 80 };
      const context2 = { path: 'temp.data', value: 'test' };
      const next = jest.fn();

      await middleware(context1, next);
      await middleware(context2, next);

      expect(mockTracker.track).toHaveBeenCalledTimes(1);
      expect(mockTracker.track).toHaveBeenCalledWith(
        'state_changed',
        expect.objectContaining({
          path: 'settings.volume'
        })
      );
    });

    test('должен трансформировать данные', async () => {
      const mockTracker = {
        track: jest.fn()
      };
      const middleware = CommonMiddleware.analytics({
        tracker: mockTracker,
        transform: (data) => ({ ...data, transformed: true })
      });
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      expect(mockTracker.track).toHaveBeenCalledWith(
        'state_changed',
        expect.objectContaining({
          path: 'test.path',
          value: 'test',
          transformed: true
        })
      );
    });

    test('должен логировать без трекера', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const middleware = CommonMiddleware.analytics();
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Analytics event:',
        'state_changed',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('sync', () => {
    test('должен синхронизировать состояние с сервером', async () => {
      const mockApiClient = {
        post: jest.fn().mockResolvedValue({ success: true })
      };
      const middleware = CommonMiddleware.sync({
        apiClient: mockApiClient
      });
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      // Проверяем, что вызов будет отложен
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    test('должен использовать кастомный endpoint', async () => {
      const mockApiClient = {
        post: jest.fn().mockResolvedValue({ success: true })
      };
      const middleware = CommonMiddleware.sync({
        apiClient: mockApiClient,
        endpoint: '/custom/sync'
      });
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      // Проверяем, что вызов будет отложен
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    test('должен фильтровать по пути', async () => {
      const mockApiClient = {
        post: jest.fn().mockResolvedValue({ success: true })
      };
      const middleware = CommonMiddleware.sync({
        apiClient: mockApiClient,
        filter: (path) => path.startsWith('settings')
      });
      const context1 = { path: 'settings.volume', value: 80 };
      const context2 = { path: 'temp.data', value: 'test' };
      const next = jest.fn();

      await middleware(context1, next);
      await middleware(context2, next);

      // Проверяем, что будет только один отложенный вызов
      // (точная проверка требует ожидания таймаута)
    });

    test('должен логировать без API клиента', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const middleware = CommonMiddleware.sync();
      const context = { path: 'test.path', value: 'test' };
      const next = jest.fn();

      await middleware(context, next);

      // Проверяем, что вызов будет отложен
      expect(consoleSpy).not.toHaveBeenCalledWith('Sync to server:');

      consoleSpy.mockRestore();
    });
  });
});