class TemplateService {
  constructor(templateRepository) {
    if (!templateRepository) {
      throw new Error('TemplateRepository is required');
    }
    this.templateRepository = templateRepository;
  }

  async getAllTemplates() {
    return await this.templateRepository.findAll();
  }

  async getTemplateById(id) {
    return await this.templateRepository.findById(id);
  }

  async createTemplate(templateData) {
    const template = {
      id: this.generateId(),
      name: templateData.name,
      bars: templateData.bars || [],
      createdAt: new Date().toISOString(),
      ...templateData
    };
    return await this.templateRepository.save(template);
  }

  async updateTemplate(id, templateData) {
    return await this.templateRepository.update(id, {
      ...templateData,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteTemplate(id) {
    return await this.templateRepository.delete(id);
  }

  async applyTemplate(templateId) {
    const template = await this.getTemplateById(templateId);
    if (template) {
      // Здесь будет логика применения шаблона
      return template.bars;
    }
    return null;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default TemplateService;