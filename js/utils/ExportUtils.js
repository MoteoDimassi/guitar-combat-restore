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
    
    // Используем html2canvas из CDN
    if (typeof html2canvas !== 'undefined') {
      html2canvas(area).then(canvas => {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `beat-${Date.now()}.png`;
        a.click();
      });
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
