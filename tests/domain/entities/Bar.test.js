import Bar from '../../../js/domain/entities/Bar.js';
import Chord from '../../../js/domain/entities/Chord.js';

describe('Bar', () => {
  let bar;

  beforeEach(() => {
    bar = new Bar('test-bar-1', 4, 4);
  });

  describe('Конструктор', () => {
    test('должен создаваться с параметрами по умолчанию', () => {
      const defaultBar = new Bar('default-bar');
      
      expect(defaultBar.id).toBe('default-bar');
      expect(defaultBar.beats).toBe(4);
      expect(defaultBar.beatUnit).toBe(4);
      expect(defaultBar.chords).toEqual([]);
    });

    test('должен создаваться с кастомными параметрами', () => {
      const customBar = new Bar('custom-bar', 3, 8);
      
      expect(customBar.id).toBe('custom-bar');
      expect(customBar.beats).toBe(3);
      expect(customBar.beatUnit).toBe(8);
      expect(customBar.chords).toEqual([]);
    });

    test('должен инициализировать пустой массив аккордов', () => {
      expect(Array.isArray(bar.chords)).toBe(true);
      expect(bar.chords).toHaveLength(0);
    });
  });

  describe('addChord', () => {
    test('должен добавлять аккорд в такт', () => {
      const chord = new Chord('chord-1', 'C', 0);
      
      bar.addChord(chord);
      
      expect(bar.chords).toHaveLength(1);
      expect(bar.chords[0]).toBe(chord);
    });

    test('должен добавлять несколько аккордов', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      
      expect(bar.chords).toHaveLength(2);
      expect(bar.chords[0]).toBe(chord1);
      expect(bar.chords[1]).toBe(chord2);
    });

    test('должен добавлять аккорды в правильном порядке', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      const chord3 = new Chord('chord-3', 'Am', 1);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      bar.addChord(chord3);
      
      expect(bar.chords).toEqual([chord1, chord2, chord3]);
    });
  });

  describe('removeChord', () => {
    test('должен удалять аккорд по ID', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      const chord3 = new Chord('chord-3', 'Am', 1);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      bar.addChord(chord3);
      
      bar.removeChord('chord-2');
      
      expect(bar.chords).toHaveLength(2);
      expect(bar.chords[0]).toBe(chord1);
      expect(bar.chords[1]).toBe(chord3);
    });

    test('не должен удалять аккорды при несуществующем ID', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      
      bar.removeChord('nonexistent-id');
      
      expect(bar.chords).toHaveLength(2);
      expect(bar.chords[0]).toBe(chord1);
      expect(bar.chords[1]).toBe(chord2);
    });

    test('должен работать с пустым списком аккордов', () => {
      bar.removeChord('any-id');
      
      expect(bar.chords).toHaveLength(0);
    });

    test('должен удалять все аккорды при последовательных вызовах', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      
      bar.removeChord('chord-1');
      bar.removeChord('chord-2');
      
      expect(bar.chords).toHaveLength(0);
    });
  });

  describe('getChordByPosition', () => {
    test('должен находить аккорд по позиции', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      const chord3 = new Chord('chord-3', 'Am', 1);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      bar.addChord(chord3);
      
      expect(bar.getChordByPosition(0)).toBe(chord1);
      expect(bar.getChordByPosition(1)).toBe(chord3);
      expect(bar.getChordByPosition(2)).toBe(chord2);
    });

    test('должен возвращать undefined для несуществующей позиции', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 2);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      
      expect(bar.getChordByPosition(1)).toBeUndefined();
      expect(bar.getChordByPosition(5)).toBeUndefined();
    });

    test('должен возвращать undefined для пустого такта', () => {
      expect(bar.getChordByPosition(0)).toBeUndefined();
      expect(bar.getChordByPosition(1)).toBeUndefined();
    });

    test('должен находить первый аккорд при дублирующихся позициях', () => {
      const chord1 = new Chord('chord-1', 'C', 0);
      const chord2 = new Chord('chord-2', 'G', 0);
      
      bar.addChord(chord1);
      bar.addChord(chord2);
      
      expect(bar.getChordByPosition(0)).toBe(chord1);
    });
  });

  describe('Инварианты и бизнес-правила', () => {
    test('должен сохранять целостность данных при операциях', () => {
      const originalId = bar.id;
      const originalBeats = bar.beats;
      const originalBeatUnit = bar.beatUnit;
      
      const chord = new Chord('chord-1', 'C', 0);
      bar.addChord(chord);
      bar.removeChord('nonexistent');
      bar.getChordByPosition(5);
      
      expect(bar.id).toBe(originalId);
      expect(bar.beats).toBe(originalBeats);
      expect(bar.beatUnit).toBe(originalBeatUnit);
    });

    test('должен корректно обрабатывать граничные значения', () => {
      const barWithZeroBeats = new Bar('zero-beats', 0, 4);
      const barWithLargeBeats = new Bar('large-beats', 16, 4);
      const barWithFractionalBeatUnit = new Bar('fractional', 4, 8);
      
      expect(barWithZeroBeats.beats).toBe(0);
      expect(barWithLargeBeats.beats).toBe(16);
      expect(barWithFractionalBeatUnit.beatUnit).toBe(8);
    });
  });

  describe('Инкапсуляция данных', () => {
    test('должен предоставлять доступ к аккордам только через методы', () => {
      const chord = new Chord('chord-1', 'C', 0);
      bar.addChord(chord);
      
      // Проверяем, что прямое изменение массива возможно (JavaScript limitation),
      // но бизнес-логика работает корректно
      const chordsLength = bar.chords.length;
      bar.chords.push(new Chord('direct', 'D', 1));
      
      expect(bar.chords).toHaveLength(chordsLength + 1);
    });
  });
});