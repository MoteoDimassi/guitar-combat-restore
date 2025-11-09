class ChordRepository {
  constructor(storageAdapter) {
    this.storageAdapter = storageAdapter;
    this.collection = 'chords';
  }

  async findAll() {
    return await this.storageAdapter.getAll(this.collection);
  }

  async findById(id) {
    return await this.storageAdapter.get(this.collection, id);
  }

  async save(chord) {
    return await this.storageAdapter.set(this.collection, chord.id, chord);
  }

  async update(id, chordData) {
    const existingChord = await this.findById(id);
    if (existingChord) {
      const updatedChord = { ...existingChord, ...chordData };
      return await this.storageAdapter.set(this.collection, id, updatedChord);
    }
    return null;
  }

  async delete(id) {
    return await this.storageAdapter.delete(this.collection, id);
  }

  async findByBarId(barId) {
    const allChords = await this.findAll();
    return allChords.filter(chord => chord.barId === barId);
  }
}

export default ChordRepository;