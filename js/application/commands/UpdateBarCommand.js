class UpdateBarCommand {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
  }

  async execute(params) {
    try {
      this.validate(params);
      
      const { barId, barData } = params;
      const barService = this.serviceContainer.get('barService');
      
      const updatedBar = await barService.updateBar(barId, barData);
      
      if (updatedBar) {
        this.eventBus.emit('bar:updated', { bar: updatedBar });
        return updatedBar;
      } else {
        this.eventBus.emit('bar:update-failed', { barId, reason: 'Bar not found' });
        throw new Error(`Bar with id ${barId} not found`);
      }
    } catch (error) {
      console.error('Failed to update bar:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось обновить такт',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async addChord(params) {
    try {
      this.validateChordParams(params);
      
      const { barId, chordName, position } = params;
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      // Создаем новый аккорд
      const chordData = {
        name: chordName,
        position: position || 0
      };
      
      const chord = await chordService.createChord(chordData);
      
      // Добавляем аккорд к такту
      const updatedBar = await barService.addChordToBar(barId, chord);
      
      this.eventBus.emit('chord:added', { chord });
      this.eventBus.emit('bar:updated', { bar: updatedBar });
      
      return { chord, bar: updatedBar };
    } catch (error) {
      console.error('Failed to add chord to bar:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось добавить аккорд в такт',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async removeChord(params) {
    try {
      this.validateChordParams(params);
      
      const { barId, chordId } = params;
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      // Удаляем аккорд из такта
      const updatedBar = await barService.removeChordFromBar(barId, chordId);
      
      // Удаляем сам аккорд
      await chordService.deleteChord(chordId);
      
      this.eventBus.emit('chord:removed', { chordId });
      this.eventBus.emit('bar:updated', { bar: updatedBar });
      
      return { bar: updatedBar };
    } catch (error) {
      console.error('Failed to remove chord from bar:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось удалить аккорд из такта',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async updateChord(params) {
    try {
      this.validateChordParams(params);
      
      const { chordId, chordData } = params;
      const chordService = this.serviceContainer.get('chordService');
      
      const updatedChord = await chordService.updateChord(chordId, chordData);
      
      if (updatedChord) {
        this.eventBus.emit('chord:updated', { chord: updatedChord });
        return updatedChord;
      } else {
        this.eventBus.emit('chord:update-failed', { chordId, reason: 'Chord not found' });
        throw new Error(`Chord with id ${chordId} not found`);
      }
    } catch (error) {
      console.error('Failed to update chord:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось обновить аккорд',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  validate(params) {
    if (!params.barId || typeof params.barId !== 'string') {
      throw new Error('barId is required and must be a string');
    }
    
    if (!params.barData || typeof params.barData !== 'object') {
      throw new Error('barData is required and must be an object');
    }
    
    return true;
  }

  validateChordParams(params) {
    if (!params.barId || typeof params.barId !== 'string') {
      throw new Error('barId is required and must be a string');
    }
    
    if (params.chordId && typeof params.chordId !== 'string') {
      throw new Error('chordId must be a string');
    }
    
    if (params.chordName && typeof params.chordName !== 'string') {
      throw new Error('chordName must be a string');
    }
    
    if (params.position !== undefined && (typeof params.position !== 'number' || params.position < 0)) {
      throw new Error('position must be a non-negative number');
    }
    
    return true;
  }

  canExecute(params) {
    try {
      this.validate(params);
      return true;
    } catch (error) {
      console.error('UpdateBarCommand validation failed:', error);
      return false;
    }
  }

  canExecuteChord(params) {
    try {
      this.validateChordParams(params);
      return true;
    } catch (error) {
      console.error('UpdateBarCommand chord validation failed:', error);
      return false;
    }
  }

  getDescription() {
    return 'Update bar and manage chords within the bar';
  }
}

export default UpdateBarCommand;