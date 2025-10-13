import { PlayStatus } from '../Measure/PlayStatus.js';

/**
 * DownloadManager - класс для скачивания настроек боя
 * Поддерживает множественные форматы экспорта с фокусом на тактовую структуру
 */
class DownloadManager {
    constructor() {
        this.data = {
            timestamp: new Date().toISOString(),
            version: "2.0",
            settings: {}
        };
        this.exportFormats = ['v2', 'current', 'legacy'];
    }

    /**
     * Собирает все данные о настройках боя в новом формате
     * @returns {Object} Объект с настройками боя в формате v2
     */
    collectBattleSettingsV2() {
        const bars = this.collectBarsDataV2();
        const metadata = this.collectMetadata();
        const songStructure = this.collectSongStructure();
        const templates = this.collectTemplates();
        
        return {
            version: "2.0",
            metadata: metadata,
            songStructure: songStructure,
            bars: bars,
            templates: templates
        };
    }

    /**
     * Собирает все данные о настройках боя (для обратной совместимости)
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
     * Собирает метаданные о композиции
     * @returns {Object} Метаданные
     */
    collectMetadata() {
        const app = window.guitarCombatApp;
        
        return {
            title: app?.songTitle || "Без названия",
            artist: app?.songArtist || "",
            tempo: this.getTempo(),
            timeSignature: `${this.getArrowsPerBar()}/4`,
            createdAt: new Date().toISOString(),
            description: "Создано в Guitar Combat",
            // Дополнительные метаданные
            totalBars: app?.bars?.length || 1,
            totalBeats: this.getTotalBeats(),
            duration: this.calculateDuration()
        };
    }

    /**
     * Собирает информацию о структуре песни
     * @returns {Object} Структура песни
     */
    collectSongStructure() {
        const app = window.guitarCombatApp;
        
        return {
            beatCount: this.getArrowsPerBar(),
            totalBars: app?.bars?.length || 1,
            currentBar: app?.barNavigation?.getCurrentBarIndex() || 0,
            // Информация о повторениях
            hasRepeats: this.detectRepeats(),
            repeatStructure: this.getRepeatStructure()
        };
    }

    /**
     * Собирает полную информацию о тактах
     * @returns {Array} Массив тактов с детальной информацией
     */
    collectBarsDataV2() {
        const app = window.guitarCombatApp;
        const bars = [];

        if (!app || !app.bars || app.bars.length === 0) {
            // Если тактов нет, создаём один такт из текущих настроек
            return [this.createBarFromCurrentSettings()];
        }

        // Собираем данные из существующих тактов
        app.bars.forEach((bar, index) => {
            const barData = {
                index: index,
                beatUnits: this.collectBeatUnitsV2(bar, index),
                chordChanges: this.collectChordChanges(bar),
                lyricSyllables: this.collectLyricSyllables(bar),
                // Дополнительная информация о такте
                metadata: {
                    isActive: this.isBarActive(index),
                    hasChords: bar.chordChanges && bar.chordChanges.length > 0,
                    hasLyrics: bar.lyricSyllables && bar.lyricSyllables.length > 0,
                    playingBeats: this.countPlayingBeats(bar)
                }
            };

            bars.push(barData);
        });

        return bars;
    }

    /**
     * Собирает информацию о долях в такте
     * @param {Bar} bar - Объект такта
     * @returns {Array} Массив долей
     */
    collectBeatUnits(bar) {
        const beatUnits = [];

        if (bar.beatUnits && bar.beatUnits.length > 0) {
            bar.beatUnits.forEach((beatUnit, index) => {
                const beatData = {
                    index: index,
                    direction: index % 2 === 0 ? 'down' : 'up',
                    playStatus: {
                        status: beatUnit.playStatus.status,
                        statusString: beatUnit.playStatus.getStatusString(),
                        displaySymbol: beatUnit.playStatus.getDisplaySymbol()
                    }
                };

                // Дополнительная информация
                beatData.metadata = {
                    isPlayed: beatUnit.isPlayed(),
                    isMuted: beatUnit.isMuted(),
                    isSkipped: beatUnit.isSkipped(),
                    cssClass: beatUnit.getCSSClass()
                };

                beatUnits.push(beatData);
            });
        } else {
            // Если beatUnits нет, создаём из ArrowDisplay
            const arrowDisplay = window.guitarCombatApp?.arrowDisplay;
            if (arrowDisplay) {
                const playStatuses = arrowDisplay.getAllPlayStatuses();
                playStatuses.forEach((playStatus, index) => {
                    beatUnits.push({
                        index: index,
                        direction: index % 2 === 0 ? 'down' : 'up',
                        playStatus: {
                            status: playStatus.status,
                            statusString: playStatus.getStatusString(),
                            displaySymbol: playStatus.getDisplaySymbol()
                        }
                    });
                });
            }
        }

        return beatUnits;
    }

