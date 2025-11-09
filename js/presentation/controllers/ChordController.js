class ChordController {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.selectedChord = null;
    this.selectedBar = null;
    
    this.init();
  }

  init() {
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.eventBus.on('chord:selected', (data) => {
      this.onChordSelected(data);
    });

    this.eventBus.on('bar:selected', (data) => {
      this.onBarSelected(data);
    });

    this.eventBus.on('chord:add', (data) => {
      this.onAddChord(data);
    });

    this.eventBus.on('chord:remove', (data) => {
      this.onRemoveChord(data);
    });

    this.eventBus.on('chord:update', (data) => {
      this.onUpdateChord(data);
    });

    this.eventBus.on('beat:clicked', (data) => {
      this.onBeatClicked(data);
    });
  }

  onChordSelected(data) {
    this.selectedChord = data.chordName;
    console.log('ChordController: Chord selected', data);
  }

  onBarSelected(data) {
    this.selectedBar = data.barId;
    console.log('ChordController: Bar selected', data);
  }

  async onAddChord(data) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      const chordData = {
        name: data.chordName,
        position: data.position || 0
      };
      
      const chord = await chordService.createChord(chordData);
      
      if (data.barId) {
        await barService.addChordToBar(data.barId, chord);
      }
      
      this.eventBus.emit('chord:added', { chord });
    } catch (error) {
      console.error('Failed to add chord:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось добавить аккорд',
        error 
      });
    }
  }

  async onRemoveChord(data) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      // Сначала удаляем аккорд из всех тактов
      const bars = await barService.getAllBars();
      for (const bar of bars) {
        await barService.removeChordFromBar(bar.id, data.chordId);
      }
      
      // Затем удаляем сам аккорд
      await chordService.deleteChord(data.chordId);
      
      this.eventBus.emit('chord:removed', { chordId: data.chordId });
    } catch (error) {
      console.error('Failed to remove chord:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось удалить аккорд',
        error 
      });
    }
  }

  async onUpdateChord(data) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      
      const updatedChord = await chordService.updateChord(data.chordId, data.chordData);
      
      this.eventBus.emit('chord:updated', { chord: updatedChord });
    } catch (error) {
      console.error('Failed to update chord:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось обновить аккорд',
        error 
      });
    }
  }

  onBeatClicked(data) {
    if (!this.selectedChord) {
      console.warn('No chord selected');
      return;
    }
    
    if (!this.selectedBar) {
      console.warn('No bar selected');
      return;
    }
    
    this.addChordToBeat(this.selectedBar, this.selectedChord, data.beat);
  }

  async addChordToBeat(barId, chordName, beatPosition) {
    try {
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      // Проверяем, есть ли уже аккорд на этой позиции
      const bar = await barService.getBarById(barId);
      const existingChord = bar.chords.find(chord => chord.position === beatPosition);
      
      if (existingChord) {
        // Обновляем существующий аккорд
        await chordService.updateChord(existingChord.id, { name: chordName });
        this.eventBus.emit('chord:updated', { 
          chord: { ...existingChord, name: chordName } 
        });
      } else {
        // Создаем новый аккорд
        const chordData = {
          name: chordName,
          position: beatPosition
        };
        
        const chord = await chordService.createChord(chordData);
        await barService.addChordToBar(barId, chord);
        
        this.eventBus.emit('chord:added', { chord });
      }
      
      // Обновляем отображение такта
      const updatedBar = await barService.getBarById(barId);
      this.eventBus.emit('bar:updated', { bar: updatedBar });
    } catch (error) {
      console.error('Failed to add chord to beat:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось добавить аккорд на долю',
        error 
      });
    }
  }

  async removeChordFromBeat(barId, beatPosition) {
    try {
      const barService = this.serviceContainer.get('barService');
      const chordService = this.serviceContainer.get('chordService');
      
      const bar = await barService.getBarById(barId);
      const chordToRemove = bar.chords.find(chord => chord.position === beatPosition);
      
      if (chordToRemove) {
        await barService.removeChordFromBar(barId, chordToRemove.id);
        await chordService.deleteChord(chordToRemove.id);
        
        this.eventBus.emit('chord:removed', { chordId: chordToRemove.id });
        
        // Обновляем отображение такта
        const updatedBar = await barService.getBarById(barId);
        this.eventBus.emit('bar:updated', { bar: updatedBar });
      }
    } catch (error) {
      console.error('Failed to remove chord from beat:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось удалить аккорд с доли',
        error 
      });
    }
  }

  getSelectedChord() {
    return this.selectedChord;
  }

  getSelectedBar() {
    return this.selectedBar;
  }

  setSelectedChord(chordName) {
    this.selectedChord = chordName;
  }

  setSelectedBar(barId) {
    this.selectedBar = barId;
  }

  destroy() {
    this.eventBus.off('chord:selected');
    this.eventBus.off('bar:selected');
    this.eventBus.off('chord:add');
    this.eventBus.off('chord:remove');
    this.eventBus.off('chord:update');
    this.eventBus.off('beat:clicked');
  }
}

export default ChordController;