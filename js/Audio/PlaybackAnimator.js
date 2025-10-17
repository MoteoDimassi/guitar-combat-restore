/**
 * Класс PlaybackAnimator - управляет анимацией воспроизведения стрелок
 * Отвечает за подсветку текущей активной стрелочки во время воспроизведения
 */
export class PlaybackAnimator {
  constructor(arrowDisplay = null) {
    // Зависимости
    this.arrowDisplay = arrowDisplay;

    // Состояние анимации
    this.isAnimating = false;
    this.currentArrowIndex = -1;
    this.intervalId = null;

    // Настройки анимации
    this.settings = {
      bpm: 120,
      beatCount: 8
    };

    // Колбэки
    this.onAnimationStart = null;
    this.onAnimationStop = null;
  }

  /**
   * Устанавливает ArrowDisplay
   * @param {ArrowDisplay} arrowDisplay - Экземпляр ArrowDisplay
   */
  setArrowDisplay(arrowDisplay) {
    this.arrowDisplay = arrowDisplay;
  }

  /**
   * Устанавливает настройки анимации
   * @param {Object} settings - Настройки (bpm, beatCount)
   */
  setSettings(settings) {
    if (settings && typeof settings.bpm === 'number') {
      this.settings.bpm = settings.bpm;
    }
    if (settings && typeof settings.beatCount === 'number') {
      this.settings.beatCount = settings.beatCount;
    }
  }

  /**
   * Запускает анимацию воспроизведения
   */
  startAnimation() {
    if (this.isAnimating || !this.arrowDisplay) return;

    try {
      this.isAnimating = true;
      this.currentArrowIndex = -1; // Начнем с первой стрелки

      // Вызываем колбэк начала анимации
      if (this.onAnimationStart) {
        this.onAnimationStart();
      }

      // Устанавливаем первую стрелку как активную
      this.setActiveArrow(0);

    } catch (error) {
      console.error('Ошибка при запуске анимации:', error);
      this.stopAnimation();
    }
  }

  /**
   * Останавливает анимацию воспроизведения
   */
  stopAnimation() {
    if (!this.isAnimating) return;

    this.isAnimating = false;

    // Снимаем активность со всех стрелок
    this.clearAllActiveArrows();

    // Очищаем интервал если есть
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.currentArrowIndex = -1;

    // Вызываем колбэк остановки анимации
    if (this.onAnimationStop) {
      this.onAnimationStop();
    }
  }

  /**
   * Переходит к следующей стрелочке в анимации
   */
  nextArrow() {
    if (!this.isAnimating || !this.arrowDisplay) return;

    // Снимаем активность с текущей стрелки
    if (this.currentArrowIndex >= 0) {
      this.setArrowInactive(this.currentArrowIndex);
    }

    // Переходим к следующей стрелке
    this.currentArrowIndex++;

    // Если достигли конца, сбрасываем анимацию для цикличного воспроизведения
    if (this.currentArrowIndex >= this.settings.beatCount) {
      this.resetAnimation();
      // После сброса устанавливаем первую стрелку как активную
      this.setActiveArrow(0);
      return;
    }

    // Устанавливаем новую стрелку как активную
    this.setActiveArrow(this.currentArrowIndex);
  }

  /**
   * Устанавливает активную стрелку по индексу
   * @param {number} index - Индекс стрелки
   */
  setActiveArrow(index) {
    if (!this.arrowDisplay || index < 0 || index >= this.settings.beatCount) return;

    this.currentArrowIndex = index;
    this.arrowDisplay.setArrowActive(index, true);

    console.log(`🎯 Активная стрелка: ${index + 1}`);
  }

  /**
   * Снимает активность со стрелки по индексу
   * @param {number} index - Индекс стрелки
   */
  setArrowInactive(index) {
    if (!this.arrowDisplay || index < 0 || index >= this.settings.beatCount) return;

    this.arrowDisplay.setArrowActive(index, false);
  }

  /**
   * Снимает активность со всех стрелок
   */
  clearAllActiveArrows() {
    if (!this.arrowDisplay) return;

    for (let i = 0; i < this.settings.beatCount; i++) {
      this.arrowDisplay.setArrowActive(i, false);
    }
  }

  /**
   * Сбрасывает анимацию без остановки - для цикличного воспроизведения
   */
  resetAnimation() {
    // Снимаем активность с текущей стрелки если есть
    if (this.currentArrowIndex >= 0) {
      this.setArrowInactive(this.currentArrowIndex);
    }
    
    // Сбрасываем индекс на начало
    this.currentArrowIndex = -1;
    
    // Не устанавливаем первую стрелку как активную здесь,
    // чтобы избежать дублирования при вызове из nextArrow()
    // Активация первой стрелки произойдет при следующем вызове nextArrow()
    
    console.log('🔄 Анимация сброшена для цикличного воспроизведения');
  }

  /**
   * Устанавливает колбэк для начала анимации
   * @param {Function} callback - Колбэк функция
   */
  setOnAnimationStart(callback) {
    this.onAnimationStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки анимации
   * @param {Function} callback - Колбэк функция
   */
  setOnAnimationStop(callback) {
    this.onAnimationStop = callback;
  }

  /**
   * Получает текущее состояние анимации
   * @returns {boolean} True если анимация активна
   */
  getIsAnimating() {
    return this.isAnimating;
  }

  /**
   * Получает индекс текущей активной стрелки
   * @returns {number} Индекс активной стрелки (-1 если нет)
   */
  getCurrentArrowIndex() {
    return this.currentArrowIndex;
  }

  /**
   * Освобождает ресурсы
   */
  dispose() {
    this.stopAnimation();
    this.arrowDisplay = null;
    this.onAnimationStart = null;
    this.onAnimationStop = null;
  }
}