// Утилиты для экспорта данных
export class ExportUtils {
  constructor(beatRow) {
    this.beatRow = beatRow;
  }

  init() {
    this.bindEvents();
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
