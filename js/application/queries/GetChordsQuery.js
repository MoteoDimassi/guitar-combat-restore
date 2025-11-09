class GetChordsQuery {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
  }

  async execute(params = {}) {
    try {
      this.validate(params);
      
      const chordService = this.serviceContainer.get('chordService');
      
      let chords;
      
      if (params.chordId) {
        // Получаем конкретный аккорд
        chords = await chordService.getChordById(params.chordId);
      } else if (params.barId) {
        // Получаем аккорды для конкретного такта
        chords = await this.getChordsByBarId(params.barId);
      } else {
        // Получаем все аккорды
        chords = await chordService.getAllChords();
      }
      
      return chords;
    } catch (error) {
      console.error('Failed to get chords:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось получить аккорды',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async getChordsByBarId(barId) {
    const chordRepository = this.serviceContainer.get('chordRepository');
    return await chordRepository.findByBarId(barId);
  }

  async executeByName(chordName) {
    try {
      if (!chordName || typeof chordName !== 'string') {
        throw new Error('chordName is required and must be a string');
      }
      
      const chordService = this.serviceContainer.get('chordService');
      const allChords = await chordService.getAllChords();
      
      // Ищем аккорды по имени (может быть несколько с одинаковым именем)
      const chords = allChords.filter(chord => chord.name === chordName);
      
      return chords;
    } catch (error) {
      console.error(`Failed to get chords by name ${chordName}:`, error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось найти аккорды по имени',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeByPosition(barId, position) {
    try {
      if (!barId || typeof barId !== 'string') {
        throw new Error('barId is required and must be a string');
      }
      
      if (position === undefined || typeof position !== 'number' || position < 0) {
        throw new Error('position must be a non-negative number');
      }
      
      const chords = await this.getChordsByBarId(barId);
      
      // Ищем аккорд на конкретной позиции
      const chord = chords.find(chord => chord.position === position);
      
      return chord || null;
    } catch (error) {
      console.error(`Failed to get chord by position ${position} in bar ${barId}:`, error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось найти аккорд на указанной позиции',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeCount(params = {}) {
    try {
      const chords = await this.execute(params);
      
      if (Array.isArray(chords)) {
        return chords.length;
      } else if (chords) {
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Failed to get chords count:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось получить количество аккордов',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  validate(params) {
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
      console.error('GetChordsQuery validation failed:', error);
      return false;
    }
  }

  getDescription() {
    return 'Get chords from storage by various criteria';
  }
}

export default GetChordsQuery;