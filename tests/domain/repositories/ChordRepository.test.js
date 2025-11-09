import ChordRepository from '../../../js/domain/repositories/ChordRepository.js';

describe('ChordRepository', () => {
  let chordRepository;
  let mockStorageAdapter;

  beforeEach(() => {
    // Создаем мок для storageAdapter
    mockStorageAdapter = {
      get: jest.fn(),
      set: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn()
    };

    chordRepository = new ChordRepository(mockStorageAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с storageAdapter', () => {
      expect(chordRepository.storageAdapter).toBe(mockStorageAdapter);
      expect(chordRepository.collection).toBe('chords');
    });

    test('должен выбрасывать ошибку без storageAdapter', () => {
      expect(() => new ChordRepository()).toThrow();
    });
  });

  describe('findAll', () => {
    test('должен возвращать все аккорды из хранилища', async () => {
      const mockChords = [
        { id: 'chord-1', name: 'C', position: 0, notes: [] },
        { id: 'chord-2', name: 'G', position: 2, notes: [] }
      ];
      
      mockStorageAdapter.getAll.mockResolvedValue(mockChords);

      const result = await chordRepository.findAll();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
      expect(result).toEqual(mockChords);
    });

    test('должен возвращать пустой массив при отсутствии аккордов', async () => {
      mockStorageAdapter.getAll.mockResolvedValue([]);

      const result = await chordRepository.findAll();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.getAll.mockRejectedValue(error);

      await expect(chordRepository.findAll()).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
    });
  });

  describe('findById', () => {
    test('должен находить аккорд по ID', async () => {
      const mockChord = { id: 'chord-1', name: 'C', position: 0, notes: [] };
      mockStorageAdapter.get.mockResolvedValue(mockChord);

      const result = await chordRepository.findById('chord-1');

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'chord-1');
      expect(result).toEqual(mockChord);
    });

    test('должен возвращать null при отсутствии аккорда', async () => {
      mockStorageAdapter.get.mockResolvedValue(null);

      const result = await chordRepository.findById('nonexistent');

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'nonexistent');
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.get.mockRejectedValue(error);

      await expect(chordRepository.findById('chord-1')).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'chord-1');
    });
  });

  describe('save', () => {
    test('должен сохранять новый аккорд', async () => {
      const newChord = { id: 'chord-1', name: 'C', position: 0, notes: [] };
      mockStorageAdapter.set.mockResolvedValue(newChord);

      const result = await chordRepository.save(newChord);

      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', newChord);
      expect(result).toEqual(newChord);
    });

    test('должен сохранять аккорд с нотами', async () => {
      const chordWithNotes = {
        id: 'chord-1',
        name: 'C',
        position: 0,
        notes: [
          { id: 'note-1', name: 'C', octave: 4 },
          { id: 'note-2', name: 'E', octave: 4 },
          { id: 'note-3', name: 'G', octave: 4 }
        ]
      };
      mockStorageAdapter.set.mockResolvedValue(chordWithNotes);

      const result = await chordRepository.save(chordWithNotes);

      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', chordWithNotes);
      expect(result).toEqual(chordWithNotes);
    });

    test('должен сохранять сложные аккорды с альтерациями', async () => {
      const complexChord = {
        id: 'chord-1',
        name: 'C#7#9/Bb',
        position: 1.5,
        notes: [
          { id: 'note-1', name: 'C#', octave: 4 },
          { id: 'note-2', name: 'E#', octave: 4 },
          { id: 'note-3', name: 'G#', octave: 4 },
          { id: 'note-4', name: 'Bb', octave: 4 }
        ]
      };
      mockStorageAdapter.set.mockResolvedValue(complexChord);

      const result = await chordRepository.save(complexChord);

      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', complexChord);
      expect(result).toEqual(complexChord);
    });

    test('должен обрабатывать ошибки при сохранении', async () => {
      const chord = { id: 'chord-1', name: 'C', position: 0, notes: [] };
      const error = new Error('Save error');
      mockStorageAdapter.set.mockRejectedValue(error);

      await expect(chordRepository.save(chord)).rejects.toThrow('Save error');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', chord);
    });
  });

  describe('update', () => {
    test('должен обновлять существующий аккорд', async () => {
      const existingChord = { id: 'chord-1', name: 'C', position: 0, notes: [] };
      const updateData = { name: 'Cmaj7', position: 1 };
      const expectedUpdatedChord = { ...existingChord, ...updateData };

      mockStorageAdapter.get.mockResolvedValue(existingChord);
      mockStorageAdapter.set.mockResolvedValue(expectedUpdatedChord);

      const result = await chordRepository.update('chord-1', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'chord-1');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', expectedUpdatedChord);
      expect(result).toEqual(expectedUpdatedChord);
    });

    test('должен возвращать null при обновлении несуществующего аккорда', async () => {
      const updateData = { name: 'G' };
      mockStorageAdapter.get.mockResolvedValue(null);

      const result = await chordRepository.update('nonexistent', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'nonexistent');
      expect(mockStorageAdapter.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('должен обновлять ноты в аккорде', async () => {
      const existingChord = {
        id: 'chord-1',
        name: 'C',
        position: 0,
        notes: [{ id: 'note-1', name: 'C', octave: 4 }]
      };
      const updateData = {
        notes: [
          { id: 'note-1', name: 'C', octave: 4 },
          { id: 'note-2', name: 'E', octave: 4 },
          { id: 'note-3', name: 'G', octave: 4 }
        ]
      };
      const expectedUpdatedChord = { ...existingChord, ...updateData };

      mockStorageAdapter.get.mockResolvedValue(existingChord);
      mockStorageAdapter.set.mockResolvedValue(expectedUpdatedChord);

      const result = await chordRepository.update('chord-1', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'chord-1');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', expectedUpdatedChord);
      expect(result).toEqual(expectedUpdatedChord);
    });

    test('должен обновлять позицию аккорда', async () => {
      const existingChord = { id: 'chord-1', name: 'C', position: 0, notes: [] };
      const updateData = { position: 2.5 };
      const expectedUpdatedChord = { ...existingChord, ...updateData };

      mockStorageAdapter.get.mockResolvedValue(existingChord);
      mockStorageAdapter.set.mockResolvedValue(expectedUpdatedChord);

      const result = await chordRepository.update('chord-1', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'chord-1');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', expectedUpdatedChord);
      expect(result).toEqual(expectedUpdatedChord);
    });

    test('должен обрабатывать ошибки при обновлении', async () => {
      const error = new Error('Update error');
      mockStorageAdapter.get.mockRejectedValue(error);

      await expect(chordRepository.update('chord-1', { name: 'G' })).rejects.toThrow('Update error');
      expect(mockStorageAdapter.get).toHaveBeenCalledWith('chords', 'chord-1');
    });
  });

  describe('delete', () => {
    test('должен удалять аккорд по ID', async () => {
      mockStorageAdapter.delete.mockResolvedValue(true);

      const result = await chordRepository.delete('chord-1');

      expect(mockStorageAdapter.delete).toHaveBeenCalledWith('chords', 'chord-1');
      expect(result).toBe(true);
    });

    test('должен возвращать false при удалении несуществующего аккорда', async () => {
      mockStorageAdapter.delete.mockResolvedValue(false);

      const result = await chordRepository.delete('nonexistent');

      expect(mockStorageAdapter.delete).toHaveBeenCalledWith('chords', 'nonexistent');
      expect(result).toBe(false);
    });

    test('должен обрабатывать ошибки при удалении', async () => {
      const error = new Error('Delete error');
      mockStorageAdapter.delete.mockRejectedValue(error);

      await expect(chordRepository.delete('chord-1')).rejects.toThrow('Delete error');
      expect(mockStorageAdapter.delete).toHaveBeenCalledWith('chords', 'chord-1');
    });
  });

  describe('findByBarId', () => {
    test('должен находить аккорды по ID такта', async () => {
      const mockChords = [
        { id: 'chord-1', barId: 'bar-1', name: 'C', position: 0, notes: [] },
        { id: 'chord-2', barId: 'bar-2', name: 'G', position: 0, notes: [] },
        { id: 'chord-3', barId: 'bar-1', name: 'Am', position: 2, notes: [] }
      ];
      const expectedChords = [
        { id: 'chord-1', barId: 'bar-1', name: 'C', position: 0, notes: [] },
        { id: 'chord-3', barId: 'bar-1', name: 'Am', position: 2, notes: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockChords);

      const result = await chordRepository.findByBarId('bar-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
      expect(result).toEqual(expectedChords);
    });

    test('должен возвращать пустой массив при отсутствии аккордов для такта', async () => {
      const mockChords = [
        { id: 'chord-1', barId: 'bar-2', name: 'C', position: 0, notes: [] },
        { id: 'chord-2', barId: 'bar-3', name: 'G', position: 0, notes: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockChords);

      const result = await chordRepository.findByBarId('bar-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
      expect(result).toEqual([]);
    });

    test('должен возвращать пустой массив при отсутствии всех аккордов', async () => {
      mockStorageAdapter.getAll.mockResolvedValue([]);

      const result = await chordRepository.findByBarId('bar-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
      expect(result).toEqual([]);
    });

    test('должен находить аккорды с разными позициями в одном такте', async () => {
      const mockChords = [
        { id: 'chord-1', barId: 'bar-1', name: 'C', position: 0, notes: [] },
        { id: 'chord-2', barId: 'bar-1', name: 'G', position: 1.5, notes: [] },
        { id: 'chord-3', barId: 'bar-1', name: 'Am', position: 3, notes: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockChords);

      const result = await chordRepository.findByBarId('bar-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
      expect(result).toHaveLength(3);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1.5);
      expect(result[2].position).toBe(3);
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.getAll.mockRejectedValue(error);

      await expect(chordRepository.findByBarId('bar-1')).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('chords');
    });
  });

  describe('Интеграция с хранилищем', () => {
    test('должен корректно работать с реальным объектом аккорда', async () => {
      const chord = {
        id: 'chord-1',
        name: 'Cmaj7',
        position: 0,
        barId: 'bar-1',
        notes: [
          { id: 'note-1', name: 'C', octave: 4 },
          { id: 'note-2', name: 'E', octave: 4 },
          { id: 'note-3', name: 'G', octave: 4 },
          { id: 'note-4', name: 'B', octave: 4 }
        ]
      };

      mockStorageAdapter.set.mockResolvedValue(chord);

      const result = await chordRepository.save(chord);

      expect(result).toEqual(chord);
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('chords', 'chord-1', chord);
    });

    test('должен корректно обрабатывать сложные запросы', async () => {
      const mockChords = [
        {
          id: 'chord-1',
          barId: 'bar-1',
          name: 'C',
          position: 0,
          notes: [
            { id: 'note-1', name: 'C', octave: 4 },
            { id: 'note-2', name: 'E', octave: 4 },
            { id: 'note-3', name: 'G', octave: 4 }
          ]
        },
        {
          id: 'chord-2',
          barId: 'bar-1',
          name: 'G',
          position: 2,
          notes: [
            { id: 'note-4', name: 'G', octave: 3 },
            { id: 'note-5', name: 'B', octave: 3 },
            { id: 'note-6', name: 'D', octave: 4 }
          ]
        },
        {
          id: 'chord-3',
          barId: 'bar-2',
          name: 'Am',
          position: 0,
          notes: [
            { id: 'note-7', name: 'A', octave: 3 },
            { id: 'note-8', name: 'C', octave: 4 },
            { id: 'note-9', name: 'E', octave: 4 }
          ]
        }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockChords);

      const barChords = await chordRepository.findByBarId('bar-1');

      expect(barChords).toHaveLength(2);
      expect(barChords[0].name).toBe('C');
      expect(barChords[1].name).toBe('G');
      expect(barChords[0].notes).toHaveLength(3);
      expect(barChords[1].notes).toHaveLength(3);
    });

    test('должен корректно обрабатывать аккорды без нот', async () => {
      const chordWithoutNotes = {
        id: 'chord-1',
        name: 'C',
        position: 0,
        barId: 'bar-1',
        notes: []
      };

      mockStorageAdapter.set.mockResolvedValue(chordWithoutNotes);

      const result = await chordRepository.save(chordWithoutNotes);

      expect(result).toEqual(chordWithoutNotes);
      expect(result.notes).toEqual([]);
    });
  });

  describe('Пограничные случаи', () => {
    test('должен обрабатывать аккорды с пустым названием', async () => {
      const chordWithEmptyName = {
        id: 'chord-1',
        name: '',
        position: 0,
        notes: []
      };

      mockStorageAdapter.set.mockResolvedValue(chordWithEmptyName);

      const result = await chordRepository.save(chordWithEmptyName);

      expect(result.name).toBe('');
    });

    test('должен обрабатывать аккорды с дробными позициями', async () => {
      const chordWithFractionalPosition = {
        id: 'chord-1',
        name: 'C',
        position: 1.75,
        notes: []
      };

      mockStorageAdapter.set.mockResolvedValue(chordWithFractionalPosition);

      const result = await chordRepository.save(chordWithFractionalPosition);

      expect(result.position).toBe(1.75);
    });

    test('должен обрабатывать аккорды с отрицательными позициями', async () => {
      const chordWithNegativePosition = {
        id: 'chord-1',
        name: 'C',
        position: -1,
        notes: []
      };

      mockStorageAdapter.set.mockResolvedValue(chordWithNegativePosition);

      const result = await chordRepository.save(chordWithNegativePosition);

      expect(result.position).toBe(-1);
    });
  });
});