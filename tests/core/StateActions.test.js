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
});