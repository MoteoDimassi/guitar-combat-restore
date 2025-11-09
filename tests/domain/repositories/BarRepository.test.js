import BarRepository from '../../../js/domain/repositories/BarRepository.js';

describe('BarRepository', () => {
  let barRepository;
  let mockStorageAdapter;

  beforeEach(() => {
    // Создаем мок для storageAdapter
    mockStorageAdapter = {
      get: jest.fn(),
      set: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn()
    };

    barRepository = new BarRepository(mockStorageAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с storageAdapter', () => {
      expect(barRepository.storageAdapter).toBe(mockStorageAdapter);
      expect(barRepository.collection).toBe('bars');
    });

    test('должен выбрасывать ошибку без storageAdapter', () => {
      expect(() => new BarRepository(null)).toThrow('Storage adapter is required');
    });
  });

  describe('findAll', () => {
    test('должен возвращать все бары из хранилища', async () => {
      const mockBars = [
        { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', beats: 3, beatUnit: 4, chords: [] }
      ];
      
      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const result = await barRepository.findAll();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toEqual(mockBars);
    });

    test('должен возвращать пустой массив при отсутствии баров', async () => {
      mockStorageAdapter.getAll.mockResolvedValue([]);

      const result = await barRepository.findAll();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.getAll.mockRejectedValue(error);

      await expect(barRepository.findAll()).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
    });
  });

  describe('findById', () => {
    test('должен находить бар по ID', async () => {
      const mockBar = { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] };
      mockStorageAdapter.get.mockResolvedValue(mockBar);

      const result = await barRepository.findById('bar-1');

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'bar-1');
      expect(result).toEqual(mockBar);
    });

    test('должен возвращать null при отсутствии бара', async () => {
      mockStorageAdapter.get.mockResolvedValue(null);

      const result = await barRepository.findById('nonexistent');

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'nonexistent');
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.get.mockRejectedValue(error);

      await expect(barRepository.findById('bar-1')).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'bar-1');
    });
  });

  describe('save', () => {
    test('должен сохранять новый бар', async () => {
      const newBar = { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] };
      mockStorageAdapter.set.mockResolvedValue(newBar);

      const result = await barRepository.save(newBar);

      expect(mockStorageAdapter.set).toHaveBeenCalledWith('bars', 'bar-1', newBar);
      expect(result).toEqual(newBar);
    });

    test('должен сохранять бар с аккордами', async () => {
      const barWithChords = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [
          { id: 'chord-1', name: 'C', position: 0 },
          { id: 'chord-2', name: 'G', position: 2 }
        ]
      };
      mockStorageAdapter.set.mockResolvedValue(barWithChords);

      const result = await barRepository.save(barWithChords);

      expect(mockStorageAdapter.set).toHaveBeenCalledWith('bars', 'bar-1', barWithChords);
      expect(result).toEqual(barWithChords);
    });

    test('должен обрабатывать ошибки при сохранении', async () => {
      const bar = { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] };
      const error = new Error('Save error');
      mockStorageAdapter.set.mockRejectedValue(error);

      await expect(barRepository.save(bar)).rejects.toThrow('Save error');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('bars', 'bar-1', bar);
    });
  });

  describe('update', () => {
    test('должен обновлять существующий бар', async () => {
      const existingBar = { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] };
      const updateData = { beats: 3, beatUnit: 8 };
      const expectedUpdatedBar = { ...existingBar, ...updateData };

      mockStorageAdapter.get.mockResolvedValue(existingBar);
      mockStorageAdapter.set.mockResolvedValue(expectedUpdatedBar);

      const result = await barRepository.update('bar-1', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'bar-1');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('bars', 'bar-1', expectedUpdatedBar);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен возвращать null при обновлении несуществующего бара', async () => {
      const updateData = { beats: 3 };
      mockStorageAdapter.get.mockResolvedValue(null);

      const result = await barRepository.update('nonexistent', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'nonexistent');
      expect(mockStorageAdapter.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('должен обновлять аккорды в баре', async () => {
      const existingBar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [{ id: 'chord-1', name: 'C', position: 0 }]
      };
      const updateData = {
        chords: [
          { id: 'chord-1', name: 'C', position: 0 },
          { id: 'chord-2', name: 'G', position: 2 }
        ]
      };
      const expectedUpdatedBar = { ...existingBar, ...updateData };

      mockStorageAdapter.get.mockResolvedValue(existingBar);
      mockStorageAdapter.set.mockResolvedValue(expectedUpdatedBar);

      const result = await barRepository.update('bar-1', updateData);

      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'bar-1');
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('bars', 'bar-1', expectedUpdatedBar);
      expect(result).toEqual(expectedUpdatedBar);
    });

    test('должен обрабатывать ошибки при обновлении', async () => {
      const error = new Error('Update error');
      mockStorageAdapter.get.mockRejectedValue(error);

      await expect(barRepository.update('bar-1', { beats: 3 })).rejects.toThrow('Update error');
      expect(mockStorageAdapter.get).toHaveBeenCalledWith('bars', 'bar-1');
    });
  });

  describe('delete', () => {
    test('должен удалять бар по ID', async () => {
      mockStorageAdapter.delete.mockResolvedValue(true);

      const result = await barRepository.delete('bar-1');

      expect(mockStorageAdapter.delete).toHaveBeenCalledWith('bars', 'bar-1');
      expect(result).toBe(true);
    });

    test('должен возвращать false при удалении несуществующего бара', async () => {
      mockStorageAdapter.delete.mockResolvedValue(false);

      const result = await barRepository.delete('nonexistent');

      expect(mockStorageAdapter.delete).toHaveBeenCalledWith('bars', 'nonexistent');
      expect(result).toBe(false);
    });

    test('должен обрабатывать ошибки при удалении', async () => {
      const error = new Error('Delete error');
      mockStorageAdapter.delete.mockRejectedValue(error);

      await expect(barRepository.delete('bar-1')).rejects.toThrow('Delete error');
      expect(mockStorageAdapter.delete).toHaveBeenCalledWith('bars', 'bar-1');
    });
  });

  describe('findByTemplateId', () => {
    test('должен находить бары по ID шаблона', async () => {
      const mockBars = [
        { id: 'bar-1', templateId: 'template-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', templateId: 'template-2', beats: 3, beatUnit: 4, chords: [] },
        { id: 'bar-3', templateId: 'template-1', beats: 4, beatUnit: 4, chords: [] }
      ];
      const expectedBars = [
        { id: 'bar-1', templateId: 'template-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-3', templateId: 'template-1', beats: 4, beatUnit: 4, chords: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const result = await barRepository.findByTemplateId('template-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toEqual(expectedBars);
    });

    test('должен возвращать пустой массив при отсутствии баров для шаблона', async () => {
      const mockBars = [
        { id: 'bar-1', templateId: 'template-2', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', templateId: 'template-3', beats: 3, beatUnit: 4, chords: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const result = await barRepository.findByTemplateId('template-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toEqual([]);
    });

    test('должен возвращать пустой массив при отсутствии всех баров', async () => {
      mockStorageAdapter.getAll.mockResolvedValue([]);

      const result = await barRepository.findByTemplateId('template-1');

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.getAll.mockRejectedValue(error);

      await expect(barRepository.findByTemplateId('template-1')).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
    });
  });

  describe('getMaxOrder', () => {
    test('должен возвращать максимальный порядок среди баров', async () => {
      const mockBars = [
        { id: 'bar-1', order: 1, beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', order: 3, beats: 3, beatUnit: 4, chords: [] },
        { id: 'bar-3', order: 2, beats: 4, beatUnit: 4, chords: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const result = await barRepository.getMaxOrder();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toBe(3);
    });

    test('должен возвращать 0 при отсутствии баров', async () => {
      mockStorageAdapter.getAll.mockResolvedValue([]);

      const result = await barRepository.getMaxOrder();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toBe(0);
    });

    test('должен возвращать 0 когда у баров нет поля order', async () => {
      const mockBars = [
        { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', beats: 3, beatUnit: 4, chords: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const result = await barRepository.getMaxOrder();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toBe(0);
    });

    test('должен обрабатывать отрицательные значения order', async () => {
      const mockBars = [
        { id: 'bar-1', order: -1, beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', order: -3, beats: 3, beatUnit: 4, chords: [] }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const result = await barRepository.getMaxOrder();

      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
      expect(result).toBe(-1);
    });

    test('должен обрабатывать ошибки хранилища', async () => {
      const error = new Error('Storage error');
      mockStorageAdapter.getAll.mockRejectedValue(error);

      await expect(barRepository.getMaxOrder()).rejects.toThrow('Storage error');
      expect(mockStorageAdapter.getAll).toHaveBeenCalledWith('bars');
    });
  });

  describe('Интеграция с хранилищем', () => {
    test('должен корректно работать с реальным объектом бара', async () => {
      const bar = {
        id: 'bar-1',
        beats: 4,
        beatUnit: 4,
        chords: [
          { id: 'chord-1', name: 'C', position: 0, notes: [] },
          { id: 'chord-2', name: 'G', position: 2, notes: [] }
        ],
        templateId: 'template-1',
        order: 1
      };

      mockStorageAdapter.set.mockResolvedValue(bar);

      const result = await barRepository.save(bar);

      expect(result).toEqual(bar);
      expect(mockStorageAdapter.set).toHaveBeenCalledWith('bars', 'bar-1', bar);
    });

    test('должен корректно обрабатывать сложные запросы', async () => {
      const mockBars = [
        {
          id: 'bar-1',
          templateId: 'template-1',
          order: 1,
          beats: 4,
          beatUnit: 4,
          chords: [
            { id: 'chord-1', name: 'C', position: 0, notes: [] },
            { id: 'chord-2', name: 'Am', position: 2, notes: [] }
          ]
        },
        {
          id: 'bar-2',
          templateId: 'template-1',
          order: 2,
          beats: 3,
          beatUnit: 4,
          chords: [
            { id: 'chord-3', name: 'F', position: 0, notes: [] },
            { id: 'chord-4', name: 'G', position: 1.5, notes: [] }
          ]
        }
      ];

      mockStorageAdapter.getAll.mockResolvedValue(mockBars);

      const templateBars = await barRepository.findByTemplateId('template-1');
      const maxOrder = await barRepository.getMaxOrder();

      expect(templateBars).toHaveLength(2);
      expect(maxOrder).toBe(2);
      expect(templateBars[0].chords).toHaveLength(2);
      expect(templateBars[1].chords).toHaveLength(2);
    });
  });
});