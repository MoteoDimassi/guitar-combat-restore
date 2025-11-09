class ConfigManager {
  constructor() {
    this.config = {
      audio: {
        volume: 0.8,
        tempo: 120,
      },
      ui: {
        theme: 'light',
        language: 'en',
      },
      playback: {
        autoPlay: false,
        loop: false,
      },
    };
  }

  get(path) {
    return path.split('.').reduce((current, key) => {
      return current ? current[key] : undefined;
    }, this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, this.config);
    target[lastKey] = value;
  }

  load(configData) {
    this.config = { ...this.config, ...configData };
  }

  save() {
    // В реальном приложении здесь будет сохранение в localStorage или на сервер
    return JSON.stringify(this.config);
  }
}

export default ConfigManager;