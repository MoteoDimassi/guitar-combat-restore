class BarRepository {
  constructor(storageAdapter) {
    if (!storageAdapter) {
      throw new Error('Storage adapter is required');
    }
    this.storageAdapter = storageAdapter;
    this.collection = 'bars';
  }

  async findAll() {
    return await this.storageAdapter.getAll(this.collection);
  }

  async findById(id) {
    return await this.storageAdapter.get(this.collection, id);
  }

  async save(bar) {
    return await this.storageAdapter.set(this.collection, bar.id, bar);
  }

  async update(id, barData) {
    const existingBar = await this.findById(id);
    if (existingBar) {
      const updatedBar = { ...existingBar, ...barData };
      return await this.storageAdapter.set(this.collection, id, updatedBar);
    }
    return null;
  }

  async delete(id) {
    return await this.storageAdapter.delete(this.collection, id);
  }

  async findByTemplateId(templateId) {
    const allBars = await this.findAll();
    return allBars.filter(bar => bar.templateId === templateId);
  }

  async getMaxOrder() {
    const allBars = await this.findAll();
    if (allBars.length === 0) return 0;
    return Math.max(...allBars.map(bar => bar.order || 0));
  }
}

export default BarRepository;