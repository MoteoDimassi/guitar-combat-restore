class TemplateRepository {
  constructor(storageAdapter, templateLoader) {
    this.storageAdapter = storageAdapter;
    this.templateLoader = templateLoader;
    this.collection = 'templates';
  }

  async findAll() {
    try {
      const storedTemplates = await this.storageAdapter.getAll(this.collection);
      const defaultTemplates = await this.templateLoader.loadAllTemplates();
      
      // Объединяем сохраненные шаблоны с шаблонами по умолчанию
      // Сохраненные шаблоны имеют приоритет
      const templateMap = new Map();
      
      // Сначала добавляем шаблоны по умолчанию
      defaultTemplates.forEach(template => {
        templateMap.set(template.id, template);
      });
      
      // Затем добавляем сохраненные шаблоны (переписывая шаблоны по умолчанию с тем же ID)
      storedTemplates.forEach(template => {
        templateMap.set(template.id, template);
      });
      
      return Array.from(templateMap.values());
    } catch (error) {
      console.error('Failed to find all templates:', error);
      return await this.templateLoader.loadAllTemplates();
    }
  }

  async findById(id) {
    try {
      // Сначала ищем в сохраненных шаблонах
      let template = await this.storageAdapter.get(this.collection, id);
      
      // Если не найдено, ищем в шаблонах по умолчанию
      if (!template) {
        template = await this.templateLoader.loadTemplate(id);
      }
      
      return template;
    } catch (error) {
      console.error(`Failed to find template by id ${id}:`, error);
      return null;
    }
  }

  async save(template) {
    try {
      // Сохраняем только пользовательские шаблоны
      // Шаблоны по умолчанию не сохраняются в хранилище
      if (!this.isDefaultTemplate(template.id)) {
        return await this.storageAdapter.set(this.collection, template.id, template);
      }
      return template;
    } catch (error) {
      console.error(`Failed to save template ${template.id}:`, error);
      throw error;
    }
  }

  async update(id, templateData) {
    try {
      const existingTemplate = await this.findById(id);
      if (existingTemplate) {
        const updatedTemplate = { ...existingTemplate, ...templateData };
        
        // Если это шаблон по умолчанию, создаем его копию с новым ID
        if (this.isDefaultTemplate(id)) {
          updatedTemplate.id = this.generateId();
          updatedTemplate.isCustom = true;
        }
        
        return await this.storageAdapter.set(this.collection, updatedTemplate.id, updatedTemplate);
      }
      return null;
    } catch (error) {
      console.error(`Failed to update template ${id}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      // Нельзя удалять шаблоны по умолчанию
      if (this.isDefaultTemplate(id)) {
        throw new Error('Cannot delete default template');
      }
      
      return await this.storageAdapter.delete(this.collection, id);
    } catch (error) {
      console.error(`Failed to delete template ${id}:`, error);
      throw error;
    }
  }

  isDefaultTemplate(id) {
    const defaultTemplateIds = ['basic-4-4', 'basic-3-4', 'blues-12-bar'];
    return defaultTemplateIds.includes(id);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async exportTemplate(id) {
    try {
      return await this.templateLoader.exportTemplate(id);
    } catch (error) {
      console.error(`Failed to export template ${id}:`, error);
      throw error;
    }
  }

  async importTemplate(file) {
    try {
      const template = await this.templateLoader.loadTemplateFromFile(file);
      
      // Если это шаблон по умолчанию, создаем его копию с новым ID
      if (this.isDefaultTemplate(template.id)) {
        template.id = this.generateId();
        template.isCustom = true;
      }
      
      return await this.save(template);
    } catch (error) {
      console.error('Failed to import template:', error);
      throw error;
    }
  }
}

export default TemplateRepository;