    /**
     * Собирает информацию о долях в такте (улучшенная версия)
     * @param {Bar} bar - Объект такта
     * @param {number} barIndex - Индекс такта
     * @returns {Array} Массив долей
     */
    collectBeatUnitsV2(bar, barIndex) {
        const beatUnits = [];

        // Для первого такта всегда используем статусы из ArrowDisplay, чтобы обеспечить синхронизацию
        if (barIndex === 0 && window.guitarCombatApp?.arrowDisplay) {
            const arrowDisplay = window.guitarCombatApp.arrowDisplay;
            const playStatuses = arrowDisplay.getAllPlayStatuses();

            playStatuses.forEach((playStatus, index) => {
                const beatData = {
                    index: index,
                    direction: index % 2 === 0 ? 'down' : 'up',
                    playStatus: {
                        status: playStatus.status,
                        statusString: playStatus.getStatusString(),
                        displaySymbol: playStatus.getDisplaySymbol()
                    }
                };

                // Дополнительная информация
                beatData.metadata = {
                    isPlayed: playStatus.isPlayed(),
                    isMuted: playStatus.isMuted(),
                    isSkipped: playStatus.isSkipped(),
                    cssClass: playStatus.getCSSClass()
                };

                beatUnits.push(beatData);
            });
        } else if (bar.beatUnits && bar.beatUnits.length > 0) {
            // Для остальных тактов используем данные из такта
            bar.beatUnits.forEach((beatUnit, index) => {
                const beatData = {
                    index: index,
                    direction: index % 2 === 0 ? 'down' : 'up',
                    playStatus: {
                        status: beatUnit.playStatus.status,
                        statusString: beatUnit.playStatus.getStatusString(),
                        displaySymbol: beatUnit.playStatus.getDisplaySymbol()
                    }
                };

                // Дополнительная информация
                beatData.metadata = {
                    isPlayed: beatUnit.isPlayed(),
                    isMuted: beatUnit.isMuted(),
                    isSkipped: beatUnit.isSkipped(),
                    cssClass: beatUnit.getCSSClass()
                };

                beatUnits.push(beatData);
            });
        } else {
            // Fallback
            const arrowDisplay = window.guitarCombatApp?.arrowDisplay;
            if (arrowDisplay) {
                const playStatuses = arrowDisplay.getAllPlayStatuses();
                playStatuses.forEach((playStatus, index) => {
                    beatUnits.push({
                        index: index,
                        direction: index % 2 === 0 ? 'down' : 'up',
                        playStatus: {
                            status: playStatus.status,
                            statusString: playStatus.getStatusString(),
                            displaySymbol: playStatus.getDisplaySymbol()
                        }
                    });
                });
            }
        }

        return beatUnits;
    }

    /**
     * Собирает информацию о сменах аккордов в такте
     * @param {Bar} bar - Объект такта
     * @returns {Array} Массив смен аккордов
     */
    collectChordChanges(bar) {
        const chordChanges = [];
        
        if (bar.chordChanges && bar.chordChanges.length > 0) {
            bar.chordChanges.forEach(chordChange => {
                chordChanges.push({
                    name: chordChange.name,
                    startBeat: chordChange.startBeat,
                    endBeat: chordChange.endBeat,
                    duration: chordChange.getDuration()
                });
            });
        } else {
            // Пробуем получить аккорды из ChordParser
            const app = window.guitarCombatApp;
            if (app && app.chordParser) {
                const validChords = app.chordParser.getValidChords();
                if (validChords.length > 0) {
                    chordChanges.push({
                        name: validChords[0].name,
                        startBeat: 0,
                        endBeat: bar.beatCount || 4,
                        duration: bar.beatCount || 4
                    });
                }
            }
        }
        
        return chordChanges;
    }

    /**
     * Собирает информацию о слогах в такте
     * @param {Bar} bar - Объект такта
     * @returns {Array} Массив слогов
     */
    collectLyricSyllables(bar) {
        const syllables = [];
        
        if (bar.lyricSyllables && bar.lyricSyllables.length > 0) {
            bar.lyricSyllables.forEach(syllable => {
                syllables.push({
                    text: syllable.text,
                    startBeat: syllable.startBeat,
                    duration: syllable.duration,
                    endBeat: syllable.endBeat
                });
            });
        }
        
        return syllables;
    }

    /**
     * Собирает информацию о шаблонах
     * @returns {Object} Данные о шаблонах
     */
    collectTemplates() {
        const app = window.guitarCombatApp;
        
        return {
            strummingPattern: app?.currentStrummingPattern || "custom",
            customizations: {
                mutePattern: this.getMutePattern(),
                emphasisPattern: this.getEmphasisPattern(),
                dynamics: this.getDynamicsPattern()
            },
            generationInfo: {
                generatedAt: new Date().toISOString(),
                source: "Guitar Combat",
                version: "2.0"
            }
        };
    }

