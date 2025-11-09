import { StateManager } from '../StateManager.js';
import { StateActions } from '../StateActions.js';
import { StateSelectors } from '../StateSelectors.js';
import { EventBus } from '../EventBus.js';

// Инициализация
const eventBus = new EventBus();
const stateManager = new StateManager(eventBus);
const stateActions = new StateActions(stateManager, eventBus);

// Подписка на изменения состояния
const unsubscribe = stateManager.subscribe("settings.bpm", (newBpm, oldBpm) => {
  console.log(`Tempo changed from ${oldBpm} to ${newBpm}`);
});

// Использование действий
stateActions.updateTempo(120);
stateActions.updateChordsInput("Am F C G");
stateActions.togglePlayback();

// Получение состояния через селекторы
const currentChords = StateSelectors.getCurrentChords(stateManager.getState());
const playbackSettings = StateSelectors.getPlaybackSettings(
  stateManager.getState()
);

console.log('Current chords:', currentChords);
console.log('Playback settings:', playbackSettings);

// Отписка
unsubscribe();

// Дополнительные примеры использования
console.log('=== Дополнительные примеры ===');

// 1. Работа с тактами
stateActions.updateBars([
  { chords: ['Am', 'F'], duration: 8 },
  { chords: ['C', 'G'], duration: 8 }
]);

stateActions.nextBar();
const currentBar = StateSelectors.getCurrentBar(stateManager.getState());
console.log('Current bar:', currentBar);

// 2. Получение статистики
const chordsStats = StateSelectors.getChordsStats(stateManager.getState());
const barsInfo = StateSelectors.getBarsInfo(stateManager.getState());
console.log('Chords stats:', chordsStats);
console.log('Bars info:', barsInfo);

// 3. Работа с шаблонами
stateActions.selectTemplate('rock-template');
const templatesInfo = StateSelectors.getTemplatesInfo(stateManager.getState());
console.log('Templates info:', templatesInfo);

// 4. Подписка на несколько путей состояния
const unsubscribeMultiple = stateManager.subscribeMultiple(
  ['playback.isPlaying', 'settings.bpm'],
  (value, oldValue, changedPath) => {
    console.log(`Path ${changedPath} changed from ${oldValue} to ${value}`);
  }
);

stateActions.updateTempo(130);
stateActions.togglePlayback();

unsubscribeMultiple();

export { stateManager, stateActions, StateSelectors };