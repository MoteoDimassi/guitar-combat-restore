import { PlayStatus } from '../Measure/PlayStatus.js';

/**
 * Класс для случайной генерации боя
 * Генерирует случайные состояния воспроизведения для каждой длительности такта
 * Первая длительность всегда имеет статус "Играть" (PLAY)
 */
export class RandomStrumGenerator {
  constructor() {
    this.availableStatuses = [
      PlayStatus.STATUS.SKIP,    // Не играть (○)
      PlayStatus.STATUS.PLAY,    // Играть (●)
      PlayStatus.STATUS.MUTED    // С приглушением (⊗)
    ];
  }

  /**
   * Генерирует случайный бой для указанного количества длительностей
   * @param {number} count - Количество длительностей (стрелочек)
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  generateRandomStrum(count) {
    if (count < 1) {
      console.warn('Количество длительностей должно быть больше 0');
      return [];
    }

    const playStatuses = [];

    // Первая длительность всегда должна быть PLAY
    playStatuses.push(new PlayStatus(PlayStatus.STATUS.PLAY));

    // Генерируем случайные состояния для остальных длительностей
    for (let i = 1; i < count; i++) {
      const randomStatus = this.getRandomStatus();
      playStatuses.push(new PlayStatus(randomStatus));
    }

    return playStatuses;
  }

  /**
   * Получает случайное состояние из доступных статусов
   * @returns {number} Случайный статус
   */
  getRandomStatus() {
    const randomIndex = Math.floor(Math.random() * this.availableStatuses.length);
    return this.availableStatuses[randomIndex];
  }

  /**
   * Генерирует случайный бой с определенными ограничениями
   * @param {number} count - Количество длительностей
   * @param {Object} options - Опции генерации
   * @param {number} options.minPlayCount - Минимальное количество играющих долей
   * @param {number} options.maxPlayCount - Максимальное количество играющих долей
   * @param {number} options.minMutedCount - Минимальное количество приглушенных долей
   * @param {number} options.maxMutedCount - Максимальное количество приглушенных долей
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  generateRandomStrumWithConstraints(count, options = {}) {
    if (count < 1) {
      return [];
    }

    const {
      minPlayCount = 1,
      maxPlayCount = Math.floor(count * 0.8),
      minMutedCount = 0,
      maxMutedCount = Math.floor(count * 0.4)
    } = options;

    const playStatuses = [];
    
    // Сначала генерируем случайную последовательность
    const randomSequence = this.generateRandomStrum(count);
    
    // Применяем ограничения
    const constrainedSequence = this.applyConstraints(
      randomSequence, 
      minPlayCount, 
      maxPlayCount, 
      minMutedCount, 
      maxMutedCount
    );

    return constrainedSequence;
  }

  /**
   * Применяет ограничения к случайной последовательности
   * @param {PlayStatus[]} sequence - Исходная последовательность
   * @param {number} minPlayCount - Минимальное количество играющих долей
   * @param {number} maxPlayCount - Максимальное количество играющих долей
   * @param {number} minMutedCount - Минимальное количество приглушенных долей
   * @param {number} maxMutedCount - Максимальное количество приглушенных долей
   * @returns {PlayStatus[]} Скорректированная последовательность
   */
  applyConstraints(sequence, minPlayCount, maxPlayCount, minMutedCount, maxMutedCount) {
    const result = [...sequence];
    const count = result.length;

    // Подсчитываем текущие состояния
    let playCount = result.filter(status => status.getStatus() === PlayStatus.STATUS.PLAY).length;
    let mutedCount = result.filter(status => status.getStatus() === PlayStatus.STATUS.MUTED).length;
    let skipCount = result.filter(status => status.getStatus() === PlayStatus.STATUS.SKIP).length;

    // Корректируем количество играющих долей
    if (playCount < minPlayCount) {
      // Добавляем PLAY статусы
      const needed = minPlayCount - playCount;
      const skipIndices = this.getIndicesWithStatus(result, PlayStatus.STATUS.SKIP);
      
      for (let i = 0; i < Math.min(needed, skipIndices.length); i++) {
        const randomIndex = skipIndices[Math.floor(Math.random() * skipIndices.length)];
        result[randomIndex] = new PlayStatus(PlayStatus.STATUS.PLAY);
        skipIndices.splice(skipIndices.indexOf(randomIndex), 1);
        playCount++;
        skipCount--;
      }
    }

    if (playCount > maxPlayCount) {
      // Убираем лишние PLAY статусы (кроме первого)
      const needed = playCount - maxPlayCount;
      const playIndices = this.getIndicesWithStatus(result, PlayStatus.STATUS.PLAY).slice(1); // Исключаем первый
      
      for (let i = 0; i < Math.min(needed, playIndices.length); i++) {
        const randomIndex = playIndices[Math.floor(Math.random() * playIndices.length)];
        result[randomIndex] = new PlayStatus(PlayStatus.STATUS.SKIP);
        playIndices.splice(playIndices.indexOf(randomIndex), 1);
        playCount--;
        skipCount++;
      }
    }

    // Корректируем количество приглушенных долей
    if (mutedCount < minMutedCount) {
      const needed = minMutedCount - mutedCount;
      const skipIndices = this.getIndicesWithStatus(result, PlayStatus.STATUS.SKIP);
      
      for (let i = 0; i < Math.min(needed, skipIndices.length); i++) {
        const randomIndex = skipIndices[Math.floor(Math.random() * skipIndices.length)];
        result[randomIndex] = new PlayStatus(PlayStatus.STATUS.MUTED);
        skipIndices.splice(skipIndices.indexOf(randomIndex), 1);
        mutedCount++;
        skipCount--;
      }
    }

    if (mutedCount > maxMutedCount) {
      const needed = mutedCount - maxMutedCount;
      const mutedIndices = this.getIndicesWithStatus(result, PlayStatus.STATUS.MUTED);
      
      for (let i = 0; i < Math.min(needed, mutedIndices.length); i++) {
        const randomIndex = mutedIndices[Math.floor(Math.random() * mutedIndices.length)];
        result[randomIndex] = new PlayStatus(PlayStatus.STATUS.SKIP);
        mutedIndices.splice(mutedIndices.indexOf(randomIndex), 1);
        mutedCount--;
        skipCount++;
      }
    }

    return result;
  }

