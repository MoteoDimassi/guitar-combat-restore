import { ServiceRegistry } from '../../js/core/ServiceRegistry.js';

describe('ServiceRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  describe('Инициализация', () => {
    test('должен создаваться с пустыми регистрациями', () => {
      expect(registry.registrations.size).toBe(0);
    });
  });

  describe('Регистрация сервисов', () => {
    test('должен регистрировать сервис с базовыми метаданными', () => {
      const factory = () => ({ name: 'test' });
      
      registry.register('testService', factory);
      
      const registration = registry.get('testService');
      expect(registration.name).toBe('testService');
      expect(registration.factory).toBe(factory);
      expect(registration.metadata.description).toBe('');
      expect(registration.metadata.category).toBe('general');
      expect(registration.metadata.version).toBe('1.0.0');
      expect(registration.metadata.author).toBe('');
      expect(registration.metadata.tags).toEqual([]);
      expect(registration.metadata.dependencies).toEqual([]);
      expect(registration.metadata.singleton).toBe(true);
      expect(registration.metadata.lazy).toBe(true);
      expect(registration.metadata.priority).toBe(0);
    });

    test('должен регистрировать сервис с полными метаданными', () => {
      const factory = () => ({ name: 'test' });
      const metadata = {
        description: 'Test service description',
        category: 'test',
        version: '2.0.0',
        author: 'Test Author',
        tags: ['tag1', 'tag2'],
        dependencies: ['dep1', 'dep2'],
        singleton: false,
        lazy: false,
        priority: 10
      };
      
      registry.register('testService', factory, metadata);
      
      const registration = registry.get('testService');
      expect(registration.metadata.description).toBe('Test service description');
      expect(registration.metadata.category).toBe('test');
      expect(registration.metadata.version).toBe('2.0.0');
      expect(registration.metadata.author).toBe('Test Author');
      expect(registration.metadata.tags).toEqual(['tag1', 'tag2']);
      expect(registration.metadata.dependencies).toEqual(['dep1', 'dep2']);
      expect(registration.metadata.singleton).toBe(false);
      expect(registration.metadata.lazy).toBe(false);
      expect(registration.metadata.priority).toBe(10);
    });

    test('должен перезаписывать существующую регистрацию', () => {
      const factory1 = () => ({ name: 'test1' });
      const factory2 = () => ({ name: 'test2' });
      
      registry.register('testService', factory1, { category: 'cat1' });
      registry.register('testService', factory2, { category: 'cat2' });
      
      const registration = registry.get('testService');
      expect(registration.factory).toBe(factory2);
      expect(registration.metadata.category).toBe('cat2');
    });
  });

  describe('Получение регистраций', () => {
    test('должен возвращать регистрацию по имени', () => {
      const factory = () => ({ name: 'test' });
      
      registry.register('testService', factory);
      
      const registration = registry.get('testService');
      expect(registration.name).toBe('testService');
      expect(registration.factory).toBe(factory);
    });

    test('должен возвращать undefined для несуществующего сервиса', () => {
      const registration = registry.get('nonExistentService');
      expect(registration).toBeUndefined();
    });

    test('должен возвращать все регистрации', () => {
      const factory1 = () => ({ name: 'test1' });
      const factory2 = () => ({ name: 'test2' });
      
      registry.register('service1', factory1);
      registry.register('service2', factory2);
      
      const allRegistrations = registry.getAll();
      expect(allRegistrations.size).toBe(2);
      expect(allRegistrations.has('service1')).toBe(true);
      expect(allRegistrations.has('service2')).toBe(true);
    });
  });

  describe('Фильтрация по категории', () => {
    test('должен возвращать сервисы по категории', () => {
      const factory1 = () => ({ name: 'test1' });
      const factory2 = () => ({ name: 'test2' });
      const factory3 = () => ({ name: 'test3' });
      
      registry.register('service1', factory1, { category: 'category1' });
      registry.register('service2', factory2, { category: 'category2' });
      registry.register('service3', factory3, { category: 'category1' });
      
      const category1Services = registry.getByCategory('category1');
      expect(category1Services).toHaveLength(2);
      expect(category1Services[0].name).toBe('service1');
      expect(category1Services[1].name).toBe('service3');
    });

    test('должен возвращать пустой массив для несуществующей категории', () => {
      const services = registry.getByCategory('nonExistentCategory');
      expect(services).toEqual([]);
    });
  });

  describe('Фильтрация по тегам', () => {
    test('должен возвращать сервисы по тегу', () => {
      const factory1 = () => ({ name: 'test1' });
      const factory2 = () => ({ name: 'test2' });
      const factory3 = () => ({ name: 'test3' });
      
      registry.register('service1', factory1, { tags: ['tag1', 'common'] });
      registry.register('service2', factory2, { tags: ['tag2', 'common'] });
      registry.register('service3', factory3, { tags: ['tag3'] });
      
      const commonServices = registry.getByTag('common');
      expect(commonServices).toHaveLength(2);
      expect(commonServices[0].name).toBe('service1');
      expect(commonServices[1].name).toBe('service2');
    });

    test('должен возвращать пустой массив для несуществующего тега', () => {
      const services = registry.getByTag('nonExistentTag');
      expect(services).toEqual([]);
    });
  });

  describe('Поиск с фильтром', () => {
    test('должен находить сервисы по фильтру', () => {
      const factory1 = () => ({ name: 'test1' });
      const factory2 = () => ({ name: 'test2' });
      const factory3 = () => ({ name: 'test3' });
      
      registry.register('service1', factory1, { 
        category: 'test', 
        priority: 10,
        tags: ['important']
      });
      registry.register('service2', factory2, { 
        category: 'prod', 
        priority: 5,
        tags: ['important']
      });
      registry.register('service3', factory3, { 
        category: 'test', 
        priority: 1,
        tags: ['optional']
      });
      
      // Поиск по категории
      const testServices = registry.find(service => 
        service.metadata.category === 'test'
      );
      expect(testServices).toHaveLength(2);
      
      // Поиск по приоритету
      const highPriorityServices = registry.find(service => 
        service.metadata.priority >= 5
      );
      expect(highPriorityServices).toHaveLength(2);
      
      // Поиск по тегу
      const importantServices = registry.find(service => 
        service.metadata.tags.includes('important')
      );
      expect(importantServices).toHaveLength(2);
      
      // Комплексный поиск
      const complexServices = registry.find(service => 
        service.metadata.category === 'test' && 
        service.metadata.priority > 5
      );
      expect(complexServices).toHaveLength(1);
      expect(complexServices[0].name).toBe('service1');
    });

    test('должен возвращать пустой массив если ничего не найдено', () => {
      const factory = () => ({ name: 'test' });
      registry.register('service', factory, { category: 'test' });
      
      const services = registry.find(service => 
        service.metadata.category === 'nonExistent'
      );
      expect(services).toEqual([]);
    });
  });

  describe('Применение к контейнеру', () => {
    test('должен применять регистрации к контейнеру', () => {
      const factory1 = () => ({ name: 'test1' });
      const factory2 = () => ({ name: 'test2' });
      const metadata1 = { singleton: true, tags: ['tag1'] };
      const metadata2 = { singleton: false, tags: ['tag2'] };
      
      registry.register('service1', factory1, metadata1);
      registry.register('service2', factory2, metadata2);
      
      const mockContainer = {
        register: jest.fn()
      };
      
      registry.applyToContainer(mockContainer);
      
      expect(mockContainer.register).toHaveBeenCalledTimes(2);
      expect(mockContainer.register).toHaveBeenCalledWith(
        'service1', factory1, metadata1
      );
      expect(mockContainer.register).toHaveBeenCalledWith(
        'service2', factory2, metadata2
      );
    });

    test('должен обрабатывать пустой реестр', () => {
      const mockContainer = {
        register: jest.fn()
      };
      
      registry.applyToContainer(mockContainer);
      
      expect(mockContainer.register).not.toHaveBeenCalled();
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать пустые метаданные', () => {
      const factory = () => ({ name: 'test' });
      
      registry.register('testService', factory, {});
      
      const registration = registry.get('testService');
      expect(registration.metadata.description).toBe('');
      expect(registration.metadata.category).toBe('general');
      expect(registration.metadata.version).toBe('1.0.0');
      expect(registration.metadata.author).toBe('');
      expect(registration.metadata.tags).toEqual([]);
      expect(registration.metadata.dependencies).toEqual([]);
      expect(registration.metadata.singleton).toBe(true);
      expect(registration.metadata.lazy).toBe(true);
      expect(registration.metadata.priority).toBe(0);
    });

    test('должен обрабатывать null метаданные', () => {
      const factory = () => ({ name: 'test' });
      
      registry.register('testService', factory, null);
      
      const registration = registry.get('testService');
      expect(registration.metadata.description).toBe('');
      expect(registration.metadata.category).toBe('general');
    });

    test('должен обрабатывать частичные метаданные', () => {
      const factory = () => ({ name: 'test' });
      
      registry.register('testService', factory, {
        category: 'custom',
        priority: 5
      });
      
      const registration = registry.get('testService');
      expect(registration.metadata.category).toBe('custom');
      expect(registration.metadata.priority).toBe(5);
      expect(registration.metadata.description).toBe('');
      expect(registration.metadata.version).toBe('1.0.0');
    });

    test('должен обрабатывать массивы в метаданных', () => {
      const factory = () => ({ name: 'test' });
      
      registry.register('testService', factory, {
        tags: ['tag1', 'tag2', 'tag3'],
        dependencies: ['dep1', 'dep2']
      });
      
      const registration = registry.get('testService');
      expect(registration.metadata.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(registration.metadata.dependencies).toEqual(['dep1', 'dep2']);
    });
  });

  describe('Интеграция с ServiceContainer', () => {
    test('должен корректно работать с ServiceContainer', () => {
      const { ServiceContainer } = require('../../js/core/ServiceContainer.js');
      const factory = () => ({ name: 'test' });
      const metadata = { singleton: true, tags: ['test'] };
      
      registry.register('testService', factory, metadata);
      
      const container = new ServiceContainer();
      registry.applyToContainer(container);
      
      expect(container.has('testService')).toBe(true);
      
      const instance = container.get('testService');
      expect(instance.name).toBe('test');
    });
  });
});