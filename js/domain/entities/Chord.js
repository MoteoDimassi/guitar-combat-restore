class Chord {
  constructor(id, name, position = 0) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.notes = [];
  }

  addNote(note) {
    this.notes.push(note);
  }

  removeNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
  }

  getNotes() {
    return this.notes;
  }

  setNotes(notes) {
    this.notes = notes;
  }
}

export default Chord;