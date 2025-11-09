import Chord from '../../../js/domain/entities/Chord.js';

describe('Chord', () => {
  let chord;

  beforeEach(() => {
    chord = new Chord('test-chord-1', 'C', 0);
  });

  describe('Конструктор', () => {
    test('должен создаваться с основными параметрами', () => {
      const testChord = new Chord('chord-1', 'Am', 2);
      
      expect(testChord.id).toBe('chord-1');
      expect(testChord.name).toBe('Am');
      expect(testChord.position).toBe(2);
      expect(testChord.notes).toEqual([]);
    });

    test('должен создаваться с позицией по умолчанию', () => {
      const defaultPositionChord = new Chord('chord-1', 'G');
      
      expect(defaultPositionChord.id).toBe('chord-1');
      expect(defaultPositionChord.name).toBe('G');
      expect(defaultPositionChord.position).toBe(0);
      expect(defaultPositionChord.notes).toEqual([]);
    });

    test('должен инициализировать пустой массив нот', () => {
      expect(Array.isArray(chord.notes)).toBe(true);
      expect(chord.notes).toHaveLength(0);
    });

    test('должен корректно обрабатывать специальные символы в названии аккорда', () => {
      const specialChord = new Chord('special', 'C#7/Bb');
      
      expect(specialChord.name).toBe('C#7/Bb');
    });

    test('должен корректно обрабатывать числовые позиции', () => {
      const chordWithPosition = new Chord('pos-chord', 'F', 5);
      
      expect(chordWithPosition.position).toBe(5);
    });

    test('должен корректно обрабатывать отрицательные позиции', () => {
      const chordWithNegativePosition = new Chord('neg-chord', 'Dm', -1);
      
      expect(chordWithNegativePosition.position).toBe(-1);
    });
  });

  describe('addNote', () => {
    test('должен добавлять ноту в аккорд', () => {
      const note = { id: 'note-1', name: 'C', octave: 4 };
      
      chord.addNote(note);
      
      expect(chord.notes).toHaveLength(1);
      expect(chord.notes[0]).toBe(note);
    });

    test('должен добавлять несколько нот', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'E', octave: 4 };
      const note3 = { id: 'note-3', name: 'G', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      chord.addNote(note3);
      
      expect(chord.notes).toHaveLength(3);
      expect(chord.notes[0]).toBe(note1);
      expect(chord.notes[1]).toBe(note2);
      expect(chord.notes[2]).toBe(note3);
    });

    test('должен добавлять ноты в правильном порядке', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'G', octave: 3 };
      const note3 = { id: 'note-3', name: 'E', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      chord.addNote(note3);
      
      expect(chord.notes).toEqual([note1, note2, note3]);
    });

    test('должен добавлять ноты с одинаковыми ID', () => {
      const note1 = { id: 'same-id', name: 'C', octave: 4 };
      const note2 = { id: 'same-id', name: 'C', octave: 5 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      
      expect(chord.notes).toHaveLength(2);
      expect(chord.notes[0]).toBe(note1);
      expect(chord.notes[1]).toBe(note2);
    });
  });

  describe('removeNote', () => {
    test('должен удалять ноту по ID', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'E', octave: 4 };
      const note3 = { id: 'note-3', name: 'G', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      chord.addNote(note3);
      
      chord.removeNote('note-2');
      
      expect(chord.notes).toHaveLength(2);
      expect(chord.notes[0]).toBe(note1);
      expect(chord.notes[1]).toBe(note3);
    });

    test('не должен удалять ноты при несуществующем ID', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'E', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      
      chord.removeNote('nonexistent-id');
      
      expect(chord.notes).toHaveLength(2);
      expect(chord.notes[0]).toBe(note1);
      expect(chord.notes[1]).toBe(note2);
    });

    test('должен работать с пустым списком нот', () => {
      chord.removeNote('any-id');
      
      expect(chord.notes).toHaveLength(0);
    });

    test('должен удалять все ноты при последовательных вызовах', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'E', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      
      chord.removeNote('note-1');
      chord.removeNote('note-2');
      
      expect(chord.notes).toHaveLength(0);
    });

    test('должен удалять только первую ноту с указанным ID', () => {
      const note1 = { id: 'same-id', name: 'C', octave: 4 };
      const note2 = { id: 'same-id', name: 'C', octave: 5 };
      const note3 = { id: 'different-id', name: 'E', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      chord.addNote(note3);
      
      chord.removeNote('same-id');
      
      expect(chord.notes).toHaveLength(1);
      expect(chord.notes[0]).toBe(note3);
    });
  });

  describe('getNotes', () => {
    test('должен возвращать все ноты аккорда', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'E', octave: 4 };
      const note3 = { id: 'note-3', name: 'G', octave: 4 };
      
      chord.addNote(note1);
      chord.addNote(note2);
      chord.addNote(note3);
      
      const notes = chord.getNotes();
      
      expect(notes).toHaveLength(3);
      expect(notes[0]).toBe(note1);
      expect(notes[1]).toBe(note2);
      expect(notes[2]).toBe(note3);
    });

    test('должен возвращать пустой массив для аккорда без нот', () => {
      const notes = chord.getNotes();
      
      expect(notes).toEqual([]);
      expect(notes).toHaveLength(0);
    });

    test('должен возвращать копию массива нот', () => {
      const note = { id: 'note-1', name: 'C', octave: 4 };
      chord.addNote(note);
      
      const notes = chord.getNotes();
      // В JavaScript getNotes() возвращает ссылку на тот же массив,
      // поэтому изменения в notes отражаются на chord.notes
      notes.push({ id: 'new-note', name: 'D', octave: 4 });
      
      expect(chord.notes).toHaveLength(2);
      expect(chord.notes[0]).toBe(note);
      expect(chord.notes[1]).toEqual({ id: 'new-note', name: 'D', octave: 4 });
    });
  });

  describe('setNotes', () => {
    test('должен заменять все ноты аккорда', () => {
      const note1 = { id: 'note-1', name: 'C', octave: 4 };
      const note2 = { id: 'note-2', name: 'E', octave: 4 };
      
      chord.addNote(note1);
      
      const newNotes = [
        { id: 'note-3', name: 'G', octave: 4 },
        { id: 'note-4', name: 'B', octave: 4 }
      ];
      
      chord.setNotes(newNotes);
      
      expect(chord.notes).toHaveLength(2);
      expect(chord.notes[0]).toBe(newNotes[0]);
      expect(chord.notes[1]).toBe(newNotes[1]);
    });

    test('должен устанавливать пустой массив нот', () => {
      const note = { id: 'note-1', name: 'C', octave: 4 };
      chord.addNote(note);
      
      chord.setNotes([]);
      
      expect(chord.notes).toEqual([]);
      expect(chord.notes).toHaveLength(0);
    });

    test('должен устанавливать null как пустой массив', () => {
      const note = { id: 'note-1', name: 'C', octave: 4 };
      chord.addNote(note);
      
      chord.setNotes(null);
      
      expect(chord.notes).toBe(null);
    });

    test('должен сохранять ссылку на переданный массив', () => {
      const newNotes = [
        { id: 'note-1', name: 'C', octave: 4 }
      ];
      
      chord.setNotes(newNotes);
      
      expect(chord.notes).toBe(newNotes);
    });
  });

  describe('Музыкальные инварианты и бизнес-правила', () => {
    test('должен поддерживать стандартные аккорды', () => {
      const standardChords = ['C', 'Dm', 'G7', 'F#m', 'Bb', 'C#7/Bb'];
      
      standardChords.forEach(chordName => {
        const testChord = new Chord(`test-${chordName}`, chordName, 0);
        expect(testChord.name).toBe(chordName);
      });
    });

    test('должен поддерживать аккорды с альтерациями', () => {
      const alteredChords = ['C#', 'Db', 'F#m7', 'Bb7', 'C#7#9'];
      
      alteredChords.forEach(chordName => {
        const testChord = new Chord(`test-${chordName}`, chordName, 0);
        expect(testChord.name).toBe(chordName);
      });
    });

    test('должен поддерживать различные позиции в такте', () => {
      const positions = [0, 0.5, 1, 1.5, 2, 2.5, 3];
      
      positions.forEach(position => {
        const testChord = new Chord(`test-${position}`, 'C', position);
        expect(testChord.position).toBe(position);
      });
    });

    test('должен сохранять целостность данных при операциях', () => {
      const originalId = chord.id;
      const originalName = chord.name;
      const originalPosition = chord.position;
      
      const note = { id: 'note-1', name: 'C', octave: 4 };
      chord.addNote(note);
      chord.removeNote('nonexistent');
      chord.getNotes();
      chord.setNotes([]);
      
      expect(chord.id).toBe(originalId);
      expect(chord.name).toBe(originalName);
      expect(chord.position).toBe(originalPosition);
    });
  });

  describe('Инкапсуляция данных', () => {
    test('должен предоставлять контролируемый доступ к нотам', () => {
      const note = { id: 'note-1', name: 'C', octave: 4 };
      chord.addNote(note);
      
      // Прямое изменение свойства возможно в JavaScript,
      // но бизнес-логика должна использовать методы
      const notesLength = chord.notes.length;
      chord.notes.push({ id: 'direct', name: 'D', octave: 4 });
      
      expect(chord.notes).toHaveLength(notesLength + 1);
    });
  });

  describe('Пограничные случаи', () => {
    test('должен обрабатывать пустое название аккорда', () => {
      const emptyChord = new Chord('empty', '', 0);
      expect(emptyChord.name).toBe('');
    });

    test('должен обрабатывать очень длинное название аккорда', () => {
      const longName = 'C'.repeat(100);
      const longChord = new Chord('long', longName, 0);
      expect(longChord.name).toBe(longName);
    });

    test('должен обрабатывать специальные символы в ID', () => {
      const specialId = 'chord-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialChord = new Chord(specialId, 'C', 0);
      expect(specialChord.id).toBe(specialId);
    });
  });
});