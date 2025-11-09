import { ServiceContainer } from '../../js/core/ServiceContainer.js';

describe('ServiceContainer', () => {
  let container;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(async () => {
    await container.clear();
  });

  describe('Инициализация', () => {
    test('должен создаваться с пустыми коллекциями', () => {
      expect(container.services.size).toBe(0);
      expect(container.singletons.size).toBe(0);
      expect(container.factories.size).toBe(0);
      expect(container.instances.size).toBe(0);
      expect(container.dependencies.size).toBe(0);
      expect(container.loading.size).toBe(0);
      expect(container.initialized.size).toBe(0);
    });
  });

  describe('Регистрация сервисов', () => {
    test('должен регистрировать сервис с базовыми опциями', () => {
      const factory = () => ({ name: 'test' });
      
      container.register('testService', factory);
      
      expect(container.has('testService')).toBe(true);
      const serviceDefinition = container.services.get('testService');
      expect(serviceDefinition.factory).toBe(factory);
      expect(serviceDefinition.options.singleton).toBe(true);
      expect(serviceDefinition.options.lazy).toBe(true);
    });

    test('должен регистрировать сервис с кастомными опциями', () => {
      const factory = () => ({ name: 'test' });
      const options = {
        singleton: false,
        lazy: false,
        dependencies: ['dep1', 'dep2'],
        init: 'initialize',
        destroy: 'cleanup',
        priority: 10,
        tags: ['tag1', 'tag2']
      };
      
      container.register('testService', factory, options);
      
      const serviceDefinition = container.services.get('testService');
      expect(serviceDefinition.options.singleton).toBe(false);
      expect(serviceDefinition.options.lazy).toBe(false);
      expect(serviceDefinition.options.dependencies).toEqual(['dep1', 'dep2']);
      expect(serviceDefinition.options.init).toBe('initialize');
      expect(serviceDefinition.options.destroy).toBe('cleanup');
      expect(serviceDefinition.options.priority).toBe(10);
      expect(serviceDefinition.options.tags).toEqual(['tag1', 'tag2']);
    });

    test('должен выбрасывать ошибку при повторной регистрации', () => {
      const factory = () => ({ name: 'test' });
      
      container.register('testService', factory);
      
      expect(() => {
        container.register('testService', factory);
      }).toThrow('Service testService is already registered');
    });

    test('должен регистрировать синглтон', () => {
      const factory = () => ({ name: 'singleton' });
      
      container.singleton('singletonService', factory);
      
      const serviceDefinition = container.services.get('singletonService');
      expect(serviceDefinition.options.singleton).toBe(true);
    });

    test('должен регистрировать фабрику', () => {
      const factory = () => ({ name: 'factory' });
      
      container.factory('factoryService', factory);
      
      const serviceDefinition = container.services.get('factoryService');
      expect(serviceDefinition.options.singleton).toBe(false);
    });
  });

  describe('Получение сервисов', () => {
    test('должен выбрасывать ошибку для незарегистрированного сервиса', () => {
      expect(() => {
        container.get('nonExistentService');
      }).toThrow('Service nonExistentService is not registered');
    });

    test('должен создавать синглтон один раз', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return { id: callCount };
      };
      
      container.register('singletonService', factory, { singleton: true });
      
      const instance1 = container.get('singletonService');
      const instance2 = container.get('singletonService');
      
      expect(instance1).toBe(instance2);
      expect(callCount).toBe(1);
    });

    test('должен создавать фабричный сервис каждый раз', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return { id: callCount };
      };
      
      container.register('factoryService', factory, { singleton: false });
      
      const instance1 = container.get('factoryService');
      const instance2 = container.get('factoryService');
      
      expect(instance1).not.toBe(instance2);
      expect(callCount).toBe(2);
    });

    test('должен передавать контейнер в фабрику', () => {
      const factory = (container) => {
        return { container };
      };
      
      container.register('testService', factory);
      
      const instance = container.get('testService');
      expect(instance.container).toBe(container);
    });

    test('должен выбрасывать ошибку при циклической зависимости', () => {
      const factory1 = (container) => container.get('service2');
      const factory2 = (container) => container.get('service1');
      
      container.register('service1', factory1, { dependencies: ['service2'] });
      container.register('service2', factory2, { dependencies: ['service1'] });
      
      expect(() => {
        container.get('service1');
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Разрешение зависимостей', () => {
    test('должен разрешать строковые зависимости', () => {
      const depFactory = () => ({ name: 'dependency' });
      const factory = (container, dep) => ({ dep });
      
      container.register('dependency', depFactory);
      container.register('mainService', factory, { dependencies: ['dependency'] });
      
      const instance = container.get('mainService');
      expect(instance.dep).toEqual({ name: 'dependency' });
    });

    test('должен разрешать объектные зависимости', () => {
      const depFactory = () => ({ name: 'dependency' });
      const factory = (container, dep) => ({ dep });
      
      container.register('dependency', depFactory);
      container.register('mainService', factory, { 
        dependencies: [{ name: 'dependency' }] 
      });
      
      const instance = container.get('mainService');
      expect(instance.dep).toEqual({ name: 'dependency' });
    });

    test('должен выбрасывать ошибку для невалидной зависимости', () => {
      const factory = (container, dep) => ({ dep });
      
      container.register('mainService', factory, { 
        dependencies: [123] 
      });
      
      expect(() => {
        container.get('mainService');
      }).toThrow('Invalid dependency definition: 123');
    });
  });

  describe('Инициализация сервисов', () => {
    test('должен инициализировать сервисы с методом init', async () => {
      let initialized = false;
      const factory = () => ({
        initialize: () => { initialized = true; }
      });
      
      container.register('testService', factory, { init: 'initialize' });
      
      await container.initialize();
      
      expect(initialized).toBe(true);
      expect(container.initialized.has('testService')).toBe(true);
    });

    test('должен инициализировать только указанные сервисы', async () => {
      const factory1 = () => ({
        initialize: () => {}
      });
      const factory2 = () => ({
        initialize: () => {}
      });
      
      container.register('service1', factory1, { init: 'initialize' });
      container.register('service2', factory2, { init: 'initialize' });
      
      await container.initialize(['service1']);
      
      expect(container.initialized.has('service1')).toBe(true);
      expect(container.initialized.has('service2')).toBe(false);
    });

    test('должен сортировать сервисы по зависимостям при инициализации', async () => {
      const initOrder = [];
      
      const factory1 = () => ({
        initialize: () => { initOrder.push('service1'); }
      });
      const factory2 = () => ({
        initialize: () => { initOrder.push('service2'); }
      });
      const factory3 = () => ({
        initialize: () => { initOrder.push('service3'); }
      });
      
      container.register('service1', factory1, { 
        init: 'initialize',
        dependencies: ['service2'] 
      });
      container.register('service2', factory2, { 
        init: 'initialize',
        dependencies: ['service3'] 
      });
      container.register('service3', factory3, { init: 'initialize' });
      
      await container.initialize();
      
      expect(initOrder).toEqual(['service3', 'service2', 'service1']);
    });

    test('должен выбрасывать ошибку при циклической зависимости в инициализации', () => {
      const factory1 = () => ({ initialize: () => {} });
      const factory2 = () => ({ initialize: () => {} });
      
      container.register('service1', factory1, { 
        init: 'initialize',
        dependencies: ['service2'] 
      });
      container.register('service2', factory2, { 
        init: 'initialize',
        dependencies: ['service1'] 
      });
      
      expect(async () => {
        await container.initialize();
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Работа с тегами', () => {
    test('должен получать сервисы по тегу', () => {
      const factory1 = () => ({ name: 'service1' });
      const factory2 = () => ({ name: 'service2' });
      const factory3 = () => ({ name: 'service3' });
      
      container.register('service1', factory1, { tags: ['tag1', 'common'] });
      container.register('service2', factory2, { tags: ['tag2', 'common'] });
      container.register('service3', factory3, { tags: ['tag3'] });
      
      const commonServices = container.getByTag('common');
      
      expect(commonServices).toHaveLength(2);
      expect(commonServices[0].name).toBe('service1');
      expect(commonServices[1].name).toBe('service2');
    });

    test('должен возвращать пустой массив для несуществующего тега', () => {
      const services = container.getByTag('nonExistentTag');
      expect(services).toEqual([]);
    });
  });

  describe('Управление сервисами', () => {
    test('должен проверять наличие сервиса', () => {
      const factory = () => ({});
      
      expect(container.has('testService')).toBe(false);
      
      container.register('testService', factory);
      
      expect(container.has('testService')).toBe(true);
    });

    test('должен удалять сервис', async () => {
      let destroyed = false;
      const factory = () => ({
        cleanup: () => { destroyed = true; }
      });
      
      container.register('testService', factory, { destroy: 'cleanup' });
      container.get('testService'); // Создаем экземпляр
      
      await container.remove('testService');
      
      expect(container.has('testService')).toBe(false);
      expect(destroyed).toBe(true);
    });

    test('должен корректно обрабатывать удаление несуществующего сервиса', async () => {
      await expect(container.remove('nonExistentService')).resolves.toBeUndefined();
    });
  });

  describe('Получение информации', () => {
    test('должен возвращать информацию о сервисе', () => {
      const factory = () => ({});
      const options = {
        singleton: true,
        lazy: false,
        dependencies: ['dep1'],
        tags: ['tag1'],
        priority: 5
      };
      
      container.register('testService', factory, options);
      container.get('testService'); // Создаем экземпляр
      
      const info = container.getServiceInfo('testService');
      
      expect(info.name).toBe('testService');
      expect(info.singleton).toBe(true);
      expect(info.lazy).toBe(false);
      expect(info.dependencies).toEqual(['dep1']);
      expect(info.tags).toEqual(['tag1']);
      expect(info.priority).toBe(5);
      expect(info.instanceCreated).toBe(true);
      expect(info.initialized).toBe(false);
      expect(info.createdAt).toBeDefined();
    });

    test('должен возвращать null для несуществующего сервиса', () => {
      const info = container.getServiceInfo('nonExistentService');
      expect(info).toBeNull();
    });

    test('должен возвращать статистику контейнера', () => {
      const factory1 = () => ({});
      const factory2 = () => ({});
      
      container.register('service1', factory1, { tags: ['tag1'] });
      container.register('service2', factory2, { tags: ['tag1', 'tag2'] });
      
      container.get('service1'); // Создаем экземпляр
      
      const stats = container.getStats();
      
      expect(stats.total).toBe(2);
      expect(stats.singletons).toBe(1);
      expect(stats.initialized).toBe(0);
      expect(stats.loading).toBe(0);
      expect(stats.byTag).toEqual({
        tag1: 2,
        tag2: 1
      });
    });
  });

  describe('Очистка контейнера', () => {
    test('должен очищать все данные контейнера', async () => {
      let destroyed1 = false;
      let destroyed2 = false;
      
      const factory1 = () => ({
        cleanup: () => { destroyed1 = true; }
      });
      const factory2 = () => ({
        cleanup: () => { destroyed2 = true; }
      });
      
      container.register('service1', factory1, { destroy: 'cleanup' });
      container.register('service2', factory2, { destroy: 'cleanup' });
      
      container.get('service1');
      container.get('service2');
      
      await container.clear();
      
      expect(container.services.size).toBe(0);
      expect(container.singletons.size).toBe(0);
      expect(container.instances.size).toBe(0);
      expect(container.dependencies.size).toBe(0);
      expect(container.initialized.size).toBe(0);
      expect(container.loading.size).toBe(0);
      expect(destroyed1).toBe(true);
      expect(destroyed2).toBe(true);
    });
  });

  describe('Дочерние контейнеры', () => {
    test('должен создавать дочерний контейнер', () => {
      const child = container.createChild();
      
      expect(child).toBeInstanceOf(ServiceContainer);
      expect(child.parent).toBe(container);
      expect(child.inheritFromParent).toBe(true);
    });

    test('должен создавать дочерний контейнер с опциями', () => {
      const child = container.createChild({ inheritFromParent: false });
      
      expect(child.inheritFromParent).toBe(false);
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать ошибки в методе destroy', async () => {
      const factory = () => ({
        cleanup: () => { throw new Error('Destroy error'); }
      });
      
      container.register('testService', factory, { destroy: 'cleanup' });
      container.get('testService');
      
      // Не должно выбрасывать ошибку
      await expect(container.remove('testService')).resolves.toBeUndefined();
    });

    test('должен обрабатывать ошибки в методе init', async () => {
      const factory = () => ({
        initialize: () => { throw new Error('Init error'); }
      });
      
      container.register('testService', factory, { init: 'initialize' });
      
      await expect(container.initialize()).rejects.toThrow('Init error');
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать пустые зависимости', () => {
      const factory = () => ({});
      
      container.register('testService', factory, { dependencies: [] });
      
      const instance = container.get('testService');
      expect(instance).toEqual({});
    });

    test('должен обрабатывать сервис без опций', () => {
      const factory = () => ({});
      
      container.register('testService', factory);
      
      const serviceDefinition = container.services.get('testService');
      expect(serviceDefinition.options.singleton).toBe(true);
      expect(serviceDefinition.options.lazy).toBe(true);
      expect(serviceDefinition.options.dependencies).toEqual([]);
      expect(serviceDefinition.options.tags).toEqual([]);
    });

    test('должен обрабатывать сервис с пустыми опциями', () => {
      const factory = () => ({});
      
      container.register('testService', factory, {});
      
      const serviceDefinition = container.services.get('testService');
      expect(serviceDefinition.options.singleton).toBe(true);
      expect(serviceDefinition.options.lazy).toBe(true);
    });
  });
});