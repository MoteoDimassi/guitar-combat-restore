class PlayStatus {
  constructor() {
    this.isPlaying = false;
    this.currentBar = 0;
    this.currentBeat = 0;
    this.tempo = 120;
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  stop() {
    this.isPlaying = false;
    this.currentBar = 0;
    this.currentBeat = 0;
  }

  setCurrentBar(bar) {
    this.currentBar = bar;
  }

  setCurrentBeat(beat) {
    this.currentBeat = beat;
  }

  setTempo(tempo) {
    this.tempo = tempo;
  }

  getTempo() {
    return this.tempo;
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }
}

export default PlayStatus;