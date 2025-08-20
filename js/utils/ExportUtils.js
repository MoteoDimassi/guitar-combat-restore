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
    document.getElementById('exportPng').addEventListener('click', () => {
      this.exportPNG();
    });

    // Кнопка скачивания JSON
    document.getElementById('downloadJson').addEventListener('click', () => {
      this.downloadJSON();
    });
  }

  exportPNG() {
    const area = document.getElementById('beatArea');
    
    // Создаем временный контейнер для экспорта
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; padding: 20px; background: white;';
    
    // Создаем копию содержимого beatArea без клонирования сложных элементов
    const beatRow = document.getElementById('beatRow');
    if (beatRow) {
      // Копируем только содержимое beatRow
      const beatRowClone = document.createElement('div');
      beatRowClone.id = 'beatRow-export';
      beatRowClone.className = beatRow.className;
      beatRowClone.innerHTML = beatRow.innerHTML;
      beatRowClone.style.marginBottom = '20px';
      
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
          logging: false
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
    const bpm = Number(document.getElementById('bpm').value) || 90;
    const speed = Number(document.getElementById('speed').value) || 100;
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
