import MIDI from 'midi.js';
import Soundfont from 'soundfont-player';
import { MidiUtils } from '../utils/MidiUtils.js';
import { AudioPolyfill } from '../utils/AudioPolyfill.js';

/**
 * AudioEngine - движок синтеза звука для метронома и гитары
 * Отвечает за создание и воспроизведение звуков
 */
export class AudioEngine {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.midiInstrument = null;
    this.isMidiLoaded = false;
  }

  /**
   * Загрузка MIDI-инструмента (гитара стальных струн)
   * @returns {Promise<void>}
   */
  async loadMidiInstrument() {
    if (this.isMidiLoaded) return;

    try {
      const audioContext = this.audioManager.getAudioContext();
      if (!audioContext) {
        console.error('AudioEngine: AudioContext not available');
        return;
      }

      // Загружаем инструмент acoustic_guitar_steel
      this.midiInstrument = await Soundfont.instrument(audioContext, 'acoustic_guitar_steel');
      this.isMidiLoaded = true;
      console.log('AudioEngine: MIDI instrument loaded successfully');
    } catch (error) {
      console.error('AudioEngine: Failed to load MIDI instrument:', error);
    }
  }

  /**
   * Создает звук метронома (клик)
   * @param {number} time - Время воспроизведения
   * @param {boolean} isAccent - Является ли акцентом
   * @param {number} volume - Громкость (0-1)
   */
  scheduleClick(time, isAccent, volume = 0.5) {
    const audioCtx = this.audioManager.getAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isAccent ? 1500 : 1000, time);
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Создает звук гитарного аккорда с помощью MIDI soundfont
   * @param {string} chordName - Название аккорда (например, "Am")
   * @param {number} duration - Длительность звука в секундах
   * @param {number} volume - Громкость (0-1)
   */
  async playChord(chordName, duration = 0.3, volume = 0.8) {
    if (!this.isMidiLoaded) {
      await this.loadMidiInstrument();
    }

    if (!this.midiInstrument) {
      console.warn('AudioEngine: MIDI instrument not loaded, using fallback');
      // Fallback на старый метод, если MIDI не загрузился
      return this.createGuitarSoundFromName(chordName, duration, volume);
    }

    try {
      // Получаем MIDI-номера нот аккорда
      const midiNotes = this.audioManager.chordAnalyzer.getMidiNotes(chordName);
      if (!midiNotes || midiNotes.length === 0) {
        console.warn('AudioEngine: No MIDI notes found for chord:', chordName);
        return;
      }

      // Воспроизводим каждую ноту аккорда
      const notePromises = midiNotes.map(midiNote => {
        return this.midiInstrument.play(midiNote, 0, {
          gain: volume,
          duration: duration
        });
      });

      await Promise.all(notePromises);
    } catch (error) {
      console.error('AudioEngine: Error playing chord:', error);
    }
  }

  /**
   * Создает синтезированный гитарный звук (fallback метод)
   * @param {string} chordName - Название аккорда
   * @param {number} duration - Длительность
   * @param {number} volume - Громкость
   */
  createGuitarSoundFromName(chordName, duration = 0.3, volume = 0.8) {
    const frequencies = this.audioManager.chordAnalyzer.getChordNotes(chordName);
    if (!frequencies) return;

    // Используем среднюю частоту для простого звука
    const averageFreq = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
    this.createGuitarSound(averageFreq, duration, volume);
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