export class MainController {
  constructor(eventBus, container) {
    this.container = container;
    this.eventBus = eventBus;
    this.stateManager = container.get("stateManager");
    this.domElements = {};
    this.components = {};
    this.isInitialized = false;
  }

  /**
   * Инициализация контроллера
   */
  async initialize() {
    try {
      console.log("🎮 Initializing MainController...");

      // Инициализация DOM элементов
      this.initializeDOMElements();

      // Привязка событий
      this.bindEvents();

      // Настройка подписок
      this.setupSubscriptions();

      // Синхронизация с состоянием
      this.syncWithState();

      this.isInitialized = true;
      console.log("✅ MainController initialized successfully");
    } catch (error) {
      console.error("❌ MainController initialization failed:", error);
      throw error;
    }
  }

  /**
   * Инициализация DOM элементов
   */
  initializeDOMElements() {
    this.domElements = {
      chordsInput: document.getElementById("chordsInput"),
      beatCountSelect: document.getElementById("countSelect"),
      bpmInput: document.getElementById("bpm"),
      bpmSlider: document.getElementById("bpm"),
      bpmLabel: document.getElementById("bpmLabel"),
      playBtn: document.getElementById("toggleBtn"),
      generateBtn: document.getElementById("generateBtn"),
      nextLineBtn: document.getElementById("nextLineBtn"),
      prevLineBtn: document.getElementById("prevLineBtn"),
      settingsBtn: document.getElementById("settingsBtn"),
      settingsMenu: document.getElementById("settingsMenu"),
      strumVolume: document.getElementById("strumVolume"),
      strumVolumeLabel: document.getElementById("strumVolumeLabel"),
      metronomeVolume: document.getElementById("metronomeVolume"),
      metronomeVolumeLabel: document.getElementById("metronomeVolumeLabel"),
    };

    // Проверяем критически важные элементы
    const criticalElements = ["chordsInput", "beatCountSelect"];
    const missingElements = criticalElements.filter(
      (id) => !this.domElements[id]
    );

    if (missingElements.length > 0) {
      throw new Error(
        `Missing critical DOM elements: ${missingElements.join(", ")}`
      );
    }
  }

  /**
   * Привязка событий
   */
  bindEvents() {
    // События ввода аккордов
    if (this.domElements.chordsInput) {
      this.domElements.chordsInput.addEventListener("input", (e) => {
        this.handleChordsInput(e.target.value);
      });

      this.domElements.chordsInput.addEventListener("change", (e) => {
        this.handleChordsInput(e.target.value);
      });
    }

    // События изменения количества долей
    if (this.domElements.beatCountSelect) {
      this.domElements.beatCountSelect.addEventListener("change", (e) => {
        this.handleBeatCountChange(parseInt(e.target.value));
      });
    }

    // События изменения темпа
    if (this.domElements.bpmSlider) {
      this.domElements.bpmSlider.addEventListener("input", (e) => {
        this.handleBpmChange(parseInt(e.target.value));
      });
    }

    if (this.domElements.bpmInput) {
      this.domElements.bpmInput.addEventListener("change", (e) => {
        this.handleBpmChange(parseInt(e.target.value));
      });
    }

    // События кнопок
    if (this.domElements.playBtn) {
      this.domElements.playBtn.addEventListener("click", () => {
        this.handlePlayButtonClick();
      });
    }

    if (this.domElements.generateBtn) {
      this.domElements.generateBtn.addEventListener("click", () => {
        this.handleGenerateButtonClick();
      });
    }

    if (this.domElements.nextLineBtn) {
      this.domElements.nextLineBtn.addEventListener("click", () => {
        this.eventBus.emit("navigation:nextBar");
      });
    }

    if (this.domElements.prevLineBtn) {
      this.domElements.prevLineBtn.addEventListener("click", () => {
        this.eventBus.emit("navigation:previousBar");
      });
    }

    // События настроек
    if (this.domElements.settingsBtn) {
      this.domElements.settingsBtn.addEventListener("click", () => {
        this.handleSettingsToggle();
      });
    }

    // События громкости
    if (this.domElements.strumVolume) {
      this.domElements.strumVolume.addEventListener("input", (e) => {
        this.handleVolumeChange("strum", parseInt(e.target.value));
      });
    }

    if (this.domElements.metronomeVolume) {
      this.domElements.metronomeVolume.addEventListener("input", (e) => {
        this.handleVolumeChange("metronome", parseInt(e.target.value));
      });
    }
  }

