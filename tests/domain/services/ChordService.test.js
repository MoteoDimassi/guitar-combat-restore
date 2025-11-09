import ChordService from '../../../js/domain/services/ChordService.js';

describe('ChordService', () => {
  let chordService;
  let mockChordRepository;

  beforeEach(() => {
    // Создаем мок для ChordRepository
    mockChordRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    chordService = new ChordService(mockChordRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с ChordRepository', () => {
      expect(chordService.chordRepository).toBe(mockChordRepository);
    });
  });

  describe('getAllChords', () => {
    test('должен возвращать все аккорды из репозитория', async () => {
      const mockChords = [
        { id: 'chord-1', name: 'C', position: 0, notes: [] },
        { id: 'chord-2', name: 'G', position: 2, notes: [] }
      ];
      
      mockChordRepository.findAll.mockResolvedValue(mockChords);

      const result = await chordService.getAllChords();

      expect(mockChordRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockChords);
    });

    test('должен возвращать пустой массив при отсутствии аккордов', async () => {
      mockChordRepository.findAll.mockResolvedValue([]);

      const result = await chordService.getAllChords();

      expect(mockChordRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки репозитория', async () => {
      const error = new Error('Repository error');
      mockChordRepository.findAll.mockRejectedValue(error);

      await expect(chordService.getAllChords()).rejects.toThrow('Repository error');
      expect(mockChordRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getChordById', () => {
    test('должен возвращать аккорд по ID', async () => {
      const mockChord = { id: 'chord-1', name: 'C', position: 0, notes: [] };
      mockChordRepository.findById.mockResolvedValue(mockChord);

      const result = await chordService.getChordById('chord-1');

      expect(mockChordRepository.findById).toHaveBeenCalledWith('chord-1');
      expect(result).toEqual(mockChord);
    });

    test('должен возвращать null при отсутствии аккорда', async () => {
      mockChordRepository.findById.mockResolvedValue(null);

      const result = await chordService.getChordById('nonexistent');

      expect(mockChordRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки репозитория', async () => {
      const error = new Error('Repository error');
      mockChordRepository.findById.mockRejectedValue(error);

      await expect(chordService.getChordById('chord-1')).rejects.toThrow('Repository error');
      expect(mockChordRepository.findById).toHaveBeenCalledWith('chord-1');
    });
  });

  describe('createChord', () => {
    test('должен создавать новый аккорд с базовыми данными', async () => {
      const chordData = { name: 'C', position: 0 };
      const expectedChord = {
        id: expect.any(String),
        name: 'C',
        position: 0
      };
      
      mockChordRepository.save.mockResolvedValue(expectedChord);

      const result = await chordService.createChord(chordData);

      expect(mockChordRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        name: 'C',
        position: 0
      }));
      expect(result).toEqual(expectedChord);
    });

    test('должен создавать аккорд с дополнительными данными', async () => {
      const chordData = { 
        name: 'Cmaj7', 
        position: 1.5,
        barId: 'bar-1',
        notes: [
          { id: 'note-1', name: 'C', octave: 4 },
          { id: 'note-2', name: 'E', octave: 4 }
        ]
      };
      const expectedChord = {
        id: expect.any(String),
        name: 'Cmaj7',
        position: 1.5,
        barId: 'bar-1',
        notes: chordData.notes
      };
      
      mockChordRepository.save.mockResolvedValue(expectedChord);

      const result = await chordService.createChord(chordData);

      expect(mockChordRepository.save).toHaveBeenCalledWith(expect.objectContaining(expectedChord));
      expect(result).toEqual(expectedChord);
    });

    test('должен генерировать уникальный ID для каждого аккорда', async () => {
      const chordData1 = { name: 'C', position: 0 };
      const chordData2 = { name: 'G', position: 2 };
      
      mockChordRepository.save
        .mockResolvedValueOnce({ id: 'generated-id-1', ...chordData1 })
        .mockResolvedValueOnce({ id: 'generated-id-2', ...chordData2 });

      const result1 = await chordService.createChord(chordData1);
      const result2 = await chordService.createChord(chordData2);

      expect(result1.id).toBe('generated-id-1');
      expect(result2.id).toBe('generated-id-2');
      expect(result1.id).not.toBe(result2.id);
    });

    test('должен обрабатывать ошибки при сохранении', async () => {
      const chordData = { name: 'C', position: 0 };
      const error = new Error('Save error');
      mockChordRepository.save.mockRejectedValue(error);

      await expect(chordService.createChord(chordData)).rejects.toThrow('Save error');
    });
  });

  describe('updateChord', () => {
    test('должен обновлять существующий аккорд', async () => {
      const updateData = { name: 'Cmaj7', position: 1 };
      const expectedUpdatedChord = { id: 'chord-1', name: 'Cmaj7', position: 1 };
      
      mockChordRepository.update.mockResolvedValue(expectedUpdatedChord);

      const result = await chordService.updateChord('chord-1', updateData);

      expect(mockChordRepository.update).toHaveBeenCalledWith('chord-1', updateData);
      expect(result).toEqual(expectedUpdatedChord);
    });

    test('должен возвращать null при обновлении несуществующего аккорда', async () => {
      const updateData = { name: 'G' };
      mockChordRepository.update.mockResolvedValue(null);

      const result = await chordService.updateChord('nonexistent', updateData);

      expect(mockChordRepository.update).toHaveBeenCalledWith('nonexistent', updateData);
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки при обновлении', async () => {
      const error = new Error('Update error');
      mockChordRepository.update.mockRejectedValue(error);

      await expect(chordService.updateChord('chord-1', { name: 'G' })).rejects.toThrow('Update error');
      expect(mockChordRepository.update).toHaveBeenCalledWith('chord-1', { name: 'G' });
    });
  });

  describe('deleteChord', () => {
    test('должен удалять аккорд по ID', async () => {
      mockChordRepository.delete.mockResolvedValue(true);

      const result = await chordService.deleteChord('chord-1');

      expect(mockChordRepository.delete).toHaveBeenCalledWith('chord-1');
      expect(result).toBe(true);
    });

    test('должен возвращать false при удалении несуществующего аккорда', async () => {
      mockChordRepository.delete.mockResolvedValue(false);

      const result = await chordService.deleteChord('nonexistent');

      expect(mockChordRepository.delete).toHaveBeenCalledWith('nonexistent');
      expect(result).toBe(false);
    });

    test('должен обрабатывать ошибки при удалении', async () => {
      const error = new Error('Delete error');
      mockChordRepository.delete.mockRejectedValue(error);

      await expect(chordService.deleteChord('chord-1')).rejects.toThrow('Delete error');
      expect(mockChordRepository.delete).toHaveBeenCalledWith('chord-1');
    });
  });

  describe('isValidChord', () => {
    test('должен возвращать true для базовых мажорных аккордов', () => {
      const validChords = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      
      validChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(true);
      });
    });

    test('должен возвращать true для аккордов с диезами', () => {
      const validChords = ['C#', 'D#', 'F#', 'G#', 'A#'];
      
      validChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(true);
      });
    });

    test('должен возвращать true для минорных аккордов', () => {
      const validChords = ['Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
      
      validChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(true);
      });
    });

    test('должен возвращать true для минорных аккордов с диезами', () => {
      const validChords = ['C#m', 'D#m', 'F#m', 'G#m', 'A#m'];
      
      validChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(true);
      });
    });

    test('должен возвращать true для доминантсепт аккордов', () => {
      const validChords = ['C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7'];
      
      validChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(true);
      });
    });

    test('должен возвращать true для доминантсепт аккордов с диезами', () => {
      const validChords = ['C#7', 'D#7', 'F#7', 'G#7', 'A#7'];
      
      validChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(true);
      });
    });

    test('должен возвращать false для невалидных аккордов', () => {
      const invalidChords = ['H', 'Z', 'C9', 'Gm11', 'X', 'Y', '123'];
      
      invalidChords.forEach(chord => {
        expect(chordService.isValidChord(chord)).toBe(false);
      });
    });

    test('должен возвращать false для пустой строки', () => {
      expect(chordService.isValidChord('')).toBe(false);
    });

    test('должен возвращать false для null и undefined', () => {
      expect(chordService.isValidChord(null)).toBe(false);
      expect(chordService.isValidChord(undefined)).toBe(false);
    });

    test('должен быть чувствительным к регистру', () => {
      expect(chordService.isValidChord('c')).toBe(false);
      expect(chordService.isValidChord('C')).toBe(true);
      expect(chordService.isValidChord('cm')).toBe(false);
      expect(chordService.isValidChord('Cm')).toBe(true);
    });
  });

  describe('generateId', () => {
    test('должен генерировать уникальные ID', () => {
      const id1 = chordService.generateId();
      const id2 = chordService.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });

    test('должен генерировать ID в ожидаемом формате', () => {
      const id = chordService.generateId();
      
      // ID должен содержать timestamp и случайную строку
      expect(id).toMatch(/^[a-z0-9]+$/i);
    });

    test('должен генерировать разные ID при быстрых вызовах', () => {
      const ids = [];
      
      for (let i = 0; i < 10; i++) {
        ids.push(chordService.generateId());
      }
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Интеграционные сценарии', () => {
    test('должен корректно обрабатывать полный жизненный цикл аккорда', async () => {
      // Создание аккорда
      const chordData = { name: 'C', position: 0 };
      const createdChord = { id: 'chord-1', ...chordData };
      mockChordRepository.save.mockResolvedValue(createdChord);

      const chord = await chordService.createChord(chordData);
      expect(chord.id).toBe('chord-1');

      // Получение аккорда
      mockChordRepository.findById.mockResolvedValue(createdChord);
      const retrievedChord = await chordService.getChordById('chord-1');
      expect(retrievedChord.id).toBe('chord-1');

      // Обновление аккорда
      const updateData = { name: 'Cmaj7', position: 1 };
      const updatedChord = { ...createdChord, ...updateData };
      mockChordRepository.update.mockResolvedValue(updatedChord);

      const result = await chordService.updateChord('chord-1', updateData);
      expect(result.name).toBe('Cmaj7');
      expect(result.position).toBe(1);

      // Удаление аккорда
      mockChordRepository.delete.mockResolvedValue(true);
      const deleteResult = await chordService.deleteChord('chord-1');
      expect(deleteResult).toBe(true);
    });

    test('должен корректно работать с музыкальными аккордами разной сложности', () => {
      const simpleChords = ['C', 'G', 'Am', 'F'];
      const complexChords = ['Cmaj7', 'G#m7', 'Bb7', 'D#m'];
      const allChords = [...simpleChords, ...complexChords];

      allChords.forEach(chord => {
        // Проверяем только аккорды, которые есть в списке валидных в ChordService
        if (['C', 'G', 'Am', 'F', 'D#m'].includes(chord)) {
          expect(chordService.isValidChord(chord)).toBe(true);
        } else {
          // Остальные аккорды должны быть невалидными согласно текущей реализации
          expect(chordService.isValidChord(chord)).toBe(false);
        }
      });
    });
  });
});