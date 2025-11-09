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

  async processChordsInput(chordsString) {
    // Разбиваем строку на отдельные аккорды
    const chordNames = chordsString.split(/\s+/).filter(name => name.trim());
    
    const validChords = [];
    const invalidChords = [];
    
    // Проверяем каждый аккорд
    for (const chordName of chordNames) {
      if (this.isValidChord(chordName)) {
        validChords.push({
          name: chordName,
          id: this.generateId()
        });
      } else {
        invalidChords.push(chordName);
      }
    }
    
    return {
      validChords,
      invalidChords,
      totalChords: chordNames.length
    };
  }

  isValidChord(chordName) {
    // Базовая проверка на валидность аккорда
    const validChords = [
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
      'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
      'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7', 'A#7', 'B7'
    ];
    
    return validChords.includes(chordName);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ChordService;