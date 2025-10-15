import { PlayStatus } from './PlayStatus.js';
import { ChordChange } from './ChordChange.js';
import { LyricSyllable } from './LyricSyllable.js';

/**
 * Класс BeatUnit описывает одну длительность в такте
 */
export class BeatUnit {
    /**
     * @param {number} index - Индекс длительности в такте
     * @param {PlayStatus|number} playStatus - Объект PlayStatus или число для обратной совместимости
     * @param {ChordChange|null} chord - Аккорд, связанный с этой длительностью
     * @param {LyricSyllable|null} syllable - Слог, связанный с этой длительностью
     */
    constructor(index, playStatus = null, chord = null, syllable = null) {
        this.index = index;
        // Если передано число, создаем объект PlayStatus
        if (typeof playStatus === 'number') {
            this.playStatus = new PlayStatus(playStatus);
        } else {
            // Позволяем устанавливать null, чтобы ArrowDisplay мог управлять статусами
            this.playStatus = playStatus;
        }
        this.chord = chord;
        this.syllable = syllable;
    }

    /**
     * Проверяет, играется ли данная длительность
     * @returns {boolean}
     */
    isPlayed() {
        return this.playStatus ? this.playStatus.isPlayed() : false;
    }

    /**
     * Проверяет, есть ли приглушение на данной длительности
     * @returns {boolean}
     */
    isMuted() {
        return this.playStatus ? this.playStatus.isMuted() : false;
    }

    /**
     * Проверяется, пропускается ли данная длительность
     * @returns {boolean}
     */
    isSkipped() {
        return this.playStatus ? this.playStatus.isSkipped() : true;
    }

    /**
     * Устанавливает статус воспроизведения
     * @param {PlayStatus} playStatus - Статус воспроизведения
     */
    setPlayStatus(playStatus) {
        // Если передано число, создаем объект PlayStatus
        if (typeof playStatus === 'number') {
            this.playStatus = new PlayStatus(playStatus);
        } else {
            this.playStatus = playStatus;
        }
    }

    /**
     * Получает статус воспроизведения
     * @returns {PlayStatus}
     */
    getPlayStatus() {
        return this.playStatus;
    }

    /**
     * Возвращает строковое представление типа
     * @returns {string}
     */
    getTypeString() {
        return this.playStatus ? this.playStatus.getStatusString() : 'SKIP';
    }

    /**
     * Возвращает символ для отображения
     * @returns {string}
     */
    getDisplaySymbol() {
        return this.playStatus ? this.playStatus.getDisplaySymbol() : '○';
    }

    /**
     * Возвращает CSS класс для стилизации
     * @returns {string}
     */
    getCSSClass() {
        return this.playStatus ? this.playStatus.getCSSClass() : 'play-status-skip';
    }

    /**
     * Переключает статус воспроизведения
     */
    toggleStatus() {
        if (this.playStatus) {
            this.playStatus.toggleStatus();
        } else {
            // Если статуса нет, создаем новый со статусом PLAY
            this.playStatus = new PlayStatus(PlayStatus.STATUS.PLAY);
        }
    }


    /**
     * Устанавливает аккорд для этой длительности
     * @param {ChordChange|null} chord - Аккорд или null
     */
    setChord(chord) {
        this.chord = chord;
    }

    /**
     * Получает аккорд для этой длительности
     * @returns {ChordChange|null}
     */
    getChord() {
        return this.chord;
    }

    /**
     * Устанавливает слог для этой длительности
     * @param {LyricSyllable|null} syllable - Слог или null
     */
    setSyllable(syllable) {
        this.syllable = syllable;
    }

    /**
     * Получает слог для этой длительности
     * @returns {LyricSyllable|null}
     */
    getSyllable() {
        return this.syllable;
    }

    /**
     * Получает полную информацию о длительности
     * @returns {Object} Объект с полной информацией
     */
    getFullInfo() {
        return {
            index: this.index,
            playStatus: this.playStatus || new PlayStatus(PlayStatus.STATUS.SKIP),
            chord: this.chord,
            syllable: this.syllable,
            isPlayed: this.isPlayed(),
            isMuted: this.isMuted(),
            isSkipped: this.isSkipped(),
            typeString: this.getTypeString(),
            displaySymbol: this.getDisplaySymbol(),
            cssClass: this.getCSSClass()
        };
    }

    /**
     * Проверяет, есть ли у этой длительности связанный аккорд
     * @returns {boolean}
     */
    hasChord() {
        return this.chord !== null;
    }

    /**
     * Проверяет, есть ли у этой длительности связанный слог
     * @returns {boolean}
     */
    hasSyllable() {
        return this.syllable !== null;
    }

    /**
     * Создает копию объекта BeatUnit
     * @returns {BeatUnit}
     */
    clone() {
        return new BeatUnit(
            this.index,
            this.playStatus ? this.playStatus.clone() : null,
            this.chord ? this.chord.clone() : null,
            this.syllable ? this.syllable.clone() : null
        );
    }

    /**
     * Возвращает объект для сериализации
     * @returns {Object}
     */
    toJSON() {
        const result = {
            index: this.index,
            playStatus: this.playStatus ? this.playStatus.toJSON() : new PlayStatus(PlayStatus.STATUS.SKIP).toJSON()
        };
        
        // Добавляем информацию об аккорде и слоге, если они есть
        if (this.chord) {
            result.chord = this.chord.toJSON();
        }
        
        if (this.syllable) {
            result.syllable = this.syllable.toJSON();
        }
        
        return result;
    }

    /**
     * Создает BeatUnit из JSON объекта
     * @param {Object} data - Данные для создания
     * @returns {BeatUnit}
     */
    static fromJSON(data) {
        const playStatus = PlayStatus.fromJSON(data.playStatus);
        
        // Убеждаемся, что у нас есть корректный объект PlayStatus
        if (!playStatus || typeof playStatus.getStatusString !== 'function') {
            playStatus = new PlayStatus(PlayStatus.STATUS.SKIP);
        }
        
        // Восстанавливаем аккорд, если он есть
        let chord = null;
        if (data.chord) {
            chord = ChordChange.fromJSON(data.chord);
        }
        
        // Восстанавливаем слог, если он есть
        let syllable = null;
        if (data.syllable) {
            syllable = LyricSyllable.fromJSON(data.syllable);
        }
        
        return new BeatUnit(data.index, playStatus, chord, syllable);
    }
}
