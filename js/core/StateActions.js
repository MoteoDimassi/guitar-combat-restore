export class StateActions {
  constructor(stateManager, eventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  /**
   * Обновление строки аккордов
   */
  updateChordsInput(chordsString) {
    this.stateManager.setState("chords.inputString", chordsString);
    this.eventBus.emit("chords:input:changed", { chordsString });
  }

  /**
   * Обновление распарсенных аккордов
   */
  updateParsedChords(validChords, invalidChords) {
    this.stateManager.setState("chords.validChords", validChords);
    this.stateManager.setState("chords.invalidChords", invalidChords);
    this.eventBus.emit("chords:parsed", { validChords, invalidChords });
  }

  /**
   * Обновление тактов
   */
  updateBars(bars) {
    this.stateManager.setState("bars", bars);
    this.eventBus.emit("bars:updated", { bars });
  }

  /**
   * Переключение на следующий такт
   */
  nextBar() {
    this.stateManager.updateState("currentBarIndex", (current) => {
      const maxIndex = this.stateManager.getState("bars.length") - 1;
      return Math.min(current + 1, maxIndex);
    });
    this.eventBus.emit("navigation:next", {});
  }

  /**
   * Переключение на предыдущий такт
   */
  previousBar() {
    this.stateManager.updateState("currentBarIndex", (current) => {
      return Math.max(current - 1, 0);
    });
    this.eventBus.emit("navigation:previous", {});
  }

  /**
   * Переход к указанному такту
   */
  goToBar(barIndex) {
    const maxIndex = this.stateManager.getState("bars.length") - 1;
    const validIndex = Math.max(0, Math.min(barIndex, maxIndex));
    this.stateManager.setState("currentBarIndex", validIndex);
    this.eventBus.emit("navigation:goto", { barIndex: validIndex });
  }

  /**
   * Обновление темпа
   */
  updateTempo(bpm) {
    if (this.stateManager.validate("settings.bpm", bpm)) {
      this.stateManager.setState("settings.bpm", bpm);
      this.stateManager.setState("playback.tempo", bpm);
      this.eventBus.emit("tempo:changed", { bpm });
    }
  }

  /**
   * Обновление количества долей
   */
  updateBeatCount(beatCount) {
    if (this.stateManager.validate("settings.beatCount", beatCount)) {
      this.stateManager.setState("settings.beatCount", beatCount);
      this.stateManager.setState("ui.arrowsCount", beatCount);
      this.eventBus.emit("beatCount:changed", { beatCount });
    }
  }

  /**
   * Переключение воспроизведения
   */
  togglePlayback() {
    this.stateManager.updateState("playback.isPlaying", (current) => !current);
    this.stateManager.setState(
      "settings.isPlaying",
      this.stateManager.getState("playback.isPlaying")
    );
    this.eventBus.emit("playback:toggled", {
      isPlaying: this.stateManager.getState("playback.isPlaying"),
    });
  }

  /**
   * Начало воспроизведения
   */
  startPlayback() {
    this.stateManager.setState("playback.isPlaying", true);
    this.stateManager.setState("settings.isPlaying", true);
    this.eventBus.emit("playback:started", {});
  }

  /**
   * Остановка воспроизведения
   */
  stopPlayback() {
    this.stateManager.setState("playback.isPlaying", false);
    this.stateManager.setState("settings.isPlaying", false);
    this.stateManager.setState("playback.currentBar", 0);
    this.stateManager.setState("playback.currentBeat", 0);
    this.eventBus.emit("playback:stopped", {});
  }

  /**
   * Обновление текущей позиции воспроизведения
   */
  updatePlaybackPosition(barIndex, beatIndex) {
    this.stateManager.setState("playback.currentBar", barIndex);
    this.stateManager.setState("playback.currentBeat", beatIndex);
    this.eventBus.emit("playback:position:changed", { barIndex, beatIndex });
  }

  /**
   * Выбор шаблона
   */
  selectTemplate(templateId) {
    this.stateManager.setState("ui.selectedTemplate", templateId);
    this.eventBus.emit("template:selected", { templateId });
  }

  /**
   * Обновление громкости
   */
  updateVolume(type, value) {
    this.stateManager.setState(`settings.volume.${type}`, value);
    this.eventBus.emit("volume:changed", { type, value });
  }

  /**
   * Переключение видимости настроек
   */
  toggleSettings() {
    this.stateManager.updateState("ui.showSettings", (current) => !current);
    this.eventBus.emit("ui:settings:toggled", {
      visible: this.stateManager.getState("ui.showSettings"),
    });
  }

  /**
   * Обновление текста песни
   */
  updateSongText(content) {
    this.stateManager.setState("songText.content", content);
    this.eventBus.emit("songText:updated", { content });
  }
}

export default StateActions;