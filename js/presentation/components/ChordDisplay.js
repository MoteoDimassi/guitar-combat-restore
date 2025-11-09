class ChordDisplay {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.chords = [];
    this.selectedChord = null;
    
    this.init();
    this.subscribeToEvents();
  }

  init() {
    this.container.innerHTML = `
      <div class="chord-display">
        <div class="chord-selector">
          <label for="chord-select">Выберите аккорд:</label>
          <select id="chord-select" class="chord-select">
            <option value="">-- Выберите аккорд --</option>
            <option value="C">C</option>
            <option value="C#">C#</option>
            <option value="D">D</option>
            <option value="D#">D#</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="F#">F#</option>
            <option value="G">G</option>
            <option value="G#">G#</option>
            <option value="A">A</option>
            <option value="A#">A#</option>
            <option value="B">B</option>
          </select>
        </div>
        <div class="chord-list">
          <h3>Текущие аккорды:</h3>
          <ul class="chord-items"></ul>
        </div>
      </div>
    `;
    
    this.chordSelect = this.container.querySelector('#chord-select');
    this.chordList = this.container.querySelector('.chord-items');
    
    this.chordSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.selectChord(e.target.value);
      }
    });
  }

  subscribeToEvents() {
    this.eventBus.on('chords:loaded', (data) => {
      this.updateChordList(data.chords);
    });

    this.eventBus.on('chord:added', (data) => {
      this.addChordToList(data.chord);
    });

    this.eventBus.on('chord:removed', (data) => {
      this.removeChordFromList(data.chordId);
    });

    this.eventBus.on('chord:selected', (data) => {
      this.highlightChord(data.chordId);
    });
  }

  selectChord(chordName) {
    this.selectedChord = chordName;
    this.eventBus.emit('chord:selected', { chordName });
  }

  updateChordList(chords) {
    this.chords = chords;
    this.renderChordList();
  }

  addChordToList(chord) {
    this.chords.push(chord);
    this.renderChordList();
  }

  removeChordFromList(chordId) {
    this.chords = this.chords.filter(chord => chord.id !== chordId);
    this.renderChordList();
  }

  highlightChord(chordId) {
    const chordElements = this.chordList.querySelectorAll('.chord-item');
    chordElements.forEach(element => {
      element.classList.remove('selected');
      if (element.dataset.chordId === chordId) {
        element.classList.add('selected');
      }
    });
  }

  renderChordList() {
    this.chordList.innerHTML = '';
    
    this.chords.forEach(chord => {
      const chordItem = document.createElement('li');
      chordItem.className = 'chord-item';
      chordItem.dataset.chordId = chord.id;
      chordItem.innerHTML = `
        <span class="chord-name">${chord.name}</span>
        <button class="remove-chord" data-chord-id="${chord.id}">Удалить</button>
      `;
      
      const removeButton = chordItem.querySelector('.remove-chord');
      removeButton.addEventListener('click', () => {
        this.eventBus.emit('chord:remove', { chordId: chord.id });
      });
      
      chordItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-chord')) {
          this.eventBus.emit('chord:selected', { chordId: chord.id });
        }
      });
      
      this.chordList.appendChild(chordItem);
    });
  }

  getSelectedChord() {
    return this.selectedChord;
  }

  clearSelection() {
    this.selectedChord = null;
    this.chordSelect.value = '';
  }

  destroy() {
    this.eventBus.off('chords:loaded');
    this.eventBus.off('chord:added');
    this.eventBus.off('chord:removed');
    this.eventBus.off('chord:selected');
    this.container.innerHTML = '';
  }
}

export default ChordDisplay;