  /**
   * Получает индексы элементов с определенным статусом
   * @param {PlayStatus[]} sequence - Последовательность состояний
   * @param {number} status - Искомый статус
   * @returns {number[]} Массив индексов
   */
  getIndicesWithStatus(sequence, status) {
    return sequence
      .map((playStatus, index) => ({ playStatus, index }))
      .filter(item => item.playStatus.getStatus() === status)
      .map(item => item.index);
  }

  /**
   * Генерирует случайный бой с определенными паттернами
   * @param {number} count - Количество длительностей
   * @param {string} pattern - Тип паттерна ('basic', 'complex', 'rhythmic')
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  generatePatternStrum(count, pattern = 'basic') {
    if (count < 1) {
      return [];
    }

    const playStatuses = [];

    switch (pattern) {
      case 'basic':
        return this.generateBasicPattern(count);
      
      case 'complex':
        return this.generateComplexPattern(count);
      
      case 'rhythmic':
        return this.generateRhythmicPattern(count);
      
      default:
        return this.generateRandomStrum(count);
    }
  }

  /**
   * Генерирует базовый паттерн (чередование PLAY и SKIP)
   * @param {number} count - Количество длительностей
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  generateBasicPattern(count) {
    const playStatuses = [];
    
    // Первая всегда PLAY
    playStatuses.push(new PlayStatus(PlayStatus.STATUS.PLAY));
    
    // Остальные чередуются PLAY/SKIP
    for (let i = 1; i < count; i++) {
      const status = i % 2 === 0 ? PlayStatus.STATUS.PLAY : PlayStatus.STATUS.SKIP;
      playStatuses.push(new PlayStatus(status));
    }
    
    return playStatuses;
  }

  /**
   * Генерирует сложный паттерн с приглушением
   * @param {number} count - Количество длительностей
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  generateComplexPattern(count) {
    const playStatuses = [];
    
    // Первая всегда PLAY
    playStatuses.push(new PlayStatus(PlayStatus.STATUS.PLAY));
    
    // Генерируем более сложный паттерн
    for (let i = 1; i < count; i++) {
      let status;
      
      if (i % 4 === 0) {
        // Каждый четвертый - приглушенный
        status = PlayStatus.STATUS.MUTED;
      } else if (i % 2 === 0) {
        // Каждый второй - играть
        status = PlayStatus.STATUS.PLAY;
      } else {
        // Остальные - не играть
        status = PlayStatus.STATUS.SKIP;
      }
      
      playStatuses.push(new PlayStatus(status));
    }
    
    return playStatuses;
  }

  /**
   * Генерирует ритмический паттерн
   * @param {number} count - Количество длительностей
   * @returns {PlayStatus[]} Массив состояний воспроизведения
   */
  generateRhythmicPattern(count) {
    const playStatuses = [];
    
    // Первая всегда PLAY
    playStatuses.push(new PlayStatus(PlayStatus.STATUS.PLAY));
    
    // Создаем ритмический паттерн
    for (let i = 1; i < count; i++) {
      let status;
      
      // Паттерн: PLAY, SKIP, PLAY, MUTED, PLAY, SKIP, PLAY, SKIP...
      const patternIndex = (i - 1) % 4;
      
      switch (patternIndex) {
        case 0: // Каждый 4-й + 1
          status = PlayStatus.STATUS.SKIP;
          break;
        case 1: // Каждый 4-й + 2
          status = PlayStatus.STATUS.PLAY;
          break;
        case 2: // Каждый 4-й + 3
          status = PlayStatus.STATUS.MUTED;
          break;
        case 3: // Каждый 4-й
          status = PlayStatus.STATUS.PLAY;
          break;
        default:
          status = PlayStatus.STATUS.SKIP;
      }
      
      playStatuses.push(new PlayStatus(status));
    }
    
    return playStatuses;
  }

