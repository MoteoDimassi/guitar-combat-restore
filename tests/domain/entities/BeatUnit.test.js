import BeatUnit from '../../../js/domain/entities/BeatUnit.js';

describe('BeatUnit', () => {
  let beatUnit;

  beforeEach(() => {
    beatUnit = new BeatUnit();
  });

  describe('Конструктор', () => {
    test('должен создаваться с параметром по умолчанию', () => {
      const defaultBeatUnit = new BeatUnit();
      expect(defaultBeatUnit.value).toBe(4);
    });

    test('должен создаваться с кастомным значением', () => {
      const customBeatUnit = new BeatUnit(8);
      expect(customBeatUnit.value).toBe(8);
    });

    test('должен корректно обрабатывать дробные значения', () => {
      const fractionalBeatUnit = new BeatUnit(2.5);
      expect(fractionalBeatUnit.value).toBe(2.5);
    });

    test('должен корректно обрабатывать нулевое значение', () => {
      const zeroBeatUnit = new BeatUnit(0);
      expect(zeroBeatUnit.value).toBe(0);
    });

    test('должен корректно обрабатывать отрицательные значения', () => {
      const negativeBeatUnit = new BeatUnit(-4);
      expect(negativeBeatUnit.value).toBe(-4);
    });
  });

  describe('getValue', () => {
    test('должен возвращать текущее значение', () => {
      expect(beatUnit.getValue()).toBe(4);
    });

    test('должен возвращать измененное значение после setValue', () => {
      beatUnit.setValue(8);
      expect(beatUnit.getValue()).toBe(8);
    });

    test('должен возвращать дробные значения', () => {
      beatUnit.setValue(2.5);
      expect(beatUnit.getValue()).toBe(2.5);
    });

    test('должен возвращать нулевое значение', () => {
      beatUnit.setValue(0);
      expect(beatUnit.getValue()).toBe(0);
    });
  });

  describe('setValue', () => {
    test('должен устанавливать новое значение', () => {
      beatUnit.setValue(8);
      expect(beatUnit.value).toBe(8);
    });

    test('должен устанавливать дробные значения', () => {
      beatUnit.setValue(2.5);
      expect(beatUnit.value).toBe(2.5);
    });

    test('должен устанавливать нулевое значение', () => {
      beatUnit.setValue(0);
      expect(beatUnit.value).toBe(0);
    });

    test('должен устанавливать отрицательные значения', () => {
      beatUnit.setValue(-4);
      expect(beatUnit.value).toBe(-4);
    });

    test('должен перезаписывать существующее значение', () => {
      beatUnit.setValue(8);
      beatUnit.setValue(16);
      expect(beatUnit.value).toBe(16);
    });

    test('должен устанавливать очень большие значения', () => {
      beatUnit.setValue(1024);
      expect(beatUnit.value).toBe(1024);
    });

    test('должен устанавливать очень маленькие значения', () => {
      beatUnit.setValue(0.001);
      expect(beatUnit.value).toBe(0.001);
    });
  });

  describe('getDuration', () => {
    test('должен возвращать длительность для целой ноты (value=1)', () => {
      beatUnit.setValue(1);
      expect(beatUnit.getDuration()).toBe(1);
    });

    test('должен возвращать длительность для половинной ноты (value=2)', () => {
      beatUnit.setValue(2);
      expect(beatUnit.getDuration()).toBe(0.5);
    });

    test('должен возвращать длительность для четвертной ноты (value=4)', () => {
      beatUnit.setValue(4);
      expect(beatUnit.getDuration()).toBe(0.25);
    });

    test('должен возвращать длительность для восьмой ноты (value=8)', () => {
      beatUnit.setValue(8);
      expect(beatUnit.getDuration()).toBe(0.125);
    });

    test('должен возвращать длительность для шестнадцатой ноты (value=16)', () => {
      beatUnit.setValue(16);
      expect(beatUnit.getDuration()).toBe(0.0625);
    });

    test('должен возвращать длительность для тридцать второй ноты (value=32)', () => {
      beatUnit.setValue(32);
      expect(beatUnit.getDuration()).toBe(0.03125);
    });

    test('должен корректно обрабатывать дробные значения', () => {
      beatUnit.setValue(2.5);
      expect(beatUnit.getDuration()).toBe(0.4);
    });

    test('должен обрабатывать отрицательные значения', () => {
      beatUnit.setValue(-4);
      expect(beatUnit.getDuration()).toBe(-0.25);
    });

    test('должен возвращать точные значения для стандартных нотных длительностей', () => {
      const testCases = [
        { value: 1, expected: 1 },
        { value: 2, expected: 0.5 },
        { value: 4, expected: 0.25 },
        { value: 8, expected: 0.125 },
        { value: 16, expected: 0.0625 },
        { value: 32, expected: 0.03125 },
        { value: 64, expected: 0.015625 }
      ];

      testCases.forEach(({ value, expected }) => {
        beatUnit.setValue(value);
        expect(beatUnit.getDuration()).toBeCloseTo(expected, 10);
      });
    });
  });

  describe('Музыкальные инварианты', () => {
    test('должен корректно представлять стандартные нотные длительности', () => {
      const standardDurations = [1, 2, 4, 8, 16, 32, 64];
      
      standardDurations.forEach(value => {
        beatUnit.setValue(value);
        const duration = beatUnit.getDuration();
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(1);
      });
    });

    test('должен поддерживать точки (увеличение длительности на 50%)', () => {
      beatUnit.setValue(4);
      const duration = beatUnit.getDuration();
      const dottedDuration = duration * 1.5;
      
      expect(dottedDuration).toBe(0.375);
    });

    test('должен поддерживать триоли (деление на 3 части)', () => {
      beatUnit.setValue(8);
      const duration = beatUnit.getDuration();
      const tripletDuration = duration * (2/3);
      
      expect(tripletDuration).toBeCloseTo(0.08333, 5);
    });
  });

  describe('Пограничные случаи и обработка ошибок', () => {
    test('должен обрабатывать очень большие значения', () => {
      beatUnit.setValue(1024);
      expect(beatUnit.getDuration()).toBeCloseTo(0.0009765625, 10);
    });

    test('должен обрабатывать очень маленькие положительные значения', () => {
      beatUnit.setValue(0.1);
      expect(beatUnit.getDuration()).toBe(10);
    });

    test('должен сохранять точность при последовательных операциях', () => {
      beatUnit.setValue(4);
      const duration1 = beatUnit.getDuration();
      
      beatUnit.setValue(8);
      const duration2 = beatUnit.getDuration();
      
      beatUnit.setValue(4);
      const duration3 = beatUnit.getDuration();
      
      // Проверяем, что после возвращения к исходному значению,
      // длительность также возвращается к исходной
      expect(duration1).toBe(duration3);
      // А при изменении значения на 8, длительность должна измениться
      expect(duration1).not.toBe(duration2);
    });
  });

  describe('Инкапсуляция данных', () => {
    test('должен предоставлять контролируемый доступ к значению', () => {
      beatUnit.setValue(8);
      expect(beatUnit.value).toBe(8);
      
      // В JavaScript прямое изменение свойства возможно,
      // но бизнес-логика должна использовать методы
      beatUnit.value = 16;
      expect(beatUnit.value).toBe(16);
    });
  });
});