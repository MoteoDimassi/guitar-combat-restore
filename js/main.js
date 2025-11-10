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
import { OptionsMenu } from './components/OptionsMenu.js';
import { ChordStore } from './components/ChordStore.js';
import { SongExporter } from './utils/SongExporter.js';
import { SongImporter } from './utils/SongImporter.js';
import { TextUpdateManager } from './utils/TextUpdateManager.js';

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
  const chordStore = new ChordStore(); // Новое хранилище аккордов
  const chordBarManager = new ChordBarManager(barManager, chordManager, chordDisplay, beatRow);
  const lineNavigation = new LineNavigation(barManager, barSyllableDisplay);
  const playbackSync = new PlaybackSync(beatRow, barManager, barSyllableDisplay, chordDisplay, chordBarManager);
  const optionsMenu = new OptionsMenu();
  
  // Новые модули
  const songExporter = new SongExporter();
  const songImporter = new SongImporter();
  const textUpdateManager = new TextUpdateManager();

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
  optionsMenu.init();
  
  // Инициализация новых модулей
  textUpdateManager.init(syllableDragDrop);
  
  // Отладочная информация
  console.log('Инициализация модулей завершена');
  console.log('songExporter:', songExporter);
  console.log('songImporter:', songImporter);
  console.log('textUpdateManager:', textUpdateManager);

  // Инициализация мобильного меню
  const mobileMenu = new MobileMenu();
  mobileMenu.init();

  // Инициализация модального окна
  const modal = new Modal();
  modal.init();
  
  // Связываем обновление drop-зон с рендерингом beatRow
  beatRow.setOnRenderComplete(() => {
    // Небольшая задержка для гарантированного обновления DOM
    setTimeout(() => {
      syllableDragDrop.updateDropZones();
    }, 10);
  });

  // Функция для управления видимостью кнопок песни
  const updateSongButtons = () => {
    const saveSongBtn = document.getElementById('saveSongBtn');
    const importSongBtn = document.getElementById('importSongBtn');
    
    if (!saveSongBtn || !importSongBtn) return;
    
    // Проверяем, есть ли текст песни
    const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
    const hasSongText = songs.length > 0 && songs[songs.length - 1].text && songs[songs.length - 1].text.trim().length > 0;
    
    if (hasSongText) {
      // Есть текст песни - показываем кнопку "Сохранить песню"
      saveSongBtn.classList.remove('hidden');
      importSongBtn.classList.add('hidden');
    } else {
      // Нет текста песни - показываем кнопку "Импорт песни"
      saveSongBtn.classList.add('hidden');
      importSongBtn.classList.remove('hidden');
    }
  };

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
    chordStore, // Хранилище аккордов
    chordBarManager,
    lineNavigation,
    playbackSync,
    optionsMenu,
    songExporter,
    songImporter,
    textUpdateManager,
    updateSongButtons, // Функция для обновления кнопок песни
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
  
  // Добаваем обработчик поля ввода аккордов
  const chordsInput = document.getElementById('chordsInput');
  if (chordsInput) {
    // Обновляем аккорды при вводе
    chordsInput.addEventListener('input', () => {
      const chordsString = chordsInput.value;

      // Обновляем ChordStore - центральное хранилище аккордов
      if (window.app && window.app.chordStore) {
        window.app.chordStore.updateFromString(chordsString);
        window.app.chordStore.saveToLocalStorage();
      }

      // Обновляем аккорды в метрономе (для обратной совместимости)
      if (window.app && window.app.metronome) {
        window.app.metronome.updateChords(chordsString);
      }

      // Обновляем отображение аккордов для текущего такта
      if (window.app && window.app.chordDisplay && window.app.chordStore) {
        const currentBarIndex = window.app.state.currentBarIndex || 0;
        const currentChord = window.app.chordStore.getChordForBar(currentBarIndex);
        const nextChord = window.app.chordStore.getNextChord(currentBarIndex);
        
        if (currentChord) {
          window.app.chordDisplay.setChords(currentChord, nextChord || currentChord);
        } else {
          window.app.chordDisplay.setChords('--', '--');
        }
      }

      // Если воспроизведение активно, обновляем текущую позицию
      if (window.app && window.app.playback && window.app.playback.isPlaying()) {
        const currentIndex = window.app.state.currentIndex;
        const currentBarIndex = window.app.state.currentBarIndex;
        
        if (window.app.metronome && window.app.metronome.onBeatCallback) {
          window.app.metronome.updateChordDisplay(currentIndex, currentBarIndex);
        }
      }
    });

    // Инициализируем ChordStore при загрузке
    // Пытаемся загрузить из localStorage, если не получается - парсим из input
    if (!window.app.chordStore.loadFromLocalStorage()) {
      window.app.chordStore.updateFromString(chordsInput.value);
    } else {
      // Если загрузили из localStorage, обновляем поле ввода
      const savedChords = window.app.chordStore.getAllChords();
      if (savedChords.length > 0) {
        chordsInput.value = savedChords.join(' ');
      }
    }

    // Обновляем метроном с аккордами из ChordStore
    window.app.metronome.updateChords(chordsInput.value);

    // Показываем начальные аккорды сразу при загрузке
    if (window.app && window.app.chordDisplay && window.app.chordStore) {
      window.app.chordDisplay.show();

      const currentBarIndex = window.app.state.currentBarIndex || 0;
      const currentChord = window.app.chordStore.getChordForBar(currentBarIndex);
      const nextChord = window.app.chordStore.getNextChord(currentBarIndex);

      if (currentChord) {
        window.app.chordDisplay.setChords(currentChord, nextChord || currentChord);
      } else {
        window.app.chordDisplay.setChords('--', '--');
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
      // Скрываем панель управления и показываем кнопку опций
      if (window.app && window.app.optionsMenu) {
        window.app.optionsMenu.hideControlPanel();
        window.app.optionsMenu.showOptionsButton();
      }
    } else {
      // Если нет текста песни, убеждаемся, что секция управления тактами скрыта
      if (window.app && window.app.settings) {
        window.app.settings.hideBarManagement();
      }
      // Показываем панель управления и скрываем кнопку опций
      if (window.app && window.app.optionsMenu) {
        window.app.optionsMenu.showControlPanel();
        window.app.optionsMenu.hideOptionsButton();
      }
    }
    
    // Обновляем видимость кнопок
    updateSongButtons();
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

  // Добавляем отдельный обработчик для кнопки сохранения песни
  document.addEventListener('click', (e) => {
    const saveSongBtn = e.target.closest('#saveSongBtn');
    if (saveSongBtn) {
      console.log('Кнопка "Сохранить песню" нажата');
      if (window.app && window.app.songExporter) {
        try {
          console.log('Начинаем экспорт песни...');
          window.app.songExporter.downloadSongFile();
          console.log('Экспорт завершён');
        } catch (error) {
          console.error('Ошибка при сохранении песни:', error);
          alert('Ошибка при сохранении песни. Проверьте консоль для подробностей.');
        }
      } else {
        console.error('SongExporter не найден в window.app');
        alert('Ошибка: модуль экспорта не инициализирован');
      }
    }
  });

  // Добавляем обработчик для кнопки импорта песни
  document.addEventListener('click', (e) => {
    const importSongBtn = e.target.closest('#importSongBtn');
    if (importSongBtn) {
      console.log('Кнопка "Импорт песни" нажата');
      if (window.app && window.app.importUtils) {
        try {
          console.log('Запускаем импорт песни...');
          window.app.importUtils.triggerImport();
        } catch (error) {
          console.error('Ошибка при импорте песни:', error);
          alert('Ошибка при импорте песни. Проверьте консоль для подробностей.');
        }
      } else {
        console.error('ImportUtils не найден в window.app');
        alert('Ошибка: модуль импорта не инициализирован');
      }
    }
  });
});
