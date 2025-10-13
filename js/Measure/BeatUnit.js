import { PlayStatus } from './PlayStatus.js';

/**
 * Класс BeatUnit описывает одну длительность в такте
 */
export class BeatUnit {
    /**
     * @param {number} index - Индекс длительности в такте
     * @param {PlayStatus|number} playStatus - Объект PlayStatus или число для обратной совместимости
     */
    constructor(index, playStatus = 0) {
        this.index = index;
        
        // Поддержка как нового PlayStatus, так и старого числового типа для обратной совместимости
        if (playStatus instanceof PlayStatus) {
            this.playStatus = playStatus;
        } else {
            // Создаем PlayStatus из старого числового типа
            this.playStatus = new PlayStatus(playStatus);
        }
    }

    /**
     * Проверяет, играется ли данная длительность
     * @returns {boolean}
     */
    isPlayed() {
        return this.playStatus.isPlayed();
    }

    /**
     * Проверяет, есть ли приглушение на данной длительности
     * @returns {boolean}
     */
    isMuted() {
        return this.playStatus.isMuted();
    }

    /**
     * Проверяет, пропускается ли данная длительность
     * @returns {boolean}
     */
    isSkipped() {
        return this.playStatus.isSkipped();
    }

    /**
     * Устанавливает тип звукоизвлечения
     * @param {number} type - Тип звукоизвлечения (для обратной совместимости)
     */
    setType(type) {
        this.playStatus = new PlayStatus(type);
    }

    /**
     * Устанавливает статус воспроизведения
     * @param {PlayStatus|number} playStatus - Статус воспроизведения
     */
    setPlayStatus(playStatus) {
        if (playStatus instanceof PlayStatus) {
            this.playStatus = playStatus;
        } else {
            this.playStatus = new PlayStatus(playStatus);
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
        return this.playStatus.getStatusString();
    }

    /**
     * Возвращает символ для отображения
     * @returns {string}
     */
    getDisplaySymbol() {
        return this.playStatus.getDisplaySymbol();
    }

    /**
     * Возвращает CSS класс для стилизации
     * @returns {string}
     */
    getCSSClass() {
        return this.playStatus.getCSSClass();
    }

    /**
     * Переключает статус воспроизведения
     */
    toggleStatus() {
        this.playStatus.toggleStatus();
    }

    /**
     * Получает числовое значение типа (для обратной совместимости)
     * @returns {number}
     */
    getType() {
        return this.playStatus.getStatus();
    }

    /**
     * Создает копию объекта BeatUnit
     * @returns {BeatUnit}
     */
    clone() {
        return new BeatUnit(this.index, this.playStatus.clone());
    }

    /**
     * Возвращает объект для сериализации
     * @returns {Object}
     */
    toJSON() {
        return {
            index: this.index,
            type: this.playStatus.getStatus(), // Для обратной совместимости
            playStatus: this.playStatus.toJSON()
        };
    }

    /**
     * Создает BeatUnit из JSON объекта
     * @param {Object} data - Данные для создания
     * @returns {BeatUnit}
     */
    static fromJSON(data) {
        // Поддержка как старого формата (type), так и нового (playStatus)
        if (data.playStatus) {
            return new BeatUnit(data.index, PlayStatus.fromJSON(data.playStatus));
        } else {
            return new BeatUnit(data.index, data.type);
        }
    }
}
