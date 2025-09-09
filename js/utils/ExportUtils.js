// Утилиты для экспорта данных
export class ExportUtils {
  constructor(beatRow) {
    this.beatRow = beatRow;
  }

  init() {
    this.bindEvents();
    this.createImportInput();
  }

  bindEvents() {
    // Кнопка экспорта в PNG
    const exportPngBtn = document.getElementById('exportPng');
    if (exportPngBtn) {
      exportPngBtn.addEventListener('click', () => {
        this.exportPNG();
      });
    }

    // Кнопка скачивания JSON
    const downloadJsonBtn = document.getElementById('downloadJson');
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener('click', () => {
        this.downloadJSON();
      });
    }

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

  exportPNG() {
    const area = document.getElementById('beatArea');
    
    // Создаем временный контейнер для экспорта с ограничением размера FullHD
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; background: white; width: 100%; max-width: 1920px; margin: 0 auto;';
    
    // Создаем копию содержимого beatArea без клонирования сложных элементов
    const beatRow = document.getElementById('beatRow');
    if (beatRow) {
      // Копируем только содержимое beatRow
      const beatRowClone = document.createElement('div');
      beatRowClone.id = 'beatRow-export';
      beatRowClone.className = beatRow.className;
      beatRowClone.innerHTML = beatRow.innerHTML;
      beatRowClone.style.cssText = 'display: grid; grid-template-columns: repeat(8, 1fr); gap: 1rem; width: 100%; padding: 0 1rem; margin-bottom: 20px;';
      
      exportContainer.appendChild(beatRowClone);
    }
    
    // Добавляем информацию об аккордах
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'text-align: center; font-family: Arial, sans-serif; padding: 10px; background: #f9fafb; border-radius: 8px; width: 100%; max-width: 600px; margin-top: 10px;';
    
    // Получаем данные
    const bpm = Number(document.getElementById('bpm').value) || 90;
    const chordsInput = document.getElementById('chordsInput');
    const chords = chordsInput ? chordsInput.value.trim() : '';
    
    // Формируем информацию (без скорости)
    let infoText = `BPM: ${bpm}`;
    if (chords) {
      infoText += ` | Аккорды: ${chords}`;
    }
    
    infoDiv.textContent = infoText;
    exportContainer.appendChild(infoDiv);
    
    // Используем html2canvas из CDN
    if (typeof html2canvas !== 'undefined') {
      // Добавляем временный контейнер в DOM
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '-9999px';
      document.body.appendChild(exportContainer);
      
      // Небольшая задержка для корректного рендеринга
      setTimeout(() => {
        html2canvas(exportContainer, {
          backgroundColor: '#ffffff',
          logging: false,
          width: Math.min(exportContainer.offsetWidth, 1920),
          height: Math.min(exportContainer.offsetHeight, 1080),
          scale: 1
        }).then(canvas => {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `beat-${Date.now()}.png`;
          a.click();
          
          // Очищаем временный контейнер
          if (exportContainer.parentNode) {
            document.body.removeChild(exportContainer);
          }
        }).catch(error => {
          console.error('Ошибка экспорта в PNG:', error);
          // Очищаем временный контейнер в случае ошибки
          if (exportContainer.parentNode) {
            document.body.removeChild(exportContainer);
          }
        });
      }, 100);
    } else {
      console.error('html2canvas не загружен');
    }
  }

  downloadJSON() {
    const beats = this.beatRow.getBeats();
    
    // Получаем BPM с проверкой на null
    const bpmElement = document.getElementById('bpm');
    const bpm = bpmElement ? Number(bpmElement.value) || 90 : 90;
    
    // Получаем speed из глобального состояния или используем значение по умолчанию
    const speed = (window.app && window.app.state) ? window.app.state.speed : 100;
    
    // Получаем аккорды с проверкой на null
    const chordsInput = document.getElementById('chordsInput');
    const chords = chordsInput ? chordsInput.value.split('|').map(s => s.trim()).filter(Boolean) : [];

    const data = {
      beats,
      bpm,
      speed,
      chords,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
