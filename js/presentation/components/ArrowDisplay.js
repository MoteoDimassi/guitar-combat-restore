class ArrowDisplay {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.arrows = [];
    this.currentBeat = 0;
    this.isPlaying = false;
  }

  async initialize() {
    if (!this.container) {
      console.warn('ArrowDisplay: Container not found');
      return;
    }
    
    this.init();
    this.subscribeToEvents();
  }

  init() {
    this.container.innerHTML = `
      <div class="arrow-display">
        <div class="arrow-container">
          <div class="arrow arrow-1" data-beat="0">↓</div>
          <div class="arrow arrow-2" data-beat="1">↓</div>
          <div class="arrow arrow-3" data-beat="2">↓</div>
          <div class="arrow arrow-4" data-beat="3">↓</div>
        </div>
      </div>
    `;
    
    this.arrows = this.container.querySelectorAll('.arrow');
    this.updateArrows();
  }

  subscribeToEvents() {
    this.eventBus.on('playback:started', () => {
      this.isPlaying = true;
    });

    this.eventBus.on('playback:stopped', () => {
      this.isPlaying = false;
      this.currentBeat = 0;
      this.updateArrows();
    });

    this.eventBus.on('playback:beat', (data) => {
      this.currentBeat = data.beat;
      this.updateArrows();
    });

    this.eventBus.on('playback:bar', (data) => {
      this.currentBeat = 0;
      this.updateArrows();
    });
  }

  updateArrows() {
    this.arrows.forEach((arrow, index) => {
      if (index === this.currentBeat && this.isPlaying) {
        arrow.classList.add('active');
      } else {
        arrow.classList.remove('active');
      }
    });
  }

  setCurrentBeat(beat) {
    this.currentBeat = beat;
    this.updateArrows();
  }

  setPlaying(isPlaying) {
    this.isPlaying = isPlaying;
    this.updateArrows();
  }

  reset() {
    this.currentBeat = 0;
    this.isPlaying = false;
    this.updateArrows();
  }

  destroy() {
    this.eventBus.off('playback:started');
    this.eventBus.off('playback:stopped');
    this.eventBus.off('playback:beat');
    this.eventBus.off('playback:bar');
    this.container.innerHTML = '';
  }
}

export default ArrowDisplay;