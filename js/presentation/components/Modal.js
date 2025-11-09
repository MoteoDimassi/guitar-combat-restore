class Modal {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.isOpen = false;
    this.currentModal = null;
    
    this.init();
    this.subscribeToEvents();
  }

  init() {
    this.container.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title"></h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-content"></div>
          <div class="modal-footer">
            <button class="modal-cancel">Отмена</button>
            <button class="modal-confirm">OK</button>
          </div>
        </div>
      </div>
    `;
    
    this.modalOverlay = this.container.querySelector('#modal-overlay');
    this.modalTitle = this.container.querySelector('.modal-title');
    this.modalContent = this.container.querySelector('.modal-content');
    this.modalClose = this.container.querySelector('.modal-close');
    this.modalCancel = this.container.querySelector('.modal-cancel');
    this.modalConfirm = this.container.querySelector('.modal-confirm');
    
    this.modalClose.addEventListener('click', () => {
      this.close();
    });
    
    this.modalCancel.addEventListener('click', () => {
      this.close();
    });
    
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });
    
    // Изначально скрываем модальное окно
    this.modalOverlay.style.display = 'none';
  }

  subscribeToEvents() {
    this.eventBus.on('modal:open', (data) => {
      this.open(data.type, data.data);
    });

    this.eventBus.on('modal:close', () => {
      this.close();
    });
  }

  open(type, data = {}) {
    this.currentModal = type;
    this.isOpen = true;
    
    switch (type) {
      case 'settings':
        this.openSettingsModal(data);
        break;
      case 'templates':
        this.openTemplatesModal(data);
        break;
      case 'export':
        this.openExportModal(data);
        break;
      case 'import':
        this.openImportModal(data);
        break;
      case 'confirm':
        this.openConfirmModal(data);
        break;
      default:
        console.warn(`Unknown modal type: ${type}`);
        this.close();
        return;
    }
    
    this.modalOverlay.style.display = 'flex';
  }

  close() {
    this.isOpen = false;
    this.currentModal = null;
    this.modalOverlay.style.display = 'none';
    
    // Очищаем содержимое
    this.modalTitle.textContent = '';
    this.modalContent.innerHTML = '';
    
    this.eventBus.emit('modal:closed', { type: this.currentModal });
  }

  openSettingsModal(data) {
    this.modalTitle.textContent = 'Настройки';
    this.modalContent.innerHTML = `
      <div class="settings-form">
        <div class="form-group">
          <label for="tempo">Темп (BPM):</label>
          <input type="number" id="tempo" min="40" max="200" value="${data.tempo || 120}">
        </div>
        <div class="form-group">
          <label for="volume">Громкость:</label>
          <input type="range" id="volume" min="0" max="100" value="${(data.volume || 0.8) * 100}">
        </div>
        <div class="form-group">
          <label for="auto-play">Автовоспроизведение:</label>
          <input type="checkbox" id="auto-play" ${data.autoPlay ? 'checked' : ''}>
        </div>
      </div>
    `;
    
    this.modalConfirm.textContent = 'Сохранить';
    this.modalConfirm.onclick = () => {
      const settings = {
        tempo: parseInt(this.modalContent.querySelector('#tempo').value),
        volume: parseInt(this.modalContent.querySelector('#volume').value) / 100,
        autoPlay: this.modalContent.querySelector('#auto-play').checked
      };
      
      this.eventBus.emit('settings:saved', settings);
      this.close();
    };
  }

  openTemplatesModal(data) {
    this.modalTitle.textContent = 'Шаблоны';
    this.modalContent.innerHTML = `
      <div class="templates-list">
        <div class="template-item" data-template="basic-4-4">
          <h4>Basic 4/4</h4>
          <p>Простой шаблон 4/4</p>
        </div>
        <div class="template-item" data-template="basic-3-4">
          <h4>Basic 3/4</h4>
          <p>Простой шаблон 3/4</p>
        </div>
        <div class="template-item" data-template="blues-12-bar">
          <h4>12-Bar Blues</h4>
          <p>Стандартный блюзовый прогрессия</p>
        </div>
      </div>
    `;
    
    const templateItems = this.modalContent.querySelectorAll('.template-item');
    templateItems.forEach(item => {
      item.addEventListener('click', () => {
        const templateId = item.dataset.template;
        this.eventBus.emit('template:selected', { templateId });
        this.close();
      });
    });
    
    this.modalConfirm.textContent = 'Закрыть';
    this.modalConfirm.onclick = () => {
      this.close();
    };
  }

  openExportModal(data) {
    this.modalTitle.textContent = 'Экспорт';
    this.modalContent.innerHTML = `
      <div class="export-options">
        <p>Выберите формат экспорта:</p>
        <div class="radio-group">
          <label>
            <input type="radio" name="export-format" value="json" checked>
            JSON
          </label>
          <label>
            <input type="radio" name="export-format" value="midi">
            MIDI (в разработке)
          </label>
        </div>
      </div>
    `;
    
    this.modalConfirm.textContent = 'Экспортировать';
    this.modalConfirm.onclick = () => {
      const format = this.modalContent.querySelector('input[name="export-format"]:checked').value;
      this.eventBus.emit('export:requested', { format });
      this.close();
    };
  }

  openImportModal(data) {
    this.modalTitle.textContent = 'Импорт';
    this.modalContent.innerHTML = `
      <div class="import-options">
        <p>Выберите файл для импорта:</p>
        <input type="file" id="import-file" accept=".json">
      </div>
    `;
    
    this.modalConfirm.textContent = 'Импортировать';
    this.modalConfirm.onclick = () => {
      const fileInput = this.modalContent.querySelector('#import-file');
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        this.eventBus.emit('import:requested', { file });
        this.close();
      } else {
        alert('Пожалуйста, выберите файл');
      }
    };
  }

  openConfirmModal(data) {
    this.modalTitle.textContent = data.title || 'Подтверждение';
    this.modalContent.innerHTML = `
      <p>${data.message || 'Вы уверены?'}</p>
    `;
    
    this.modalConfirm.textContent = 'Да';
    this.modalConfirm.onclick = () => {
      if (data.onConfirm) {
        data.onConfirm();
      }
      this.eventBus.emit('modal:confirmed', { type: this.currentModal });
      this.close();
    };
  }

  isModalOpen() {
    return this.isOpen;
  }

  getCurrentModal() {
    return this.currentModal;
  }

  destroy() {
    this.eventBus.off('modal:open');
    this.eventBus.off('modal:close');
    this.container.innerHTML = '';
  }
}

export default Modal;