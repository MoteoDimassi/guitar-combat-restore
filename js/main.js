/**
 * @fileoverview Main entry point of the Guitar Combat application.
 * Initializes all components, manages global state, and handles application lifecycle events.
 * This file serves as the central orchestrator for the guitar rhythm training application.
 */

import { BeatRow } from './components/BeatRow.js';
import { Controls } from './components/Controls.js';
import { Playback } from './components/Playback.js';
import { ExportUtils } from './utils/ExportUtils.js';
import { ImportUtils } from './utils/ImportUtils.js';
import { Metronome } from './components/Metronome.js';
import { Modal } from './components/Modal.js';
import { MobileMenu } from './components/MobileMenu.js';
import { TemplateManager } from './components/TemplateManager.js';
import { ChordDisplay } from './components/ChordDisplay.js';
import { SyllableDragDrop } from './components/SyllableDragDrop.js';
import { Settings } from './components/Settings.js';
import { BarManager } from './managers/BarManager.js';
import { BarSyllableDisplay } from './components/BarSyllableDisplay.js';
import { ChordBarManager } from './components/ChordBarManager.js';
import { ChordManager } from './components/ChordManager.js';
import { LineNavigation } from './components/LineNavigation.js';
import { PlaybackSync } from './components/PlaybackSync.js';

// Проверка поддержки Web Audio API
if (!window.AudioContext && !window.webkitAudioContext) {
  console.warn('Web Audio API не поддерживается в этом браузере. Некоторые функции могут не работать.');
}

/**
 * Handles window resize events to adapt the application layout.
 * Re-renders components to ensure proper responsiveness on different screen sizes.
 * Called automatically when the window is resized.
 *
 * @function handleResize
 */
function handleResize() {
  // Re-render beat row component to adapt to new screen size
  if (window.app && window.app.beatRow) {
    window.app.beatRow.render();
  }
}