    /**
     * Создаёт такт из текущих настроек (если тактов нет)
     * @returns {Object} Данные такта
     */
    createBarFromCurrentSettings() {
        const beatCount = this.getArrowsPerBar();
        const arrowDisplay = window.guitarCombatApp?.arrowDisplay;
        
        const beatUnits = [];
        for (let i = 0; i < beatCount; i++) {
            let playStatus = PlayStatus.STATUS.SKIP;
            
            if (arrowDisplay) {
                const status = arrowDisplay.getPlayStatus(i);
                if (status) {
                    playStatus = status.status;
                }
            }
            
            beatUnits.push({
                index: i,
                direction: i % 2 === 0 ? 'down' : 'up',
                playStatus: {
                    status: playStatus,
                    statusString: playStatus === 1 ? 'играть' : playStatus === 2 ? 'с приглушиванием' : 'не играть',
                    displaySymbol: playStatus === 1 ? '●' : playStatus === 2 ? '⊗' : '○'
                }
            });
        }
        
        // Получаем аккорды
        const chords = this.getChords();
        const chordChanges = chords.length > 0 ? [{
            name: chords[0],
            startBeat: 0,
            endBeat: beatCount
        }] : [];
        
        return {
            index: 0,
            beatUnits: beatUnits,
            chordChanges: chordChanges,
            lyricSyllables: [],
            metadata: {
                isActive: true,
                hasChords: chords.length > 0,
                hasLyrics: false,
                playingBeats: beatUnits.filter(b => b.playStatus.status !== 0).length
            }
        };
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
     * Скачивает настройки в указанном формате
     * @param {string} format - Формат экспорта ('v2', 'current', 'legacy')
     */
    downloadJson(format = 'v2') {
        try {
            let data;
            let filename;
            
            switch (format) {
                case 'v2':
                    data = this.collectBattleSettingsV2();
                    filename = `guitar-combat-v2-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                case 'current':
                    data = this.collectBattleSettings();
                    filename = `guitar-combat-current-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                case 'legacy':
                    data = this.exportToLegacyFormat();
                    filename = `guitar-compat-legacy-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                default:
                    throw new Error(`Неподдерживаемый формат: ${format}`);
            }
            
            const jsonString = JSON.stringify(data, null, 2);
            
            // Создаем blob с JSON данными
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Создаем ссылку для скачивания
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Добавляем ссылку в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Освобождаем память
            URL.revokeObjectURL(url);
            
            console.log(`Настройки боя скачаны в формате ${format}:`, data);
            
        } catch (error) {
            console.error('Ошибка при скачивании настроек:', error);
            alert('Произошла ошибка при скачивании настроек. Проверьте консоль для подробностей.');
        }
    }

    /**
     * Экспортирует данные в старый формат (для совместимости)
     * @returns {Object} Данные в старом формате
     */
    exportToLegacyFormat() {
        const v2Data = this.collectBattleSettingsV2();
        const firstBar = v2Data.bars[0];
        
        return {
            beats: firstBar.beatUnits.map(unit => ({
                direction: unit.direction,
                play: unit.playStatus.status
            })),
            bpm: v2Data.metadata.tempo,
            speed: 100,
            timestamp: v2Data.metadata.createdAt
        };
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

    /**
     * Вспомогательные методы для нового формата
     */
    getTotalBeats() {
        const app = window.guitarCombatApp;
        if (app && app.bars) {
            return app.bars.reduce((total, bar) => total + (bar.beatCount || 4), 0);
        }
        return this.getArrowsPerBar();
    }

    calculateDuration() {
        const tempo = this.getTempo();
        const totalBeats = this.getTotalBeats();
        // Длительность в секундах = (количество_ударов / темп) * 60
        return Math.round((totalBeats / tempo) * 60);
    }

    detectRepeats() {
        // Логика определения повторений в композиции
        return false; // Заглушка
    }

    getRepeatStructure() {
        // Логика получения структуры повторений
        return []; // Заглушка
    }

    isBarActive(index) {
        // Проверка, активен ли такт
        return true; // Заглушка
    }

    countPlayingBeats(bar) {
        if (!bar.beatUnits) return 0;
        return bar.beatUnits.filter(beat => beat.isPlayed()).length;
    }

    getMutePattern() {
        // Получение паттерна глушения
        return []; // Заглушка
    }

    getEmphasisPattern() {
        // Получение паттерна акцентов
        return []; // Заглушка
    }

    getDynamicsPattern() {
        // Получение паттерна динамики
        return []; // Заглушка
    }
}

// Экспортируем класс для использования в других модулях
export { DownloadManager };
