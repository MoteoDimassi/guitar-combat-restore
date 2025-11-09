class StateManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = {
      chords: [],
      bars: [],
      settings: {},
      playback: {
        isPlaying: false,
        currentBar: 0,
        currentBeat: 0,
      },
    };
  }

  setState(path, value) {
    const oldValue = this.getState(path);
    this.state = this.setNestedValue(this.state, path, value);
    this.eventBus.emit("state:changed", { path, value, oldValue });
  }

  getState(path) {
    return this.getNestedValue(this.state, path);
  }

  subscribe(path, callback) {
    this.eventBus.on("state:changed", ({ path: changedPath, value }) => {
      if (changedPath.startsWith(path)) {
        callback(value);
      }
    });
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current ? current[key] : undefined;
    }, obj);
  }
}

export default StateManager;