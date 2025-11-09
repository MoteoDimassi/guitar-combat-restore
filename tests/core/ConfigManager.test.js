import ConfigManager from '../../js/core/ConfigManager.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('Инициализация', () => {
    test('должен создаваться с конфигурацией по умолчанию', () => {
      expect(configManager.config).toEqual({
        audio: {
          volume: 0.8,
          tempo: 120,
        },
        ui: {
          theme: 'light',
          language: 'en',
        },
        playback: {
          autoPlay: false,
          loop: false,
        },
      });
    });
  });

  describe('Получение значений', () => {
    test('должен получать значение по простому пути', () => {
      expect(configManager.get('audio.volume')).toBe(0.8);
      expect(configManager.get('audio.tempo')).toBe(120);
      expect(configManager.get('ui.theme')).toBe('light');
      expect(configManager.get('ui.language')).toBe('en');
      expect(configManager.get('playback.autoPlay')).toBe(false);
      expect(configManager.get('playback.loop')).toBe(false);
    });

    test('должен получать значение по вложенному пути', () => {
      expect(configManager.get('audio')).toEqual({
        volume: 0.8,
        tempo: 120,
      });
      expect(configManager.get('ui')).toEqual({
        theme: 'light',
        language: 'en',
      });
      expect(configManager.get('playback')).toEqual({
        autoPlay: false,
        loop: false,
      });
    });

    test('должен возвращать undefined для несуществующего пути', () => {
      expect(configManager.get('nonexistent')).toBeUndefined();
      expect(configManager.get('audio.nonexistent')).toBeUndefined();
      expect(configManager.get('ui.nonexistent.path')).toBeUndefined();
    });

    test('должен возвращать undefined для пустого пути', () => {
      expect(configManager.get('')).toBeUndefined();
    });

    test('должен обрабатывать null путь', () => {
      expect(configManager.get(null)).toBeUndefined();
    });

    test('должен обрабатывать undefined путь', () => {
      expect(configManager.get(undefined)).toBeUndefined();
    });
  });

  describe('Установка значений', () => {
    test('должен устанавливать значение по простому пути', () => {
      configManager.set('audio.volume', 0.9);
      expect(configManager.get('audio.volume')).toBe(0.9);

      configManager.set('ui.theme', 'dark');
      expect(configManager.get('ui.theme')).toBe('dark');

      configManager.set('playback.autoPlay', true);
      expect(configManager.get('playback.autoPlay')).toBe(true);
    });

    test('должен устанавливать значение по вложенному пути', () => {
      const newAudioConfig = {
        volume: 0.7,
        tempo: 140,
        bass: 0.5,
      };

      configManager.set('audio', newAudioConfig);
      expect(configManager.get('audio')).toEqual(newAudioConfig);
    });

    test('должен создавать вложенные объекты при необходимости', () => {
      configManager.set('newSection.newProperty', 'newValue');
      expect(configManager.get('newSection.newProperty')).toBe('newValue');
      expect(configManager.get('newSection')).toEqual({
        newProperty: 'newValue',
      });
    });

    test('должен создавать глубокую вложенность', () => {
      configManager.set('level1.level2.level3.level4', 'deepValue');
      expect(configManager.get('level1.level2.level3.level4')).toBe('deepValue');
      expect(configManager.get('level1.level2.level3')).toEqual({
        level4: 'deepValue',
      });
    });

    test('должен перезаписывать существующие значения', () => {
      configManager.set('audio.volume', 0.5);
      configManager.set('audio.volume', 0.6);
      expect(configManager.get('audio.volume')).toBe(0.6);
    });

    test('должен обрабатывать различные типы значений', () => {
      configManager.set('test.string', 'test string');
      configManager.set('test.number', 42);
      configManager.set('test.boolean', true);
      configManager.set('test.array', [1, 2, 3]);
      configManager.set('test.object', { key: 'value' });
      configManager.set('test.null', null);

      expect(configManager.get('test.string')).toBe('test string');
      expect(configManager.get('test.number')).toBe(42);
      expect(configManager.get('test.boolean')).toBe(true);
      expect(configManager.get('test.array')).toEqual([1, 2, 3]);
      expect(configManager.get('test.object')).toEqual({ key: 'value' });
      expect(configManager.get('test.null')).toBeNull();
    });
  });

  describe('Загрузка конфигурации', () => {
    test('должен загружать конфигурацию', () => {
      const newConfig = {
        audio: {
          volume: 0.9,
          tempo: 140,
          bass: 0.5,
        },
        ui: {
          theme: 'dark',
        },
        newSection: {
          newProperty: 'newValue',
        },
      };

      configManager.load(newConfig);

      expect(configManager.get('audio.volume')).toBe(0.9);
      expect(configManager.get('audio.tempo')).toBe(140);
      expect(configManager.get('audio.bass')).toBe(0.5);
      expect(configManager.get('ui.theme')).toBe('dark');
      expect(configManager.get('ui.language')).toBe('en'); // должно остаться старое значение
      expect(configManager.get('newSection.newProperty')).toBe('newValue');
    });

    test('должен обрабатывать пустую конфигурацию', () => {
      const originalConfig = JSON.parse(JSON.stringify(configManager.config));
      
      configManager.load({});
      
      expect(configManager.config).toEqual(originalConfig);
    });

    test('должен обрабатывать null конфигурацию', () => {
      const originalConfig = JSON.parse(JSON.stringify(configManager.config));
      
      configManager.load(null);
      
      expect(configManager.config).toEqual(originalConfig);
    });

    test('должен обрабатывать undefined конфигурацию', () => {
      const originalConfig = JSON.parse(JSON.stringify(configManager.config));
      
      configManager.load(undefined);
      
      expect(configManager.config).toEqual(originalConfig);
    });
  });

  describe('Сохранение конфигурации', () => {
    test('должен сохранять конфигурацию в JSON', () => {
      configManager.set('audio.volume', 0.9);
      configManager.set('ui.theme', 'dark');

      const json = configManager.save();
      const parsedConfig = JSON.parse(json);

      expect(parsedConfig.audio.volume).toBe(0.9);
      expect(parsedConfig.ui.theme).toBe('dark');
    });

    test('должен сохранять всю конфигурацию', () => {
      const json = configManager.save();
      const parsedConfig = JSON.parse(json);

      expect(parsedConfig).toEqual(configManager.config);
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать путь с точками в имени свойства', () => {
      configManager.set('section.with.dots', 'value');
      expect(configManager.get('section.with.dots')).toBe('value');
    });

    test('должен обрабатывать очень глубокую вложенность', () => {
      const deepPath = 'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z';
      configManager.set(deepPath, 'deep value');
      expect(configManager.get(deepPath)).toBe('deep value');
    });

    test('должен обрабатывать специальные символы в пути', () => {
      configManager.set('section.special-chars_123', 'value');
      expect(configManager.get('section.special-chars_123')).toBe('value');
    });

    test('должен обрабатывать числовые ключи', () => {
      configManager.set('section.0', 'first');
      configManager.set('section.1', 'second');
      
      expect(configManager.get('section.0')).toBe('first');
      expect(configManager.get('section.1')).toBe('second');
    });
  });

  describe('Интеграция с другими системами', () => {
    test('должен работать с localStorage', () => {
      // Мокаем localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      global.localStorage = mockLocalStorage;

      configManager.set('test.value', 'test data');
      const json = configManager.save();
      
      mockLocalStorage.setItem('config', json);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'config',
        expect.stringContaining('test data')
      );
    });

    test('должен восстанавливаться из localStorage', () => {
      // Мокаем localStorage
      const testConfig = {
        audio: { volume: 0.7, tempo: 130 },
        ui: { theme: 'dark', language: 'ru' },
      };
      
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify(testConfig)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      global.localStorage = mockLocalStorage;

      const storedConfig = mockLocalStorage.getItem('config');
      configManager.load(JSON.parse(storedConfig));
      
      expect(configManager.get('audio.volume')).toBe(0.7);
      expect(configManager.get('audio.tempo')).toBe(130);
      expect(configManager.get('ui.theme')).toBe('dark');
      expect(configManager.get('ui.language')).toBe('ru');
    });
  });

  describe('Производительность', () => {
    test('должен эффективно обрабатывать большое количество операций', () => {
      const startTime = performance.now();
      
      // Выполняем 1000 операций установки
      for (let i = 0; i < 1000; i++) {
        configManager.set(`test.item${i}`, `value${i}`);
      }
      
      // Выполняем 1000 операций получения
      for (let i = 0; i < 1000; i++) {
        expect(configManager.get(`test.item${i}`)).toBe(`value${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Операции должны выполняться быстро (менее 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('должен эффективно работать с глубокой вложенностью', () => {
      const startTime = performance.now();
      
      // Создаем глубокую вложенность
      let path = '';
      for (let i = 0; i < 100; i++) {
        path += `level${i}.`;
      }
      path = path.slice(0, -1); // Удаляем последнюю точку
      
      configManager.set(path, 'deep value');
      expect(configManager.get(path)).toBe('deep value');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Операции должны выполняться быстро (менее 50ms)
      expect(duration).toBeLessThan(50);
    });
  });
});