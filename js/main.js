// Точка входа приложения - инициализирует все компоненты и управляет глобальным состоянием
import { BeatRow } from './components/BeatRow.js';
import { Controls } from './components/Controls.js';
import { Playback } from './components/Playback.js';
import { ExportUtils } from './utils/ExportUtils.js';
import { Metronome } from './components/Metronome.js';

// Проверка поддержки Web Audio API
if (!window.AudioContext && !window.webkitAudioContext) {
  console.warn('Web Audio API не поддерживается в этом браузере. Некоторые функции могут не работать.');
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', async () => {
  // Создание экземпляров компонентов
  const beatRow = new BeatRow();
  const controls = new Controls(beatRow);
  const playback = new Playback(beatRow);
  const exportUtils = new ExportUtils(beatRow);
  const metronome = new Metronome();

  // Инициализация компонентов
  beatRow.init();
  controls.init();
  playback.init();
  exportUtils.init();
  metronome.init();

  // Глобальное состояние приложения
  window.app = {
    beatRow,
    controls,
    playback,
    exportUtils,
    metronome,
    state: {
      count: 8,
      beats: [],
      playing: false,
      currentIndex: 0,
      bpm: 90,
      speed: 100,
      chords: []
    }
  };

  // Установка начальных значений
  controls.setCount(8);
  controls.updateBpmLabel();
  
  // Инициализация метронома с правильным количеством стрелочек
  metronome.setBeatCount(8);
  
  // Добаваем обработчик поля ввода аккордов
  const chordsInput = document.getElementById('chordsInput');
  if (chordsInput) {
    // Обновляем аккорды при вводе
    chordsInput.addEventListener('input', () => {
      const chordsString = chordsInput.value;
      if (window.app && window.app.metronome) {
        window.app.metronome.updateChords(chordsString);
      }
    });
    
    // Инициализируем аккорды при загрузке
    window.app.metronome.updateChords(chordsInput.value);
  }
});
