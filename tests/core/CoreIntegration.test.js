import { ServiceContainer } from '../../js/core/ServiceContainer.js';
import { ServiceRegistry } from '../../js/core/ServiceRegistry.js';
import { ServiceLoader } from '../../js/core/ServiceLoader.js';
import ConfigManager from '../../js/core/ConfigManager.js';
import { EventBus } from '../../js/core/EventBus.js';
import { EventAggregator } from '../../js/core/EventAggregator.js';
import { EventMiddleware } from '../../js/core/EventMiddleware.js';
import StateManager from '../../js/core/StateManager.js';
import { StateActions } from '../../js/core/StateActions.js';
import { StateHooks } from '../../js/core/StateHooks.js';
import { StateSelectors } from '../../js/core/StateSelectors.js';
import { StateMiddleware, CommonMiddleware } from '../../js/core/StateMiddleware.js';

describe('Core Integration Tests', () => {
  describe('ServiceContainer + ServiceRegistry + ServiceLoader', () => {
    test('должен загружать и регистрировать сервисы', async () => {
      const container = new ServiceContainer();
      const registry = new ServiceRegistry();
      const loader = new ServiceLoader(container, registry);

      const module = {
        name: 'TestModule',
        services: {
          testService: {
            factory: () => ({ name: 'test-service' }),
            metadata: { category: 'test', singleton: true }
          },
          anotherService: {
            factory: () => ({ name: 'another-service' }),
            metadata: { category: 'test', singleton: false }
          }
        }
      };

      await loader.loadModule(module);

      expect(container.has('testService')).toBe(true);
      expect(container.has('anotherService')).toBe(true);
      expect(registry.get('testService')).toBeDefined();
      expect(registry.get('anotherService')).toBeDefined();

      // Проверяем, что сервисы работают корректно
      const service1 = container.get('testService');
      const service2 = container.get('anotherService');
      const service2Again = container.get('anotherService');

      expect(service1.name).toBe('test-service');
      expect(service2.name).toBe('another-service');
      expect(service2).toBe(service2Again); // singleton
      expect(service2).not.toBe(service1); // factory
    });

    test('должен обрабатывать зависимости между сервисами', async () => {
      const container = new ServiceContainer();
      const registry = new ServiceRegistry();
      const loader = new ServiceLoader(container, registry);

      const module = {
        name: 'DependencyModule',
        services: {
          serviceA: {
            factory: () => ({ name: 'service-A' }),
            metadata: { category: 'test' }
          },
          serviceB: {
            factory: (container, serviceA) => ({ 
              name: 'service-B', 
              dependency: serviceA 
            }),
            metadata: { 
              category: 'test',
              dependencies: ['serviceA']
            }
          }
        }
      };

      await loader.loadModule(module);

      const serviceB = container.get('serviceB');
      expect(serviceB.dependency.name).toBe('service-A');
    });
  });

  describe('EventBus + EventMiddleware + EventAggregator', () => {
    test('должен работать вместе с middleware и агрегацией', (done) => {
      const eventBus = new EventBus();
      const aggregator = new EventAggregator(eventBus);

      // Добавляем middleware
      eventBus.use(EventMiddleware.logger({ logLevel: 'info' }));
      eventBus.use(EventMiddleware.transformer({
        'test:event': (data) => ({ ...data, transformed: true })
      }));

      // Настраиваем агрегацию
      const aggregatedEvents = [];
      aggregator.aggregateByTime('test:event', 50, (events) => {
        aggregatedEvents.push(...events);
        if (aggregatedEvents.length === 3) {
          expect(aggregatedEvents).toHaveLength(3);
          expect(aggregatedEvents[0].data.transformed).toBe(true);
          expect(aggregatedEvents[1].data.transformed).toBe(true);
          expect(aggregatedEvents[2].data.transformed).toBe(true);
          done();
        }
      });

      // Генерируем события
      eventBus.emit('test:event', { id: 1 });
      eventBus.emit('test:event', { id: 2 });
      eventBus.emit('test:event', { id: 3 });
    });

    test('должен обрабатывать ошибки в middleware и агрегации', (done) => {
      const eventBus = new EventBus();
      const aggregator = new EventAggregator(eventBus);

      // Добавляем middleware с ошибкой
      eventBus.use(EventMiddleware.validator({
        'test:event': (data) => data.value > 0
      }));

      // Настраиваем агрегацию
      let errorCount = 0;
      aggregator.aggregateByCount('test:event', 2, (events) => {
        expect(events).toHaveLength(2);
        expect(events[0].data.value).toBe(1);
        expect(events[1].data.value).toBe(2);
        done();
      });

      // Генерируем события
      eventBus.emit('test:event', { value: 1 });
      eventBus.emit('test:event', { value: 2 });
    });
  });

  describe('StateManager + StateHooks + StateActions + StateSelectors', () => {
    test('должен интегрироваться с StateManager', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);
      const stateActions = new StateActions(stateManager, eventBus);
      const stateHooks = new StateHooks(stateManager);

      // Используем StateHooks для изменения состояния
      const [, setBpm] = stateHooks.useState('settings.bpm');
      const [, setInputString] = stateHooks.useState('chords.inputString');

      await setBpm(140);
      await setInputString('C G Am F');

      expect(stateManager.getState('settings.bpm')).toBe(140);
      expect(stateManager.getState('chords.inputString')).toBe('C G Am F');

      // Используем StateActions для обновления состояния
      stateActions.updateTempo(120);
      stateActions.updateParsedChords(['C', 'G', 'Am', 'F'], []);

      expect(stateManager.getState('settings.bpm')).toBe(120);
      expect(stateManager.getState('playback.tempo')).toBe(120);
      expect(stateManager.getState('chords.validChords')).toEqual(['C', 'G', 'Am', 'F']);

      // Используем StateSelectors для получения данных
      const state = stateManager.getState();
      const chords = StateSelectors.getCurrentChords(state);
      const playbackSettings = StateSelectors.getPlaybackSettings(state);

      expect(chords).toEqual(['C', 'G', 'Am', 'F']);
      expect(playbackSettings.bpm).toBe(120);
    });

    test('должен обрабатывать сложные сценарии с формами', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);
      const stateHooks = new StateHooks(stateManager);

      const form = stateHooks.useForm('testForm', {
        name: '',
        type: 'major',
        tempo: 120
      });

      // Устанавливаем значения
      await form.setValue('name', 'C');
      await form.setValue('tempo', 140);

      expect(form.getValue('name')).toBe('C');
      expect(form.getValue('tempo')).toBe(140);

      // Валидируем форму
      const isValid = form.validate({
        name: (value) => value.length > 0 || 'Name is required',
        tempo: (value) => value >= 60 && value <= 300 || 'Invalid tempo'
      });

      expect(isValid).toBe(true);
      expect(stateManager.getState('testForm.errors')).toEqual({});

      // Получаем все значения
      const values = form.getValues();
      expect(values).toEqual({
        name: 'C',
        type: 'major',
        tempo: 140
      });
    });

    test('должен обрабатывать массивы через StateHooks', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);
      const stateHooks = new StateHooks(stateManager);

      const array = stateHooks.useArray('testArray');

      // Добавляем элементы
      await array.addItem({ id: 1, value: 'first' });
      await array.addItem({ id: 2, value: 'second' }, 0);

      expect(array.getArray()).toEqual([
        { id: 2, value: 'second' },
        { id: 1, value: 'first' }
      ]);

      // Обновляем элемент
      await array.updateItem(1, { id: 1, value: 'updated' });

      expect(array.getArray()).toEqual([
        { id: 2, value: 'second' },
        { id: 1, value: 'updated' }
      ]);

      // Перемещаем элемент
      await array.moveItem(0, 1);

      expect(array.getArray()).toEqual([
        { id: 1, value: 'updated' },
        { id: 2, value: 'second' }
      ]);

      // Удаляем элемент
      await array.removeItem(0);

      expect(array.getArray()).toEqual([
        { id: 2, value: 'second' }
      ]);
    });
  });

  describe('StateManager + StateMiddleware', () => {
    test('должен работать с middleware', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);

      // Добавляем middleware
      stateManager.use(CommonMiddleware.logger({
        filter: (path) => path.startsWith('settings')
      }));

      stateManager.use(CommonMiddleware.validator({
        schema: {
          'settings.bpm': (value) => value >= 60 && value <= 300
        },
        strict: true
      }));

      stateManager.use(CommonMiddleware.immutable({
        paths: ['settings']
      }));

      // Валидное изменение
      await stateManager.setState('settings.bpm', 140);
      expect(stateManager.getState('settings.bpm')).toBe(140);

      // Невалидное изменение должно вызвать ошибку
      await expect(stateManager.setState('settings.bpm', 400)).rejects.toThrow();

      // Проверяем, что объект заморожен
      const settings = stateManager.getState('settings');
      expect(Object.isFrozen(settings)).toBe(true);
    });

    test('должен обрабатывать асинхронные middleware', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);

      let middlewareCallCount = 0;
      stateManager.use(async (context, next) => {
        middlewareCallCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        await next();
      });

      await stateManager.setState('test.value', 'test');

      expect(middlewareCallCount).toBe(1);
      expect(stateManager.getState('test.value')).toBe('test');
    });
  });

  describe('ConfigManager + ServiceContainer', () => {
    test('должен интегрироваться с сервисами', () => {
      const configManager = new ConfigManager();
      const container = new ServiceContainer();

      // Регистрируем сервис, который использует ConfigManager
      container.register('configService', () => ({
        getConfig: (path) => configManager.get(path),
        setConfig: (path, value) => configManager.set(path, value)
      }));

      const configService = container.get('configService');

      // Используем сервис для работы с конфигурацией
      expect(configService.getConfig('audio.volume')).toBe(0.8);
      expect(configService.getConfig('ui.theme')).toBe('light');

      configService.setConfig('audio.volume', 0.9);
      configService.setConfig('ui.theme', 'dark');

      expect(configService.getConfig('audio.volume')).toBe(0.9);
      expect(configService.getConfig('ui.theme')).toBe('dark');
    });

    test('должен обрабатывать сложную конфигурацию', () => {
      const configManager = new ConfigManager();
      const container = new ServiceContainer();

      // Устанавливаем сложную конфигурацию
      configManager.set('custom.nested.value', 'test');
      configManager.set('custom.array', [1, 2, 3]);
      configManager.set('custom.object', { key: 'value' });

      container.register('configService', () => ({
        getConfig: (path) => configManager.get(path)
      }));

      const configService = container.get('configService');

      expect(configService.getConfig('custom.nested.value')).toBe('test');
      expect(configService.getConfig('custom.array')).toEqual([1, 2, 3]);
      expect(configService.getConfig('custom.object')).toEqual({ key: 'value' });
    });
  });

  describe('Полная интеграция всех Core модулей', () => {
    test('должен работать в комплексном сценарии', async () => {
      // Создаем все компоненты
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);
      const stateActions = new StateActions(stateManager, eventBus);
      const stateHooks = new StateHooks(stateManager);
      const configManager = new ConfigManager();
      const container = new ServiceContainer();
      const registry = new ServiceRegistry();
      const loader = new ServiceLoader(container, registry);
      const aggregator = new EventAggregator(eventBus);

      // Настраиваем middleware
      eventBus.use(EventMiddleware.logger({ logLevel: 'info' }));
      stateManager.use(CommonMiddleware.validator({
        schema: {
          'settings.bpm': (value) => value >= 60 && value <= 300
        }
      }));

      // Настраиваем агрегацию
      const aggregatedEvents = [];
      aggregator.aggregateByCount('tempo:changed', 3, (events) => {
        aggregatedEvents.push(...events);
      });

      // Регистрируем сервис
      container.register('appService', (container) => ({
        stateManager,
        stateActions,
        stateHooks,
        configManager,
        updateTempo: (bpm) => {
          stateActions.updateTempo(bpm);
          configManager.set('audio.tempo', bpm);
        }
      }));

      const appService = container.get('appService');

      // Используем сервис для изменения состояния
      await appService.updateTempo(120);
      await appService.updateTempo(130);
      await appService.updateTempo(140);

      // Проверяем результаты
      expect(stateManager.getState('settings.bpm')).toBe(140);
      expect(stateManager.getState('playback.tempo')).toBe(140);
      expect(configManager.get('audio.tempo')).toBe(140);
      expect(aggregatedEvents).toHaveLength(3);

      // Проверяем интеграцию через StateSelectors
      const state = stateManager.getState();
      const playbackSettings = StateSelectors.getPlaybackSettings(state);
      expect(playbackSettings.bpm).toBe(140);
    });

    test('должен обрабатывать ошибки в комплексном сценарии', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);
      const stateActions = new StateActions(stateManager, eventBus);
      const container = new ServiceContainer();

      // Настраиваем обработку ошибок
      const errors = [];
      eventBus.on('eventbus:error', (event) => {
        errors.push(event.data);
      });

      // Регистрируем сервис с ошибкой
      container.register('errorService', () => {
        throw new Error('Service initialization error');
      });

      // Пытаемся получить сервис с ошибкой
      expect(() => {
        container.get('errorService');
      }).toThrow();

      // Проверяем, что ошибка была обработана
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Производительность интеграции', () => {
    test('должен эффективно работать при большом количестве операций', async () => {
      const eventBus = new EventBus();
      const stateManager = new StateManager(eventBus);
      const stateHooks = new StateHooks(stateManager);

      const startTime = performance.now();

      // Выполняем большое количество операций
      for (let i = 0; i < 1000; i++) {
        await stateHooks.setValue(`test.item${i}`, `value${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Операции должны выполняться быстро (менее 200ms)
      expect(duration).toBeLessThan(200);

      // Проверяем, что все значения установлены
      for (let i = 0; i < 1000; i++) {
        expect(stateManager.getState(`test.item${i}`)).toBe(`value${i}`);
      }
    });

    test('должен эффективно обрабатывать события', () => {
      const eventBus = new EventBus();
      const aggregator = new EventAggregator(eventBus);

      let eventCount = 0;
      eventBus.on('test:event', () => {
        eventCount++;
      });

      const startTime = performance.now();

      // Генерируем большое количество событий
      for (let i = 0; i < 1000; i++) {
        eventBus.emit('test:event', { id: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // События должны обрабатываться быстро (менее 100ms)
      expect(duration).toBeLessThan(100);
      expect(eventCount).toBe(1000);
    });
  });
});