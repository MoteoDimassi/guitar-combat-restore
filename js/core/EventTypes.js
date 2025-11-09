export const EventTypes = {
  // События состояния
  STATE_CHANGED: "state:changed",
  STATE_RESET: "state:reset",
  STATE_LOADED: "state:loaded",

  // События аккордов
  CHORDS_INPUT_CHANGED: "chords:input:changed",
  CHORDS_PARSED: "chords:parsed",
  CHORDS_VALIDATED: "chords:validated",
  CHORD_UPDATED: "chord:updated",

  // События тактов
  BARS_UPDATED: "bars:updated",
  BAR_CHANGED: "bar:changed",
  BAR_CREATED: "bar:created",
  BAR_DELETED: "bar:deleted",

  // События навигации
  NAVIGATION_NEXT: "navigation:next",
  NAVIGATION_PREVIOUS: "navigation:previous",
  NAVIGATION_GOTO: "navigation:goto",

  // События воспроизведения
  PLAYBACK_STARTED: "playback:started",
  PLAYBACK_STOPPED: "playback:stopped",
  PLAYBACK_TOGGLED: "playback:toggled",
  PLAYBACK_POSITION_CHANGED: "playback:position:changed",

  // События темпа
  TEMPO_CHANGED: "tempo:changed",
  TEMPO_INCREMENTED: "tempo:incremented",
  TEMPO_DECREMENTED: "tempo:decremented",

  // События количества долей
  BEAT_COUNT_CHANGED: "beatCount:changed",

  // События шаблонов
  TEMPLATE_SELECTED: "template:selected",
  TEMPLATE_APPLIED: "template:applied",
  TEMPLATE_LOADED: "template:loaded",

  // События UI
  UI_SETTINGS_TOGGLED: "ui:settings:toggled",
  UI_SONG_TEXT_TOGGLED: "ui:songText:toggled",
  UI_MODAL_OPENED: "ui:modal:opened",
  UI_MODAL_CLOSED: "ui:modal:closed",

  // События громкости
  VOLUME_CHANGED: "volume:changed",

  // События текста песни
  SONG_TEXT_UPDATED: "songText:updated",

  // События аудио
  AUDIO_INITIALIZED: "audio:initialized",
  AUDIO_PLAY_STARTED: "audio:play:started",
  AUDIO_PLAY_STOPPED: "audio:play:stopped",
  AUDIO_NOTE_PLAYED: "audio:note:played",
  AUDIO_CHORD_PLAYED: "audio:chord:played",

  // События стрелочек
  ARROW_CLICKED: "arrow:clicked",
  ARROW_STATUS_CHANGED: "arrow:status:changed",
  ARROW_HIGHLIGHTED: "arrow:highlighted",

  // События BeatUnit
  BEAT_UNIT_STATUS_CHANGED: "beatUnit:status:changed",

  // События ошибок
  ERROR_OCCURRED: "error:occurred",
  ERROR_HANDLED: "error:handled",

  // Системные события
  APPLICATION_INITIALIZED: "application:initialized",
  APPLICATION_DESTROYED: "application:destroyed",

  // События EventBus
  EVENTBUS_ERROR: "eventbus:error",
};

export default EventTypes;