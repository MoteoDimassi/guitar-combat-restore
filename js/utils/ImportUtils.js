// Утилиты для импорта данных
export class ImportUtils {
  constructor(beatRow) {
    this.beatRow = beatRow;
  }

  init() {
    this.bindImportEvents();
    this.createImportInput();
  }

  bindImportEvents() {
    // Кнопка импорта JSON
    const importJsonBtn = document.getElementById('importJson');
    if (importJsonBtn) {
      importJsonBtn.addEventListener('click', () => {
        this.triggerImport();
      });
    }
  }

  createImportInput() {
    // Создаем скрытый input для загрузки файлов
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'importJsonInput';
    importInput.accept = 'application/json';
    importInput.style.display = 'none';

    importInput.addEventListener('change', (e) => {
      this.handleImport(e);
    });

    document.body.appendChild(importInput);
  }

  triggerImport() {
    const importInput = document.getElementById('importJsonInput');
    if (importInput) {
      importInput.click();
    }
  }

  handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this.importData(data);
      } catch (error) {
        console.error('Ошибка при импорте JSON:', error);
        // Заменяем alert() на не-блокирующие уведомления
        if (error instanceof SyntaxError) {
          this.showErrorNotification('Неверный формат JSON файла');
        } else {
          this.showErrorNotification('Ошибка при импорте файла: ' + error.message);
        }
      }
    };
    reader.onerror = () => {
      this.showErrorNotification('Ошибка чтения файла');
    };
    reader.readAsText(file);

    // Сбрасываем input для возможности повторного импорта того же файла
    event.target.value = '';
  }

  importData(data) {
    if (!data || !data.beats) {
      this.showErrorNotification('Неверный формат файла. Файл должен содержать данные боя.');
      return;
    }

    try {
      // 1. Нормализуем биты
      const normalizedBeats = data.beats.map(beat => {
        // Преобразуем старые boolean значения в новые числовые состояния
        let playState;
        if (typeof beat.play === 'number') {
          // Уже числовое значение (0, 1, 2)
          playState = beat.play;
        } else if (beat.play === true) {
          // Старый формат: true → 1 (заполненный)
          playState = 1;
        } else {
          // Старый формат: false → 0 (пустой)
          playState = 0;
        }
        
        return {
          direction: beat.direction || 'down',
          play: playState
        };
      });

      if (!this.beatRow) return;

      // 2. Сбрасываем подсветку
      this.beatRow.highlightedIndices.clear();

      // 3. Применяем play к кружкам
      const circleStates = normalizedBeats.map(beat => beat.play);
      this.beatRow.setCircleStates(circleStates);

      // 4. Устанавливаем биты (стрелочки)
      this.beatRow.setBeats(normalizedBeats);

      // 5. Обновляем количество стрелок
      const count = normalizedBeats.length;
      if (window.app && window.app.controls) {
        window.app.controls.setCount(count);
      }

      // 6. Обновляем BPM
      if (data.bpm && document.getElementById('bpm')) {
        const bpmSlider = document.getElementById('bpm');
        const bpmLabel = document.getElementById('bpmLabel');
        bpmSlider.value = data.bpm;
        bpmLabel.textContent = data.bpm;
        if (window.app) {
          window.app.state.bpm = data.bpm;
        }
      }

      // 7. Обновляем аккорды
      if (data.chords && document.getElementById('chordsInput')) {
        const chordsInput = document.getElementById('chordsInput');
        chordsInput.value = Array.isArray(data.chords) ? data.chords.join(' ') : data.chords;
        if (window.app && window.app.metronome) {
          window.app.metronome.updateChords(chordsInput.value);

          // Обновляем отображение аккордов
          if (window.app.chordDisplay) {
            const chords = window.app.metronome.getChords();
            if (chords && chords.length > 0) {
              window.app.chordDisplay.setChords(chords[0], chords[1] || chords[0]);
            } else {
              window.app.chordDisplay.setChords('--', '--');
            }
          }
        }
      }

      // 8. Обновляем speed
      if (data.speed && window.app) {
        window.app.state.speed = data.speed;
      }

      // 9. Обновляем глобальное состояние с новыми битами
      if (window.app) {
        window.app.state.beats = normalizedBeats;
        window.app.state.currentIndex = 0;
      }

      this.showSuccessNotification('Данные успешно импортированы!');
    } catch (error) {
      console.error('Ошибка при импорте данных:', error);
      this.showErrorNotification('Ошибка при импорте данных. Проверьте содержимое файла.');
    }
  }

  /**
   * Показать уведомление об успехе
   * @param {string} message - сообщение
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Показать уведомление об ошибке
   * @param {string} message - сообщение
   */
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Показать уведомление
   * @param {string} message - сообщение
   * @param {string} type - тип уведомления ('success' или 'error')
   */
  showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}