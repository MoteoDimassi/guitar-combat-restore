class GetBarsQuery {
  constructor(eventBus, serviceContainer) {
    this.eventBus = eventBus;
    this.serviceContainer = serviceContainer;
  }

  async execute(params = {}) {
    try {
      this.validate(params);
      
      const barService = this.serviceContainer.get('barService');
      
      let bars;
      
      if (params.barId) {
        // Получаем конкретный такт
        bars = await barService.getBarById(params.barId);
      } else if (params.templateId) {
        // Получаем такты для конкретного шаблона
        bars = await this.getBarsByTemplateId(params.templateId);
      } else {
        // Получаем все такты
        bars = await barService.getAllBars();
      }
      
      return bars;
    } catch (error) {
      console.error('Failed to get bars:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось получить такты',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async getBarsByTemplateId(templateId) {
    const barRepository = this.serviceContainer.get('barRepository');
    return await barRepository.findByTemplateId(templateId);
  }

  async executeByTimeSignature(beats, beatUnit) {
    try {
      if (!beats || typeof beats !== 'number' || beats < 1) {
        throw new Error('beats must be a positive number');
      }
      
      if (!beatUnit || typeof beatUnit !== 'number' || beatUnit < 1) {
        throw new Error('beatUnit must be a positive number');
      }
      
      const barService = this.serviceContainer.get('barService');
      const allBars = await barService.getAllBars();
      
      // Ищем такты с указанным размером
      const bars = allBars.filter(bar => 
        bar.beats === beats && bar.beatUnit === beatUnit
      );
      
      return bars;
    } catch (error) {
      console.error(`Failed to get bars by time signature ${beats}/${beatUnit}:`, error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось найти такты с указанным размером',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeByOrder(order) {
    try {
      if (order === undefined || typeof order !== 'number' || order < 0) {
        throw new Error('order must be a non-negative number');
      }
      
      const barService = this.serviceContainer.get('barService');
      const allBars = await barService.getAllBars();
      
      // Ищем такт по порядковому номеру
      const bar = allBars.find(bar => bar.order === order);
      
      return bar || null;
    } catch (error) {
      console.error(`Failed to get bar by order ${order}:`, error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось найти такт с указанным порядковым номером',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeCount(params = {}) {
    try {
      const bars = await this.execute(params);
      
      if (Array.isArray(bars)) {
        return bars.length;
      } else if (bars) {
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Failed to get bars count:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось получить количество тактов',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeMaxOrder() {
    try {
      const barRepository = this.serviceContainer.get('barRepository');
      return await barRepository.getMaxOrder();
    } catch (error) {
      console.error('Failed to get max order:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось получить максимальный порядковый номер',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  async executeWithChords(params = {}) {
    try {
      const bars = await this.execute(params);
      
      if (!Array.isArray(bars)) {
        return bars ? [bars] : [];
      }
      
      // Для каждого такта получаем связанные аккорды
      const chordRepository = this.serviceContainer.get('chordRepository');
      
      for (const bar of bars) {
        bar.chords = await chordRepository.findByBarId(bar.id);
      }
      
      return bars;
    } catch (error) {
      console.error('Failed to get bars with chords:', error);
      this.eventBus.emit('error:occurred', { 
        message: 'Не удалось получить такты с аккордами',
        error,
        type: 'storage'
      });
      
      throw error;
    }
  }

  validate(params) {
    if (params.barId && typeof params.barId !== 'string') {
      throw new Error('barId must be a string');
    }
    
    if (params.templateId && typeof params.templateId !== 'string') {
      throw new Error('templateId must be a string');
    }
    
    return true;
  }

  canExecute(params) {
    try {
      this.validate(params);
      return true;
    } catch (error) {
      console.error('GetBarsQuery validation failed:', error);
      return false;
    }
  }

  getDescription() {
    return 'Get bars from storage by various criteria';
  }
}

export default GetBarsQuery;