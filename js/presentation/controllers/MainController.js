class MainController {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.components = {};
    
    this.init();
  }

  init() {
    this.subscribeToEvents();
    this.setupGlobalEventHandlers();
  }

  subscribeToEvents() {
    this.eventBus.on('app:initialized', () => {
      this.onAppInitialized();
    });

    this.eventBus.on('chord:selected', (data) => {
      this.onChordSelected(data);
    });

    this.eventBus.on('bar:selected', (data) => {
      this.onBarSelected(data);
    });

    this.eventBus.on('playback:started', () => {
      this.onPlaybackStarted();
    });

    this.eventBus.on('playback:stopped', () => {
      this.onPlaybackStopped();
    });

    this.eventBus.on('settings:saved', (data) => {
      this.onSettingsSaved(data);
    });

    this.eventBus.on('template:selected', (data) => {
      this.onTemplateSelected(data);
    });
  }

  setupGlobalEventHandlers() {
    // Глобальные обработчики клавиатуры
    document.addEventListener('keydown', (e) => {
      this.handleKeyPress(e);
    });

    // Глобальные обработчики изменений размера окна
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  onAppInitialized() {
    console.log('MainController: App initialized');
    this.loadInitialData();
  }

  onChordSelected(data) {
    console.log('MainController: Chord selected', data);
    // Здесь может быть логика для обработки выбора аккорда
  }

  onBarSelected(data) {
    console.log('MainController: Bar selected', data);
    // Здесь может быть логика для обработки выбора такта
  }

  onPlaybackStarted() {
    console.log('MainController: Playback started');
    // Обновляем UI для состояния воспроизведения
  }

  onPlaybackStopped() {
    console.log('MainController: Playback stopped');
    // Обновляем UI для состояния остановки
  }

  onSettingsSaved(data) {
    console.log('MainController: Settings saved', data);
    // Применяем новые настройки
    this.applySettings(data);
  }

  onTemplateSelected(data) {
    console.log('MainController: Template selected', data);
    // Применяем выбранный шаблон
    this.applyTemplate(data.templateId);
  }

  handleKeyPress(e) {
    // Обработка горячих клавиш
    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlayback();
        break;
      case 'Escape':
        this.eventBus.emit('modal:close');
        break;
      case 's':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.saveProject();
        }
        break;
      case 'o':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.openProject();
        }
        break;
    }
  }

  handleResize() {
    // Обработка изменения размера окна
    this.eventBus.emit('window:resized', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  async loadInitialData() {
    try {
      // Загружаем начальные данные
      const chordService = this.serviceContainer.get('chordService');
      const barService = this.serviceContainer.get('barService');
      
      const chords = await chordService.getAllChords();
      const bars = await barService.getAllBars();
      
      this.eventBus.emit('chords:loaded', { chords });
      this.eventBus.emit('bars:loaded', { bars });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось загрузить данные',
        error 
      });
    }
  }

  togglePlayback() {
    const playbackService = this.serviceContainer.get('playbackService');
    if (playbackService.isCurrentlyPlaying()) {
      playbackService.pause();
      this.eventBus.emit('playback:paused');
    } else {
      playbackService.play();
      this.eventBus.emit('playback:started');
    }
  }

  async saveProject() {
    try {
      // Здесь будет логика сохранения проекта
      this.eventBus.emit('project:saved');
    } catch (error) {
      console.error('Failed to save project:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось сохранить проект',
        error 
      });
    }
  }

  async openProject() {
    try {
      // Здесь будет логика открытия проекта
      this.eventBus.emit('project:opened');
    } catch (error) {
      console.error('Failed to open project:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось открыть проект',
        error 
      });
    }
  }

  applySettings(settings) {
    // Применяем настройки к различным сервисам
    const playbackService = this.serviceContainer.get('playbackService');
    const audioRepository = this.serviceContainer.get('audioRepository');
    
    if (settings.tempo) {
      playbackService.setTempo(settings.tempo);
    }
    
    if (settings.volume !== undefined) {
      audioRepository.setVolume(settings.volume);
    }
    
    // Сохраняем настройки
    const configManager = this.serviceContainer.get('configManager');
    configManager.set('audio', settings);
  }

  async applyTemplate(templateId) {
    try {
      const templateService = this.serviceContainer.get('templateService');
      const bars = await templateService.applyTemplate(templateId);
      
      if (bars) {
        this.eventBus.emit('template:applied', { bars });
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось применить шаблон',
        error 
      });
    }
  }

  registerComponent(name, component) {
    this.components[name] = component;
  }

  getComponent(name) {
    return this.components[name];
  }

  destroy() {
    this.eventBus.off('app:initialized');
    this.eventBus.off('chord:selected');
    this.eventBus.off('bar:selected');
    this.eventBus.off('playback:started');
    this.eventBus.off('playback:stopped');
    this.eventBus.off('settings:saved');
    this.eventBus.off('template:selected');
    
    // Уничтожаем все компоненты
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    
    this.components = {};
  }
}

export default MainController;