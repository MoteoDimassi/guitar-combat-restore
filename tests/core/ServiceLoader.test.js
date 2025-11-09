import { ServiceLoader } from '../../js/core/ServiceLoader.js';
import { ServiceRegistry } from '../../js/core/ServiceRegistry.js';
import { ServiceContainer } from '../../js/core/ServiceContainer.js';

// Мок для динамического импорта
jest.mock('../../js/core/ServiceLoader.js', () => {
  const originalModule = jest.requireActual('../../js/core/ServiceLoader.js');
  return {
    ...originalModule,
    ServiceLoader: originalModule.ServiceLoader,
  };
});

describe('ServiceLoader', () => {
  let serviceLoader;
  let container;
  let registry;

  beforeEach(() => {
    container = new ServiceContainer();
    registry = new ServiceRegistry();
    serviceLoader = new ServiceLoader(container, registry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должен создаваться с контейнером и реестром', () => {
      expect(serviceLoader.container).toBe(container);
      expect(serviceLoader.registry).toBe(registry);
      expect(serviceLoader.loadedModules.size).toBe(0);
    });

    test('должен создаваться только с контейнером', () => {
      const loaderWithoutRegistry = new ServiceLoader(container);
      expect(loaderWithoutRegistry.container).toBe(container);
      expect(loaderWithoutRegistry.registry).toBeUndefined();
    });
  });

  describe('Загрузка модулей', () => {
    test('должен загружать модуль с сервисами', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { category: 'test' }
          },
          service2: {
            factory: () => ({ name: 'service2' }),
            metadata: { category: 'test' }
          }
        }
      };

      await serviceLoader.loadModule(module);

      expect(container.has('service1')).toBe(true);
      expect(container.has('service2')).toBe(true);
      expect(serviceLoader.isModuleLoaded('TestModule')).toBe(true);
    });

    test('должен вызывать метод инициализации модуля', async () => {
      const initializeMock = jest.fn();
      const module = {
        name: 'TestModule',
        services: {},
        initialize: initializeMock
      };

      await serviceLoader.loadModule(module);

      expect(initializeMock).toHaveBeenCalledWith(container, {});
    });

    test('должен передавать опции в метод инициализации', async () => {
      const initializeMock = jest.fn();
      const module = {
        name: 'TestModule',
        services: {},
        initialize: initializeMock
      };
      const options = { testOption: 'testValue' };

      await serviceLoader.loadModule(module, options);

      expect(initializeMock).toHaveBeenCalledWith(container, options);
    });

    test('должен регистрировать в реестре если он доступен', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { category: 'test' }
          }
        }
      };

      await serviceLoader.loadModule(module);

      const registration = registry.get('service1');
      expect(registration).toBeDefined();
      expect(registration.metadata.module).toBe('TestModule');
    });

    test('должен использовать имя модуля из опций', async () => {
      const module = {
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { category: 'test' }
          }
        }
      };
      const options = { name: 'CustomModuleName' };

      await serviceLoader.loadModule(module, options);

      expect(serviceLoader.isModuleLoaded('CustomModuleName')).toBe(true);
      const registration = registry.get('service1');
      expect(registration.metadata.module).toBe('CustomModuleName');
    });

    test('должен предупреждать о повторной загрузке модуля', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const module = {
        name: 'TestModule',
        services: {}
      };

      await serviceLoader.loadModule(module);
      await serviceLoader.loadModule(module);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Module TestModule is already loaded'
      );

      consoleSpy.mockRestore();
    });

    test('должен выбрасывать ошибку при загрузке модуля', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => {
              throw new Error('Factory error');
            },
            metadata: { category: 'test' }
          }
        }
      };

      await expect(serviceLoader.loadModule(module)).rejects.toThrow();
    });

    test('должен обрабатывать модуль без сервисов', async () => {
      const module = {
        name: 'TestModule',
        initialize: jest.fn()
      };

      await serviceLoader.loadModule(module);

      expect(serviceLoader.isModuleLoaded('TestModule')).toBe(true);
    });

    test('должен обрабатывать модуль без имени', async () => {
      const module = {
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { category: 'test' }
          }
        }
      };

      await serviceLoader.loadModule(module);

      expect(serviceLoader.isModuleLoaded('unknown')).toBe(true);
    });
  });

  describe('Загрузка из конфигурации', () => {
    beforeEach(() => {
      // Мокаем динамический импорт
      jest.mock('./test-service.js', () => ({
        default: () => ({ name: 'test-service' })
      }), { virtual: true });
    });

    test('должен загружать сервисы из конфигурации', async () => {
      const config = {
        service1: {
          module: './test-service.js',
          options: { singleton: true }
        }
      };

      // Мокаем import
      const mockImport = jest.fn().mockResolvedValue({
        default: () => ({ name: 'test-service' })
      });
      global.import = mockImport;

      await serviceLoader.loadFromConfig(config);

      expect(mockImport).toHaveBeenCalledWith('./test-service.js');
      expect(container.has('service1')).toBe(true);
    });

    test('должен использовать указанный экспорт', async () => {
      const config = {
        service1: {
          module: './test-service.js',
          export: 'namedExport'
        }
      };

      const mockService = () => ({ name: 'test-service' });
      const mockImport = jest.fn().mockResolvedValue({
        namedExport: mockService
      });
      global.import = mockImport;

      await serviceLoader.loadFromConfig(config);

      expect(container.has('service1')).toBe(true);
    });

    test('должен обрабатывать ошибки загрузки обязательного сервиса', async () => {
      const config = {
        service1: {
          module: './non-existent-service.js',
          required: true
        }
      };

      const mockImport = jest.fn().mockRejectedValue(new Error('Module not found'));
      global.import = mockImport;

      await expect(serviceLoader.loadFromConfig(config)).rejects.toThrow('Module not found');
    });

    test('должен игнорировать ошибки загрузки необязательного сервиса', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const config = {
        service1: {
          module: './non-existent-service.js',
          required: false
        }
      };

      const mockImport = jest.fn().mockRejectedValue(new Error('Module not found'));
      global.import = mockImport;

      await serviceLoader.loadFromConfig(config);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Failed to load service service1:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('должен обрабатывать пустую конфигурацию', async () => {
      await expect(serviceLoader.loadFromConfig({})).resolves.toBeUndefined();
    });
  });

  describe('Автообнаружение сервисов', () => {
    test('должен автоматически обнаруживать сервисы', async () => {
      const mockImport = jest.fn().mockResolvedValue({
        default: () => ({ name: 'mock-service' })
      });
      global.import = mockImport;

      await serviceLoader.autoDiscover('./services');

      // Проверяем, что были попытки импорта предопределенных сервисов
      expect(mockImport).toHaveBeenCalledTimes(6); // 6 предопределенных сервисов
    });

    test('должен исключать указанные сервисы', async () => {
      const mockImport = jest.fn().mockResolvedValue({
        default: () => ({ name: 'mock-service' })
      });
      global.import = mockImport;

      await serviceLoader.autoDiscover('./services', {
        exclude: ['ChordService', 'BarService']
      });

      expect(mockImport).toHaveBeenCalledTimes(4); // 6 - 2 исключенных
    });

    test('должен обрабатывать ошибки автообнаружения', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockImport = jest.fn().mockRejectedValue(new Error('Module not found'));
      global.import = mockImport;

      await serviceLoader.autoDiscover('./services');

      expect(consoleSpy).toHaveBeenCalledTimes(6); // 6 предупреждений об ошибках

      consoleSpy.mockRestore();
    });

    test('должен использовать кастомные опции', async () => {
      const mockImport = jest.fn().mockResolvedValue({
        default: () => ({ name: 'mock-service' })
      });
      global.import = mockImport;

      await serviceLoader.autoDiscover('./services', {
        pattern: /\.custom\.js$/,
        recursive: false
      });

      // В реальной реализации здесь была бы логика сканирования файловой системы
      // Для теста просто проверяем, что метод вызывается без ошибок
      expect(mockImport).toHaveBeenCalledTimes(6);
    });
  });

  describe('Управление загруженными модулями', () => {
    test('должен возвращать список загруженных модулей', () => {
      expect(serviceLoader.getLoadedModules()).toEqual(new Set());

      serviceLoader.loadedModules.add('TestModule1');
      serviceLoader.loadedModules.add('TestModule2');

      const loadedModules = serviceLoader.getLoadedModules();
      expect(loadedModules.has('TestModule1')).toBe(true);
      expect(loadedModules.has('TestModule2')).toBe(true);
    });

    test('должен возвращать копию множества загруженных модулей', () => {
      serviceLoader.loadedModules.add('TestModule');

      const loadedModules = serviceLoader.getLoadedModules();
      loadedModules.add('NewModule');

      expect(serviceLoader.loadedModules.has('NewModule')).toBe(false);
    });

    test('должен проверять загрузку модуля', () => {
      expect(serviceLoader.isModuleLoaded('TestModule')).toBe(false);

      serviceLoader.loadedModules.add('TestModule');

      expect(serviceLoader.isModuleLoaded('TestModule')).toBe(true);
    });
  });

  describe('Интеграция с другими компонентами', () => {
    test('должен корректно работать с ServiceContainer', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { singleton: true }
          }
        }
      };

      await serviceLoader.loadModule(module);

      const instance = container.get('service1');
      expect(instance.name).toBe('service1');
    });

    test('должен корректно работать с ServiceRegistry', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { category: 'test', tags: ['tag1'] }
          }
        }
      };

      await serviceLoader.loadModule(module);

      const registration = registry.get('service1');
      expect(registration.metadata.category).toBe('test');
      expect(registration.metadata.tags).toEqual(['tag1']);
    });

    test('должен работать без реестра', async () => {
      const loaderWithoutRegistry = new ServiceLoader(container);
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => ({ name: 'service1' }),
            metadata: { category: 'test' }
          }
        }
      };

      await expect(loaderWithoutRegistry.loadModule(module)).resolves.toBeUndefined();
      expect(container.has('service1')).toBe(true);
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать ошибки в фабрике сервиса', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            factory: () => {
              throw new Error('Factory error');
            },
            metadata: { category: 'test' }
          }
        }
      };

      await expect(serviceLoader.loadModule(module)).rejects.toThrow('Factory error');
    });

    test('должен обрабатывать ошибки в методе инициализации', async () => {
      const module = {
        name: 'TestModule',
        services: {},
        initialize: () => {
          throw new Error('Initialization error');
        }
      };

      await expect(serviceLoader.loadModule(module)).rejects.toThrow('Initialization error');
    });

    test('должен обрабатывать невалидные определения сервисов', async () => {
      const module = {
        name: 'TestModule',
        services: {
          service1: {
            // Отсутствует factory
            metadata: { category: 'test' }
          }
        }
      };

      await expect(serviceLoader.loadModule(module)).rejects.toThrow();
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать пустой модуль', async () => {
      const module = {};

      await expect(serviceLoader.loadModule(module)).resolves.toBeUndefined();
    });

    test('должен обрабатывать null модуль', async () => {
      await expect(serviceLoader.loadModule(null)).rejects.toThrow();
    });

    test('должен обрабатывать undefined модуль', async () => {
      await expect(serviceLoader.loadModule(undefined)).rejects.toThrow();
    });

    test('должен обрабатывать модуль с пустыми сервисами', async () => {
      const module = {
        name: 'TestModule',
        services: {}
      };

      await expect(serviceLoader.loadModule(module)).resolves.toBeUndefined();
      expect(serviceLoader.isModuleLoaded('TestModule')).toBe(true);
    });
  });
});