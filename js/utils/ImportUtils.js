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
        // Добавить более подробную обработку ошибок
        if (error instanceof SyntaxError) {
          alert('Неверный формат JSON файла');
        } else {
          alert('Ошибка при импорте файла: ' + error.message);
        }
      }
    };
    reader.onerror = () => {
      alert('Ошибка чтения файла');
    };
    reader.readAsText(file);

    // Сбрасываем input для возможности повторного импорта того же файла
    event.target.value = '';
  }

  importData(data) {
    if (!data || !data.beats) {
      alert('Неверный формат файла. Файл должен содержать данные боя.');
      return;
    }

    try {
      // 1. Нормализуем биты
      const normalizedBeats = data.beats.map(beat => ({
        direction: beat.direction || 'down',
        play: !!beat.play  // строго булевое значение
      }));

      if (!this.beatRow) return;

      // 2. Сбрасываем подсветку
      this.beatRow.highlightedIndices.clear();

      // 3. Применяем play к кружкам
      const circleStates = normalizedBeats.map(beat => beat.play);
      console.log('Import: Setting circleStates:', circleStates);
      this.beatRow.setCircleStates(circleStates);

      // 4. Устанавливаем биты (стрелочки)
      console.log('Import: Setting beats:', normalizedBeats);
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

      alert('Данные успешно импортированы!');
    } catch (error) {
      console.error('Ошибка при импорте данных:', error);
      alert('Ошибка при импорте данных. Проверьте содержимое файла.');
    }
  }
}