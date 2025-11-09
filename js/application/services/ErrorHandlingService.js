class ErrorHandlingService {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
    this.errorHandlers = new Map();
    this.errorHistory = [];
    
    this.init();
  }

  init() {
    this.setupDefaultHandlers();
    this.subscribeToEvents();
  }

  setupDefaultHandlers() {
    // Регистрируем обработчики для разных типов ошибок
    this.registerHandler('audio', this.handleAudioError.bind(this));
    this.registerHandler('storage', this.handleStorageError.bind(this));
    this.registerHandler('network', this.handleNetworkError.bind(this));
    this.registerHandler('validation', this.handleValidationError.bind(this));
    this.registerHandler('general', this.handleGeneralError.bind(this));
  }

  subscribeToEvents() {
    this.eventBus.on('error:occurred', (data) => {
      this.handleError(data.error, data.context, data.type);
    });

    // Глобальные обработчики ошибок
    window.addEventListener('error', (event) => {
      this.handleError(event.error, { 
        filename: event.filename, 
        lineno: event.lineno, 
        colno: event.colno 
      }, 'javascript');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, { promise: event.promise }, 'promise');
    });
  }

  registerHandler(type, handler) {
    this.errorHandlers.set(type, handler);
  }

  unregisterHandler(type) {
    this.errorHandlers.delete(type);
  }

  handleError(error, context = {}, type = 'general') {
    const errorInfo = {
      error,
      context,
      type,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId()
    };

    // Добавляем в историю ошибок
    this.errorHistory.push(errorInfo);
    
    // Ограничиваем размер истории
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    // Логируем ошибку
    this.logError(errorInfo);

    // Вызываем соответствующий обработчик
    const handler = this.errorHandlers.get(type) || this.errorHandlers.get('general');
    if (handler) {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Уведомляем об ошибке
    this.eventBus.emit('error:handled', errorInfo);
  }

  handleAudioError(errorInfo) {
    console.error('Audio error:', errorInfo);
    
    // Показываем пользователю сообщение об ошибке аудио
    this.showUserError('Произошла ошибка аудио системы. Проверьте настройки звука.');
    
    // Пытаемся переинициализировать аудио систему
    try {
      const audioEngine = this.serviceContainer.get('audioEngine');
      audioEngine.suspend();
      setTimeout(() => {
        audioEngine.resume();
      }, 1000);
    } catch (e) {
      console.error('Failed to restart audio system:', e);
    }
  }

  handleStorageError(errorInfo) {
    console.error('Storage error:', errorInfo);
    
    // Показываем пользователю сообщение об ошибке хранилища
    this.showUserError('Не удалось сохранить данные. Попробуйте обновить страницу.');
    
    // Пытаемся переключиться на альтернативное хранилище
    try {
      const fileStorageAdapter = this.serviceContainer.get('fileStorageAdapter');
      // Здесь можно переключиться на файловое хранилище
    } catch (e) {
      console.error('Failed to switch to alternative storage:', e);
    }
  }

  handleNetworkError(errorInfo) {
    console.error('Network error:', errorInfo);
    
    // Показываем пользователю сообщение об ошибке сети
    this.showUserError('Проблемы с сетевым соединением. Проверьте подключение к интернету.');
  }

  handleValidationError(errorInfo) {
    console.error('Validation error:', errorInfo);
    
    // Показываем пользователю сообщение об ошибке валидации
    this.showUserError('Введены некорректные данные. Проверьте форму и попробуйте снова.');
  }

  handleGeneralError(errorInfo) {
    console.error('General error:', errorInfo);
    
    // Показываем общее сообщение об ошибке
    this.showUserError('Произошла непредвиденная ошибка. Попробуйте обновить страницу.');
  }

  logError(errorInfo) {
    const logMessage = `[${errorInfo.timestamp}] ${errorInfo.type.toUpperCase()}: ${errorInfo.error.message || errorInfo.error}`;
    
    if (errorInfo.context) {
      console.group(logMessage);
      console.error('Error:', errorInfo.error);
      console.error('Context:', errorInfo.context);
      console.groupEnd();
    } else {
      console.error(logMessage, errorInfo.error);
    }
  }

  showUserError(message) {
    // Создаем временное уведомление об ошибке
    const errorNotification = document.createElement('div');
    errorNotification.className = 'error-notification';
    errorNotification.textContent = message;
    
    document.body.appendChild(errorNotification);
    
    // Показываем уведомление
    setTimeout(() => {
      errorNotification.classList.add('show');
    }, 100);
    
    // Скрываем и удаляем через 5 секунд
    setTimeout(() => {
      errorNotification.classList.remove('show');
      setTimeout(() => {
        if (errorNotification.parentNode) {
          errorNotification.parentNode.removeChild(errorNotification);
        }
      }, 300);
    }, 5000);
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getErrorHistory() {
    return [...this.errorHistory];
  }

  getErrorsByType(type) {
    return this.errorHistory.filter(errorInfo => errorInfo.type === type);
  }

  clearErrorHistory() {
    this.errorHistory = [];
  }

  exportErrorHistory() {
    const data = {
      exportDate: new Date().toISOString(),
      errors: this.errorHistory
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  destroy() {
    this.eventBus.off('error:occurred');
    this.errorHandlers.clear();
    this.errorHistory = [];
  }
}

export default ErrorHandlingService;