import PlaybackService from '../../../js/domain/services/PlaybackService.js';

describe('PlaybackService', () => {
  let playbackService;
  let mockAudioEngine;
  let mockBarRepository;

  beforeEach(() => {
    // Создаем мок для AudioEngine
    mockAudioEngine = {
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      setTempo: jest.fn(),
      getTempo: jest.fn()
    };

    // Создаем мок для BarRepository
    mockBarRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    playbackService = new PlaybackService(mockAudioEngine, mockBarRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с AudioEngine и BarRepository', () => {
      expect(playbackService.audioEngine).toBe(mockAudioEngine);
      expect(playbackService.barRepository).toBe(mockBarRepository);
    });

    test('должен инициализироваться с параметрами по умолчанию', () => {
      expect(playbackService.isPlaying).toBe(false);
      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);
      expect(playbackService.tempo).toBe(120);
    });

    test('должен выбрасывать ошибку без AudioEngine', () => {
      expect(() => new PlaybackService(null, mockBarRepository)).toThrow('AudioEngine is required');
    });

    test('должен выбрасывать ошибку без BarRepository', () => {
      expect(() => new PlaybackService(mockAudioEngine, null)).toThrow('BarRepository is required');
    });
  });

  describe('play', () => {
    test('должен начинать воспроизведение при остановленном состоянии', async () => {
      const mockBars = [
        { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', beats: 3, beatUnit: 4, chords: [] }
      ];
      
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.play();

      expect(playbackService.isPlaying).toBe(true);
      expect(mockBarRepository.findAll).toHaveBeenCalled();
    });

    test('не должен начинать воспроизведение при уже играющем состоянии', async () => {
      playbackService.isPlaying = true;
      
      await playbackService.play();

      expect(mockBarRepository.findAll).not.toHaveBeenCalled();
      expect(playbackService.isPlaying).toBe(true);
    });

    test('должен останавливать воспроизведение при отсутствии баров', async () => {
      mockBarRepository.findAll.mockResolvedValue([]);

      await playbackService.play();

      expect(playbackService.isPlaying).toBe(false);
      expect(mockBarRepository.findAll).toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки при получении баров', async () => {
      const error = new Error('Repository error');
      mockBarRepository.findAll.mockRejectedValue(error);

      await expect(playbackService.play()).rejects.toThrow('Repository error');
      expect(mockBarRepository.findAll).toHaveBeenCalled();
    });

    test('должен сохранять позицию при начале воспроизведения', async () => {
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      
      playbackService.currentBar = 5;
      playbackService.currentBeat = 3;
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.play();

      expect(playbackService.currentBar).toBe(5);
      expect(playbackService.currentBeat).toBe(3);
      expect(playbackService.isPlaying).toBe(true);
    });
  });

  describe('start', () => {
    test('должен быть псевдонимом для метода play', async () => {
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.start();

      expect(playbackService.isPlaying).toBe(true);
      expect(mockBarRepository.findAll).toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки так же как play', async () => {
      const error = new Error('Repository error');
      mockBarRepository.findAll.mockRejectedValue(error);

      await expect(playbackService.start()).rejects.toThrow('Repository error');
    });
  });

  describe('pause', () => {
    test('должен приостанавливать воспроизведение', () => {
      playbackService.isPlaying = true;

      playbackService.pause();

      expect(playbackService.isPlaying).toBe(false);
    });

    test('должен оставаться в состоянии паузы при повторном вызове', () => {
      playbackService.isPlaying = false;

      playbackService.pause();

      expect(playbackService.isPlaying).toBe(false);
    });

    test('не должен изменять другие параметры при паузе', () => {
      playbackService.isPlaying = true;
      playbackService.currentBar = 3;
      playbackService.currentBeat = 2;
      playbackService.tempo = 140;

      playbackService.pause();

      expect(playbackService.currentBar).toBe(3);
      expect(playbackService.currentBeat).toBe(2);
      expect(playbackService.tempo).toBe(140);
    });
  });

  describe('stop', () => {
    test('должен останавливать воспроизведение', () => {
      playbackService.isPlaying = true;

      playbackService.stop();

      expect(playbackService.isPlaying).toBe(false);
    });

    test('должен сбрасывать текущий такт', () => {
      playbackService.currentBar = 5;

      playbackService.stop();

      expect(playbackService.currentBar).toBe(0);
    });

    test('должен сбрасывать текущий удар', () => {
      playbackService.currentBeat = 3;

      playbackService.stop();

      expect(playbackService.currentBeat).toBe(0);
    });

    test('не должен изменять темп', () => {
      playbackService.tempo = 140;

      playbackService.stop();

      expect(playbackService.tempo).toBe(140);
    });

    test('должен работать корректно при вызове из состояния паузы', () => {
      playbackService.isPlaying = true;
      playbackService.currentBar = 10;
      playbackService.currentBeat = 5;

      playbackService.stop();

      expect(playbackService.isPlaying).toBe(false);
      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);
    });

    test('должен корректно работать при повторных вызовах', () => {
      playbackService.isPlaying = true;
      playbackService.currentBar = 10;
      playbackService.currentBeat = 5;

      playbackService.stop();
      playbackService.stop();

      expect(playbackService.isPlaying).toBe(false);
      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);
    });
  });

  describe('setTempo', () => {
    test('должен устанавливать новый темп', () => {
      playbackService.setTempo(140);

      expect(playbackService.tempo).toBe(140);
    });

    test('должен устанавливать медленный темп', () => {
      playbackService.setTempo(60);

      expect(playbackService.tempo).toBe(60);
    });

    test('должен устанавливать быстрый темп', () => {
      playbackService.setTempo(200);

      expect(playbackService.tempo).toBe(200);
    });

    test('должен устанавливать граничные значения темпа', () => {
      playbackService.setTempo(40);
      expect(playbackService.tempo).toBe(40);

      playbackService.setTempo(300);
      expect(playbackService.tempo).toBe(300);
    });

    test('должен устанавливать дробные значения темпа', () => {
      playbackService.setTempo(120.5);

      expect(playbackService.tempo).toBe(120.5);
    });

    test('не должен изменять другие параметры', () => {
      const originalBar = playbackService.currentBar;
      const originalBeat = playbackService.currentBeat;
      const originalPlaying = playbackService.isPlaying;

      playbackService.setTempo(150);

      expect(playbackService.currentBar).toBe(originalBar);
      expect(playbackService.currentBeat).toBe(originalBeat);
      expect(playbackService.isPlaying).toBe(originalPlaying);
    });
  });

  describe('getTempo', () => {
    test('должен возвращать текущий темп', () => {
      playbackService.tempo = 140;

      expect(playbackService.getTempo()).toBe(140);
    });

    test('должен возвращать темп по умолчанию', () => {
      expect(playbackService.getTempo()).toBe(120);
    });

    test('должен возвращать измененный темп', () => {
      playbackService.setTempo(80);
      expect(playbackService.getTempo()).toBe(80);

      playbackService.setTempo(160);
      expect(playbackService.getTempo()).toBe(160);
    });
  });

  describe('setCurrentBar', () => {
    test('должен устанавливать текущий такт', () => {
      playbackService.setCurrentBar(5);

      expect(playbackService.currentBar).toBe(5);
    });

    test('должен устанавливать нулевой такт', () => {
      playbackService.setCurrentBar(0);

      expect(playbackService.currentBar).toBe(0);
    });

    test('должен устанавливать отрицательный такт', () => {
      playbackService.setCurrentBar(-1);

      expect(playbackService.currentBar).toBe(-1);
    });

    test('не должен изменять другие параметры', () => {
      const originalBeat = playbackService.currentBeat;
      const originalTempo = playbackService.tempo;
      const originalPlaying = playbackService.isPlaying;

      playbackService.setCurrentBar(10);

      expect(playbackService.currentBeat).toBe(originalBeat);
      expect(playbackService.tempo).toBe(originalTempo);
      expect(playbackService.isPlaying).toBe(originalPlaying);
    });
  });

  describe('setCurrentBeat', () => {
    test('должен устанавливать текущий удар', () => {
      playbackService.setCurrentBeat(3);

      expect(playbackService.currentBeat).toBe(3);
    });

    test('должен устанавливать нулевой удар', () => {
      playbackService.setCurrentBeat(0);

      expect(playbackService.currentBeat).toBe(0);
    });

    test('должен устанавливать отрицательный удар', () => {
      playbackService.setCurrentBeat(-1);

      expect(playbackService.currentBeat).toBe(-1);
    });

    test('должен устанавливать дробные значения', () => {
      playbackService.setCurrentBeat(2.5);

      expect(playbackService.currentBeat).toBe(2.5);
    });

    test('не должен изменять другие параметры', () => {
      const originalBar = playbackService.currentBar;
      const originalTempo = playbackService.tempo;
      const originalPlaying = playbackService.isPlaying;

      playbackService.setCurrentBeat(5);

      expect(playbackService.currentBar).toBe(originalBar);
      expect(playbackService.tempo).toBe(originalTempo);
      expect(playbackService.isPlaying).toBe(originalPlaying);
    });
  });

  describe('isCurrentlyPlaying', () => {
    test('должен возвращать false в начальном состоянии', () => {
      expect(playbackService.isCurrentlyPlaying()).toBe(false);
    });

    test('должен возвращать true после вызова play', async () => {
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.play();

      expect(playbackService.isCurrentlyPlaying()).toBe(true);
    });

    test('должен возвращать false после вызова pause', () => {
      playbackService.isPlaying = true;

      playbackService.pause();

      expect(playbackService.isCurrentlyPlaying()).toBe(false);
    });

    test('должен возвращать false после вызова stop', () => {
      playbackService.isPlaying = true;

      playbackService.stop();

      expect(playbackService.isCurrentlyPlaying()).toBe(false);
    });

    test('должен возвращать false после последовательности play-pause-play-pause', () => {
      playbackService.isPlaying = true;

      playbackService.pause();
      expect(playbackService.isCurrentlyPlaying()).toBe(false);

      playbackService.play();
      expect(playbackService.isCurrentlyPlaying()).toBe(true);

      playbackService.pause();
      expect(playbackService.isCurrentlyPlaying()).toBe(false);
    });
  });

  describe('Сценарии использования', () => {
    test('должен корректно обрабатывать полный цикл воспроизведения', async () => {
      const mockBars = [
        { id: 'bar-1', beats: 4, beatUnit: 4, chords: [] },
        { id: 'bar-2', beats: 3, beatUnit: 4, chords: [] }
      ];
      
      // Начальное состояние
      expect(playbackService.isCurrentlyPlaying()).toBe(false);
      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);

      // Запуск воспроизведения
      mockBarRepository.findAll.mockResolvedValue(mockBars);
      await playbackService.play();
      expect(playbackService.isCurrentlyPlaying()).toBe(true);

      // Изменение позиции
      playbackService.setCurrentBar(1);
      playbackService.setCurrentBeat(2);
      expect(playbackService.currentBar).toBe(1);
      expect(playbackService.currentBeat).toBe(2);

      // Изменение темпа
      playbackService.setTempo(140);
      expect(playbackService.getTempo()).toBe(140);
      expect(playbackService.isCurrentlyPlaying()).toBe(true);

      // Пауза
      playbackService.pause();
      expect(playbackService.isCurrentlyPlaying()).toBe(false);
      expect(playbackService.currentBar).toBe(1);
      expect(playbackService.currentBeat).toBe(2);

      // Остановка
      playbackService.stop();
      expect(playbackService.isCurrentlyPlaying()).toBe(false);
      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);
      expect(playbackService.getTempo()).toBe(140);
    });

    test('должен корректно обрабатывать изменение темпа во время воспроизведения', async () => {
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.play();
      expect(playbackService.isCurrentlyPlaying()).toBe(true);

      playbackService.setTempo(140);
      expect(playbackService.getTempo()).toBe(140);
      expect(playbackService.isCurrentlyPlaying()).toBe(true);

      playbackService.pause();
      expect(playbackService.getTempo()).toBe(140);
    });

    test('должен сохранять темп при остановке', async () => {
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.play();
      playbackService.setTempo(100);
      playbackService.stop();

      expect(playbackService.getTempo()).toBe(100);
    });

    test('должен корректно обрабатывать пустой список баров', async () => {
      mockBarRepository.findAll.mockResolvedValue([]);

      await playbackService.play();

      expect(playbackService.isCurrentlyPlaying()).toBe(false);
      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);
    });
  });

  describe('Инварианты и бизнес-правила', () => {
    test('должен сохранять целостность данных при операциях', async () => {
      const originalTempo = playbackService.tempo;
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      await playbackService.play();
      playbackService.setCurrentBar(5);
      playbackService.setCurrentBeat(3);
      playbackService.pause();
      playbackService.stop();

      expect(playbackService.tempo).toBe(originalTempo);
    });

    test('должен корректно обрабатывать граничные значения', () => {
      // Нулевые значения
      playbackService.setCurrentBar(0);
      playbackService.setCurrentBeat(0);
      playbackService.setTempo(0);

      expect(playbackService.currentBar).toBe(0);
      expect(playbackService.currentBeat).toBe(0);
      expect(playbackService.tempo).toBe(0);

      // Отрицательные значения
      playbackService.setCurrentBar(-1);
      playbackService.setCurrentBeat(-1);
      playbackService.setTempo(-1);

      expect(playbackService.currentBar).toBe(-1);
      expect(playbackService.currentBeat).toBe(-1);
      expect(playbackService.tempo).toBe(-1);

      // Очень большие значения
      playbackService.setCurrentBar(1000);
      playbackService.setCurrentBeat(1000);
      playbackService.setTempo(1000);

      expect(playbackService.currentBar).toBe(1000);
      expect(playbackService.currentBeat).toBe(1000);
      expect(playbackService.tempo).toBe(1000);
    });
  });

  describe('Интеграция с AudioEngine', () => {
    test('должен корректно взаимодействовать с AudioEngine при необходимости', async () => {
      const mockBars = [{ id: 'bar-1', beats: 4, beatUnit: 4, chords: [] }];
      mockBarRepository.findAll.mockResolvedValue(mockBars);

      // В текущей реализации AudioEngine не используется напрямую,
      // но тест проверяет, что сервис правильно инициализирован
      await playbackService.play();

      expect(playbackService.audioEngine).toBe(mockAudioEngine);
      expect(playbackService.isPlaying).toBe(true);
    });
  });
});