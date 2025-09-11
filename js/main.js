// Точка входа приложения - инициализирует все компоненты и управляет глобальным состоянием
import { BeatRow } from './components/BeatRow.js';
import { Controls } from './components/Controls.js';
import { Playback } from './components/Playback.js';
import { ExportUtils } from './utils/ExportUtils.js';
import { ImportUtils } from './utils/ImportUtils.js';
import { Metronome } from './components/Metronome.js';
import { Modal } from './components/Modal.js';
import { MobileMenu } from './components/MobileMenu.js';
import { TemplateManager } from './components/TemplateManager.js';

// Проверка поддержки Web Audio API
if (!window.AudioContext && !window.webkitAudioContext) {
  console.warn('Web Audio API не поддерживается в этом браузере. Некоторые функции могут не работать.');
}

// Функция для обработки изменения размера окна
function handleResize() {
  // Перерендерим компоненты при изменении размера для адаптации
  if (window.app && window.app.beatRow) {
    window.app.beatRow.render();
  }
}


// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', async () => {
  // Создание экземпляров компонентов
  const beatRow = new BeatRow();
  const controls = new Controls(beatRow);
  const playback = new Playback(beatRow);
  const exportUtils = new ExportUtils(beatRow);
  const importUtils = new ImportUtils(beatRow);
  const metronome = new Metronome();
  const templateManager = new TemplateManager(beatRow, controls);

  // Инициализация компонентов
  beatRow.init();
  controls.init();
  playback.init();
  exportUtils.init();
  importUtils.init();
  metronome.init();
  templateManager.init();

  // Инициализация мобильного меню
  const mobileMenu = new MobileMenu();
  mobileMenu.init();

  // Инициализация модального окна
  const modal = new Modal();
  modal.init();

  // Глобальное состояние приложения
  window.app = {
    beatRow,
    controls,
    playback,
    exportUtils,
    importUtils,
    metronome,
    modal,
    templateManager,
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
  
  // Добавляем обработчик изменения размера окна для адаптивности
  window.addEventListener('resize', handleResize);

  // Добавляем обработчик для ссылки политики конфиденциальности в футере
  
  // Обработчик клика делегируем на документ
document.addEventListener('click', (e) => {
  const link = e.target.closest('footer a[href="#"]');
  if (!link) return;

  if (link.textContent.includes('Политика конфиденциальности')) {
    e.preventDefault();
    if (window.app && window.app.modal) {
      window.app.modal.showPrivacyPolicy();
      console.log('Модальное окно открыто', window.app.modal);
    }
  }
  
  if (link.textContent.includes('Условия использования')) {
    e.preventDefault();
    if (window.app && window.app.modal) {
      window.app.modal.showTermsOfUse();
    }
  }
});
});
