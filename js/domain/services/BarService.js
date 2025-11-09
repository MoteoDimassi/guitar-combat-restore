class BarService {
  constructor(barRepository) {
    this.barRepository = barRepository;
  }

  async getAllBars() {
    return await this.barRepository.findAll();
  }

  async getBarById(id) {
    return await this.barRepository.findById(id);
  }

  async createBar(barData) {
    const bar = {
      id: this.generateId(),
      chords: [],
      ...barData
    };
    return await this.barRepository.save(bar);
  }

  async updateBar(id, barData) {
    return await this.barRepository.update(id, barData);
  }

  async deleteBar(id) {
    return await this.barRepository.delete(id);
  }

  async addChordToBar(barId, chord) {
    const bar = await this.getBarById(barId);
    if (bar) {
      bar.chords.push(chord);
      return await this.updateBar(barId, bar);
    }
    return null;
  }

  async removeChordFromBar(barId, chordId) {
    const bar = await this.getBarById(barId);
    if (bar) {
      bar.chords = bar.chords.filter(chord => chord.id !== chordId);
      return await this.updateBar(barId, bar);
    }
    return null;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default BarService;