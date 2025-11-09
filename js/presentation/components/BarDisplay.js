class BarDisplay {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.bars = [];
    this.selectedBar = null;
    this.timeSignature = { beats: 4, beatUnit: 4 };
    
    this.init();
    this.subscribeToEvents();
  }

  init() {
    this.container.innerHTML = `
      <div class="bar-display">
        <div class="time-signature">
          <label for="beats">Доли:</label>
          <select id="beats" class="beats-select">
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4" selected>4</option>
            <option value="6">6</option>
            <option value="8">8</option>
          </select>
          
          <label for="beat-unit">Длительность:</label>
          <select id="beat-unit" class="beat-unit-select">
            <option value="2">2</option>
            <option value="4" selected>4</option>
            <option value="8">8</option>
            <option value="16">16</option>
          </select>
        </div>
        
        <div class="bars-container">
          <div class="bars-header">
            <h3>Такты:</h3>
            <button id="add-bar" class="add-bar-btn">Добавить такт</button>
          </div>
          <div class="bars-list"></div>
        </div>
      </div>
    `;
    
    this.beatsSelect = this.container.querySelector('#beats');
    this.beatUnitSelect = this.container.querySelector('#beat-unit');
    this.barsList = this.container.querySelector('.bars-list');
    this.addBarButton = this.container.querySelector('#add-bar');
    
    this.beatsSelect.addEventListener('change', () => {
      this.updateTimeSignature();
    });
    
    this.beatUnitSelect.addEventListener('change', () => {
      this.updateTimeSignature();
    });
    
    this.addBarButton.addEventListener('click', () => {
      this.eventBus.emit('bar:add', {
        beats: this.timeSignature.beats,
        beatUnit: this.timeSignature.beatUnit
      });
    });
  }

  subscribeToEvents() {
    this.eventBus.on('bars:loaded', (data) => {
      this.updateBarsList(data.bars);
    });

    this.eventBus.on('bar:added', (data) => {
      this.addBarToList(data.bar);
    });

    this.eventBus.on('bar:removed', (data) => {
      this.removeBarFromList(data.barId);
    });

    this.eventBus.on('bar:selected', (data) => {
      this.highlightBar(data.barId);
    });

    this.eventBus.on('bar:updated', (data) => {
      this.updateBarInList(data.bar);
    });
  }

  updateTimeSignature() {
    this.timeSignature = {
      beats: parseInt(this.beatsSelect.value),
      beatUnit: parseInt(this.beatUnitSelect.value)
    };
    
    this.eventBus.emit('time-signature:changed', this.timeSignature);
    this.renderBars();
  }

  updateBarsList(bars) {
    this.bars = bars;
    this.renderBars();
  }

  addBarToList(bar) {
    this.bars.push(bar);
    this.renderBars();
  }

  removeBarFromList(barId) {
    this.bars = this.bars.filter(bar => bar.id !== barId);
    this.renderBars();
  }

  updateBarInList(updatedBar) {
    const index = this.bars.findIndex(bar => bar.id === updatedBar.id);
    if (index !== -1) {
      this.bars[index] = updatedBar;
      this.renderBars();
    }
  }

  highlightBar(barId) {
    const barElements = this.barsList.querySelectorAll('.bar-item');
    barElements.forEach(element => {
      element.classList.remove('selected');
      if (element.dataset.barId === barId) {
        element.classList.add('selected');
      }
    });
  }

  renderBars() {
    this.barsList.innerHTML = '';
    
    this.bars.forEach((bar, index) => {
      const barItem = document.createElement('div');
      barItem.className = 'bar-item';
      barItem.dataset.barId = bar.id;
      
      const beats = bar.beats || this.timeSignature.beats;
      const beatUnit = bar.beatUnit || this.timeSignature.beatUnit;
      
      barItem.innerHTML = `
        <div class="bar-header">
          <span class="bar-number">Такт ${index + 1}</span>
          <span class="bar-signature">${beats}/${beatUnit}</span>
          <button class="remove-bar" data-bar-id="${bar.id}">Удалить</button>
        </div>
        <div class="bar-content">
          <div class="bar-beats">
            ${this.renderBeats(beats, bar.chords)}
          </div>
        </div>
      `;
      
      const removeButton = barItem.querySelector('.remove-bar');
      removeButton.addEventListener('click', () => {
        this.eventBus.emit('bar:remove', { barId: bar.id });
      });
      
      barItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-bar') && !e.target.classList.contains('beat-chord')) {
          this.eventBus.emit('bar:selected', { barId: bar.id });
        }
      });
      
      this.barsList.appendChild(barItem);
    });
  }

  renderBeats(beats, chords = []) {
    let beatsHtml = '';
    
    for (let i = 0; i < beats; i++) {
      const chord = chords.find(c => c.position === i);
      const chordName = chord ? chord.name : '';
      
      beatsHtml += `
        <div class="beat" data-beat="${i}">
          <div class="beat-number">${i + 1}</div>
          <div class="beat-chord" data-beat="${i}">${chordName}</div>
        </div>
      `;
    }
    
    return beatsHtml;
  }

  getSelectedBar() {
    return this.selectedBar;
  }

  getTimeSignature() {
    return this.timeSignature;
  }

  destroy() {
    this.eventBus.off('bars:loaded');
    this.eventBus.off('bar:added');
    this.eventBus.off('bar:removed');
    this.eventBus.off('bar:selected');
    this.eventBus.off('bar:updated');
    this.container.innerHTML = '';
  }
}

export default BarDisplay;