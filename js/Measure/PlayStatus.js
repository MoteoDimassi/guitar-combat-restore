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
    console.log(`🆕 PlayStatus.constructor(${status}): СОЗДАН НОВЫЙ ЭКЗЕМПЛЯР, ID: ${this.constructor.name}_${this.status}`);
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
   * Статические экземпляры для базовых состояний
   */
  static INSTANCES = {
    SKIP: new PlayStatus(PlayStatus.STATUS.SKIP),
    PLAY: new PlayStatus(PlayStatus.STATUS.PLAY),
    MUTED: new PlayStatus(PlayStatus.STATUS.MUTED)
  };

  /**
   * Получает экземпляр PlayStatus по значению статуса
   * @param {number} status - Статус воспроизведения
   * @returns {PlayStatus}
   */
  static getInstance(status) {
    switch(status) {
      case PlayStatus.STATUS.SKIP:
        console.log(`🔍 PlayStatus.getInstance(${status}): ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ SKIP, ID: ${PlayStatus.INSTANCES.SKIP.constructor.name}_${PlayStatus.INSTANCES.SKIP.status}`);
        return PlayStatus.INSTANCES.SKIP;
      case PlayStatus.STATUS.PLAY:
        console.log(`🔍 PlayStatus.getInstance(${status}): ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ PLAY, ID: ${PlayStatus.INSTANCES.PLAY.constructor.name}_${PlayStatus.INSTANCES.PLAY.status}`);
        return PlayStatus.INSTANCES.PLAY;
      case PlayStatus.STATUS.MUTED:
        console.log(`🔍 PlayStatus.getInstance(${status}): ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ MUTED, ID: ${PlayStatus.INSTANCES.MUTED.constructor.name}_${PlayStatus.INSTANCES.MUTED.status}`);
        return PlayStatus.INSTANCES.MUTED;
      default:
        console.log(`🆕 PlayStatus.getInstance(${status}): СОЗДАЕМ НОВЫЙ ЭКЗЕМПЛЯР`);
        return new PlayStatus(status);
    }
  }

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
    console.log(`🔄 PlayStatus.clone(${this.status}): СОЗДАЕМ КОПИЮ, ID: ${this.constructor.name}_${this.status}`);
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
    // Проверяем, что data является объектом и имеет свойство status
    if (data && typeof data === 'object' && typeof data.status === 'number') {
      console.log(`🔄 PlayStatus.fromJSON(): ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus из JSON со статусом ${data.status}`);
      const result = PlayStatus.getInstance(data.status);
      console.log(`🔄 PlayStatus.fromJSON(): ПОЛУЧЕН СТАТИЧЕСКИЙ PlayStatus из JSON, ID: ${result.constructor.name}_${result.status}`);
      return result;
    }
    // Если data - число, используем его напрямую
    if (typeof data === 'number') {
      console.log(`🔄 PlayStatus.fromJSON(): ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus из числа ${data}`);
      const result = PlayStatus.getInstance(data);
      console.log(`🔄 PlayStatus.fromJSON(): ПОЛУЧЕН СТАТИЧЕСКИЙ PlayStatus из числа, ID: ${result.constructor.name}_${result.status}`);
      return result;
    }
    // Иначе создаем статус по умолчанию
    console.log(`🔄 PlayStatus.fromJSON(): ИСПОЛЬЗУЕМ СТАТИЧЕСКИЙ PlayStatus.SKIP по умолчанию, ID: ${PlayStatus.INSTANCES.SKIP.constructor.name}_${PlayStatus.INSTANCES.SKIP.status}`);
    return PlayStatus.INSTANCES.SKIP;
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
        console.log(`🔄 PlayStatus.fromString("${statusString}"): ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ PlayStatus.SKIP, ID: ${PlayStatus.INSTANCES.SKIP.constructor.name}_${PlayStatus.INSTANCES.SKIP.status}`);
        return PlayStatus.INSTANCES.SKIP;
      case 'play':
      case 'играть':
      case '●':
        console.log(`🔄 PlayStatus.fromString("${statusString}"): ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ PlayStatus.PLAY, ID: ${PlayStatus.INSTANCES.PLAY.constructor.name}_${PlayStatus.INSTANCES.PLAY.status}`);
        return PlayStatus.INSTANCES.PLAY;
      case 'muted':
      case 'с приглушиванием':
      case '⊗':
        console.log(`🔄 PlayStatus.fromString("${statusString}"): ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ PlayStatus.MUTED, ID: ${PlayStatus.INSTANCES.MUTED.constructor.name}_${PlayStatus.INSTANCES.MUTED.status}`);
        return PlayStatus.INSTANCES.MUTED;
      default:
        console.log(`🔄 PlayStatus.fromString("${statusString}"): НЕИЗВЕСТНАЯ СТРОКА, ВОЗВРАЩАЕМ СТАТИЧЕСКИЙ PlayStatus.SKIP, ID: ${PlayStatus.INSTANCES.SKIP.constructor.name}_${PlayStatus.INSTANCES.SKIP.status}`);
        return PlayStatus.INSTANCES.SKIP;
    }
  }

  /**
   * Создает массив PlayStatus из массива статусов
   * @param {number[]} statusArray - Массив статусов
   * @returns {PlayStatus[]}
   */
  static fromArray(statusArray) {
    console.log(`🔄 PlayStatus.fromArray(): ОБРАБАТЫВАЕМ МАССИВ ИЗ ${statusArray.length} СТАТУСОВ`);
    return statusArray.map((status, index) => {
      console.log(`🔄 PlayStatus.fromArray[${index}]: ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus для статуса ${status}`);
      const result = PlayStatus.getInstance(status);
      console.log(`🔄 PlayStatus.fromArray[${index}]: ПОЛУЧЕН СТАТИЧЕСКИЙ PlayStatus, ID: ${result.constructor.name}_${result.status}`);
      return result;
    });
  }
}
