/**
 * Класс ChordChange описывает смену аккорда в такте
 */
export class ChordChange {
    /**
     * @param {string} name - Название аккорда ('Am', 'F', 'C' и т.д.)
     * @param {number} startBeat - Начало аккорда (индекс BeatUnit)
     * @param {number} endBeat - Конец аккорда (индекс BeatUnit)
     */
    constructor(name, startBeat, endBeat) {
        this.name = name;
        this.startBeat = startBeat;
        this.endBeat = endBeat;
    }

    /**
     * Проверяет, активен ли аккорд на указанной длительности
     * @param {number} beatIndex - Индекс длительности
     * @returns {boolean}
     */
    isActiveAt(beatIndex) {
        return beatIndex >= this.startBeat && beatIndex < this.endBeat;
    }

    /**
     * Возвращает длительность аккорда в длительностях
     * @returns {number}
     */
    getDuration() {
        return this.endBeat - this.startBeat;
    }

    /**
     * Проверяет, пересекается ли аккорд с другим аккордом
     * @param {ChordChange} other - Другой аккорд
     * @returns {boolean}
     */
    overlapsWith(other) {
        return this.startBeat < other.endBeat && this.endBeat > other.startBeat;
    }

    /**
     * Проверяет, находится ли аккорд внутри другого аккорда
     * @param {ChordChange} other - Другой аккорд
     * @returns {boolean}
     */
    isInside(other) {
        return this.startBeat >= other.startBeat && this.endBeat <= other.endBeat;
    }

    /**
     * Проверяет, содержит ли аккорд указанную длительность
     * @param {number} beatIndex - Индекс длительности
     * @returns {boolean}
     */
    contains(beatIndex) {
        return beatIndex >= this.startBeat && beatIndex < this.endBeat;
    }

    /**
     * Сдвигает аккорд на указанное количество длительностей
     * @param {number} offset - Смещение
     */
    shift(offset) {
        this.startBeat += offset;
        this.endBeat += offset;
    }

    /**
     * Устанавливает новые границы аккорда
     * @param {number} startBeat - Новое начало
     * @param {number} endBeat - Новый конец
     */
    setBounds(startBeat, endBeat) {
        this.startBeat = startBeat;
        this.endBeat = endBeat;
    }

    /**
     * Создает копию объекта ChordChange
     * @returns {ChordChange}
     */
    clone() {
        return new ChordChange(this.name, this.startBeat, this.endBeat);
    }

    /**
     * Возвращает строковое представление аккорда
     * @returns {string}
     */
    toString() {
        return `${this.name} [${this.startBeat}-${this.endBeat})`;
    }

    /**
     * Возвращает объект для сериализации
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
            startBeat: this.startBeat,
            endBeat: this.endBeat
        };
    }

    /**
     * Создает ChordChange из JSON объекта
     * @param {Object} data - Данные для создания
     * @returns {ChordChange}
     */
    static fromJSON(data) {
        return new ChordChange(data.name, data.startBeat, data.endBeat);
    }
}
