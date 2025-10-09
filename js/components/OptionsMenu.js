// Компонент для управления меню опций
export class OptionsMenu {
  constructor() {
    this.optionsBtn = null;
    this.optionsMenu = null;
    this.controlPanel = null;
    this.isMenuOpen = false;
  }

  init() {
    this.optionsBtn = document.getElementById('optionsBtn');
    this.optionsMenu = document.getElementById('optionsMenu');
    this.controlPanel = document.getElementById('controlPanel');

    if (!this.optionsBtn || !this.optionsMenu || !this.controlPanel) {
      console.warn('OptionsMenu: Required elements not found');
      return;
    }

    this.bindEvents();
  }

  bindEvents() {
    // Обработчик клика на кнопку "Опции"
    this.optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Закрытие меню при клике вне его области
    document.addEventListener('click', (e) => {
      if (!this.isMenuOpen) return;
      
      const target = e.target;
      
      // Не закрываем если клик по кнопке опций
      if (this.optionsBtn.contains(target)) return;
      
      // Не закрываем если клик внутри меню опций
      if (this.optionsMenu.contains(target)) return;
      
      // Дополнительная проверка: не закрываем если это клик по select или его элементам
      if (target.tagName === 'SELECT' || target.tagName === 'OPTION') return;
      
      // Проверяем родительские элементы - может быть вложенный select
      const selectParent = target.closest('select');
      if (selectParent) return;
      
      // В остальных случаях закрываем меню
      this.closeMenu();
    });

    // Закрытие меню по клавише ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (!this.optionsMenu || !this.controlPanel) return;

    // Клонируем содержимое панели управления в меню опций
    const controlPanelClone = this.controlPanel.cloneNode(true);
    controlPanelClone.id = 'controlPanelClone';
    controlPanelClone.className = 'flex flex-col gap-6';
    
    this.optionsMenu.innerHTML = '';
    this.optionsMenu.appendChild(controlPanelClone);

    // Предотвращаем закрытие меню при кликах внутри него
    // Удаляем старый обработчик если есть
    if (this.menuClickHandler) {
      this.optionsMenu.removeEventListener('click', this.menuClickHandler);
    }
    // Создаём и сохраняем новый обработчик
    this.menuClickHandler = (e) => {
      e.stopPropagation();
    };
    this.optionsMenu.addEventListener('click', this.menuClickHandler);

    // Переинициализируем обработчики для клонированных элементов ДО показа меню
    this.reinitializeClonedElements();

    // Показываем меню ПОСЛЕ инициализации всех обработчиков
    this.optionsMenu.classList.remove('hidden');
    this.isMenuOpen = true;
  }

  closeMenu() {
    if (!this.optionsMenu) return;
    
    this.optionsMenu.classList.add('hidden');
    this.isMenuOpen = false;
  }

  reinitializeClonedElements() {
    // Переинициализируем обработчики для элементов в клонированной панели
    const clonedPanel = document.getElementById('controlPanelClone');
    if (!clonedPanel) return;

    // Обработчики для выбора шаблона
    const templatesSelect = clonedPanel.querySelector('#templates-select');
    if (templatesSelect && window.app && window.app.templateManager) {
      // Копируем options из оригинального select
      const originalSelect = document.querySelector('#controlPanel #templates-select');
      if (originalSelect) {
        templatesSelect.innerHTML = originalSelect.innerHTML;
        templatesSelect.value = originalSelect.value;
      }
      
      // Останавливаем распространение клика на select, чтобы не закрывать меню
      templatesSelect.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      templatesSelect.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      
      templatesSelect.addEventListener('change', async (e) => {
        const templateName = e.target.value;
        if (templateName) {
          await window.app.templateManager.applyTemplate(templateName);
        }
        // Синхронизируем оригинальный select
        if (originalSelect) {
          originalSelect.value = e.target.value;
        }
        // Не закрываем меню, чтобы пользователь мог сделать другие изменения
      });
    }

    // Обработчики для BPM
    const bpmSlider = clonedPanel.querySelector('#bpm');
    const bpmLabel = clonedPanel.querySelector('#bpmLabel');
    const bpmIncrement = clonedPanel.querySelector('#bpmIncrement');
    const bpmDecrement = clonedPanel.querySelector('#bpmDecrement');
    
    if (bpmSlider && window.app && window.app.controls) {
      const originalBpm = document.querySelector('#controlPanel #bpm');
      if (originalBpm) {
        bpmSlider.value = originalBpm.value;
        if (bpmLabel) bpmLabel.textContent = originalBpm.value;
      }

      bpmSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        if (bpmLabel) bpmLabel.textContent = value;
        // Обновляем глобальное состояние и оригинальные элементы
        if (window.app) {
          window.app.state.bpm = Number(value) || 90;
        }
        if (originalBpm) {
          originalBpm.value = value;
          const originalLabel = document.querySelector('#controlPanel #bpmLabel');
          if (originalLabel) originalLabel.textContent = value;
        }
      });

