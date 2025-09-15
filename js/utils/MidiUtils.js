/**
 * MidiUtils - утилиты для работы с MIDI
 * Конвертация названий нот в MIDI-номера для Soundfont.js
 */
export class MidiUtils {
  // Словарь нот с их индексами (C = 0, C# = 1, ..., B = 11)
  static noteIndices = {
    'C': 0,
    'C#': 1,
    'Db': 1,
    'D': 2,
    'D#': 3,
    'Eb': 3,
    'E': 4,
    'F': 5,
    'F#': 6,
    'Gb': 6,
    'G': 7,
    'G#': 8,
    'Ab': 8,
    'A': 9,
    'A#': 10,
    'Bb': 10,
    'B': 11
  };

  /**
   * Конвертирует название ноты в MIDI-номер (0-127)
   * @param {string} noteName - Название ноты (например, "C4", "A3", "C#5")
   * @returns {number} MIDI-номер или null, если невалидно
   */
  static noteToMidi(noteName) {
    if (!noteName || typeof noteName !== 'string') return null;

    // Разбираем ноту и октаву с помощью regex
    const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return null;

    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    // Получаем индекс ноты
    const noteIndex = this.noteIndices[note];
    if (noteIndex === undefined) return null;

    // Конвертация в MIDI (MIDI 60 = C4, MIDI 69 = A4)
    // Формула: (octave - 4) * 12 + noteIndex + 60
    const midiNumber = (octave - 4) * 12 + noteIndex + 60;

    // Проверяем диапазон MIDI (0-127)
    if (midiNumber < 0 || midiNumber > 127) return null;

    return midiNumber;
  }

  /**
   * Конвертирует массив названий нот в MIDI-номера
   * @param {string[]} noteNames - Массив названий нот
   * @returns {number[]} Массив MIDI-номеров
   */
  static notesToMidi(noteNames) {
    if (!Array.isArray(noteNames)) return [];
    return noteNames.map(note => this.noteToMidi(note)).filter(midi => midi !== null);
  }

  /**
   * Конвертирует частоту в MIDI-номер (приближённо)
   * @param {number} frequency - Частота в Гц
   * @returns {number} MIDI-номер
   */
  static frequencyToMidi(frequency) {
    // Формула: MIDI = 69 + 12 * log2(frequency / 440)
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }
}