class Bar {
  constructor(id, beats = 4, beatUnit = 4) {
    this.id = id;
    this.beats = beats;
    this.beatUnit = beatUnit;
    this.chords = [];
  }

  addChord(chord) {
    this.chords.push(chord);
  }

  removeChord(chordId) {
    this.chords = this.chords.filter(chord => chord.id !== chordId);
  }

  getChordByPosition(position) {
    return this.chords.find(chord => chord.position === position);
  }
}

export default Bar;