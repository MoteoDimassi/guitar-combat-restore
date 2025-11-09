import { EventBus } from '../EventBus.js';
import { EventTypes } from '../EventTypes.js';
import { EventMiddleware } from '../EventMiddleware.js';
import { EventAggregator } from '../EventAggregator.js';

// Пример использования EventBus
export function runEventBusExample() {
  console.log('=== EventBus Example ===');

  // Инициализация EventBus
  const eventBus = new EventBus({ debug: true, maxHistorySize: 200 });

  // Добавление middleware
  eventBus.use(EventMiddleware.logger({ 
    logLevel: 'info', 
    excludeEvents: ['mousemove'] 
  }));
  
  eventBus.use(EventMiddleware.performance({ threshold: 50 }));
  
  eventBus.use(EventMiddleware.validator({
    'tempo:changed': (data) => data.bpm >= 40 && data.bpm <= 300
  }));

  // Подписка на события
  const unsubscribeTempo = eventBus.on('tempo:changed', (event) => {
    console.log(`Tempo changed to ${event.data.bpm}`);
  });

  // Подписка с приоритетом
  eventBus.on('playback:started', (event) => {
    console.log('High priority handler');
  }, { priority: 10 });

  eventBus.on('playback:started', (event) => {
    console.log('Low priority handler');
  }, { priority: 1 });

  // Одноразовая подписка
  eventBus.once('application:initialized', (event) => {
    console.log('Application initialized!');
  });

  // Генерация событий
  eventBus.emit('tempo:changed', { bpm: 120 }, { source: 'TempoControl' });
  eventBus.emit('playback:started', { barIndex: 0 });
  eventBus.emit('application:initialized', { version: '1.0.0' });

  // Агрегация событий
  const aggregator = new EventAggregator(eventBus);
  aggregator.aggregateByTime('arrow:clicked', 500, (events) => {
    console.log(`User clicked ${events.length} arrows in 500ms`);
  });

  // Имитация множественных кликов
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      eventBus.emit('arrow:clicked', { arrowIndex: i });
    }, i * 100);
  }

  // Получение статистики
  setTimeout(() => {
    console.log('EventBus Statistics:', eventBus.getStats());
    console.log('Event History:', eventBus.getHistory(5));
  }, 1000);

  // Отписка
  setTimeout(() => {
    unsubscribeTempo();
    console.log('Unsubscribed from tempo changes');
  }, 2000);

  // Демонстрация обработки ошибок
  eventBus.on('error:test', (event) => {
    throw new Error('Test error in event handler');
  });

  eventBus.emit('error:test', { test: true });

  return { eventBus, aggregator };
}

// Пример использования с EventTypes
export function runEventTypesExample() {
  console.log('\n=== EventTypes Example ===');

  const eventBus = new EventBus({ debug: true });

  // Использование предопределенных типов событий
  eventBus.on(EventTypes.TEMPO_CHANGED, (event) => {
    console.log(`Tempo changed via EventTypes: ${event.data.bpm}`);
  });

  eventBus.on(EventTypes.PLAYBACK_STARTED, (event) => {
    console.log(`Playback started at bar: ${event.data.barIndex}`);
  });

  eventBus.emit(EventTypes.TEMPO_CHANGED, { bpm: 140 });
  eventBus.emit(EventTypes.PLAYBACK_STARTED, { barIndex: 2 });

  return eventBus;
}

// Пример использования middleware
export function runMiddlewareExample() {
  console.log('\n=== Middleware Example ===');

  const eventBus = new EventBus({ debug: true });

  // Middleware для трансформации данных
  eventBus.use(EventMiddleware.transformer({
    'tempo:changed': (data) => {
      // Преобразуем BPM в BPM и максимальный BPM
      return {
        ...data,
        maxBpm: 300,
        percentage: (data.bpm / 300) * 100
      };
    }
  }));

  // Middleware для фильтрации
  eventBus.use(EventMiddleware.filter((event) => {
    // Пропускаем только события с данными
    return event.data !== null && event.data !== undefined;
  }));

  // Middleware для дебаунсинга
  eventBus.use(EventMiddleware.debounce(300));

  eventBus.on('tempo:changed', (event) => {
    console.log('Transformed tempo data:', event.data);
  });

  // Генерируем несколько событий быстро
  eventBus.emit('tempo:changed', { bpm: 100 });
  eventBus.emit('tempo:changed', { bpm: 110 });
  eventBus.emit('tempo:changed', { bpm: 120 });

  return eventBus;
}

// Пример использования агрегации
export function runAggregatorExample() {
  console.log('\n=== Aggregator Example ===');

  const eventBus = new EventBus({ debug: true });
  const aggregator = new EventAggregator(eventBus);

  // Агрегация по количеству
  aggregator.aggregateByCount('chord:updated', 3, (events) => {
    console.log(`Aggregated ${events.length} chord updates:`, 
      events.map(e => e.data.chord));
  });

  // Агрегация по условию
  aggregator.aggregateByCondition('tempo:changed', (events) => {
    // Агрегируем, если средний темп превышает 130
    const avgTempo = events.reduce((sum, e) => sum + e.data.bpm, 0) / events.length;
    return avgTempo > 130;
  }, (events) => {
    console.log(`High tempo aggregation detected! Average: ${
      events.reduce((sum, e) => sum + e.data.bpm, 0) / events.length
    } BPM`);
  });

  // Генерируем события для демонстрации
  eventBus.emit('chord:updated', { chord: 'C' });
  eventBus.emit('chord:updated', { chord: 'Am' });
  eventBus.emit('chord:updated', { chord: 'F' });

  eventBus.emit('tempo:changed', { bpm: 120 });
  eventBus.emit('tempo:changed', { bpm: 140 });
  eventBus.emit('tempo:changed', { bpm: 150 });

  return { eventBus, aggregator };
}

// Запуск всех примеров
export function runAllExamples() {
  const example1 = runEventBusExample();
  const example2 = runEventTypesExample();
  const example3 = runMiddlewareExample();
  const example4 = runAggregatorExample();

  return {
    eventBusExample: example1,
    eventTypesExample: example2,
    middlewareExample: example3,
    aggregatorExample: example4
  };
}

// Экспорт для использования в других модулях
export default {
  runEventBusExample,
  runEventTypesExample,
  runMiddlewareExample,
  runAggregatorExample,
  runAllExamples
};