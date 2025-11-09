class ChordService {
  constructor(chordRepository) {
    this.chordRepository = chordRepository;
  }

  async getAllChords() {
    return await this.chordRepository.findAll();
  }

  async getChordById(id) {
    return await this.chordRepository.findById(id);
  }

  async createChord(chordData) {
    const chord = {
      id: this.generateId(),
      ...chordData
    };
    return await this.chordRepository.save(chord);
  }

  async updateChord(id, chordData) {
    return await this.chordRepository.update(id, chordData);
  }

  async deleteChord(id) {
    return await this.chordRepository.delete(id);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ChordService;