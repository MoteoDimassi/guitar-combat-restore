class SettingsView {
  constructor(container, eventBus, serviceContainer) {
    this.container = container;
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.settings = {};
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.render();
    this.setupEventHandlers();
  }

  async loadSettings() {
    try {
      const configManager = this.serviceContainer.get('configManager');
      this.settings = {
        audio: configManager.get('audio') || {},
        ui: configManager.get('ui') || {},
        playback: configManager.get('playback') || {}
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {
        audio: { volume: 0.8, tempo: 120 },
        ui: { theme: 'light', language: 'en' },
        playback: { autoPlay: false, loop: false }
      };
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="settings-view">
        <header class="settings-header">
          <h2>Settings</h2>
          <button id="close-settings" class="btn btn-secondary">✕ Close</button>
        </header>
        
        <main class="settings-content">
          <section class="settings-section">
            <h3>Audio Settings</h3>
            <div class="setting-item">
              <label for="volume-slider">Volume:</label>
              <input type="range" id="volume-slider" min="0" max="100" value="${(this.settings.audio.volume || 0.8) * 100}">
              <span id="volume-value">${Math.round((this.settings.audio.volume || 0.8) * 100)}%</span>
            </div>
            <div class="setting-item">
              <label for="tempo-input">Default Tempo (BPM):</label>
              <input type="number" id="tempo-input" min="40" max="200" value="${this.settings.audio.tempo || 120}">
            </div>
          </section>
          
          <section class="settings-section">
            <h3>UI Settings</h3>
            <div class="setting-item">
              <label for="theme-select">Theme:</label>
              <select id="theme-select">
                <option value="light" ${this.settings.ui.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${this.settings.ui.theme === 'dark' ? 'selected' : ''}>Dark</option>
              </select>
            </div>
            <div class="setting-item">
              <label for="language-select">Language:</label>
              <select id="language-select">
                <option value="en" ${this.settings.ui.language === 'en' ? 'selected' : ''}>English</option>
                <option value="ru" ${this.settings.ui.language === 'ru' ? 'selected' : ''}>Русский</option>
              </select>
            </div>
          </section>
          
          <section class="settings-section">
            <h3>Playback Settings</h3>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="autoplay-checkbox" ${this.settings.playback.autoPlay ? 'checked' : ''}>
                Auto-play on load
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="loop-checkbox" ${this.settings.playback.loop ? 'checked' : ''}>
                Loop playback
              </label>
            </div>
          </section>
        </main>
        
        <footer class="settings-footer">
          <button id="reset-settings" class="btn btn-secondary">Reset to Defaults</button>
          <button id="save-settings" class="btn btn-primary">Save Settings</button>
        </footer>
      </div>
    `;
  }

  setupEventHandlers() {
    // Закрытие настроек
    const closeBtn = this.container.querySelector('#close-settings');
    closeBtn.addEventListener('click', () => {
      this.close();
    });
    
    // Слайдер громкости
    const volumeSlider = this.container.querySelector('#volume-slider');
    const volumeValue = this.container.querySelector('#volume-value');
    
    volumeSlider.addEventListener('input', (e) => {
      const volume = parseInt(e.target.value);
      volumeValue.textContent = `${volume}%`;
    });
    
    // Сохранение настроек
    const saveBtn = this.container.querySelector('#save-settings');
    saveBtn.addEventListener('click', () => {
      this.saveSettings();
    });
    
    // Сброс настроек
    const resetBtn = this.container.querySelector('#reset-settings');
    resetBtn.addEventListener('click', () => {
      this.resetSettings();
    });
  }

  saveSettings() {
    try {
      const volumeSlider = this.container.querySelector('#volume-slider');
      const tempoInput = this.container.querySelector('#tempo-input');
      const themeSelect = this.container.querySelector('#theme-select');
      const languageSelect = this.container.querySelector('#language-select');
      const autoplayCheckbox = this.container.querySelector('#autoplay-checkbox');
      const loopCheckbox = this.container.querySelector('#loop-checkbox');
      
      const newSettings = {
        audio: {
          volume: parseInt(volumeSlider.value) / 100,
          tempo: parseInt(tempoInput.value)
        },
        ui: {
          theme: themeSelect.value,
          language: languageSelect.value
        },
        playback: {
          autoPlay: autoplayCheckbox.checked,
          loop: loopCheckbox.checked
        }
      };
      
      const configManager = this.serviceContainer.get('configManager');
      configManager.set('audio', newSettings.audio);
      configManager.set('ui', newSettings.ui);
      configManager.set('playback', newSettings.playback);
      
      this.settings = newSettings;
      
      // Уведомляем об изменении настроек
      this.eventBus.emit('settings:saved', newSettings);
      this.eventBus.emit('settings:changed', newSettings);
      
      this.close();
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось сохранить настройки',
        error 
      });
    }
  }

  resetSettings() {
    const defaultSettings = {
      audio: { volume: 0.8, tempo: 120 },
      ui: { theme: 'light', language: 'en' },
      playback: { autoPlay: false, loop: false }
    };
    
    this.settings = defaultSettings;
    this.render();
    this.setupEventHandlers();
  }

  close() {
    this.container.innerHTML = '';
    this.eventBus.emit('settings:closed');
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.render();
    this.setupEventHandlers();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default SettingsView;