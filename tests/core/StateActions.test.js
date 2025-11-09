import { StateActions } from '../../js/core/StateActions.js';

// Моки для StateManager и EventBus
class MockStateManager {
  constructor() {
    this.state = {
      bars: [],
      settings: {
        bpm: 120,
        beatCount: 4,
        isPlaying: false,
        volume: {
          strum: 80,
          metronome: 100,
        },
      },
      playback: {
        isPlaying: false,
        currentBar: 0,
        currentBeat: 0,
        tempo: 120,
      },
      ui: {
        selectedTemplate: null,
        showSettings: false,
        arrowsCount: 8,
      },
      chords: {
        validChords: [],
        invalidChords: [],
      },
      songText: {
        content: '',
      },
    };
    this.events = [];
  }

  getState(path) {
    if (!path) return this.state;
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, this.state);
  }

  setState(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, this.state);
    
    target[lastKey] = value;
  }

  updateState(path, updater) {
    const currentValue = this.getState(path);
    const newValue = updater(currentValue);
    this.setState(path, newValue);
  }

  validate(path, value) {
    const validators = {
      'settings.bpm': (val) => typeof val === 'number' && val >= 40 && val <= 300,
      'settings.beatCount': (val) => typeof val === 'number' && val >= 1 && val <= 16,
      'settings.volume.strum': (val) => typeof val === 'number' && val >= 0 && val <= 100,
      'settings.volume.metronome': (val) => typeof val === 'number' && val >= 0 && val <= 100,
    };
    
    const validator = validators[path];
    return validator ? validator(value) : true;
  }
}

class MockEventBus {
  constructor() {
    this.events = [];
  }

