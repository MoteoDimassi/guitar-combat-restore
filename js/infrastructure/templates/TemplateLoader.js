class TemplateLoader {
  constructor() {
    this.templates = new Map();
    this.defaultTemplates = [
      {
        id: 'basic-4-4',
        name: 'Basic 4/4',
        description: 'Simple 4/4 time signature template',
        beats: 4,
        beatUnit: 4,
        bars: [
          { id: 'bar-1', chords: [] },
          { id: 'bar-2', chords: [] },
          { id: 'bar-3', chords: [] },
          { id: 'bar-4', chords: [] }
        ]
      },
      {
        id: 'basic-3-4',
        name: 'Basic 3/4',
        description: 'Simple 3/4 time signature template',
        beats: 3,
        beatUnit: 4,
        bars: [
          { id: 'bar-1', chords: [] },
          { id: 'bar-2', chords: [] },
          { id: 'bar-3', chords: [] },
          { id: 'bar-4', chords: [] }
        ]
      },
      {
        id: 'blues-12-bar',
        name: '12-Bar Blues',
        description: 'Standard 12-bar blues progression',
        beats: 4,
        beatUnit: 4,
        bars: [
          { id: 'bar-1', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-2', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-3', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-4', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-5', chords: [{ name: 'F7', position: 0 }] },
          { id: 'bar-6', chords: [{ name: 'F7', position: 0 }] },
          { id: 'bar-7', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-8', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-9', chords: [{ name: 'G7', position: 0 }] },
          { id: 'bar-10', chords: [{ name: 'F7', position: 0 }] },
          { id: 'bar-11', chords: [{ name: 'C7', position: 0 }] },
          { id: 'bar-12', chords: [{ name: 'G7', position: 0 }] }
        ]
      }
    ];
  }

  async loadDefaultTemplates() {
    this.defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
    return Array.from(this.templates.values());
  }

  async loadTemplate(id) {
    return this.templates.get(id) || null;
  }

  async loadAllTemplates() {
    return Array.from(this.templates.values());
  }

  async saveTemplate(template) {
    this.templates.set(template.id, template);
    return template;
  }

  async deleteTemplate(id) {
    return this.templates.delete(id);
  }

  async loadTemplateFromFile(file) {
    try {
      const text = await file.text();
      const template = JSON.parse(text);
      
      if (!template.id || !template.name) {
        throw new Error('Invalid template format');
      }
      
      this.templates.set(template.id, template);
      return template;
    } catch (error) {
      console.error('Failed to load template from file:', error);
      throw error;
    }
  }

  async exportTemplate(id) {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with id ${id} not found`);
    }
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    return true;
  }

  getTemplateNames() {
    return Array.from(this.templates.values()).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description
    }));
  }
}

export default TemplateLoader;