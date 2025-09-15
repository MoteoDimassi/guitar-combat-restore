// Полифиллы и вспомогательные функции для кросс-браузерной поддержки Audio API
export class AudioPolyfill {

  /**
   * Проверяет поддержку Web Audio API
   * @returns {boolean} - поддерживается ли Web Audio API
   */
  static isWebAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Создает AudioContext с учетом совместимости
   * @returns {AudioContext|null} - экземпляр AudioContext или null
   */
  static createAudioContext() {
    if (!this.isWebAudioSupported()) {
      console.warn('Web Audio API is not supported in this browser');
      return null;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();

      // Для iOS Safari: предварительная инициализация
      if (this.isIOS()) {
        this.initializeIOSAudio(audioCtx);
      }

      return audioCtx;
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      return null;
    }
  }

  /**
   * Проверяет, является ли устройство iOS
   * @returns {boolean} - является ли устройство iOS
   */
  static isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /**
   * Специальная инициализация для iOS Safari
   * @param {AudioContext} audioCtx - AudioContext для инициализации
   */
  static async initializeIOSAudio(audioCtx) {
    // Создаем пустой буфер для инициализации
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    // Воспроизводим тишину для разблокировки
    try {
      source.start(0);
    } catch (error) {
      console.warn('Failed to initialize iOS AudioContext:', error);
    }
  }

  /**
   * Безопасно возобновляет AudioContext
   * @param {AudioContext} audioCtx - AudioContext для возобновления
   * @returns {Promise<boolean>} - успешно ли возобновлен
   */
  static async safeResumeAudioContext(audioCtx) {
    if (!audioCtx) return false;

    if (audioCtx.state === 'running') {
      return true;
    }

    try {
      await audioCtx.resume();
      return audioCtx.state === 'running';
    } catch (error) {
      console.error('Failed to resume AudioContext:', error);
      return false;
    }
  }

  /**
   * Проверяет состояние AudioContext и пытается исправить проблемы
   * @param {AudioContext} audioCtx - AudioContext для проверки
   * @returns {Promise<boolean>} - готов ли AudioContext к использованию
   */
  static async ensureAudioContextReady(audioCtx) {
    if (!audioCtx) return false;

    // Проверяем текущее состояние
    if (audioCtx.state === 'running') {
      return true;
    }

    if (audioCtx.state === 'suspended') {
      return await this.safeResumeAudioContext(audioCtx);
    }

    if (audioCtx.state === 'closed') {
      console.warn('AudioContext is closed, cannot use');
      return false;
    }

    // Для других состояний (например, 'interrupted')
    console.warn('AudioContext in unknown state:', audioCtx.state);
    return false;
  }

  /**
   * Создает запасной механизм воспроизведения для браузеров без Web Audio API
   * @param {number} frequency - частота звука
   * @param {number} duration - длительность
   */
  static fallbackPlaySound(frequency = 440, duration = 200) {
    // Используем Audio элемент как запасной вариант
    try {
      const audio = new Audio();
      // Создаем data URL с простым звуком (тон)
      const sampleRate = 44100;
      const numSamples = Math.floor(sampleRate * duration / 1000);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Генерируем простой синусоидальный сигнал
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
        view.setInt16(44 + i * 2, sample * 32767, true);
      }

      audio.src = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
      audio.play().catch(error => {
        console.warn('Fallback audio failed:', error);
      });
    } catch (error) {
      console.warn('Audio fallback failed:', error);
    }
  }
}