  /**
   * Настройка подписок на события
   */
  setupSubscriptions() {
    // Подписка на изменения состояния
    this.stateManager.subscribe("settings.bpm", (bpm) => {
      this.updateBpmDisplay(bpm);
    });

    this.stateManager.subscribe("settings.beatCount", (beatCount) => {
      this.updateBeatCountDisplay(beatCount);
    });

    this.stateManager.subscribe("playback.isPlaying", (isPlaying) => {
      this.updatePlayButton(isPlaying);
    });

    this.stateManager.subscribe("settings.volume.strum", (volume) => {
      this.updateVolumeDisplay("strum", volume);
    });

    this.stateManager.subscribe("settings.volume.metronome", (volume) => {
      this.updateVolumeDisplay("metronome", volume);
    });

    // Подписка на события
    this.eventBus.on("chords:parsed", (event) => {
      this.handleChordsParsed(event.data);
    });

    this.eventBus.on("bars:updated", (event) => {
      this.handleBarsUpdated(event.data);
    });

    this.eventBus.on("error:occurred", (event) => {
      this.handleError(event.data);
    });
  }

  /**
   * Синхронизация с состоянием
   */
  syncWithState() {
    // Синхронизируем UI с текущим состоянием
    const state = this.stateManager.getState();

    this.updateBpmDisplay(state.settings.bpm);
    this.updateBeatCountDisplay(state.settings.beatCount);
    this.updatePlayButton(state.playback.isPlaying);
    this.updateVolumeDisplay("strum", state.settings.volume.strum);
    this.updateVolumeDisplay("metronome", state.settings.volume.metronome);

    // Устанавливаем значения в DOM элементы
    if (this.domElements.chordsInput) {
      this.domElements.chordsInput.value = state.chords.inputString;
    }

    if (this.domElements.beatCountSelect) {
      this.domElements.beatCountSelect.value = state.settings.beatCount;
    }
  }

  /**
   * Обработчики событий
   */
  handleChordsInput(chordsString) {
    this.eventBus.emit("chords:input", { chordsString });
  }

  handleBeatCountChange(beatCount) {
    this.eventBus.emit("settings:beatCountChanged", { beatCount });
  }

  handleBpmChange(bpm) {
    this.eventBus.emit("settings:bpmChanged", { bpm });
  }

  handlePlayButtonClick() {
    this.eventBus.emit("playback:toggle");
  }

  handleGenerateButtonClick() {
    this.eventBus.emit("generate:strum", {});
  }

  handleSettingsToggle() {
    this.eventBus.emit("ui:toggleSettings");
  }

  handleVolumeChange(type, value) {
    this.eventBus.emit("ui:updateVolume", { type, value });
  }

  handleChordsParsed(data) {
    const { validChords, invalidChords } = data;
    console.log(
      `Chords parsed: ${validChords.length} valid, ${invalidChords.length} invalid`
    );
  }

  handleBarsUpdated(data) {
    const { bars } = data;
    console.log(`Bars updated: ${bars.length} bars`);
  }

  handleError(data) {
    const { error, context } = data;
    console.error(`Error in ${context}:`, error);

    // Показываем уведомление об ошибке
    this.showErrorMessage(error.message);
  }

  /**
   * Методы обновления UI
   */
  updateBpmDisplay(bpm) {
    if (this.domElements.bpmSlider) {
      this.domElements.bpmSlider.value = bpm;
    }

    if (this.domElements.bpmInput) {
      this.domElements.bpmInput.value = bpm;
    }

    if (this.domElements.bpmLabel) {
      this.domElements.bpmLabel.textContent = bpm;
    }
  }

  updateBeatCountDisplay(beatCount) {
    if (this.domElements.beatCountSelect) {
      this.domElements.beatCountSelect.value = beatCount;
    }
  }

  updatePlayButton(isPlaying) {
    if (this.domElements.playBtn) {
      if (isPlaying) {
        this.domElements.playBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
      } else {
        this.domElements.playBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        `;
      }
    }
  }

  updateVolumeDisplay(type, volume) {
    if (type === "strum") {
      if (this.domElements.strumVolume) {
        this.domElements.strumVolume.value = volume;
      }
      if (this.domElements.strumVolumeLabel) {
        this.domElements.strumVolumeLabel.textContent = `${volume}%`;
      }
    } else if (type === "metronome") {
      if (this.domElements.metronomeVolume) {
        this.domElements.metronomeVolume.value = volume;
      }
      if (this.domElements.metronomeVolumeLabel) {
        this.domElements.metronomeVolumeLabel.textContent = `${volume}%`;
      }
    }
  }

  /**
   * Показ сообщения об ошибке
   */
  showErrorMessage(message) {
    // Создаем элемент уведомления
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm";
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Регистрация компонента
   */
  registerComponent(name, component) {
    this.components[name] = component;
    console.log(`Component registered: ${name}`);
  }

  /**
   * Получение компонента
   */
  getComponent(name) {
    return this.components[name];
  }

  /**
   * Уничтожение контроллера
   */
  destroy() {
    // Удаляем обработчики событий
    Object.values(this.domElements).forEach((element) => {
      if (element && element.removeEventListener) {
        // В реальном приложении нужно сохранять ссылки на обработчики
        // для корректного удаления
      }
    });

    this.domElements = {};
    this.components = {};
    this.isInitialized = false;
  }
}

export default MainController;