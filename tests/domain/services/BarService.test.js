import BarService from '../../../js/domain/services/BarService.js';

describe('BarService', () => {
  let barService;
  let mockBarRepository;

  beforeEach(() => {
    // Создаем мок для BarRepository
    mockBarRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    barService = new BarService(mockBarRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с BarRepository', () => {
      expect(barService.barRepository).toBe(mockBarRepository);
    });

    test('должен выбрасывать ошибку без BarRepository', () => {
      expect(() => new BarService(null)).toThrow();
    });
  });

  describe('getAllBars', () => {
    test('должен возвращать все бары из репозитория', async () => {
      const mockBars = [
        { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', beats: 3, beatUnit: 8, chords: [] }
      ];
      
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      const result = await barService.getAllBars();

      expect(mockBarRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockBars);
    });

    test('должен возвращать пустой массив при отсутствии баров', async () => {
      mockBarRepository.findAll.mockResolvedValue([]);

      const result = await barService.getAllBars();

      expect(mockBarRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки репозитория', async () => {
      const error = new Error('Repository error');
      mockBarRepository.findAll.mockRejectedValue(error);

      await expect(barService.getAllBars()).rejects.toThrow('Repository error');
      expect(mockBarRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getBarById', () => {
    test('должен возвращать бар по ID', async () => {
      const mockBar = { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] };
      mockBarRepository.findById.mockResolvedValue(mockBar);

      const result = await barService.getBarById('bar-1');

      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
      expect(result).toEqual(mockBar);
    });

    test('должен возвращать null при отсутствии бара', async () => {
      mockBarRepository.findById.mockResolvedValue(null);

      const result = await barService.getBarById('nonexistent');

      expect(mockBarRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки репозитория', async () => {
      const error = new Error('Repository error');
      mockBarRepository.findById.mockRejectedValue(error);

      await expect(barService.getBarById('bar-1')).rejects.toThrow('Repository error');
      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
    });
  });

  describe('createBar', () => {
    test('должен создавать новый бар с базовыми данными', async () => {
      const barData = { beats: 4, beatUnit: 4 };
      const expectedBar = {
        id: expect.any(String),
        chords: [],
        beats: 4,
        beatUnit: 4
      };
      
      mockBarRepository.save.mockResolvedValue(expectedBar);

      const result = await barService.createBar(barData);

      expect(mockBarRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        chords: [],
        beats: 4,
        beatUnit: 4
      }));
      expect(result).toEqual(expectedBar);
    });

    test('должен создавать бар с дополнительными данными', async () => {
      const barData = { 
        beats: 3, 
        beatUnit: 8, 
        templateId: 'template-1',
        order: 1 
      };
      const expectedBar = {
        id: expect.any(String),
        chords: [],
        beats: 3,
        beatUnit: 8,
        templateId: 'template-1',
        order: 1
      };
      
      mockBarRepository.save.mockResolvedValue(expectedBar);

      const result = await barService.createBar(barData);

      expect(mockBarRepository.save).toHaveBeenCalledWith(expect.objectContaining(expectedBar));
      expect(result).toEqual(expectedBar);
    });

    test('должен генерировать уникальный ID для каждого бара', async () => {
      const barData1 = { beats: 4, beatUnit: 4 };
      const barData2 = { beats: 3, beatUnit: 8 };
      
      mockBarRepository.save
        .mockResolvedValueOnce({ id: 'generated-id-1', chords: [], ...barData1 })
        .mockResolvedValueOnce({ id: 'generated-id-2', chords: [], ...barData2 });

      const result1 = await barService.createBar(barData1);
      const result2 = await barService.createBar(barData2);

      expect(result1.id).toBe('generated-id-1');
      expect(result2.id).toBe('generated-id-2');
      expect(result1.id).not.toBe(result2.id);
    });

    test('должен обрабатывать ошибки при сохранении', async () => {
      const barData = { beats: 4, beatUnit: 4 };
      const error = new Error('Save error');
      mockBarRepository.save.mockRejectedValue(error);

      await expect(barService.createBar(barData)).rejects.toThrow('Save error');
    });
  });

  describe('updateBar', () => {
    test('должен обновлять существующий бар', async () => {
      const updateData = { beats: 3, beatUnit: 8 };
      const expectedUpdatedBar = { id: 'bar-1', beats: 3, beatUnit: 8, chords: [] };
      
      mockBarRepository.update.mockResolvedValue(expectedUpdatedBar);

      const result = await barService.updateBar('bar-1', updateData);

      expect(mockBarRepository.update).toHaveBeenCalledWith('bar-1', updateData);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен возвращать null при обновлении несуществующего бара', async () => {
      const updateData = { beats: 3 };
      mockBarRepository.update.mockResolvedValue(null);

      const result = await barService.updateBar('nonexistent', updateData);

      expect(mockBarRepository.update).toHaveBeenCalledWith('nonexistent', updateData);
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки при обновлении', async () => {
      const error = new Error('Update error');
      mockBarRepository.update.mockRejectedValue(error);

      await expect(barService.updateBar('bar-1', { beats: 3 })).rejects.toThrow('Update error');
      expect(mockBarRepository.update).toHaveBeenCalledWith('bar-1', { beats: 3 });
    });
  });

  describe('deleteBar', () => {
    test('должен удалять бар по ID', async () => {
      mockBarRepository.delete.mockResolvedValue(true);

      const result = await barService.deleteBar('bar-1');

      expect(mockBarRepository.delete).toHaveBeenCalledWith('bar-1');
      expect(result).toBe(true);
    });

    test('должен возвращать false при удалении несуществующего бара', async () => {
      mockBarRepository.delete.mockResolvedValue(false);

      const result = await barService.deleteBar('nonexistent');

      expect(mockBarRepository.delete).toHaveBeenCalledWith('nonexistent');
      expect(result).toBe(false);
    });

    test('должен обрабатывать ошибки при удалении', async () => {
      const error = new Error('Delete error');
      mockBarRepository.delete.mockRejectedValue(error);

      await expect(barService.deleteBar('bar-1')).rejects.toThrow('Delete error');
      expect(mockBarRepository.delete).toHaveBeenCalledWith('bar-1');
    });
  });

  describe('addChordToBar', () => {
    test('должен добавлять аккорд в существующий бар', async () => {
      const existingBar = { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] };
      const chord = { id: 'chord-1', name: 'C', position: 0 };
      const expectedUpdatedBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [chord]
      };
      
      mockBarRepository.findById.mockResolvedValue(existingBar);
      mockBarRepository.update.mockResolvedValue(expectedUpdatedBar);

      const result = await barService.addChordToBar('bar-1', chord);

      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
      expect(mockBarRepository.update).toHaveBeenCalledWith('bar-1', expectedUpdatedBar);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен добавлять аккорд к существующим аккордам в баре', async () => {
      const existingBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [{ id: 'chord-1', name: 'C', position: 0 }]
      };
      const newChord = { id: 'chord-2', name: 'G', position: 2 };
      const expectedUpdatedBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [
          { id: 'chord-1', name: 'C', position: 0 },
          newChord
        ]
      };
      
      mockBarRepository.findById.mockResolvedValue(existingBar);
      mockBarRepository.update.mockResolvedValue(expectedUpdatedBar);

      const result = await barService.addChordToBar('bar-1', newChord);

      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
      expect(mockBarRepository.update).toHaveBeenCalledWith('bar-1', expectedUpdatedBar);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен возвращать null при добавлении аккорда в несуществующий бар', async () => {
      const chord = { id: 'chord-1', name: 'C', position: 0 };
      mockBarRepository.findById.mockResolvedValue(null);

      const result = await barService.addChordToBar('nonexistent', chord);

      expect(mockBarRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockBarRepository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки при добавлении аккорда', async () => {
      const chord = { id: 'chord-1', name: 'C', position: 0 };
      const error = new Error('Repository error');
      mockBarRepository.findById.mockRejectedValue(error);

      await expect(barService.addChordToBar('bar-1', chord)).rejects.toThrow('Repository error');
      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
    });
  });

  describe('removeChordFromBar', () => {
    test('должен удалять аккорд из существующего бара', async () => {
      const existingBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [
          { id: 'chord-1', name: 'C', position: 0 },
          { id: 'chord-2', name: 'G', position: 2 }
        ]
      };
      const expectedUpdatedBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [{ id: 'chord-1', name: 'C', position: 0 }]
      };
      
      mockBarRepository.findById.mockResolvedValue(existingBar);
      mockBarRepository.update.mockResolvedValue(expectedUpdatedBar);

      const result = await barService.removeChordFromBar('bar-1', 'chord-2');

      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
      expect(mockBarRepository.update).toHaveBeenCalledWith('bar-1', expectedUpdatedBar);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен возвращать null при удалении аккорда из несуществующего бара', async () => {
      mockBarRepository.findById.mockResolvedValue(null);

      const result = await barService.removeChordFromBar('nonexistent', 'chord-1');

      expect(mockBarRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockBarRepository.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('должен оставлять бар без изменений при удалении несуществующего аккорда', async () => {
      const existingBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [{ id: 'chord-1', name: 'C', position: 0 }]
      };
      const expectedUpdatedBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [{ id: 'chord-1', name: 'C', position: 0 }]
      };
      
      mockBarRepository.findById.mockResolvedValue(existingBar);
      mockBarRepository.update.mockResolvedValue(expectedUpdatedBar);

      const result = await barService.removeChordFromBar('bar-1', 'nonexistent-chord');

      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
      expect(mockBarRepository.update).toHaveBeenCalledWith('bar-1', expectedUpdatedBar);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен обрабатывать ошибки при удалении аккорда', async () => {
      const error = new Error('Repository error');
      mockBarRepository.findById.mockRejectedValue(error);

      await expect(barService.removeChordFromBar('bar-1', 'chord-1')).rejects.toThrow('Repository error');
      expect(mockBarRepository.findById).toHaveBeenCalledWith('bar-1');
    });
  });

  describe('generateId', () => {
    test('должен генерировать уникальные ID', () => {
      const id1 = barService.generateId();
      const id2 = barService.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });

    test('должен генерировать ID в ожидаемом формате', () => {
      const id = barService.generateId();
      
      // ID должен содержать timestamp и случайную строку
      expect(id).toMatch(/^[a-z0-9]+$/i);
    });

    test('должен генерировать разные ID при быстрых вызовах', () => {
      const ids = [];
      
      for (let i = 0; i < 10; i++) {
        ids.push(barService.generateId());
      }
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Интеграционные сценарии', () => {
    test('должен корректно обрабатывать полный жизненный цикл бара', async () => {
      // Создание бара
      const barData = { beats: 4, beatUnit: 4 };
      const createdBar = { id: 'bar-1', chords: [], ...barData };
      mockBarRepository.save.mockResolvedValue(createdBar);

      const bar = await barService.createBar(barData);
      expect(bar.id).toBe('bar-1');

      // Добавление аккордов
      const chord1 = { id: 'chord-1', name: 'C', position: 0 };
      const chord2 = { id: 'chord-2', name: 'G', position: 2 };
      
      const barWithChord1 = { ...bar, chords: [chord1] };
      const barWithChords = { ...bar, chords: [chord1, chord2] };
      
      mockBarRepository.findById
        .mockResolvedValueOnce(bar)
        .mockResolvedValueOnce(barWithChord1);
      mockBarRepository.update
        .mockResolvedValueOnce(barWithChord1)
        .mockResolvedValueOnce(barWithChords);

      const result1 = await barService.addChordToBar('bar-1', chord1);
      
      // Сбрасываем моки для следующего вызова
      mockBarRepository.findById.mockResolvedValueOnce(result1);
      mockBarRepository.update.mockResolvedValueOnce({
        ...result1,
        chords: [...result1.chords, chord2]
      });
      
      const result2 = await barService.addChordToBar('bar-1', chord2);

      expect(result1.chords).toHaveLength(1);
      expect(result2.chords).toHaveLength(2);

      // Удаление аккорда
      const barAfterRemoval = { ...bar, chords: [chord1] };
      mockBarRepository.findById.mockResolvedValueOnce(barWithChords);
      mockBarRepository.update.mockResolvedValueOnce(barAfterRemoval);

      const result3 = await barService.removeChordFromBar('bar-1', 'chord-2');
      expect(result3.chords).toHaveLength(1);
      expect(result3.chords[0].id).toBe('chord-1');

      // Обновление бара
      const updateData = { beats: 3 };
      const updatedBar = { ...barAfterRemoval, beats: 3 };
      mockBarRepository.update.mockResolvedValueOnce(updatedBar);

      const result4 = await barService.updateBar('bar-1', updateData);
      expect(result4.beats).toBe(3);

      // Удаление бара
      mockBarRepository.delete.mockResolvedValueOnce(true);
      const result5 = await barService.deleteBar('bar-1');
      expect(result5).toBe(true);
    });

    test('должен корректно работать с пустыми и сложными структурами аккордов', async () => {
      const bar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: []
      };
      
      const complexChord = {
        id: 'chord-1',
        name: 'Cmaj7',
        position: 0,
        notes: [
          { id: 'note-1', name: 'C', octave: 4 },
          { id: 'note-2', name: 'E', octave: 4 },
          { id: 'note-3', name: 'G', octave: 4 },
          { id: 'note-4', name: 'B', octave: 4 }
        ]
      };

      mockBarRepository.findById.mockResolvedValue(bar);
      mockBarRepository.update.mockResolvedValue({ ...bar, chords: [complexChord] });

      const result = await barService.addChordToBar('bar-1', complexChord);

      expect(result.chords).toHaveLength(1);
      expect(result.chords[0].notes).toHaveLength(4);
      expect(result.chords[0].name).toBe('Cmaj7');
    });
  });
});