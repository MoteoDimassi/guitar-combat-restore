class LoadChordsCommand {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
  }

  async execute(params = {}) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      const chords = await chordService.getAllChords();
      
      this.eventBus.emit('chords:loaded', { chords });
      
      return chords;
    } catch (error) {
      console.error('Failed to load chords:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось загрузить аккорды',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeById(chordId) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      const chord = await chordService.getChordById(chordId);
      
      if (chord) {
        this.eventBus.emit('chord:loaded', { chord });
      } else {
        this.eventBus.emit('chord:not-found', { chordId });
      }
      
      return chord;
    } catch (error) {
      console.error(`Failed to load chord ${chordId}:`, error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось загрузить аккорд',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeByBarId(barId) {
    try {
      const chordRepository = this.serviceContainer.get('chordRepository');
      const chords = await chordRepository.findByBarId(barId);
      
      this.eventBus.emit('chords:loaded-for-bar', { barId, chords });
      
      return chords;
    } catch (error) {
      console.error(`Failed to load chords for bar ${barId}:`, error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось загрузить аккорды для такта',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  validate(params) {
    // Валидация параметров команды
    if (params.chordId && typeof params.chordId !== 'string') {
      throw new Error('chordId must be a string');
    }
    
    if (params.barId && typeof params.barId !== 'string') {
      throw new Error('barId must be a string');
    }
    
    return true;
  }

  canExecute(params) {
    try {
      this.validate(params);
      return true;
    } catch (error) {
      console.error('LoadChordsCommand validation failed:', error);
      return false;
    }
  }

  getDescription() {
    return 'Load chords from storage';
  }
}

export default LoadChordsCommand;