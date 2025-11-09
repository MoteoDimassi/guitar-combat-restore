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
});