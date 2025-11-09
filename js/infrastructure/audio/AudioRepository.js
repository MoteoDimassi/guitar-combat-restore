class AudioRepository {
  constructor(audioPlayer) {
    this.audioPlayer = audioPlayer;
    this.audioFiles = {
      'C1': 'audio/NotesMP3/C1.mp3',
      'C#1': 'audio/NotesMP3/C#1.mp3',
      'D1': 'audio/NotesMP3/D1.mp3',
      'D#1': 'audio/NotesMP3/D#1.mp3',
      'E1': 'audio/NotesMP3/E1.mp3',
      'F1': 'audio/NotesMP3/F1.mp3',
      'F#1': 'audio/NotesMP3/F#1.mp3',
      'G1': 'audio/NotesMP3/G1.mp3',
      'G#1': 'audio/NotesMP3/G#1.mp3',
      'A1': 'audio/NotesMP3/A1.mp3',
      'A#1': 'audio/NotesMP3/A#1.mp3',
      'B1': 'audio/NotesMP3/B1.mp3',
      'C2': 'audio/NotesMP3/C2.mp3',
      'C#2': 'audio/NotesMP3/C#2.mp3',
      'D2': 'audio/NotesMP3/D2.mp3',
      'D#2': 'audio/NotesMP3/D#2.mp3',
      'E2': 'audio/NotesMP3/E2.mp3',
      'F2': 'audio/NotesMP3/F2.mp3',
      'F#2': 'audio/NotesMP3/F#2.mp3',
      'G2': 'audio/NotesMP3/G2.mp3',
      'G#2': 'audio/NotesMP3/G#2.mp3',
      'A2': 'audio/NotesMP3/A2.mp3',
      'A#2': 'audio/NotesMP3/A#2.mp3',
      'B2': 'audio/NotesMP3/B2.mp3',
      'E3': 'audio/NotesMP3/E3.mp3',
      'F3': 'audio/NotesMP3/F3.mp3',
      'F#3': 'audio/NotesMP3/F#3.mp3',
      'G3': 'audio/NotesMP3/G3.mp3',
      'G#3': 'audio/NotesMP3/G#3.mp3',
      'Mute': 'audio/NotesMP3/Mute.mp3'
    };
  }

  async loadAllSounds() {
    const loadPromises = Object.entries(this.audioFiles).map(async ([note, path]) => {
      try {
        await this.audioPlayer.loadSound(note, path);
        return { note, success: true };
      } catch (error) {
        console.error(`Failed to load ${note}:`, error);
        return { note, success: false, error };
      }
    });

    const results = await Promise.all(loadPromises);
    const failed = results.filter(result => !result.success);
    
    if (failed.length > 0) {
      console.warn(`Failed to load ${failed.length} sounds:`, failed);
    }
    
    return results;
  }

  async loadSound(note) {
    const path = this.audioFiles[note];
    if (!path) {
      throw new Error(`Audio file for note ${note} not found`);
    }
    
    return await this.audioPlayer.loadSound(note, path);
  }

  playNote(note, volume = 1.0, when = 0) {
    return this.audioPlayer.playSound(note, volume, when);
  }

  playChord(notes, volume = 1.0, when = 0) {
    return this.audioPlayer.playChord(notes, volume, when);
  }

  getAvailableNotes() {
    return Object.keys(this.audioFiles);
  }

  hasNote(note) {
    return note in this.audioFiles;
  }
}

export default AudioRepository;