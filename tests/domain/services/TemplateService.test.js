import TemplateService from '../../../js/domain/services/TemplateService.js';

describe('TemplateService', () => {
  let templateService;
  let mockTemplateRepository;

  beforeEach(() => {
    // Создаем мок для TemplateRepository
    mockTemplateRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    templateService = new TemplateService(mockTemplateRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с TemplateRepository', () => {
      expect(templateService.templateRepository).toBe(mockTemplateRepository);
    });

    test('должен выбрасывать ошибку без TemplateRepository', () => {
      expect(() => new TemplateService(null)).toThrow('TemplateRepository is required');
    });
  });

  describe('getAllTemplates', () => {
    test('должен возвращать все шаблоны из репозитория', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Basic 4/4', bars: [] },
        { id: 'template-2', name: 'Blues 12 bar', bars: [] }
      ];
      
      mockTemplateRepository.findAll.mockResolvedValue(mockTemplates);

      const result = await templateService.getAllTemplates();

      expect(mockTemplateRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTemplates);
    });

    test('должен возвращать пустой массив при отсутствии шаблонов', async () => {
      mockTemplateRepository.findAll.mockResolvedValue([]);

      const result = await templateService.getAllTemplates();

      expect(mockTemplateRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки репозитория', async () => {
      const error = new Error('Repository error');
      mockTemplateRepository.findAll.mockRejectedValue(error);

      await expect(templateService.getAllTemplates()).rejects.toThrow('Repository error');
      expect(mockTemplateRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getTemplateById', () => {
    test('должен возвращать шаблон по ID', async () => {
      const mockTemplate = { id: 'template-1', name: 'Basic 4/4', bars: [] };
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await templateService.getTemplateById('template-1');

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('template-1');
      expect(result).toEqual(mockTemplate);
    });

    test('должен возвращать null при отсутствии шаблона', async () => {
      mockTemplateRepository.findById.mockResolvedValue(null);

      const result = await templateService.getTemplateById('nonexistent');

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки репозитория', async () => {
      const error = new Error('Repository error');
      mockTemplateRepository.findById.mockRejectedValue(error);

      await expect(templateService.getTemplateById('template-1')).rejects.toThrow('Repository error');
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('template-1');
    });
  });

  describe('createTemplate', () => {
    test('должен создавать новый шаблон с базовыми данными', async () => {
      const templateData = { name: 'Custom Template', bars: [] };
      const expectedTemplate = {
        id: expect.any(String),
        name: 'Custom Template',
        bars: [],
        createdAt: expect.any(String)
      };
      
      mockTemplateRepository.save.mockResolvedValue(expectedTemplate);

      const result = await templateService.createTemplate(templateData);

      expect(mockTemplateRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        name: 'Custom Template',
        bars: [],
        createdAt: expect.any(String)
      }));
      expect(result).toEqual(expectedTemplate);
    });

    test('должен создавать шаблон с дополнительными данными', async () => {
      const templateData = { 
        name: 'Complex Template',
        bars: [
          { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
          { id: 'bar-2', beats: 3, beatUnit: 4, chords: [] }
        ],
        description: 'A complex template',
        genre: 'Rock'
      };
      const expectedTemplate = {
        id: expect.any(String),
        name: 'Complex Template',
        bars: templateData.bars,
        description: 'A complex template',
        genre: 'Rock',
        createdAt: expect.any(String)
      };
      
      mockTemplateRepository.save.mockResolvedValue(expectedTemplate);

      const result = await templateService.createTemplate(templateData);

      expect(mockTemplateRepository.save).toHaveBeenCalledWith(expect.objectContaining(expectedTemplate));
      expect(result).toEqual(expectedTemplate);
    });

    test('должен генерировать уникальный ID для каждого шаблона', async () => {
      const templateData1 = { name: 'Template 1', bars: [] };
      const templateData2 = { name: 'Template 2', bars: [] };
      
      mockTemplateRepository.save
        .mockResolvedValueOnce({ id: 'generated-id-1', ...templateData1 })
        .mockResolvedValueOnce({ id: 'generated-id-2', ...templateData2 });

      const result1 = await templateService.createTemplate(templateData1);
      const result2 = await templateService.createTemplate(templateData2);

      expect(result1.id).toBe('generated-id-1');
      expect(result2.id).toBe('generated-id-2');
      expect(result1.id).not.toBe(result2.id);
    });

    test('должен устанавливать createdAt в формате ISO', async () => {
      const templateData = { name: 'Test Template', bars: [] };
      const mockTemplate = { id: 'test-id', ...templateData };
      
      mockTemplateRepository.save.mockImplementation((template) => {
        return Promise.resolve(template);
      });

      const result = await templateService.createTemplate(templateData);

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('должен обрабатывать ошибки при сохранении', async () => {
      const templateData = { name: 'Test Template', bars: [] };
      const error = new Error('Save error');
      mockTemplateRepository.save.mockRejectedValue(error);

      await expect(templateService.createTemplate(templateData)).rejects.toThrow('Save error');
    });
  });

  describe('updateTemplate', () => {
    test('должен обновлять существующий шаблон', async () => {
      const updateData = { name: 'Updated Template', description: 'New description' };
      const expectedUpdatedTemplate = { 
        id: 'template-1', 
        name: 'Updated Template', 
        description: 'New description',
        updatedAt: expect.any(String)
      };
      
      mockTemplateRepository.update.mockResolvedValue(expectedUpdatedTemplate);

      const result = await templateService.updateTemplate('template-1', updateData);

      expect(mockTemplateRepository.update).toHaveBeenCalledWith('template-1', {
        name: 'Updated Template',
        description: 'New description',
        updatedAt: expect.any(String)
      });
      expect(result).toEqual(expectedUpdatedTemplate);
    });

    test('должен возвращать null при обновлении несуществующего шаблона', async () => {
      const updateData = { name: 'Updated Template' };
      mockTemplateRepository.update.mockResolvedValue(null);

      const result = await templateService.updateTemplate('nonexistent', updateData);

      expect(mockTemplateRepository.update).toHaveBeenCalledWith('nonexistent', {
        ...updateData,
        updatedAt: expect.any(String)
      });
      expect(result).toBeNull();
    });

    test('должен обрабатывать ошибки при обновлении', async () => {
      const error = new Error('Update error');
      mockTemplateRepository.update.mockRejectedValue(error);

      await expect(templateService.updateTemplate('template-1', { name: 'Updated' })).rejects.toThrow('Update error');
      expect(mockTemplateRepository.update).toHaveBeenCalledWith('template-1', {
        name: 'Updated',
        updatedAt: expect.any(String)
      });
    });
  });

  describe('deleteTemplate', () => {
    test('должен удалять шаблон по ID', async () => {
      mockTemplateRepository.delete.mockResolvedValue(true);

      const result = await templateService.deleteTemplate('template-1');

      expect(mockTemplateRepository.delete).toHaveBeenCalledWith('template-1');
      expect(result).toBe(true);
    });

    test('должен возвращать false при удалении несуществующего шаблона', async () => {
      mockTemplateRepository.delete.mockResolvedValue(false);

      const result = await templateService.deleteTemplate('nonexistent');

      expect(mockTemplateRepository.delete).toHaveBeenCalledWith('nonexistent');
      expect(result).toBe(false);
    });

    test('должен обрабатывать ошибки при удалении', async () => {
      const error = new Error('Delete error');
      mockTemplateRepository.delete.mockRejectedValue(error);

      await expect(templateService.deleteTemplate('template-1')).rejects.toThrow('Delete error');
      expect(mockTemplateRepository.delete).toHaveBeenCalledWith('template-1');
    });
  });

  describe('applyTemplate', () => {
    test('должен применять существующий шаблон', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Basic 4/4',
        bars: [
          { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
          { id: 'bar-2', beats: 4, beatUnit: 4, chords: [] }
        ]
      };
      
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await templateService.applyTemplate('template-1');

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('template-1');
      expect(result).toEqual(mockTemplate.bars);
    });

    test('должен возвращать null при применении несуществующего шаблона', async () => {
      mockTemplateRepository.findById.mockResolvedValue(null);

      const result = await templateService.applyTemplate('nonexistent');

      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });

    test('должен возвращать пустой массив для шаблона без баров', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Empty Template',
        bars: []
      };
      
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await templateService.applyTemplate('template-1');

      expect(result).toEqual([]);
    });

    test('должен обрабатывать ошибки при применении шаблона', async () => {
      const error = new Error('Repository error');
      mockTemplateRepository.findById.mockRejectedValue(error);

      await expect(templateService.applyTemplate('template-1')).rejects.toThrow('Repository error');
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('template-1');
    });
  });

  describe('generateId', () => {
    test('должен генерировать уникальные ID', () => {
      const id1 = templateService.generateId();
      const id2 = templateService.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });

    test('должен генерировать ID в ожидаемом формате', () => {
      const id = templateService.generateId();
      
      // ID должен содержать timestamp и случайную строку
      expect(id).toMatch(/^[a-z0-9]+$/i);
    });

    test('должен генерировать разные ID при быстрых вызовах', () => {
      const ids = [];
      
      for (let i = 0; i < 10; i++) {
        ids.push(templateService.generateId());
      }
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Интеграционные сценарии', () => {
    test('должен корректно обрабатывать полный жизненный цикл шаблона', async () => {
      // Создание шаблона
      const templateData = { 
        name: 'Test Template',
        bars: [
          { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }
        ]
      };
      const createdTemplate = { 
        id: 'template-1', 
        ...templateData,
        createdAt: '2023-01-01T00:00:00.000Z'
      };
      mockTemplateRepository.save.mockResolvedValue(createdTemplate);

      const template = await templateService.createTemplate(templateData);
      expect(template.id).toBe('template-1');

      // Получение шаблона
      mockTemplateRepository.findById.mockResolvedValue(createdTemplate);
      const retrievedTemplate = await templateService.getTemplateById('template-1');
      expect(retrievedTemplate.id).toBe('template-1');

      // Применение шаблона
      const result = await templateService.applyTemplate('template-1');
      expect(result).toEqual(templateData.bars);

      // Обновление шаблона
      const updateData = { name: 'Updated Template', description: 'New description' };
      const updatedTemplate = { 
        ...createdTemplate, 
        ...updateData,
        updatedAt: '2023-01-02T00:00:00.000Z'
      };
      mockTemplateRepository.update.mockResolvedValue(updatedTemplate);

      const updateResult = await templateService.updateTemplate('template-1', updateData);
      expect(updateResult.name).toBe('Updated Template');
      expect(updateResult.description).toBe('New description');

      // Удаление шаблона
      mockTemplateRepository.delete.mockResolvedValue(true);
      const deleteResult = await templateService.deleteTemplate('template-1');
      expect(deleteResult).toBe(true);
    });

    test('должен корректно работать со сложными структурами шаблонов', async () => {
      const complexTemplateData = {
        name: 'Complex Rock Template',
        description: 'A complex rock pattern with multiple bars',
        genre: 'Rock',
        difficulty: 'Intermediate',
        bars: [
          {
            id: 'bar-1',
            beats: 4,
            beatUnit: 4,
            chords: [
              { id: 'chord-1', name: 'C', position: 0, notes: [] },
              { id: 'chord-2', name: 'G', position: 2, notes: [] }
            ]
          },
          {
            id: 'bar-2',
            beats: 4,
            beatUnit: 4,
            chords: [
              { id: 'chord-3', name: 'Am', position: 0, notes: [] },
              { id: 'chord-4', name: 'F', position: 2, notes: [] }
            ]
          }
        ]
      };

      const createdTemplate = {
        id: 'complex-template',
        ...complexTemplateData,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockTemplateRepository.save.mockResolvedValue(createdTemplate);
      mockTemplateRepository.findById.mockResolvedValue(createdTemplate);

      const template = await templateService.createTemplate(complexTemplateData);
      expect(template.bars).toHaveLength(2);
      expect(template.bars[0].chords).toHaveLength(2);
      expect(template.bars[1].chords).toHaveLength(2);

      const appliedBars = await templateService.applyTemplate('complex-template');
      expect(appliedBars).toHaveLength(2);
      expect(appliedBars[0].chords[0].name).toBe('C');
      expect(appliedBars[1].chords[1].name).toBe('F');
    });

    test('должен корректно обрабатывать пустые и минимальные шаблоны', async () => {
      const minimalTemplateData = {
        name: 'Minimal Template',
        bars: []
      };

      const createdTemplate = {
        id: 'minimal-template',
        ...minimalTemplateData,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockTemplateRepository.save.mockResolvedValue(createdTemplate);
      mockTemplateRepository.findById.mockResolvedValue(createdTemplate);

      const template = await templateService.createTemplate(minimalTemplateData);
      expect(template.bars).toEqual([]);

      const appliedBars = await templateService.applyTemplate('minimal-template');
      expect(appliedBars).toEqual([]);
    });

    test('должен корректно обрабатывать шаблоны с одним баром', async () => {
      const singleBarTemplateData = {
        name: 'Single Bar Template',
        bars: [
          {
            id: 'bar-1',
            beats: 4,
            beatUnit: 4,
            chords: [
              { id: 'chord-1', name: 'C', position: 0, notes: [] }
            ]
          }
        ]
      };

      const createdTemplate = {
        id: 'single-bar-template',
        ...singleBarTemplateData,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockTemplateRepository.save.mockResolvedValue(createdTemplate);
      mockTemplateRepository.findById.mockResolvedValue(createdTemplate);

      const template = await templateService.createTemplate(singleBarTemplateData);
      expect(template.bars).toHaveLength(1);

      const appliedBars = await templateService.applyTemplate('single-bar-template');
      expect(appliedBars).toHaveLength(1);
      expect(appliedBars[0].chords).toHaveLength(1);
    });
  });
});