  /**
   * Анализирует сгенерированный бой и возвращает статистику
   * @param {PlayStatus[]} playStatuses - Массив состояний воспроизведения
   * @returns {Object} Статистика боя
   */
  analyzeStrum(playStatuses) {
    const total = playStatuses.length;
    const playCount = playStatuses.filter(status => status.getStatus() === PlayStatus.STATUS.PLAY).length;
    const mutedCount = playStatuses.filter(status => status.getStatus() === PlayStatus.STATUS.MUTED).length;
    const skipCount = playStatuses.filter(status => status.getStatus() === PlayStatus.STATUS.SKIP).length;

    return {
      total,
      playCount,
      mutedCount,
      skipCount,
      playPercentage: Math.round((playCount / total) * 100),
      mutedPercentage: Math.round((mutedCount / total) * 100),
      skipPercentage: Math.round((skipCount / total) * 100),
      firstBeatPlayed: total > 0 && playStatuses[0].getStatus() === PlayStatus.STATUS.PLAY
    };
  }

  /**
   * Валидирует сгенерированный бой
   * @param {PlayStatus[]} playStatuses - Массив состояний воспроизведения
   * @returns {Object} Результат валидации
   */
  validateStrum(playStatuses) {
    const issues = [];
    
    if (!playStatuses || playStatuses.length === 0) {
      issues.push('Пустая последовательность боя');
      return { isValid: false, issues };
    }

    // Проверяем, что первая доля всегда PLAY
    if (playStatuses[0].getStatus() !== PlayStatus.STATUS.PLAY) {
      issues.push('Первая доля должна быть PLAY');
    }

    // Проверяем, что есть хотя бы одна играющая доля
    const playCount = playStatuses.filter(status => status.getStatus() === PlayStatus.STATUS.PLAY).length;
    if (playCount === 0) {
      issues.push('Должна быть хотя бы одна играющая доля');
    }

    // Проверяем корректность всех статусов
    const invalidStatuses = playStatuses.filter(status => 
      ![PlayStatus.STATUS.SKIP, PlayStatus.STATUS.PLAY, PlayStatus.STATUS.MUTED].includes(status.getStatus())
    );
    
    if (invalidStatuses.length > 0) {
      issues.push(`Найдены некорректные статусы: ${invalidStatuses.length}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      playCount,
      totalCount: playStatuses.length
    };
  }

  /**
   * Экспортирует конфигурацию генератора
   * @returns {Object} Конфигурация
   */
  exportConfig() {
    return {
      availableStatuses: [...this.availableStatuses],
      version: '1.0.0'
    };
  }

  /**
   * Импортирует конфигурацию генератора
   * @param {Object} config - Конфигурация
   */
  importConfig(config) {
    if (config.availableStatuses && Array.isArray(config.availableStatuses)) {
      this.availableStatuses = [...config.availableStatuses];
    }
  }
}
