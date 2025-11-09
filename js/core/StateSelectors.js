export class StateSelectors {
  /**
   * Получение текущих аккордов
   */
  static getCurrentChords(state) {
    return state.chords.validChords;
  }

  /**
   * Получение текущего такта
   */
  static getCurrentBar(state) {
    return state.bars[state.currentBarIndex] || null;
  }

  /**
   * Получение настроек воспроизведения
   */
  static getPlaybackSettings(state) {
    return {
      bpm: state.settings.bpm,
      beatCount: state.settings.beatCount,
      isPlaying: state.playback.isPlaying,
    };
  }

  /**
   * Получение информации о шаблонах
   */
  static getTemplatesInfo(state) {
    return {
      available: state.templates.available,
      loaded: state.templates.loaded,
      custom: state.templates.custom,
      selected: state.ui.selectedTemplate,
    };
  }

  /**
   * Получение статистики по аккордам
   */
  static getChordsStats(state) {
    return {
      total: state.chords.parsedChords.length,
      valid: state.chords.validChords.length,
      invalid: state.chords.invalidChords.length,
    };
  }

  /**
   * Получение информации о тактах
   */
  static getBarsInfo(state) {
    return {
      total: state.bars.length,
      current: state.currentBarIndex,
      hasPrevious: state.currentBarIndex > 0,
      hasNext: state.currentBarIndex < state.bars.length - 1,
    };
  }
}

export default StateSelectors;