import PlayStatus from '../../../js/domain/entities/PlayStatus.js';

describe('PlayStatus', () => {
  let playStatus;

  beforeEach(() => {
    playStatus = new PlayStatus();
  });

  describe('Конструктор', () => {
    test('должен инициализироваться с параметрами по умолчанию', () => {
      expect(playStatus.isPlaying).toBe(false);
      expect(playStatus.currentBar).toBe(0);
      expect(playStatus.currentBeat).toBe(0);
      expect(playStatus.tempo).toBe(120);
    });

    test('должен создавать новый экземпляр с начальными значениями', () => {
      const anotherPlayStatus = new PlayStatus();
      
      expect(anotherPlayStatus.isPlaying).toBe(false);
      expect(anotherPlayStatus.currentBar).toBe(0);
      expect(anotherPlayStatus.currentBeat).toBe(0);
      expect(anotherPlayStatus.tempo).toBe(120);
    });
  });

  describe('play', () => {
    test('должен устанавливать isPlaying в true', () => {
      playStatus.play();
      
      expect(playStatus.isPlaying).toBe(true);
    });

    test('не должен изменять другие параметры при запуске', () => {
      const originalBar = playStatus.currentBar;
      const originalBeat = playStatus.currentBeat;
      const originalTempo = playStatus.tempo;
      
      playStatus.play();
      
      expect(playStatus.currentBar).toBe(originalBar);
      expect(playStatus.currentBeat).toBe(originalBeat);
      expect(playStatus.tempo).toBe(originalTempo);
    });

    test('должен оставаться в состоянии воспроизведения при повторном вызове', () => {
      playStatus.play();
      playStatus.play();
      
      expect(playStatus.isPlaying).toBe(true);
    });
  });

  describe('pause', () => {
    test('должен устанавливать isPlaying в false', () => {
      playStatus.play();
      playStatus.pause();
      
      expect(playStatus.isPlaying).toBe(false);
    });

    test('не должен изменять другие параметры при паузе', () => {
      playStatus.play();
      playStatus.setCurrentBar(5);
      playStatus.setCurrentBeat(3);
      playStatus.setTempo(140);
      
      const originalBar = playStatus.currentBar;
      const originalBeat = playStatus.currentBeat;
      const originalTempo = playStatus.tempo;
      
      playStatus.pause();
      
      expect(playStatus.currentBar).toBe(originalBar);
      expect(playStatus.currentBeat).toBe(originalBeat);
      expect(playStatus.tempo).toBe(originalTempo);
    });

    test('должен оставаться в состоянии паузы при повторном вызове', () => {
      playStatus.pause();
      playStatus.pause();
      
      expect(playStatus.isPlaying).toBe(false);
    });
  });

  describe('stop', () => {
    test('должен устанавливать isPlaying в false', () => {
      playStatus.play();
      playStatus.stop();
      
      expect(playStatus.isPlaying).toBe(false);
    });

    test('должен сбрасывать currentBar в 0', () => {
      playStatus.setCurrentBar(5);
      playStatus.stop();
      
      expect(playStatus.currentBar).toBe(0);
    });

    test('должен сбрасывать currentBeat в 0', () => {
      playStatus.setCurrentBeat(3);
      playStatus.stop();
      
      expect(playStatus.currentBeat).toBe(0);
    });

    test('не должен изменять tempo', () => {
      playStatus.setTempo(140);
      const originalTempo = playStatus.tempo;
      
      playStatus.stop();
      
      expect(playStatus.tempo).toBe(originalTempo);
    });

    test('должен работать корректно при вызове из состояния паузы', () => {
      playStatus.play();
      playStatus.pause();
      playStatus.setCurrentBar(10);
      playStatus.setCurrentBeat(5);
      
      playStatus.stop();
      
      expect(playStatus.isPlaying).toBe(false);
      expect(playStatus.currentBar).toBe(0);
      expect(playStatus.currentBeat).toBe(0);
    });
  });

  describe('setCurrentBar', () => {
    test('должен устанавливать текущий такт', () => {
      playStatus.setCurrentBar(5);
      
      expect(playStatus.currentBar).toBe(5);
    });

    test('должен устанавливать нулевой такт', () => {
      playStatus.setCurrentBar(0);
      
      expect(playStatus.currentBar).toBe(0);
    });

    test('должен устанавливать отрицательный такт', () => {
      playStatus.setCurrentBar(-1);
      
      expect(playStatus.currentBar).toBe(-1);
    });

    test('должен устанавливать большие значения', () => {
      playStatus.setCurrentBar(1000);
      
      expect(playStatus.currentBar).toBe(1000);
    });

    test('не должен изменять другие параметры', () => {
      const originalBeat = playStatus.currentBeat;
      const originalTempo = playStatus.tempo;
      const originalPlaying = playStatus.isPlaying;
      
      playStatus.setCurrentBar(10);
      
      expect(playStatus.currentBeat).toBe(originalBeat);
      expect(playStatus.tempo).toBe(originalTempo);
      expect(playStatus.isPlaying).toBe(originalPlaying);
    });
  });

  describe('setCurrentBeat', () => {
    test('должен устанавливать текущий удар', () => {
      playStatus.setCurrentBeat(3);
      
      expect(playStatus.currentBeat).toBe(3);
    });

    test('должен устанавливать нулевой удар', () => {
      playStatus.setCurrentBeat(0);
      
      expect(playStatus.currentBeat).toBe(0);
    });

    test('должен устанавливать отрицательный удар', () => {
      playStatus.setCurrentBeat(-1);
      
      expect(playStatus.currentBeat).toBe(-1);
    });

    test('должен устанавливать дробные значения', () => {
      playStatus.setCurrentBeat(2.5);
      
      expect(playStatus.currentBeat).toBe(2.5);
    });

    test('не должен изменять другие параметры', () => {
      const originalBar = playStatus.currentBar;
      const originalTempo = playStatus.tempo;
      const originalPlaying = playStatus.isPlaying;
      
      playStatus.setCurrentBeat(5);
      
      expect(playStatus.currentBar).toBe(originalBar);
      expect(playStatus.tempo).toBe(originalTempo);
      expect(playStatus.isPlaying).toBe(originalPlaying);
    });
  });

  describe('setTempo', () => {
    test('должен устанавливать темп', () => {
      playStatus.setTempo(140);
      
      expect(playStatus.tempo).toBe(140);
    });

    test('должен устанавливать медленный темп', () => {
      playStatus.setTempo(40);
      
      expect(playStatus.tempo).toBe(40);
    });

    test('должен устанавливать быстрый темп', () => {
      playStatus.setTempo(200);
      
      expect(playStatus.tempo).toBe(200);
    });

    test('должен устанавливать очень медленный темп', () => {
      playStatus.setTempo(1);
      
      expect(playStatus.tempo).toBe(1);
    });

    test('должен устанавливать очень быстрый темп', () => {
      playStatus.setTempo(500);
      
      expect(playStatus.tempo).toBe(500);
    });

    test('должен устанавливать дробные значения темпа', () => {
      playStatus.setTempo(120.5);
      
      expect(playStatus.tempo).toBe(120.5);
    });

    test('не должен изменять другие параметры', () => {
      const originalBar = playStatus.currentBar;
      const originalBeat = playStatus.currentBeat;
      const originalPlaying = playStatus.isPlaying;
      
      playStatus.setTempo(150);
      
      expect(playStatus.currentBar).toBe(originalBar);
      expect(playStatus.currentBeat).toBe(originalBeat);
      expect(playStatus.isPlaying).toBe(originalPlaying);
    });
  });

  describe('getTempo', () => {
    test('должен возвращать текущий темп', () => {
      playStatus.setTempo(140);
      
      expect(playStatus.getTempo()).toBe(140);
    });

    test('должен возвращать темп по умолчанию', () => {
      expect(playStatus.getTempo()).toBe(120);
    });

    test('должен возвращать измененный темп', () => {
      playStatus.setTempo(80);
      expect(playStatus.getTempo()).toBe(80);
      
      playStatus.setTempo(160);
      expect(playStatus.getTempo()).toBe(160);
    });
  });

  describe('isCurrentlyPlaying', () => {
    test('должен возвращать false в начальном состоянии', () => {
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
    });

    test('должен возвращать true после вызова play', () => {
      playStatus.play();
      
      expect(playStatus.isCurrentlyPlaying()).toBe(true);
    });

    test('должен возвращать false после вызова pause', () => {
      playStatus.play();
      playStatus.pause();
      
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
    });

    test('должен возвращать false после вызова stop', () => {
      playStatus.play();
      playStatus.stop();
      
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
    });

    test('должен возвращать false после последовательности play-pause-play-pause', () => {
      playStatus.play();
      playStatus.pause();
      playStatus.play();
      playStatus.pause();
      
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
    });
  });

  describe('Сценарии использования', () => {
    test('должен корректно обрабатывать полный цикл воспроизведения', () => {
      // Начальное состояние
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
      expect(playStatus.currentBar).toBe(0);
      expect(playStatus.currentBeat).toBe(0);
      
      // Запуск воспроизведения
      playStatus.play();
      expect(playStatus.isCurrentlyPlaying()).toBe(true);
      
      // Изменение позиции
      playStatus.setCurrentBar(2);
      playStatus.setCurrentBeat(3);
      expect(playStatus.currentBar).toBe(2);
      expect(playStatus.currentBeat).toBe(3);
      
      // Пауза
      playStatus.pause();
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
      expect(playStatus.currentBar).toBe(2);
      expect(playStatus.currentBeat).toBe(3);
      
      // Остановка
      playStatus.stop();
      expect(playStatus.isCurrentlyPlaying()).toBe(false);
      expect(playStatus.currentBar).toBe(0);
      expect(playStatus.currentBeat).toBe(0);
    });

    test('должен корректно обрабатывать изменение темпа во время воспроизведения', () => {
      playStatus.play();
      playStatus.setTempo(140);
      
      expect(playStatus.isCurrentlyPlaying()).toBe(true);
      expect(playStatus.getTempo()).toBe(140);
      
      playStatus.pause();
      expect(playStatus.getTempo()).toBe(140);
    });

    test('должен сохранять темп при остановке', () => {
      playStatus.setTempo(100);
      playStatus.play();
      playStatus.stop();
      
      expect(playStatus.getTempo()).toBe(100);
    });
  });

  describe('Инварианты и бизнес-правила', () => {
    test('должен сохранять целостность данных при операциях', () => {
      const originalTempo = playStatus.tempo;
      
      playStatus.play();
      playStatus.setCurrentBar(5);
      playStatus.setCurrentBeat(3);
      playStatus.pause();
      playStatus.stop();
      
      expect(playStatus.tempo).toBe(originalTempo);
    });

    test('должен корректно обрабатывать граничные значения', () => {
      // Нулевые значения
      playStatus.setCurrentBar(0);
      playStatus.setCurrentBeat(0);
      playStatus.setTempo(0);
      
      expect(playStatus.currentBar).toBe(0);
      expect(playStatus.currentBeat).toBe(0);
      expect(playStatus.tempo).toBe(0);
      
      // Отрицательные значения
      playStatus.setCurrentBar(-1);
      playStatus.setCurrentBeat(-1);
      playStatus.setTempo(-1);
      
      expect(playStatus.currentBar).toBe(-1);
      expect(playStatus.currentBeat).toBe(-1);
      expect(playStatus.tempo).toBe(-1);
    });
  });

  describe('Инкапсуляция данных', () => {
    test('должен предоставлять контролируемый доступ к состоянию', () => {
      // Прямое изменение свойств возможно в JavaScript,
      // но бизнес-логика должна использовать методы
      playStatus.isPlaying = true;
      expect(playStatus.isCurrentlyPlaying()).toBe(true);
      
      playStatus.currentBar = 10;
      expect(playStatus.currentBar).toBe(10);
    });
  });
});