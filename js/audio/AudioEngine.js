import { AudioPolyfill } from '../utils/AudioPolyfill.js';

/**
 * AudioEngine - движок синтеза звука для метронома
 * Отвечает за создание и воспроизведение звуков
 */
export class AudioEngine {
  constructor(audioManager) {
    this.audioManager = audioManager;
  }

  /**
   * Создает звук метронома (клик)
   * @param {number} time - Время воспроизведения
   * @param {boolean} isAccent - Является ли акцентом
   */
  scheduleClick(time, isAccent) {
    const audioCtx = this.audioManager.getAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isAccent ? 1500 : 1000, time);
    gainNode.gain.setValueAtTime(1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Создает синтезированный гитарный звук
   * @param {number} frequency - Частота основной ноты
   * @param {number} duration - Длительность звука в секундах
   * @param {number} volume - Громкость (0-1)
   */
  createGuitarSound(frequency = 330, duration = 0.3, volume = 0.8) {
    const audioCtx = this.audioManager.getAudioContext();

    // Проверка доступности AudioContext с fallback
    if (!audioCtx || audioCtx.state !== 'running') {
      console.warn('AudioEngine: AudioContext not available, using fallback sound');
      AudioPolyfill.fallbackPlaySound(frequency, duration * 1000);
      return;
    }

    const time = audioCtx.currentTime;

    // Создаем основной осциллятор для чистого звука струны
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, time);

    // Создаем второй осциллятор для обертона (октава выше)
    const overtone = audioCtx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(frequency * 2, time);

    // Создаем третий осциллятор для второго обертона
    const secondOvertone = audioCtx.createOscillator();
    secondOvertone.type = 'sine';
    secondOvertone.frequency.setValueAtTime(frequency * 3, time);

    // Создаем ADSR огибающую для основного звука
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, time + 0.001); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, time + 0.01); // Decay
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, time + duration * 0.7); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration); // Release

    // Создаем огибающую для обертонов (более короткую)
    const overtoneGain = audioCtx.createGain();
    overtoneGain.gain.setValueAtTime(0, time);
    overtoneGain.gain.linearRampToValueAtTime(volume * 0.3, time + 0.001);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.5);

    const secondOvertoneGain = audioCtx.createGain();
    secondOvertoneGain.gain.setValueAtTime(0, time);
    secondOvertoneGain.gain.linearRampToValueAtTime(volume * 0.1, time + 0.001);
    secondOvertoneGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.3);

    // Создаем фильтр для гитарного тембра
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.Q.setValueAtTime(1, time);

    // Соединяем узлы
    oscillator.connect(gainNode);
    overtone.connect(overtoneGain);
    secondOvertone.connect(secondOvertoneGain);

    gainNode.connect(filter);
    overtoneGain.connect(filter);
    secondOvertoneGain.connect(filter);

    filter.connect(audioCtx.destination);

    // Запускаем осцилляторы
    oscillator.start(time);
    overtone.start(time);
    secondOvertone.start(time);

    // Останавливаем осцилляторы
    oscillator.stop(time + duration);
    overtone.stop(time + duration * 0.8);
    secondOvertone.stop(time + duration * 0.6);
  }
}