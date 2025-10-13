/**
 * Класс LyricSyllable описывает слог в тексте песни
 */
export class LyricSyllable {
    /**
     * @param {string} text - Сам слог, например "люб-"
     * @param {number} startBeat - Начало слога (индекс BeatUnit)
     * @param {number} duration - Длительность слога в длительностях
     */
    constructor(text, startBeat, duration) {
        this.text = text;
        this.startBeat = startBeat;
        this.duration = duration;
    }

    /**
     * Возвращает конец слога
     * @returns {number}
     */
    get endBeat() {
        return this.startBeat + this.duration;
    }

    /**
     * Проверяет, активен ли слог на указанной длительности
     * @param {number} beatIndex - Индекс длительности
     * @returns {boolean}
     */
    isActiveAt(beatIndex) {
        return beatIndex >= this.startBeat && beatIndex < this.endBeat;
    }

    /**
     * Проверяет, пересекается ли слог с другим слогом
     * @param {LyricSyllable} other - Другой слог
     * @returns {boolean}
     */
    overlapsWith(other) {
        return this.startBeat < other.endBeat && this.endBeat > other.startBeat;
    }

    /**
     * Проверяет, находится ли слог внутри другого слога
     * @param {LyricSyllable} other - Другой слог
     * @returns {boolean}
     */
    isInside(other) {
        return this.startBeat >= other.startBeat && this.endBeat <= other.endBeat;
    }

    /**
     * Проверяет, содержит ли слог указанную длительность
     * @param {number} beatIndex - Индекс длительности
     * @returns {boolean}
     */
    contains(beatIndex) {
        return beatIndex >= this.startBeat && beatIndex < this.endBeat;
    }

    /**
     * Сдвигает слог на указанное количество длительностей
     * @param {number} offset - Смещение
     */
    shift(offset) {
        this.startBeat += offset;
    }

    /**
     * Устанавливает новые параметры слога
     * @param {number} startBeat - Новое начало
     * @param {number} duration - Новая длительность
     */
    setTiming(startBeat, duration) {
        this.startBeat = startBeat;
        this.duration = duration;
    }

    /**
     * Проверяет, пустой ли текст слога
     * @returns {boolean}
     */
    isEmpty() {
        return !this.text || this.text.trim() === '';
    }

    /**
     * Возвращает очищенный текст слога
     * @returns {string}
     */
    getCleanText() {
        return this.text ? this.text.trim() : '';
    }

    /**
     * Создает копию объекта LyricSyllable
     * @returns {LyricSyllable}
     */
    clone() {
        return new LyricSyllable(this.text, this.startBeat, this.duration);
    }

    /**
     * Возвращает строковое представление слога
     * @returns {string}
     */
    toString() {
        return `"${this.text}" [${this.startBeat}-${this.endBeat})`;
    }

    /**
     * Возвращает объект для сериализации
     * @returns {Object}
     */
    toJSON() {
        return {
            text: this.text,
            startBeat: this.startBeat,
            duration: this.duration
        };
    }

    /**
     * Создает LyricSyllable из JSON объекта
     * @param {Object} data - Данные для создания
     * @returns {LyricSyllable}
     */
    static fromJSON(data) {
        return new LyricSyllable(data.text, data.startBeat, data.duration);
    }
}
