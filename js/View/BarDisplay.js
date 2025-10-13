import { Bar } from '../Measure/Bar.js';

/**
 * Класс для отображения тактов на экране
 * Управляет показом содержимого тактов и навигацией между ними
 */
export class BarDisplay {
  constructor() {
    this.currentBarIndex = 0;
    this.bars = []; // массив объектов Bar
    this.isPlaying = false;
    this.playbackInterval = null;
    
    // DOM элементы
    this.nextLineBtn = null;
    this.prevLineBtn = null;
    this.playBtn = null;
    this.barContentContainer = null;
    this.barInfoDisplay = null;
    
    // Колбэки
    this.onBarChange = null;
    this.onPlaybackStart = null;
    this.onPlaybackStop = null;
  }

  /**
   * Инициализирует отображение тактов
   * @param {string} containerSelector - Селектор контейнера для отображения
   * @param {string} infoSelector - Селектор для отображения информации о такте
   */
  init(containerSelector, infoSelector = null) {
    this.barContentContainer = document.querySelector(containerSelector);
    this.barInfoDisplay = infoSelector ? document.querySelector(infoSelector) : null;
    
    this.bindButtons();
    this.updateDisplay();
  }

  /**
   * Привязывает кнопки навигации и воспроизведения
   * ПРИМЕЧАНИЕ: Навигация теперь управляется BarNavigation
   */
  bindButtons() {
    // Навигация теперь управляется BarNavigation, не привязываем события
    this.nextLineBtn = document.getElementById('nextLineBtn');
    this.prevLineBtn = document.getElementById('prevLineBtn');
    this.playBtn = document.getElementById('playBtn');

    // Привязываем только кнопку воспроизведения
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlayback());
    }
    
    console.log('⚠️ BarDisplay: Навигация управляется BarNavigation');
  }

  /**
   * Устанавливает массив тактов для отображения
   * @param {Bar[]} bars - Массив объектов Bar
   */
  setBars(bars) {
    this.bars = bars;
    if (this.currentBarIndex >= this.bars.length) {
      this.currentBarIndex = Math.max(0, this.bars.length - 1);
    }
    this.updateDisplay();
  }

  /**
   * Добавляет новый такт
   * @param {Bar} bar - Объект Bar
   */
  addBar(bar) {
    this.bars.push(bar);
    this.updateDisplay();
  }

  /**
   * Удаляет такт по индексу
   * @param {number} index - Индекс такта
   */
  removeBar(index) {
    if (index >= 0 && index < this.bars.length) {
      this.bars.splice(index, 1);
      if (this.currentBarIndex >= this.bars.length) {
        this.currentBarIndex = Math.max(0, this.bars.length - 1);
      }
      this.updateDisplay();
    }
  }

  /**
   * Получает текущий отображаемый такт
   * @returns {Bar|null} Текущий такт или null
   */
  getCurrentBar() {
    return this.bars[this.currentBarIndex] || null;
  }

  /**
   * Переходит к следующему такту
   */
  nextBar() {
    if (this.currentBarIndex < this.bars.length - 1) {
      this.currentBarIndex++;
      this.updateDisplay();
      this.notifyBarChange();
    }
  }

  /**
   * Переходит к предыдущему такту
   */
  prevBar() {
    if (this.currentBarIndex > 0) {
      this.currentBarIndex--;
      this.updateDisplay();
      this.notifyBarChange();
    }
  }

  /**
   * Переходит к указанному такту
   * @param {number} barIndex - Индекс такта
   */
  goToBar(barIndex) {
    if (barIndex >= 0 && barIndex < this.bars.length) {
      this.currentBarIndex = barIndex;
      this.updateDisplay();
      this.notifyBarChange();
    }
  }

  /**
   * Переключает воспроизведение
   */
  togglePlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  /**
   * Запускает воспроизведение тактов
   */
  startPlayback() {
    if (this.bars.length === 0) return;

    this.isPlaying = true;
    this.updatePlayButton();
    this.notifyPlaybackStart();

    // Автоматическое переключение тактов
    this.playbackInterval = setInterval(() => {
      if (this.currentBarIndex < this.bars.length - 1) {
        this.nextBar();
      } else {
        // Дошли до конца, переходим к началу
        this.goToBar(0);
      }
    }, 2000); // 2 секунды на такт
  }

  /**
   * Останавливает воспроизведение
   */
  stopPlayback() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.updatePlayButton();
    this.notifyPlaybackStop();
  }

  /**
   * Обновляет отображение текущего такта
   */
  updateDisplay() {
    this.updateBarContent();
    this.updateNavigationButtons();
    this.updateBarInfo();
  }

  /**
   * Обновляет содержимое такта
   */
  updateBarContent() {
    if (!this.barContentContainer) return;

    const currentBar = this.getCurrentBar();
    if (!currentBar) {
      this.barContentContainer.innerHTML = '<p class="text-gray-500">Нет тактов для отображения</p>';
      return;
    }

    const barInfo = currentBar.getInfo();
    
    // Создаем HTML для отображения такта
    let html = `
      <div class="bar-display">
        <div class="bar-header">
          <h3 class="text-white font-semibold">Такт ${barInfo.barIndex + 1}</h3>
        </div>
        
        <div class="bar-content">
          <!-- Длительности -->
          <div class="beat-units-section mb-4">
            <h4 class="text-gray-300 mb-2">Длительности:</h4>
            <div class="beat-units grid grid-cols-4 gap-2">
    `;

    // Отображаем длительности
    barInfo.beatUnits.forEach(beat => {
      const typeClass = this.getBeatTypeClass(beat.type);
      html += `
        <div class="beat-unit ${typeClass} p-2 rounded border text-center">
          <div class="text-sm font-medium">${beat.index + 1}</div>
          <div class="text-xs">${beat.typeString}</div>
        </div>
      `;
    });

    html += `
            </div>
          </div>

          <!-- Аккорды -->
          <div class="chord-changes-section mb-4">
            <h4 class="text-gray-300 mb-2">Аккорды:</h4>
            <div class="chord-changes">
    `;

    if (barInfo.chordChanges.length === 0) {
      html += '<p class="text-gray-500 text-sm">Аккорды не добавлены</p>';
    } else {
      barInfo.chordChanges.forEach(chord => {
        html += `
          <div class="chord-change bg-blue-900 p-2 rounded mb-2">
            <div class="text-white font-medium">${chord.name}</div>
            <div class="text-gray-400 text-sm">Длительность: ${chord.startBeat + 1}-${chord.endBeat}</div>
          </div>
        `;
      });
    }

    html += `
            </div>
          </div>

          <!-- Слоги -->
          <div class="lyric-syllables-section">
            <h4 class="text-gray-300 mb-2">Слоги:</h4>
            <div class="lyric-syllables">
    `;

    if (barInfo.lyricSyllables.length === 0) {
      html += '<p class="text-gray-500 text-sm">Слоги не добавлены</p>';
    } else {
      barInfo.lyricSyllables.forEach(syllable => {
        html += `
          <div class="lyric-syllable bg-green-900 p-2 rounded mb-2">
            <div class="text-white font-medium">"${syllable.text}"</div>
            <div class="text-gray-400 text-sm">Позиция: ${syllable.startBeat + 1}-${syllable.endBeat}</div>
          </div>
        `;
      });
    }

    html += `
            </div>
          </div>
        </div>
      </div>
    `;

    this.barContentContainer.innerHTML = html;
  }

  /**
   * Получает CSS класс для типа длительности
   * @param {number} type - Тип длительности
   * @returns {string} CSS класс
   */
  getBeatTypeClass(type) {
    switch (type) {
      case 0: return 'bg-gray-800 text-gray-400'; // не играть
      case 1: return 'bg-green-800 text-green-100'; // играть
      case 2: return 'bg-yellow-800 text-yellow-100'; // с приглушиванием
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  /**
   * Обновляет состояние кнопок навигации
   */
  updateNavigationButtons() {
    if (this.prevLineBtn) {
      this.prevLineBtn.disabled = this.currentBarIndex === 0;
      this.prevLineBtn.classList.toggle('opacity-50', this.currentBarIndex === 0);
    }

    if (this.nextLineBtn) {
      this.nextLineBtn.disabled = this.currentBarIndex >= this.bars.length - 1;
      this.nextLineBtn.classList.toggle('opacity-50', this.currentBarIndex >= this.bars.length - 1);
    }
  }

  /**
   * Обновляет кнопку воспроизведения
   */
  updatePlayButton() {
    if (!this.playBtn) return;

    if (this.isPlaying) {
      this.playBtn.textContent = '⏸️ Пауза';
      this.playBtn.classList.add('bg-red-600', 'hover:bg-red-700');
      this.playBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    } else {
      this.playBtn.textContent = '▶️ Воспроизведение';
      this.playBtn.classList.add('bg-green-600', 'hover:bg-green-700');
      this.playBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
    }
  }

  /**
   * Обновляет информацию о текущем такте
   */
  updateBarInfo() {
    if (!this.barInfoDisplay) return;

    const currentBar = this.getCurrentBar();
    if (!currentBar) {
      this.barInfoDisplay.textContent = 'Нет тактов';
      return;
    }

    const info = currentBar.getInfo();
    this.barInfoDisplay.textContent = `Такт ${info.barIndex + 1} из ${this.bars.length}`;
  }

  /**
   * Уведомляет о смене такта
   */
  notifyBarChange() {
    if (this.onBarChange) {
      this.onBarChange(this.currentBarIndex, this.getCurrentBar());
    }
  }

  /**
   * Уведомляет о начале воспроизведения
   */
  notifyPlaybackStart() {
    if (this.onPlaybackStart) {
      this.onPlaybackStart();
    }
  }

  /**
   * Уведомляет об остановке воспроизведения
   */
  notifyPlaybackStop() {
    if (this.onPlaybackStop) {
      this.onPlaybackStop();
    }
  }

  /**
   * Устанавливает колбэк для смены такта
   * @param {Function} callback - Колбэк функция
   */
  setOnBarChange(callback) {
    this.onBarChange = callback;
  }

  /**
   * Устанавливает колбэк для начала воспроизведения
   * @param {Function} callback - Колбэк функция
   */
  setOnPlaybackStart(callback) {
    this.onPlaybackStart = callback;
  }

  /**
   * Устанавливает колбэк для остановки воспроизведения
   * @param {Function} callback - Колбэк функция
   */
  setOnPlaybackStop(callback) {
    this.onPlaybackStop = callback;
  }

  /**
   * Очищает отображение
   */
  clear() {
    this.bars = [];
    this.currentBarIndex = 0;
    this.stopPlayback();
    this.updateDisplay();
  }

  /**
   * Возвращает информацию о текущем состоянии
   * @returns {Object} Состояние отображения
   */
  getState() {
    return {
      currentBarIndex: this.currentBarIndex,
      totalBars: this.bars.length,
      isPlaying: this.isPlaying,
      currentBar: this.getCurrentBar()?.getInfo() || null
    };
  }
}