      if (bpmIncrement) {
        bpmIncrement.addEventListener('click', () => {
          const newValue = Math.min(200, parseInt(bpmSlider.value) + 1);
          bpmSlider.value = newValue;
          if (bpmLabel) bpmLabel.textContent = newValue;
          // Обновляем глобальное состояние
          if (window.app) {
            window.app.state.bpm = newValue;
          }
          if (originalBpm) {
            originalBpm.value = newValue;
            const originalLabel = document.querySelector('#controlPanel #bpmLabel');
            if (originalLabel) originalLabel.textContent = newValue;
          }
        });
      }

      if (bpmDecrement) {
        bpmDecrement.addEventListener('click', () => {
          const newValue = Math.max(40, parseInt(bpmSlider.value) - 1);
          bpmSlider.value = newValue;
          if (bpmLabel) bpmLabel.textContent = newValue;
          // Обновляем глобальное состояние
          if (window.app) {
            window.app.state.bpm = newValue;
          }
          if (originalBpm) {
            originalBpm.value = newValue;
            const originalLabel = document.querySelector('#controlPanel #bpmLabel');
            if (originalLabel) originalLabel.textContent = newValue;
          }
        });
      }
    }

    // Обработчики для количества стрелок
    const countSelect = clonedPanel.querySelector('#countSelect');
    if (countSelect && window.app && window.app.controls) {
      const originalCount = document.querySelector('#controlPanel #countSelect');
      if (originalCount) {
        countSelect.value = originalCount.value;
      }

      // Останавливаем распространение клика на select, чтобы не закрывать меню
      countSelect.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      countSelect.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      countSelect.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        window.app.controls.setCount(value);
        if (originalCount) {
          originalCount.value = e.target.value;
        }
        // Не закрываем меню, чтобы пользователь мог сделать другие изменения
      });
    }

    // Обработчики для кнопок действий
    const generateBtn = clonedPanel.querySelector('#generateBtn');
    if (generateBtn && window.app && window.app.controls) {
      generateBtn.addEventListener('click', () => {
        window.app.controls.generateRandom();
        this.closeMenu();
      });
    }

    const exportPngBtn = clonedPanel.querySelector('#exportPng');
    if (exportPngBtn && window.app && window.app.exportUtils) {
      exportPngBtn.addEventListener('click', () => {
        window.app.exportUtils.exportToPng();
        this.closeMenu();
      });
    }

    const downloadJsonBtn = clonedPanel.querySelector('#downloadJson');
    if (downloadJsonBtn && window.app && window.app.exportUtils) {
      downloadJsonBtn.addEventListener('click', () => {
        window.app.exportUtils.downloadJson();
        this.closeMenu();
      });
    }

    const importJsonBtn = clonedPanel.querySelector('#importJson');
    if (importJsonBtn && window.app && window.app.importUtils) {
      importJsonBtn.addEventListener('click', () => {
        window.app.importUtils.importJson();
        this.closeMenu();
      });
    }

    const addSongTextBtn = clonedPanel.querySelector('#addSongTextBtn');
    if (addSongTextBtn && window.app && window.app.modal) {
      addSongTextBtn.addEventListener('click', () => {
        window.app.modal.showAddSongText();
        this.closeMenu();
      });
    }
  }

  // Показать кнопку "Опции" (вызывается при добавлении текста песни)
  showOptionsButton() {
    if (this.optionsBtn) {
      this.optionsBtn.classList.remove('hidden');
      this.optionsBtn.classList.add('flex');
    }
  }

  // Скрыть кнопку "Опции" (вызывается при удалении текста песни)
  hideOptionsButton() {
    if (this.optionsBtn) {
      this.optionsBtn.classList.add('hidden');
      this.optionsBtn.classList.remove('flex');
    }
    this.closeMenu();
  }

  // Скрыть панель управления
  hideControlPanel() {
    if (this.controlPanel) {
      this.controlPanel.classList.add('hidden');
    }
  }

  // Показать панель управления
  showControlPanel() {
    if (this.controlPanel) {
      this.controlPanel.classList.remove('hidden');
    }
  }
}

