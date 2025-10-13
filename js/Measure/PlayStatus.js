/**
 * Класс PlayStatus определяет состояние воспроизведения для каждой длительности
 * Управляет тремя состояниями: не играть, играть, играть с приглушением
 */
export class PlayStatus {
  /**
   * @param {number} status - Статус воспроизведения (0 - не играть, 1 - играть, 2 - приглушенный звук)
   */
  constructor(status = 0) {
    this.status = status;
  }

  /**
   * Константы для статусов воспроизведения
   */
  static STATUS = {
    SKIP: 0,      // Пустой кружок - не играть
    PLAY: 1,      // Закрашенный кружок - играть
    MUTED: 2      // Кружок с крестиком - приглушенный звук
  };

  /**
   * Проверяет, играется ли данная длительность
   * @returns {boolean}
   */
  isPlayed() {
    return this.status === PlayStatus.STATUS.PLAY || this.status === PlayStatus.STATUS.MUTED;
  }

  /**
   * Проверяет, есть ли приглушение на данной длительности
   * @returns {boolean}
   */
  isMuted() {
    return this.status === PlayStatus.STATUS.MUTED;
  }

  /**
   * Проверяет, пропускается ли данная длительность
   * @returns {boolean}
   */
  isSkipped() {
    return this.status === PlayStatus.STATUS.SKIP;
  }

  /**
   * Устанавливает статус воспроизведения
   * @param {number} status - Статус воспроизведения
   */
  setStatus(status) {
    this.status = status;
  }

  /**
   * Получает текущий статус
   * @returns {number}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Возвращает строковое представление статуса
   * @returns {string}
   */
  getStatusString() {
    switch (this.status) {
      case PlayStatus.STATUS.SKIP: return 'не играть';
      case PlayStatus.STATUS.PLAY: return 'играть';
      case PlayStatus.STATUS.MUTED: return 'с приглушиванием';
      default: return 'неизвестно';
    }
  }

  /**
   * Возвращает HTML для отображения статуса
   * @returns {string}
   */
  getDisplayHTML() {
    switch (this.status) {
      case PlayStatus.STATUS.SKIP: 
        return '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#6b7280" stroke-width="2"/></svg>';
      case PlayStatus.STATUS.PLAY: 
        return '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#ef4444" stroke="none"/></svg>';
      case PlayStatus.STATUS.MUTED: 
        return '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/></svg>';
      default: 
        return '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="red" stroke-width="2"/></svg>';
    }
  }

  /**
   * Возвращает символ для отображения статуса (для обратной совместимости)
   * @returns {string}
   */
  getDisplaySymbol() {
    switch (this.status) {
      case PlayStatus.STATUS.SKIP: return '○'; // Пустой кружок
      case PlayStatus.STATUS.PLAY: return '●'; // Закрашенный кружок
      case PlayStatus.STATUS.MUTED: return '⊗'; // Кружок с крестиком
      default: return '?';
    }
  }

  /**
   * Возвращает CSS класс для стилизации статуса
   * @returns {string}
   */
  getCSSClass() {
    switch (this.status) {
      case PlayStatus.STATUS.SKIP: return 'play-status-skip';
      case PlayStatus.STATUS.PLAY: return 'play-status-play';
      case PlayStatus.STATUS.MUTED: return 'play-status-muted';
      default: return 'play-status-unknown';
    }
  }

  /**
   * Переключает статус на следующий (циклично)
   */
  toggleStatus() {
    this.status = (this.status + 1) % 3;
  }

  /**
   * Создает копию объекта PlayStatus
   * @returns {PlayStatus}
   */
  clone() {
    return new PlayStatus(this.status);
  }

  /**
   * Сравнивает два объекта PlayStatus
   * @param {PlayStatus} other - Другой объект PlayStatus
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof PlayStatus && this.status === other.status;
  }

  /**
   * Возвращает объект для сериализации
   * @returns {Object}
   */
  toJSON() {
    return {
      status: this.status
    };
  }

  /**
   * Создает PlayStatus из JSON объекта
   * @param {Object} data - Данные для создания
   * @returns {PlayStatus}
   */
  static fromJSON(data) {
    return new PlayStatus(data.status);
  }

  /**
   * Создает PlayStatus из строки
   * @param {string} statusString - Строка статуса
   * @returns {PlayStatus}
   */
  static fromString(statusString) {
    switch (statusString.toLowerCase()) {
      case 'skip':
      case 'не играть':
      case '○':
        return new PlayStatus(PlayStatus.STATUS.SKIP);
      case 'play':
      case 'играть':
      case '●':
        return new PlayStatus(PlayStatus.STATUS.PLAY);
      case 'muted':
      case 'с приглушиванием':
      case '⊗':
        return new PlayStatus(PlayStatus.STATUS.MUTED);
      default:
        return new PlayStatus(PlayStatus.STATUS.SKIP);
    }
  }

  /**
   * Создает массив PlayStatus из массива статусов
   * @param {number[]} statusArray - Массив статусов
   * @returns {PlayStatus[]}
   */
  static fromArray(statusArray) {
    return statusArray.map(status => new PlayStatus(status));
  }
}
