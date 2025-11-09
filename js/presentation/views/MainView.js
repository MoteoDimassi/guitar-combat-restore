class MainView {
  constructor(container, eventBus, serviceContainer) {
    this.container = container;
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.components = {};
    
    this.init();
  }

  init() {
    this.render();
    this.initializeComponents();
    this.setupEventHandlers();
  }

  render() {
    this.container.innerHTML = `
      <div class="main-app">
        <header class="app-header">
          <h1>Guitar Combat</h1>
          <div class="header-controls">
            <button id="play-btn" class="btn btn-primary">▶ Play</button>
            <button id="stop-btn" class="btn btn-secondary">■ Stop</button>
            <button id="settings-btn" class="btn btn-secondary">⚙ Settings</button>
            <button id="templates-btn" class="btn btn-secondary">📋 Templates</button>
          </div>
        </header>
        
        <main class="app-main">
          <div class="left-panel">
            <div class="arrow-display-container"></div>
            <div class="playback-controls">
              <div class="tempo-control">
                <label for="tempo-slider">Tempo: <span id="tempo-value">120</span> BPM</label>
                <input type="range" id="tempo-slider" min="40" max="200" value="120">
              </div>
            </div>
          </div>
          
          <div class="center-panel">
            <div class="bar-display-container"></div>
          </div>
          
          <div class="right-panel">
            <div class="chord-display-container"></div>
          </div>
        </main>
        
        <footer class="app-footer">
          <div class="footer-controls">
            <button id="export-btn" class="btn btn-secondary">📤 Export</button>
            <button id="import-btn" class="btn btn-secondary">📥 Import</button>
          </div>
        </footer>
      </div>
      
      <!-- Модальное окно будет добавлено отдельно -->
      <div class="modal-container"></div>
    `;
  }

  initializeComponents() {
    // Инициализируем компоненты
    const ArrowDisplay = require('../components/ArrowDisplay').default;
    const BarDisplay = require('../components/BarDisplay').default;
    const ChordDisplay = require('../components/ChordDisplay').default;
    const Modal = require('../components/Modal').default;
    
    // Создаем экземпляры компонентов
    this.components.arrowDisplay = new ArrowDisplay(
      this.container.querySelector('.arrow-display-container'),
      this.eventBus
    );
    
    this.components.barDisplay = new BarDisplay(
      this.container.querySelector('.bar-display-container'),
      this.eventBus
    );
    
    this.components.chordDisplay = new ChordDisplay(
      this.container.querySelector('.chord-display-container'),
      this.eventBus
    );
    
    this.components.modal = new Modal(
      this.container.querySelector('.modal-container'),
      this.eventBus
    );
  }

  setupEventHandlers() {
    // Кнопки управления воспроизведением
    const playBtn = this.container.querySelector('#play-btn');
    const stopBtn = this.container.querySelector('#stop-btn');
    
    playBtn.addEventListener('click', () => {
      this.eventBus.emit('playback:toggle');
    });
    
    stopBtn.addEventListener('click', () => {
      this.eventBus.emit('playback:stop');
    });
    
    // Кнопки настроек и шаблонов
    const settingsBtn = this.container.querySelector('#settings-btn');
    const templatesBtn = this.container.querySelector('#templates-btn');
    
    settingsBtn.addEventListener('click', () => {
      this.eventBus.emit('modal:open', { type: 'settings' });
    });
    
    templatesBtn.addEventListener('click', () => {
      this.eventBus.emit('modal:open', { type: 'templates' });
    });
    
    // Кнопки экспорта и импорта
    const exportBtn = this.container.querySelector('#export-btn');
    const importBtn = this.container.querySelector('#import-btn');
    
    exportBtn.addEventListener('click', () => {
      this.eventBus.emit('modal:open', { type: 'export' });
    });
    
    importBtn.addEventListener('click', () => {
      this.eventBus.emit('modal:open', { type: 'import' });
    });
    
    // Слайдер темпа
    const tempoSlider = this.container.querySelector('#tempo-slider');
    const tempoValue = this.container.querySelector('#tempo-value');
    
    tempoSlider.addEventListener('input', (e) => {
      const tempo = parseInt(e.target.value);
      tempoValue.textContent = tempo;
      this.eventBus.emit('playback:set-tempo', { tempo });
    });
    
    // Подписываемся на события для обновления UI
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.eventBus.on('playback:started', () => {
      const playBtn = this.container.querySelector('#play-btn');
      playBtn.textContent = '⏸ Pause';
    });
    
    this.eventBus.on('playback:paused', () => {
      const playBtn = this.container.querySelector('#play-btn');
      playBtn.textContent = '▶ Play';
    });
    
    this.eventBus.on('playback:stopped', () => {
      const playBtn = this.container.querySelector('#play-btn');
      playBtn.textContent = '▶ Play';
    });
    
    this.eventBus.on('playback:tempo-changed', (data) => {
      const tempoSlider = this.container.querySelector('#tempo-slider');
      const tempoValue = this.container.querySelector('#tempo-value');
      
      tempoSlider.value = data.tempo;
      tempoValue.textContent = data.tempo;
    });
    
    this.eventBus.on('error:occurred', (data) => {
      this.showError(data.message);
    });
  }

  showError(message) {
    // Создаем временное уведомление об ошибке
    const errorNotification = document.createElement('div');
    errorNotification.className = 'error-notification';
    errorNotification.textContent = message;
    
    document.body.appendChild(errorNotification);
    
    // Показываем уведомление
    setTimeout(() => {
      errorNotification.classList.add('show');
    }, 100);
    
    // Скрываем и удаляем через 3 секунды
    setTimeout(() => {
      errorNotification.classList.remove('show');
      setTimeout(() => {
        if (errorNotification.parentNode) {
          errorNotification.parentNode.removeChild(errorNotification);
        }
      }, 300);
    }, 3000);
  }

  getComponent(name) {
    return this.components[name];
  }

  updatePlayButton(isPlaying) {
    const playBtn = this.container.querySelector('#play-btn');
    playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
  }

  updateTempoDisplay(tempo) {
    const tempoSlider = this.container.querySelector('#tempo-slider');
    const tempoValue = this.container.querySelector('#tempo-value');
    
    tempoSlider.value = tempo;
    tempoValue.textContent = tempo;
  }

  destroy() {
    // Уничтожаем все компоненты
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    
    // Отписываемся от событий
    this.eventBus.off('playback:started');
    this.eventBus.off('playback:paused');
    this.eventBus.off('playback:stopped');
    this.eventBus.off('playback:tempo-changed');
    this.eventBus.off('error:occurred');
    
    // Очищаем контейнер
    this.container.innerHTML = '';
  }
}

export default MainView;