/**
 * Main application initialization function.
 * Sets up all components, initializes global state, and binds event handlers.
 * Called when the DOM content has finished loading.
 *
 * @async
 * @event DOMContentLoaded
 * @param {Event} event - DOM content loaded event
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Create component instances
  const beatRow = new BeatRow();
  const controls = new Controls(beatRow);
  const playback = new Playback(beatRow);
  const exportUtils = new ExportUtils(beatRow);
  const importUtils = new ImportUtils(beatRow);
  const metronome = new Metronome();
  const chordDisplay = new ChordDisplay();
  const templateManager = new TemplateManager(beatRow, controls);
  const syllableDragDrop = new SyllableDragDrop(beatRow);
  const settings = new Settings();
  const barManager = new BarManager();
  const barSyllableDisplay = new BarSyllableDisplay(beatRow, barManager);
  const chordManager = new ChordManager();
  const chordBarManager = new ChordBarManager(barManager, chordManager, chordDisplay, beatRow);
  const lineNavigation = new LineNavigation(barManager, barSyllableDisplay);
  const playbackSync = new PlaybackSync(beatRow, barManager, barSyllableDisplay, chordDisplay, chordBarManager);

  // Инициализация компонентов
  beatRow.init();
  controls.init();
  playback.init();
  exportUtils.init();
  importUtils.init();
  metronome.init();
  chordDisplay.init();
  templateManager.init();
  syllableDragDrop.init();
  settings.init();
  barSyllableDisplay.init();
  playbackSync.init();

  // Инициализация мобильного меню
  const mobileMenu = new MobileMenu();
  mobileMenu.init();

  // Инициализация модального окна
  const modal = new Modal();
  modal.init();
  
  // Связываем обновление drop-зон с рендерингом beatRow
  beatRow.setOnRenderComplete(() => {
    syllableDragDrop.updateDropZones();
  });

  // Глобальное состояние приложения
  window.app = {
    beatRow,
    controls,
    playback,
    exportUtils,
    importUtils,
    metronome,
    chordDisplay,
    modal,
    templateManager,
    syllableDragDrop,
    settings,
    barManager,
    barSyllableDisplay,
    chordManager,
    chordBarManager,
    lineNavigation,
    playbackSync,
    state: {
      count: 8,
      beats: [],
      playing: false,
      currentIndex: 0,
      bpm: 90,
      speed: 100,
      chords: [],
      currentBarIndex: 0 // Индекс текущего активного такта
    }
  };

  // Установка начальных значений
  controls.setCount(8);
  controls.updateBpmLabel();
  
  // Инициализация метронома с правильным количеством стрелочек
  metronome.setBeatCount(8);
  
  // Загружаем сохраненные позиции слогов
  syllableDragDrop.loadSyllablePositions();
  syllableDragDrop.loadBarSyllablePositions();
  
  // Добаваем обработчик поля ввода аккордов
  const chordsInput = document.getElementById('chordsInput');
  if (chordsInput) {
    // Обновляем аккорды при вводе
    chordsInput.addEventListener('input', () => {
      const chordsString = chordsInput.value;

      // Обновляем аккорды в метрономе и пересчитываем все карты
      if (window.app && window.app.metronome) {
        const currentBeatCount = window.app.metronome.getActualBeatCount();
        window.app.metronome.updateChords(chordsString);

        // Если воспроизведение активно, нужно пересчитать текущую позицию
        if (window.app.playback && window.app.playback.isPlaying()) {
          // Получаем текущую позицию для пересчета
          const currentIndex = window.app.state.currentIndex;
          const ratio = window.app.metronome.getBeatRatio();
          const beatIndex = Math.floor(currentIndex / ratio);

          // Обновляем текущую позицию воспроизведения с новыми аккордами
          if (window.app.metronome.onBeatCallback) {
            const arrowIndex = currentIndex;
            window.app.metronome.updateChordDisplay(arrowIndex, beatIndex);
          }
        }
      }

      // Обновляем отображение аккордов
      if (window.app && window.app.chordDisplay) {
        const chords = window.app.metronome.getChords();
        if (chords && chords.length > 0) {
          window.app.chordDisplay.setChords(chords[0], chords[1] || chords[0]);
        } else {
          window.app.chordDisplay.setChords('--', '--');
        }
      }
    });

    // Инициализируем аккорды при загрузке
    window.app.metronome.updateChords(chordsInput.value);

    // Показываем начальные аккорды сразу при загрузке
    if (window.app && window.app.chordDisplay) {
      // Показываем ChordDisplay (убираем класс hidden)
      window.app.chordDisplay.show();

      // Устанавливаем текущий аккорд как первый из списка
      const chords = window.app.metronome.getChords();
      if (chords && chords.length > 0) {
        // Устанавливаем первый аккорд как текущий
        window.app.chordDisplay.setChords(chords[0], chords[1] || chords[0]);
      }
    }
  }
  
  // Добавляем обработчик изменения размера окна для адаптивности
  window.addEventListener('resize', handleResize);

  // ДОБАВИТЬ: Мобильная оптимизация для AudioContext
  // Обработчик изменения видимости страницы (для мобильных браузеров)
  document.addEventListener('visibilitychange', () => {
    if (window.app && window.app.metronome && window.app.playback) {
      if (document.hidden) {
        // Страница скрыта - можно приостановить для экономии ресурсов
        window.app.playback.stopPlayback();
      } else {
        // Страница стала видимой - возобновляем если пользователь ожидает этого
        // Не автоматически возобновляем, чтобы избежать неожиданного звука
      }
    }
  });

  /**
   * Unlocks the AudioContext on user interaction to comply with browser autoplay policies.
   * This is required for audio playback to work in modern browsers.
   * Removes event listeners after successful unlock to prevent unnecessary processing.
   *
   * @async
   * @function unlockAudioContext
   * @throws {Error} If AudioContext resume fails
   */
  const unlockAudioContext = async () => {
    if (window.app && window.app.metronome && window.app.metronome.audioCtx) {
      if (window.app.metronome.audioCtx.state === 'suspended') {
        try {
          await window.app.metronome.audioCtx.resume();
        } catch (error) {
          console.error('Failed to unlock AudioContext:', error);
        }
      }
    }
    // Remove event listeners after first successful interaction
    document.removeEventListener('touchstart', unlockAudioContext);
    document.removeEventListener('touchend', unlockAudioContext);
    document.removeEventListener('click', unlockAudioContext);
  };

  // Добавляем обработчики для разблокировки AudioContext при первом взаимодействии
  document.addEventListener('touchstart', unlockAudioContext, { once: true });
  document.addEventListener('touchend', unlockAudioContext, { once: true });
  document.addEventListener('click', unlockAudioContext, { once: true });

  // Добавляем обработчик для ссылки политики конфиденциальности в футере
  
  // Обработчик клика делегируем на документ
document.addEventListener('click', (e) => {
  const link = e.target.closest('footer a[href="#"]');
  if (!link) return;

  if (link.textContent.includes('Политика конфиденциальности')) {
    e.preventDefault();
    if (window.app && window.app.modal) {
      window.app.modal.showPrivacyPolicy();
    }
  }
  
  if (link.textContent.includes('Условия использования')) {
    e.preventDefault();
    if (window.app && window.app.modal) {
      window.app.modal.showTermsOfUse();
    }
  }
});

// Проверяем и отображаем сохраненный текст песни при загрузке
const loadSavedSongText = () => {
  const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
  if (songs.length > 0) {
    const latestSong = songs[songs.length - 1]; // Берем последнюю сохраненную песню
    if (window.app && window.app.modal) {
      window.app.modal.displaySongText(latestSong.title, latestSong.text);
    }
    // Показываем drop-зоны, так как есть текст песни
    if (window.app && window.app.syllableDragDrop) {
      window.app.syllableDragDrop.showDropZones();
    }
  } else {
    // Если нет текста песни, убеждаемся, что секция управления тактами скрыта
    if (window.app && window.app.settings) {
      window.app.settings.hideBarManagement();
    }
  }
};

// Вызываем функцию для загрузки текста песни
loadSavedSongText();

// Добавляем обработчик для кнопки добавления текста песни
document.addEventListener('click', (e) => {
  const addSongTextBtn = e.target.closest('#addSongTextBtn');
  if (addSongTextBtn && window.app && window.app.modal) {
    window.app.modal.showAddSongText();
  }
  
  // Добавляем обработчик для кнопки редактирования текста песни
  const editSongTextBtn = e.target.closest('#edit-song-text-btn');
  if (editSongTextBtn && window.app && window.app.modal) {
    window.app.modal.showEditSongText();
  }
});
});
