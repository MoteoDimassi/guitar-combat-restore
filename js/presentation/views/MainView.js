import ArrowDisplay from '../components/ArrowDisplay.js';

class MainView {
  constructor(container, eventBus, serviceContainer) {
    this.container = container;
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.components = {};
    
    this.init();
  }

  init() {
    // Не заменяем существующую разметку, а работаем с ней
    this.initializeComponents();
    this.setupEventHandlers();
  }

  initializeComponents() {
    // Инициализируем компонент отображения стрелок
    const beatRow = this.container.querySelector('#beatRow');
    if (beatRow) {
      this.components.arrowDisplay = new ArrowDisplay(
        beatRow,
        this.eventBus,
        this.serviceContainer.get('stateManager')
      );
      this.components.arrowDisplay.initialize();
      
      // Устанавливаем начальные статусы для кругов (первый заполнен, остальные пустые)
      const initialStatuses = ['played', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'];
      this.components.arrowDisplay.updateAllCircleStatuses(initialStatuses);
    }
    
    console.log('Components initialized');
  }

  setupEventHandlers() {
    // Кнопки управления воспроизведением (используем существующие ID из HTML)
    const toggleBtn = this.container.querySelector('#toggleBtn');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.eventBus.emit('playback:toggle');
      });
    }
    
    // Кнопки настроек
    const settingsBtn = this.container.querySelector('#settingsBtn');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.eventBus.emit('modal:open', { type: 'settings' });
      });
    }
    
    // Кнопки навигации по тактам
    const prevLineBtn = this.container.querySelector('#prevLineBtn');
    const nextLineBtn = this.container.querySelector('#nextLineBtn');
    
    if (prevLineBtn) {
      prevLineBtn.addEventListener('click', () => {
        this.eventBus.emit('navigation:previousBar');
      });
    }
    
    if (nextLineBtn) {
      nextLineBtn.addEventListener('click', () => {
        this.eventBus.emit('navigation:nextBar');
      });
    }
    
    // Слайдер темпа (используем существующий ID из HTML)
    const bpmSlider = this.container.querySelector('#bpm');
    const bpmLabel = this.container.querySelector('#bpmLabel');
    
    if (bpmSlider && bpmLabel) {
      bpmSlider.addEventListener('input', (e) => {
        const tempo = parseInt(e.target.value);
        bpmLabel.textContent = tempo;
        this.eventBus.emit('playback:set-tempo', { tempo });
      });
    }
    
    // Кнопка генерации
    const generateBtn = this.container.querySelector('#generateBtn');
    
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.eventBus.emit('generate:strum', {});
      });
    }
    
    // Подписываемся на события для обновления UI
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.eventBus.on('playback:started', () => {
      const toggleBtn = this.container.querySelector('#toggleBtn');
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
      }
    });
    
    this.eventBus.on('playback:paused', () => {
      const toggleBtn = this.container.querySelector('#toggleBtn');
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        `;
      }
    });
    
    this.eventBus.on('playback:stopped', () => {
      const toggleBtn = this.container.querySelector('#toggleBtn');
      if (toggleBtn) {
        toggleBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        `;
      }
    });
    
    this.eventBus.on('playback:tempo-changed', (data) => {
      const bpmSlider = this.container.querySelector('#bpm');
      const bpmLabel = this.container.querySelector('#bpmLabel');
      
      if (bpmSlider && bpmLabel) {
        bpmSlider.value = data.tempo;
        bpmLabel.textContent = data.tempo;
      }
    });
    
    this.eventBus.on('playback:beat', (data) => {
      // Обновляем активный бит в компоненте стрелок
      if (this.components.arrowDisplay) {
        this.components.arrowDisplay.setCurrentBeat(data.beat);
      }
    });
    
    this.eventBus.on('generate:strum', () => {
      // Генерируем случайные направления для стрелок
      if (this.components.arrowDisplay) {
        const directions = [];
        for (let i = 0; i < 8; i++) {
          directions.push(Math.random() > 0.5 ? 'up' : 'down');
        }
        this.components.arrowDisplay.setAllArrowDirections(directions);
        
        // Генерируем случайные статусы для кругов
        const statuses = [];
        for (let i = 0; i < 8; i++) {
          const random = Math.random();
          if (random > 0.7) {
            statuses.push('played');
          } else if (random > 0.3) {
            statuses.push('muted');
          } else {
            statuses.push('empty');
          }
        }
        this.components.arrowDisplay.updateAllCircleStatuses(statuses);
      }
    });
    
    // Обработчики событий от ArrowDisplay
    this.eventBus.on('beat:statusChanged', (data) => {
      console.log(`Beat ${data.beatIndex} status changed to: ${data.status}`);
    });
    
    this.eventBus.on('arrow:chordAssigned', (data) => {
      console.log(`Chord assigned to arrow ${data.beatIndex}:`, data.chord);
    });
    
    this.eventBus.on('arrow:syllableAssigned', (data) => {
      console.log(`Syllable assigned to arrow ${data.beatIndex}: ${data.syllable}`);
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
    const toggleBtn = this.container.querySelector('#toggleBtn');
    if (toggleBtn) {
      if (isPlaying) {
        toggleBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        `;
      } else {
        toggleBtn.innerHTML = `
          <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        `;
      }
    }
  }

  updateTempoDisplay(tempo) {
    const bpmSlider = this.container.querySelector('#bpm');
    const bpmLabel = this.container.querySelector('#bpmLabel');
    
    if (bpmSlider && bpmLabel) {
      bpmSlider.value = tempo;
      bpmLabel.textContent = tempo;
    }
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

  // Метод для получения компонента стрелок
  getArrowDisplay() {
    return this.components.arrowDisplay;
  }
}

export default MainView;