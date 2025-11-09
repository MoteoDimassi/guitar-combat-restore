import { StateSelectors } from '../../js/core/StateSelectors.js';

describe('StateSelectors', () => {
  let mockState;

  beforeEach(() => {
    mockState = {
      chords: {
        inputString: 'Am F C G',
        parsedChords: ['Am', 'F', 'C', 'G'],
        validChords: ['Am', 'F', 'C', 'G'],
        invalidChords: [],
      },
      bars: [
        { chords: ['Am', 'F'], duration: 8 },
        { chords: ['C', 'G'], duration: 8 },
        { chords: ['Dm', 'Am'], duration: 8 },
      ],
      currentBarIndex: 1,
      settings: {
        bpm: 120,
        beatCount: 4,
        isPlaying: false,
      },
      playback: {
        isPlaying: true,
        currentBar: 1,
        currentBeat: 2,
        tempo: 120,
      },
      ui: {
        selectedTemplate: 'rock-template',
        showSettings: false,
        showSongText: false,
        arrowsCount: 8,
      },
      templates: {
        available: ['rock-template', 'jazz-template', 'pop-template'],
        loaded: ['rock-template', 'jazz-template'],
        custom: ['custom-template'],
      },
    };
  });

  describe('getCurrentChords', () => {
    test('должен возвращать валидные аккорды', () => {
      const result = StateSelectors.getCurrentChords(mockState);
      expect(result).toEqual(['Am', 'F', 'C', 'G']);
    });

    test('должен возвращать пустой массив, если нет валидных аккордов', () => {
      mockState.chords.validChords = [];
      const result = StateSelectors.getCurrentChords(mockState);
      expect(result).toEqual([]);
    });
  });

  describe('getCurrentBar', () => {
    test('должен возвращать текущий такт', () => {
      const result = StateSelectors.getCurrentBar(mockState);
      expect(result).toEqual({ chords: ['C', 'G'], duration: 8 });
    });

    test('должен возвращать null, если индекс такта вне диапазона', () => {
      mockState.currentBarIndex = 10;
      const result = StateSelectors.getCurrentBar(mockState);
      expect(result).toBeNull();
    });

    test('должен возвращать null, если нет тактов', () => {
      mockState.bars = [];
      const result = StateSelectors.getCurrentBar(mockState);
      expect(result).toBeNull();
    });
  });

  describe('getPlaybackSettings', () => {
    test('должен возвращать настройки воспроизведения', () => {
      const result = StateSelectors.getPlaybackSettings(mockState);
      expect(result).toEqual({
        bpm: 120,
        beatCount: 4,
        isPlaying: true,
      });
    });

    test('должен возвращать корректные настройки при измененном состоянии', () => {
      mockState.settings.bpm = 140;
      mockState.settings.beatCount = 6;
      mockState.playback.isPlaying = false;
      
      const result = StateSelectors.getPlaybackSettings(mockState);
      expect(result).toEqual({
        bpm: 140,
        beatCount: 6,
        isPlaying: false,
      });
    });
  });

  describe('getTemplatesInfo', () => {
    test('должен возвращать информацию о шаблонах', () => {
      const result = StateSelectors.getTemplatesInfo(mockState);
      expect(result).toEqual({
        available: ['rock-template', 'jazz-template', 'pop-template'],
        loaded: ['rock-template', 'jazz-template'],
        custom: ['custom-template'],
        selected: 'rock-template',
      });
    });

    test('должен возвращать пустые массивы, если нет шаблонов', () => {
      mockState.templates = {
        available: [],
        loaded: [],
        custom: [],
      };
      mockState.ui.selectedTemplate = null;
      
      const result = StateSelectors.getTemplatesInfo(mockState);
      expect(result).toEqual({
        available: [],
        loaded: [],
        custom: [],
        selected: null,
      });
    });
  });

  describe('getChordsStats', () => {
    test('должен возвращать статистику по аккордам', () => {
      const result = StateSelectors.getChordsStats(mockState);
      expect(result).toEqual({
        total: 4,
        valid: 4,
        invalid: 0,
      });
    });

    test('должен корректно считать статистику с невалидными аккордами', () => {
      mockState.chords.parsedChords = ['Am', 'F', 'C', 'G', 'X', 'Y'];
      mockState.chords.validChords = ['Am', 'F', 'C', 'G'];
      mockState.chords.invalidChords = ['X', 'Y'];
      
      const result = StateSelectors.getChordsStats(mockState);
      expect(result).toEqual({
        total: 6,
        valid: 4,
        invalid: 2,
      });
    });

    test('должен возвращать нулевую статистику для пустых данных', () => {
      mockState.chords.parsedChords = [];
      mockState.chords.validChords = [];
      mockState.chords.invalidChords = [];
      
      const result = StateSelectors.getChordsStats(mockState);
      expect(result).toEqual({
        total: 0,
        valid: 0,
        invalid: 0,
      });
    });
  });

  describe('getBarsInfo', () => {
    test('должен возвращать информацию о тактах', () => {
      const result = StateSelectors.getBarsInfo(mockState);
      expect(result).toEqual({
        total: 3,
        current: 1,
        hasPrevious: true,
        hasNext: true,
      });
    });

    test('должен корректно определять наличие предыдущего/следующего такта', () => {
      // Первый такт
      mockState.currentBarIndex = 0;
      let result = StateSelectors.getBarsInfo(mockState);
      expect(result.hasPrevious).toBe(false);
      expect(result.hasNext).toBe(true);
      
      // Последний такт
      mockState.currentBarIndex = 2;
      result = StateSelectors.getBarsInfo(mockState);
      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(false);
    });

    test('должен возвращать корректную информацию для одного такта', () => {
      mockState.bars = [{ chords: ['Am'], duration: 4 }];
      mockState.currentBarIndex = 0;
      
      const result = StateSelectors.getBarsInfo(mockState);
      expect(result).toEqual({
        total: 1,
        current: 0,
        hasPrevious: false,
        hasNext: false,
      });
    });

    test('должен возвращать нулевую информацию для пустого массива тактов', () => {
      mockState.bars = [];
      mockState.currentBarIndex = 0;
      
      const result = StateSelectors.getBarsInfo(mockState);
      expect(result).toEqual({
        total: 0,
        current: 0,
        hasPrevious: false,
        hasNext: false,
      });
    });
  });

  describe('Граничные случаи и обработка ошибок', () => {
    test('должен обрабатывать пустое состояние', () => {
      const emptyState = {};
      
      expect(StateSelectors.getCurrentChords(emptyState)).toEqual([]);
      expect(StateSelectors.getCurrentBar(emptyState)).toBeNull();
      expect(StateSelectors.getPlaybackSettings(emptyState)).toEqual({
        bpm: undefined,
        beatCount: undefined,
        isPlaying: undefined,
      });
      expect(StateSelectors.getTemplatesInfo(emptyState)).toEqual({
        available: undefined,
        loaded: undefined,
        custom: undefined,
        selected: undefined,
      });
      expect(StateSelectors.getChordsStats(emptyState)).toEqual({
        total: undefined,
        valid: undefined,
        invalid: undefined,
      });
      expect(StateSelectors.getBarsInfo(emptyState)).toEqual({
        total: undefined,
        current: undefined,
        hasPrevious: false,
        hasNext: false,
      });
    });

    test('должен обрабатывать null состояние', () => {
      expect(StateSelectors.getCurrentChords(null)).toEqual([]);
      expect(StateSelectors.getCurrentBar(null)).toBeNull();
      expect(StateSelectors.getPlaybackSettings(null)).toEqual({
        bpm: undefined,
        beatCount: undefined,
        isPlaying: undefined,
      });
    });

    test('должен обрабатывать undefined состояние', () => {
      expect(StateSelectors.getCurrentChords(undefined)).toEqual([]);
      expect(StateSelectors.getCurrentBar(undefined)).toBeNull();
      expect(StateSelectors.getPlaybackSettings(undefined)).toEqual({
        bpm: undefined,
        beatCount: undefined,
        isPlaying: undefined,
      });
    });

    test('должен обрабатывать отсутствующие свойства в состоянии', () => {
      const incompleteState = {
        // Отсутствуют chords, bars, settings, playback, ui, templates
      };
      
      expect(StateSelectors.getCurrentChords(incompleteState)).toEqual([]);
      expect(StateSelectors.getCurrentBar(incompleteState)).toBeNull();
      expect(StateSelectors.getPlaybackSettings(incompleteState)).toEqual({
        bpm: undefined,
        beatCount: undefined,
        isPlaying: undefined,
      });
      expect(StateSelectors.getTemplatesInfo(incompleteState)).toEqual({
        available: undefined,
        loaded: undefined,
        custom: undefined,
        selected: undefined,
      });
      expect(StateSelectors.getChordsStats(incompleteState)).toEqual({
        total: undefined,
        valid: undefined,
        invalid: undefined,
      });
      expect(StateSelectors.getBarsInfo(incompleteState)).toEqual({
        total: undefined,
        current: undefined,
        hasPrevious: false,
        hasNext: false,
      });
    });

    test('должен обрабатывать некорректные типы данных', () => {
      const invalidState = {
        chords: {
          validChords: 'not an array',
          invalidChords: null,
          parsedChords: undefined,
        },
        bars: 'not an array',
        currentBarIndex: 'not a number',
        settings: {
          bpm: 'not a number',
          beatCount: 'not a number',
          isPlaying: 'not a boolean',
        },
        playback: {
          isPlaying: 'not a boolean',
          currentBar: 'not a number',
          currentBeat: 'not a number',
          tempo: 'not a number',
        },
        ui: {
          selectedTemplate: null,
        },
        templates: {
          available: 'not an array',
          loaded: 'not an array',
          custom: 'not an array',
        },
      };
      
      expect(StateSelectors.getCurrentChords(invalidState)).toEqual([]);
      expect(StateSelectors.getCurrentBar(invalidState)).toBeNull();
      expect(StateSelectors.getPlaybackSettings(invalidState)).toEqual({
        bpm: undefined,
        beatCount: undefined,
        isPlaying: undefined,
      });
      expect(StateSelectors.getTemplatesInfo(invalidState)).toEqual({
        available: undefined,
        loaded: undefined,
        custom: undefined,
        selected: null,
      });
      expect(StateSelectors.getChordsStats(invalidState)).toEqual({
        total: undefined,
        valid: undefined,
        invalid: undefined,
      });
      expect(StateSelectors.getBarsInfo(invalidState)).toEqual({
        total: undefined,
        current: undefined,
        hasPrevious: false,
        hasNext: false,
      });
    });
  });

  describe('Сложные сценарии', () => {
    test('должен корректно обрабатывать большое количество аккордов', () => {
      const largeChordList = [];
      for (let i = 0; i < 1000; i++) {
        largeChordList.push(`Chord${i}`);
      }
      
      const state = {
        chords: {
          validChords: largeChordList,
          invalidChords: [],
          parsedChords: largeChordList,
        },
      };
      
      const result = StateSelectors.getCurrentChords(state);
      expect(result).toHaveLength(1000);
      expect(result[0]).toBe('Chord0');
      expect(result[999]).toBe('Chord999');
    });

    test('должен корректно обрабатывать большое количество тактов', () => {
      const largeBarsList = [];
      for (let i = 0; i < 1000; i++) {
        largeBarsList.push({ chords: [`Chord${i}`], duration: 4 });
      }
      
      const state = {
        bars: largeBarsList,
        currentBarIndex: 500,
      };
      
      const result = StateSelectors.getBarsInfo(state);
      expect(result.total).toBe(1000);
      expect(result.current).toBe(500);
      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(true);
    });

    test('должен корректно обрабатывать смешанные валидные и невалидные аккорды', () => {
      const state = {
        chords: {
          validChords: ['C', 'G', 'Am', 'F'],
          invalidChords: ['X', 'Y', 'Z'],
          parsedChords: ['C', 'G', 'Am', 'F', 'X', 'Y', 'Z'],
        },
      };
      
      const chords = StateSelectors.getCurrentChords(state);
      const stats = StateSelectors.getChordsStats(state);
      
      expect(chords).toEqual(['C', 'G', 'Am', 'F']);
      expect(stats).toEqual({
        total: 7,
        valid: 4,
        invalid: 3,
      });
    });

    test('должен корректно обрабатывать крайние позиции в тактах', () => {
      const state = {
        bars: [
          { chords: ['C'], duration: 4 },
          { chords: ['G'], duration: 4 },
          { chords: ['Am'], duration: 4 },
        ],
        currentBarIndex: 0,
      };
      
      let result = StateSelectors.getBarsInfo(state);
      expect(result.hasPrevious).toBe(false);
      expect(result.hasNext).toBe(true);
      
      state.currentBarIndex = 2;
      result = StateSelectors.getBarsInfo(state);
      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(false);
    });

    test('должен корректно обрабатывать пустые шаблоны', () => {
      const state = {
        templates: {
          available: [],
          loaded: [],
          custom: [],
        },
        ui: {
          selectedTemplate: null,
        },
      };
      
      const result = StateSelectors.getTemplatesInfo(state);
      expect(result).toEqual({
        available: [],
        loaded: [],
        custom: [],
        selected: null,
      });
    });

    test('должен корректно обрабатывать сложные настройки воспроизведения', () => {
      const state = {
        settings: {
          bpm: 140,
          beatCount: 6,
          isPlaying: true,
        },
        playback: {
          isPlaying: false, // Другое значение
          currentBar: 5,
          currentBeat: 2,
          tempo: 120, // Другое значение
        },
      };
      
      const result = StateSelectors.getPlaybackSettings(state);
      // Должен брать значение из settings.isPlaying
      expect(result).toEqual({
        bpm: 140,
        beatCount: 6,
        isPlaying: true,
      });
    });
  });

  describe('Производительность', () => {
    test('должен эффективно обрабатывать большие состояния', () => {
      // Создаем большое состояние
      const largeState = {
        chords: {
          validChords: Array(1000).fill().map((_, i) => `Chord${i}`),
          invalidChords: Array(500).fill().map((_, i) => `Invalid${i}`),
          parsedChords: Array(1500).fill().map((_, i) => `Chord${i}`),
        },
        bars: Array(1000).fill().map((_, i) => ({
          chords: [`Chord${i}`, `Chord${i + 1}`],
          duration: 4,
          metadata: { id: i, complex: { nested: { value: i } } }
        })),
        currentBarIndex: 500,
        settings: {
          bpm: 120,
          beatCount: 4,
          isPlaying: true,
        },
        playback: {
          isPlaying: true,
          currentBar: 500,
          currentBeat: 2,
          tempo: 120,
        },
        ui: {
          selectedTemplate: 'template-500',
        },
        templates: {
          available: Array(100).fill().map((_, i) => `template-${i}`),
          loaded: Array(50).fill().map((_, i) => `loaded-${i}`),
          custom: Array(25).fill().map((_, i) => `custom-${i}`),
        },
      };
      
      const startTime = performance.now();
      
      // Выполняем все селекторы
      StateSelectors.getCurrentChords(largeState);
      StateSelectors.getCurrentBar(largeState);
      StateSelectors.getPlaybackSettings(largeState);
      StateSelectors.getTemplatesInfo(largeState);
      StateSelectors.getChordsStats(largeState);
      StateSelectors.getBarsInfo(largeState);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Операции должны выполняться быстро (менее 50ms)
      expect(duration).toBeLessThan(50);
    });
  });
});