  emit(eventName, data) {
    this.events.push({ eventName, data });
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

describe('StateActions', () => {
  let stateManager;
  let eventBus;
  let stateActions;

  beforeEach(() => {
    stateManager = new MockStateManager();
    eventBus = new MockEventBus();
    stateActions = new StateActions(stateManager, eventBus);
  });

  describe('updateChordsInput', () => {
    test('должен обновлять строку аккордов и генерировать событие', () => {
      const chordsString = 'Am F C G';
      stateActions.updateChordsInput(chordsString);
      
      expect(stateManager.getState('chords.inputString')).toBe(chordsString);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'chords:input:changed',
        data: { chordsString }
      });
    });
  });

  describe('updateParsedChords', () => {
    test('должен обновлять валидные и невалидные аккорды и генерировать событие', () => {
      const validChords = ['Am', 'F', 'C', 'G'];
      const invalidChords = ['X', 'Y'];
      
      stateActions.updateParsedChords(validChords, invalidChords);
      
      expect(stateManager.getState('chords.validChords')).toEqual(validChords);
      expect(stateManager.getState('chords.invalidChords')).toEqual(invalidChords);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'chords:parsed',
        data: { validChords, invalidChords }
      });
    });
  });

  describe('updateBars', () => {
    test('должен обновлять такты и генерировать событие', () => {
      const bars = [
        { chords: ['Am', 'F'], duration: 8 },
        { chords: ['C', 'G'], duration: 8 }
      ];
      
      stateActions.updateBars(bars);
      
      expect(stateManager.getState('bars')).toEqual(bars);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'bars:updated',
        data: { bars }
      });
    });
  });

  describe('nextBar', () => {
    test('должен переключать на следующий такт и генерировать событие', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 },
        { chords: ['C'], duration: 4 }
      ]);
      stateManager.setState('currentBarIndex', 0);
      
      stateActions.nextBar();
      
      expect(stateManager.getState('currentBarIndex')).toBe(1);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'navigation:next',
        data: {}
      });
    });

    test('не должен выходить за пределы массива тактов', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 }
      ]);
      stateManager.setState('currentBarIndex', 1);
      
      stateActions.nextBar();
      
      expect(stateManager.getState('currentBarIndex')).toBe(1);
    });
  });

  describe('previousBar', () => {
    test('должен переключать на предыдущий такт и генерировать событие', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 },
        { chords: ['C'], duration: 4 }
      ]);
      stateManager.setState('currentBarIndex', 2);
      
      stateActions.previousBar();
      
      expect(stateManager.getState('currentBarIndex')).toBe(1);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'navigation:previous',
        data: {}
      });
    });

    test('не должен выходить за пределы массива тактов', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 }
      ]);
      stateManager.setState('currentBarIndex', 0);
      
      stateActions.previousBar();
      
      expect(stateManager.getState('currentBarIndex')).toBe(0);
    });
  });

  describe('goToBar', () => {
    test('должен переходить к указанному такту и генерировать событие', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 },
        { chords: ['C'], duration: 4 }
      ]);
      
      stateActions.goToBar(2);
      
      expect(stateManager.getState('currentBarIndex')).toBe(2);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'navigation:goto',
        data: { barIndex: 2 }
      });
    });

    test('должен корректировать индекс, если он выходит за пределы', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 }
      ]);
      
      stateActions.goToBar(5);
      
      expect(stateManager.getState('currentBarIndex')).toBe(1);
    });

    test('должен корректировать отрицательный индекс', () => {
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 }
      ]);
      
      stateActions.goToBar(-1);
      
      expect(stateManager.getState('currentBarIndex')).toBe(0);
    });
  });

  describe('updateTempo', () => {
    test('должен обновлять темп и генерировать событие', () => {
      const bpm = 140;
      stateActions.updateTempo(bpm);
      
      expect(stateManager.getState('settings.bpm')).toBe(bpm);
      expect(stateManager.getState('playback.tempo')).toBe(bpm);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'tempo:changed',
        data: { bpm }
      });
    });

    test('не должен обновлять темп, если значение невалидно', () => {
      const originalBpm = stateManager.getState('settings.bpm');
      stateActions.updateTempo(350); // Невалидное значение
      
      expect(stateManager.getState('settings.bpm')).toBe(originalBpm);
      expect(stateManager.getState('playback.tempo')).toBe(originalBpm);
      expect(eventBus.getEvents()).toHaveLength(0);
    });
  });

  describe('updateBeatCount', () => {
    test('должен обновлять количество долей и генерировать событие', () => {
      const beatCount = 6;
      stateActions.updateBeatCount(beatCount);
      
      expect(stateManager.getState('settings.beatCount')).toBe(beatCount);
      expect(stateManager.getState('ui.arrowsCount')).toBe(beatCount);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'beatCount:changed',
        data: { beatCount }
      });
    });

    test('не должен обновлять количество долей, если значение невалидно', () => {
      const originalBeatCount = stateManager.getState('settings.beatCount');
      const originalArrowsCount = stateManager.getState('ui.arrowsCount');
      stateActions.updateBeatCount(20); // Невалидное значение
      
      expect(stateManager.getState('settings.beatCount')).toBe(originalBeatCount);
      expect(stateManager.getState('ui.arrowsCount')).toBe(originalArrowsCount);
      expect(eventBus.getEvents()).toHaveLength(0);
    });
  });

  describe('togglePlayback', () => {
    test('должен переключать состояние воспроизведения и генерировать событие', () => {
      const originalIsPlaying = stateManager.getState('playback.isPlaying');
      stateActions.togglePlayback();
      
      expect(stateManager.getState('playback.isPlaying')).toBe(!originalIsPlaying);
      expect(stateManager.getState('settings.isPlaying')).toBe(!originalIsPlaying);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'playback:toggled',
        data: { isPlaying: !originalIsPlaying }
      });
    });
  });

  describe('startPlayback', () => {
    test('должен запускать воспроизведение и генерировать событие', () => {
      stateActions.startPlayback();
      
      expect(stateManager.getState('playback.isPlaying')).toBe(true);
      expect(stateManager.getState('settings.isPlaying')).toBe(true);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'playback:started',
        data: {}
      });
    });
  });

  describe('stopPlayback', () => {
    test('должен останавливать воспроизведение, сбрасывать позицию и генерировать событие', () => {
      stateManager.setState('playback.currentBar', 2);
      stateManager.setState('playback.currentBeat', 3);
      
      stateActions.stopPlayback();
      
      expect(stateManager.getState('playback.isPlaying')).toBe(false);
      expect(stateManager.getState('settings.isPlaying')).toBe(false);
      expect(stateManager.getState('playback.currentBar')).toBe(0);
      expect(stateManager.getState('playback.currentBeat')).toBe(0);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'playback:stopped',
        data: {}
      });
    });
  });

  describe('updatePlaybackPosition', () => {
    test('должен обновлять позицию воспроизведения и генерировать событие', () => {
      const barIndex = 2;
      const beatIndex = 3;
      
      stateActions.updatePlaybackPosition(barIndex, beatIndex);
      
      expect(stateManager.getState('playback.currentBar')).toBe(barIndex);
      expect(stateManager.getState('playback.currentBeat')).toBe(beatIndex);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'playback:position:changed',
        data: { barIndex, beatIndex }
      });
    });
  });

  describe('selectTemplate', () => {
    test('должен выбирать шаблон и генерировать событие', () => {
      const templateId = 'rock-template';
      stateActions.selectTemplate(templateId);
      
      expect(stateManager.getState('ui.selectedTemplate')).toBe(templateId);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'template:selected',
        data: { templateId }
      });
    });
  });

  describe('updateVolume', () => {
    test('должен обновлять громкость и генерировать событие', () => {
      const type = 'strum';
      const value = 90;
      
      stateActions.updateVolume(type, value);
      
      expect(stateManager.getState('settings.volume.strum')).toBe(value);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'volume:changed',
        data: { type, value }
      });
    });
  });

  describe('toggleSettings', () => {
    test('должен переключать видимость настроек и генерировать событие', () => {
      const originalShowSettings = stateManager.getState('ui.showSettings');
      stateActions.toggleSettings();
      
      expect(stateManager.getState('ui.showSettings')).toBe(!originalShowSettings);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'ui:settings:toggled',
        data: { visible: !originalShowSettings }
      });
    });
  });

  describe('updateSongText', () => {
    test('должен обновлять текст песни и генерировать событие', () => {
      const content = 'Текст песни';
      stateActions.updateSongText(content);
      
      expect(stateManager.getState('songText.content')).toBe(content);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'songText:updated',
        data: { content }
      });
    });
  });

  describe('Граничные случаи и обработка ошибок', () => {
    test('должен обрабатывать null в updateChordsInput', () => {
      stateActions.updateChordsInput(null);
      
      expect(stateManager.getState('chords.inputString')).toBeNull();
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'chords:input:changed',
        data: { chordsString: null }
      });
    });

    test('должен обрабатывать undefined в updateChordsInput', () => {
      stateActions.updateChordsInput(undefined);
      
      expect(stateManager.getState('chords.inputString')).toBeUndefined();
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'chords:input:changed',
        data: { chordsString: undefined }
      });
    });

    test('должен обрабатывать пустые массивы в updateParsedChords', () => {
      stateActions.updateParsedChords([], []);
      
      expect(stateManager.getState('chords.validChords')).toEqual([]);
      expect(stateManager.getState('chords.invalidChords')).toEqual([]);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'chords:parsed',
        data: { validChords: [], invalidChords: [] }
      });
    });

    test('должен обрабатывать null в updateBars', () => {
      stateActions.updateBars(null);
      
      expect(stateManager.getState('bars')).toBeNull();
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'bars:updated',
        data: { bars: null }
      });
    });

    test('должен обрабатывать пустой массив в updateBars', () => {
      stateActions.updateBars([]);
      
      expect(stateManager.getState('bars')).toEqual([]);
      expect(eventBus.getEvents()).toContainEqual({
        eventName: 'bars:updated',
        data: { bars: [] }
      });
    });

    test('должен корректно работать с граничными значениями в updateTempo', () => {
      // Минимальное валидное значение
      stateActions.updateTempo(40);
      expect(stateManager.getState('settings.bpm')).toBe(40);
      expect(stateManager.getState('playback.tempo')).toBe(40);
      
      // Максимальное валидное значение
      stateActions.updateTempo(300);
      expect(stateManager.getState('settings.bpm')).toBe(300);
      expect(stateManager.getState('playback.tempo')).toBe(300);
    });

    test('должен корректно работать с граничными значениями в updateBeatCount', () => {
      // Минимальное валидное значение
      stateActions.updateBeatCount(1);
      expect(stateManager.getState('settings.beatCount')).toBe(1);
      expect(stateManager.getState('ui.arrowsCount')).toBe(1);
      
      // Максимальное валидное значение
      stateActions.updateBeatCount(16);
      expect(stateManager.getState('settings.beatCount')).toBe(16);
      expect(stateManager.getState('ui.arrowsCount')).toBe(16);
    });

    test('должен корректно работать с граничными значениями в updateVolume', () => {
      // Минимальное валидное значение
      stateActions.updateVolume('strum', 0);
      expect(stateManager.getState('settings.volume.strum')).toBe(0);
      
      // Максимальное валидное значение
      stateActions.updateVolume('strum', 100);
      expect(stateManager.getState('settings.volume.strum')).toBe(100);
      
      // То же самое для metronome
      stateActions.updateVolume('metronome', 0);
      expect(stateManager.getState('settings.volume.metronome')).toBe(0);
      
      stateActions.updateVolume('metronome', 100);
      expect(stateManager.getState('settings.volume.metronome')).toBe(100);
    });

    test('должен обрабатывать некорректные типы в updateVolume', () => {
      const originalStrum = stateManager.getState('settings.volume.strum');
      
      stateActions.updateVolume('strum', 'invalid');
      stateActions.updateVolume('strum', null);
      stateActions.updateVolume('strum', undefined);
      
      // Состояние не должно измениться при невалидных значениях
      expect(stateManager.getState('settings.volume.strum')).toBe(originalStrum);
    });

    test('должен обрабатывать некорректные типы в updateTempo', () => {
      const originalBpm = stateManager.getState('settings.bpm');
      
      stateActions.updateTempo('invalid');
      stateActions.updateTempo(null);
      stateActions.updateTempo(undefined);
      
      // Состояние не должно измениться при невалидных значениях
      expect(stateManager.getState('settings.bpm')).toBe(originalBpm);
    });

    test('должен обрабатывать некорректные типы в updateBeatCount', () => {
      const originalBeatCount = stateManager.getState('settings.beatCount');
      
      stateActions.updateBeatCount('invalid');
      stateActions.updateBeatCount(null);
      stateActions.updateBeatCount(undefined);
      
      // Состояние не должно измениться при невалидных значениях
      expect(stateManager.getState('settings.beatCount')).toBe(originalBeatCount);
    });
  });

  describe('Интеграция между методами', () => {
    test('должен синхронизировать состояние воспроизведения', () => {
      // Начинаем воспроизведение
      stateActions.startPlayback();
      expect(stateManager.getState('playback.isPlaying')).toBe(true);
      expect(stateManager.getState('settings.isPlaying')).toBe(true);
      
      // Переключаем
      stateActions.togglePlayback();
      expect(stateManager.getState('playback.isPlaying')).toBe(false);
      expect(stateManager.getState('settings.isPlaying')).toBe(false);
      
      // Останавливаем
      stateActions.stopPlayback();
      expect(stateManager.getState('playback.isPlaying')).toBe(false);
      expect(stateManager.getState('settings.isPlaying')).toBe(false);
      expect(stateManager.getState('playback.currentBar')).toBe(0);
      expect(stateManager.getState('playback.currentBeat')).toBe(0);
    });

    test('должен корректно обновлять темп в обоих местах', () => {
      stateActions.updateTempo(140);
      
      expect(stateManager.getState('settings.bpm')).toBe(140);
      expect(stateManager.getState('playback.tempo')).toBe(140);
    });

    test('должен корректно обновлять количество долей в обоих местах', () => {
      stateActions.updateBeatCount(6);
      
      expect(stateManager.getState('settings.beatCount')).toBe(6);
      expect(stateManager.getState('ui.arrowsCount')).toBe(6);
    });

    test('должен корректно обрабатывать навигацию по тактам', () => {
      // Устанавливаем несколько тактов
      stateManager.setState('bars', [
        { chords: ['Am'], duration: 4 },
        { chords: ['F'], duration: 4 },
        { chords: ['C'], duration: 4 }
      ]);
      
      // Переходим к конкретному такту
      stateActions.goToBar(1);
      expect(stateManager.getState('currentBarIndex')).toBe(1);
      
      // Следующий такт
      stateActions.nextBar();
      expect(stateManager.getState('currentBarIndex')).toBe(2);
      
      // Предыдущий такт
      stateActions.previousBar();
      expect(stateManager.getState('currentBarIndex')).toBe(1);
      
      // Попытка перейти за пределы
      stateActions.goToBar(10);
      expect(stateManager.getState('currentBarIndex')).toBe(2); // Должен быть ограничен
      
      stateActions.goToBar(-1);
      expect(stateManager.getState('currentBarIndex')).toBe(0); // Должен быть ограничен
    });
  });

  describe('Производительность', () => {
    test('должен эффективно обрабатывать множественные вызовы', () => {
      const startTime = performance.now();
      
      // Выполняем 1000 операций
      for (let i = 0; i < 1000; i++) {
        stateActions.updateChordsInput(`test chord ${i}`);
        stateActions.updateTempo(120 + i % 100);
        stateActions.updateVolume('strum', 50 + i % 50);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Операции должны выполняться быстро (менее 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('должен эффективно обрабатывать сложные объекты', () => {
      const complexBars = [];
      for (let i = 0; i < 100; i++) {
        complexBars.push({
          chords: [`Chord${i}`, `Chord${i + 1}`],
          duration: 4,
          metadata: {
            id: i,
            timestamp: Date.now(),
            complex: {
              nested: {
                value: i,
                array: [1, 2, 3, 4, 5]
              }
            }
          }
        });
      }
      
      const startTime = performance.now();
      stateActions.updateBars(complexBars);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(stateManager.getState('bars')).toEqual(complexBars);
      expect(duration).toBeLessThan(50); // Должно выполняться быстро
    });
  });

  describe('События', () => {
    test('должен генерировать события с корректными данными', () => {
      const testCases = [
        {
          method: 'updateChordsInput',
          args: ['C G Am F'],
          expectedEvent: 'chords:input:changed',
          expectedData: { chordsString: 'C G Am F' }
        },
        {
          method: 'updateParsedChords',
          args: [['C', 'G'], ['X']],
          expectedEvent: 'chords:parsed',
          expectedData: { validChords: ['C', 'G'], invalidChords: ['X'] }
        },
        {
          method: 'updateBars',
          args: [[{ chords: ['C'] }]],
          expectedEvent: 'bars:updated',
          expectedData: { bars: [{ chords: ['C'] }] }
        },
        {
          method: 'nextBar',
          args: [],
          expectedEvent: 'navigation:next',
          expectedData: {}
        },
        {
          method: 'previousBar',
          args: [],
          expectedEvent: 'navigation:previous',
          expectedData: {}
        },
        {
          method: 'goToBar',
          args: [2],
          expectedEvent: 'navigation:goto',
          expectedData: { barIndex: 2 }
        },
        {
          method: 'updateTempo',
          args: [140],
          expectedEvent: 'tempo:changed',
          expectedData: { bpm: 140 }
        },
        {
          method: 'updateBeatCount',
          args: [6],
          expectedEvent: 'beatCount:changed',
          expectedData: { beatCount: 6 }
        },
        {
          method: 'togglePlayback',
          args: [],
          expectedEvent: 'playback:toggled',
          expectedData: { isPlaying: expect.any(Boolean) }
        },
        {
          method: 'startPlayback',
          args: [],
          expectedEvent: 'playback:started',
          expectedData: {}
        },
        {
          method: 'stopPlayback',
          args: [],
          expectedEvent: 'playback:stopped',
          expectedData: {}
        },
        {
          method: 'updatePlaybackPosition',
          args: [2, 3],
          expectedEvent: 'playback:position:changed',
          expectedData: { barIndex: 2, beatIndex: 3 }
        },
        {
          method: 'selectTemplate',
          args: ['test-template'],
          expectedEvent: 'template:selected',
          expectedData: { templateId: 'test-template' }
        },
        {
          method: 'updateVolume',
          args: ['strum', 80],
          expectedEvent: 'volume:changed',
          expectedData: { type: 'strum', value: 80 }
        },
        {
          method: 'toggleSettings',
          args: [],
          expectedEvent: 'ui:settings:toggled',
          expectedData: { visible: expect.any(Boolean) }
        },
        {
          method: 'updateSongText',
          args: ['Test song text'],
          expectedEvent: 'songText:updated',
          expectedData: { content: 'Test song text' }
        }
      ];

      testCases.forEach(({ method, args, expectedEvent, expectedData }) => {
        eventBus.clearEvents();
        stateActions[method](...args);
        
        const events = eventBus.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({
          eventName: expectedEvent,
          data: expectedData
        });
      });
    });
  });
});