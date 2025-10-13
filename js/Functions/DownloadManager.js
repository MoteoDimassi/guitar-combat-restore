import { PlayStatus } from '../Measure/PlayStatus.js';

/**
 * DownloadManager - класс для скачивания настроек боя
 * Собирает данные о стрелочках, аккордах, темпе и статусах
 */
class DownloadManager {
    constructor() {
        this.data = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            settings: {}
        };
    }

    /**
     * Собирает все данные о настройках боя
     * @returns {Object} Объект с настройками боя
     */
    collectBattleSettings() {
        this.data.settings = {
            tempo: this.getTempo(),
            arrowsPerBar: this.getArrowsPerBar(),
            chords: this.getChords(),
            arrowStatuses: this.getArrowStatuses(),
            arrows: this.getArrowsData(),
            bars: this.getBarsData()
        };
        return this.data;
    }

    /**
     * Получает текущий темп
     * @returns {number} Темп в BPM
     */
    getTempo() {
        const bpmInput = document.getElementById('bpm');
        return bpmInput ? parseInt(bpmInput.value) || 120 : 120;
    }

    /**
     * Получает количество стрелочек в такте
     * @returns {number} Количество стрелочек
     */
    getArrowsPerBar() {
        // Пытаемся получить из ArrowDisplay
        if (window.guitarCombatApp && window.guitarCombatApp.arrowDisplay) {
            return window.guitarCombatApp.arrowDisplay.currentCount || 4;
        }
        
        // Fallback к DOM
        const beatRow = document.querySelector('#beatRow');
        if (beatRow) {
            const arrows = beatRow.querySelectorAll('.arrow-item');
            return arrows.length;
        }
        return 4; // значение по умолчанию
    }

    /**
     * Получает аккорды из ChordStore или поля ввода
     * @returns {Array} Массив аккордов
     */
    getChords() {
        // Пытаемся получить из ChordStore
        if (window.chordStore && window.chordStore.chordsArray) {
            return window.chordStore.chordsArray;
        }

        // Fallback к полю ввода
        const chordsInput = document.getElementById('chordsInput');
        if (chordsInput && chordsInput.value.trim()) {
            return chordsInput.value.split(/\s+/).filter(chord => chord.trim());
        }

        return [];
    }

    /**
     * Получает статусы стрелочек (играет/не играет)
     * @returns {Array} Массив статусов стрелочек
     */
    getArrowStatuses() {
        // Пытаемся получить из ArrowDisplay
        if (window.guitarCombatApp && window.guitarCombatApp.arrowDisplay) {
            const playStatuses = window.guitarCombatApp.arrowDisplay.getAllPlayStatuses();
            return playStatuses.map(status => ({
                status: status.status,
                statusString: status.getStatusString(),
                displaySymbol: status.getDisplaySymbol(),
                isPlaying: status.status === PlayStatus.STATUS.PLAY
            }));
        }
        
        // Fallback к DOM
        const beatRow = document.querySelector('#beatRow');
        if (!beatRow) return [];

        const arrows = beatRow.querySelectorAll('.arrow-item');
        const statuses = [];

        arrows.forEach(arrow => {
            const circle = arrow.querySelector('.play-status-circle');
            if (circle) {
                // Определяем статус по содержимому кружка
                const hasDot = circle.textContent.includes('●');
                const hasCross = circle.textContent.includes('⊗');
                
                let status;
                if (hasDot) status = 'play';
                else if (hasCross) status = 'mute';
                else status = 'skip';
                
                statuses.push({
                    status: status,
                    statusString: status === 'play' ? 'Играет' : status === 'mute' ? 'Заглушен' : 'Пропуск',
                    displaySymbol: status === 'play' ? '●' : status === 'mute' ? '⊗' : '○',
                    isPlaying: status === 'play'
                });
            } else {
                statuses.push({
                    status: 'skip',
                    statusString: 'Пропуск',
                    displaySymbol: '○',
                    isPlaying: false
                });
            }
        });

        return statuses;
    }

    /**
     * Получает детальные данные о тактах
     * @returns {Array} Массив объектов с данными тактов
     */
    getBarsData() {
        const bars = [];
        
        // Получаем все такты
        const barElements = document.querySelectorAll('.bar');
        
        barElements.forEach((barElement, index) => {
            const bar = {
                index: index,
                chords: this.getBarChords(index),
                syllables: this.getBarSyllables(barElement),
                isActive: !barElement.classList.contains('inactive')
            };
            bars.push(bar);
        });

        return bars;
    }

    /**
     * Получает информацию о стрелочках
     * @returns {Array} Массив объектов с информацией о стрелочках
     */
    getArrowsData() {
        // Пытаемся получить из ArrowDisplay
        if (window.guitarCombatApp && window.guitarCombatApp.arrowDisplay) {
            const arrowsInfo = window.guitarCombatApp.arrowDisplay.getAllArrowsInfo();
            const playStatuses = window.guitarCombatApp.arrowDisplay.getAllPlayStatuses();
            
            return arrowsInfo.map((arrow, index) => ({
                index: arrow.index,
                direction: arrow.direction,
                isActive: arrow.isActive,
                isHighlighted: arrow.isHighlighted,
                playStatus: playStatuses[index] ? {
                    status: playStatuses[index].status,
                    statusString: playStatuses[index].getStatusString(),
                    displaySymbol: playStatuses[index].getDisplaySymbol()
                } : null
            }));
        }
        
        // Fallback к DOM
        const beatRow = document.querySelector('#beatRow');
        if (!beatRow) return [];

        const arrows = beatRow.querySelectorAll('.arrow-item');
        const arrowsData = [];

        arrows.forEach((arrowElement, index) => {
            const direction = arrowElement.dataset.direction || 'down';
            const isActive = arrowElement.classList.contains('active') || false;
            const isHighlighted = arrowElement.classList.contains('animate-pulse') || false;
            
            const circle = arrowElement.querySelector('.play-status-circle');
            let playStatus = null;
            
            if (circle) {
                const hasDot = circle.textContent.includes('●');
                const hasCross = circle.textContent.includes('⊗');
                
                let status;
                if (hasDot) status = 'play';
                else if (hasCross) status = 'mute';
                else status = 'skip';
                
                playStatus = {
                    status: status,
                    statusString: status === 'play' ? 'Играет' : status === 'mute' ? 'Заглушен' : 'Пропуск',
                    displaySymbol: status === 'play' ? '●' : status === 'mute' ? '⊗' : '○'
                };
            }
            
            arrowsData.push({
                index: index,
                direction: direction,
                isActive: isActive,
                isHighlighted: isHighlighted,
                playStatus: playStatus
            });
        });

        return arrowsData;
    }

    /**
     * Получает аккорды для конкретного такта
     * @param {number} barIndex - Индекс такта
     * @returns {Object} Объект с аккордами для каждой позиции стрелки
     */
    getBarChords(barIndex) {
        const chords = {};
        
        if (window.chordStore) {
            // Получаем количество стрелочек в такте
            const arrowsCount = this.getArrowsPerBar();
            
            for (let i = 0; i < arrowsCount; i++) {
                const chord = window.chordStore.getChordForPosition(barIndex, i);
                if (chord) {
                    chords[`arrow_${i}`] = chord;
                }
            }
        }

        return chords;
    }

    /**
     * Получает слоги для конкретного такта
     * @param {Element} barElement - DOM элемент такта
     * @returns {Array} Массив слогов
     */
    getBarSyllables(barElement) {
        const syllables = [];
        const syllableElements = barElement.querySelectorAll('.syllable');
        
        syllableElements.forEach(syllable => {
            syllables.push({
                text: syllable.textContent.trim(),
                isHighlighted: syllable.classList.contains('highlighted'),
                isActive: !syllable.classList.contains('inactive')
            });
        });

        return syllables;
    }

    /**
     * Скачивает настройки в формате JSON
     */
    downloadJson() {
        try {
            const settings = this.collectBattleSettings();
            const jsonString = JSON.stringify(settings, null, 2);
            
            // Создаем blob с JSON данными
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Создаем ссылку для скачивания
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `guitar-combat-settings-${new Date().toISOString().split('T')[0]}.json`;
            
            // Добавляем ссылку в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Освобождаем память
            URL.revokeObjectURL(url);
            
            console.log('Настройки боя скачаны:', settings);
            
        } catch (error) {
            console.error('Ошибка при скачивании настроек:', error);
            alert('Произошла ошибка при скачивании настроек. Проверьте консоль для подробностей.');
        }
    }

    /**
     * Получает краткую информацию о настройках для предпросмотра
     * @returns {string} Краткое описание настроек
     */
    getSettingsPreview() {
        const settings = this.collectBattleSettings();
        const playingArrows = settings.settings.arrowStatuses.filter(status => status.isPlaying).length;
        return `
Настройки боя:
• Темп: ${settings.settings.tempo} BPM
• Стрелочек в такте: ${settings.settings.arrowsPerBar}
• Аккордов: ${settings.settings.chords.length}
• Играющих стрелочек: ${playingArrows}
• Тактов: ${settings.settings.bars.length}
• Стрелочки: ${settings.settings.arrows.length}
        `.trim();
    }
}

// Экспортируем класс для использования в других модулях
export { DownloadManager };
