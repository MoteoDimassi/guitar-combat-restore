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
            console.log(`🔄 BeatUnit.constructor[${index}]: ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus из числа ${playStatus}`);
            this.playStatus = PlayStatus.getInstance(playStatus);
            console.log(`🆕 BeatUnit.constructor[${index}]: ПОЛУЧЕН СТАТИЧЕСКИЙ PlayStatus из числа ${playStatus}, ID: ${this.playStatus.constructor.name}_${this.playStatus.status}`);
        } else {
            // Позволяем устанавливать null, чтобы ArrowDisplay мог управлять статусами
            this.playStatus = playStatus;
            if (playStatus) {
                console.log(`🔗 BeatUnit.constructor[${index}]: УСТАНОВЛЕН СУЩЕСТВУЮЩИЙ PlayStatus, ID: ${playStatus.constructor.name}_${playStatus.status}`);
            } else {
                console.log(`⚠️ BeatUnit.constructor[${index}]: PlayStatus установлен в null`);
            }
        }
        this.chord = chord;
        this.syllable = syllable;
        
        // Механизм событий для уведомления об изменениях статуса
        this.statusChangeListeners = new Set();
        this.parentBar = null;
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
        const oldStatus = this.playStatus;
        
        // Если передано число, получаем статический экземпляр PlayStatus
        if (typeof playStatus === 'number') {
            console.log(`🔄 BeatUnit.setPlayStatus[${this.index}]: ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus из числа ${playStatus} (было: ${oldStatus ? oldStatus.status : 'null'})`);
            this.playStatus = PlayStatus.getInstance(playStatus);
            console.log(`🆕 BeatUnit.setPlayStatus[${this.index}]: ПОЛУЧЕН СТАТИЧЕСКИЙ PlayStatus из числа ${playStatus}, ID: ${this.playStatus.constructor.name}_${this.playStatus.status} (было: ${oldStatus ? oldStatus.status : 'null'})`);
        } else {
            this.playStatus = playStatus;
            if (playStatus) {
                console.log(`🔄 BeatUnit.setPlayStatus[${this.index}]: УСТАНОВЛЕН СУЩЕСТВУЮЩИЙ PlayStatus "${playStatus.getStatusString()}" [${playStatus.status}], ID: ${playStatus.constructor.name}_${playStatus.status} (было: ${oldStatus ? oldStatus.getStatusString() : 'null'}] [${oldStatus ? oldStatus.status : 'null'}])`);
            } else {
                console.log(`⚠️ BeatUnit.setPlayStatus[${this.index}]: PlayStatus установлен в null (было: ${oldStatus ? oldStatus.getStatusString() : 'null'}] [${oldStatus ? oldStatus.status : 'null'}])`);
            }
        }
        
        if (this.playStatus) {
            console.log(`🔄 BeatUnit ${this.index + 1}: PlayStatus object ID: ${this.playStatus.constructor.name}_${this.playStatus.status}`);
        }
        
        // Уведомляем слушателей об изменении статуса
        this.notifyStatusChange(oldStatus, this.playStatus);
    }

    /**
     * Получает статус воспроизведения
     * @returns {PlayStatus}
     */
    getPlayStatus() {
        console.log(`🔄 BeatUnit.getPlayStatus(${this.index}): "${this.playStatus ? this.playStatus.getStatusString() : 'null'}" [${this.playStatus ? this.playStatus.status : 'null'}]`);
        if (this.playStatus) {
            console.log(`🔄 BeatUnit ${this.index + 1}: PlayStatus object ID: ${this.playStatus.constructor.name}_${this.playStatus.status}`);
        }
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
        const oldStatus = this.playStatus ? this.playStatus.clone() : null;
        
        if (this.playStatus) {
            // Вычисляем новый статус
            const newStatus = (this.playStatus.getStatus() + 1) % 3;
            // Получаем статический экземпляр для нового статуса
            console.log(`🔄 BeatUnit.toggleStatus(${this.index}): ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus для нового статуса ${newStatus} (было: ${oldStatus.getStatusString()})`);
            this.playStatus = PlayStatus.getInstance(newStatus);
            console.log(`🔄 BeatUnit.toggleStatus(${this.index}): статус изменен с "${oldStatus.getStatusString()}" на "${this.playStatus.getStatusString()}"`);
        } else {
            // Если статуса нет, получаем статический экземпляр со статусом PLAY
            console.log(`🔄 BeatUnit.toggleStatus[${this.index}]: ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus со статусом PLAY (было: null)`);
            this.playStatus = PlayStatus.getInstance(PlayStatus.STATUS.PLAY);
            console.log(`🆕 BeatUnit.toggleStatus[${this.index}]: ПОЛУЧЕН СТАТИЧЕСКИЙ PlayStatus со статусом PLAY, ID: ${this.playStatus.constructor.name}_${this.playStatus.status} (было: null)`);
        }
        
        // Уведомляем слушателей об изменении статуса
        this.notifyStatusChange(oldStatus, this.playStatus);
    }

    /**
     * Добавляет слушателя изменений статуса
     * @param {Function} listener - Функция-слушатель, принимающая (beatUnit, oldStatus, newStatus)
     */
    addStatusChangeListener(listener) {
        if (typeof listener === 'function') {
            this.statusChangeListeners.add(listener);
            console.log(`📢 BeatUnit(${this.index}): добавлен слушатель изменений статуса. Всего слушателей: ${this.statusChangeListeners.size}`);
        }
    }

    /**
     * Удаляет слушателя изменений статуса
     * @param {Function} listener - Функция-слушатель для удаления
     */
    removeStatusChangeListener(listener) {
        const removed = this.statusChangeListeners.delete(listener);
        if (removed) {
            console.log(`📢 BeatUnit(${this.index}): удален слушатель изменений статуса. Всего слушателей: ${this.statusChangeListeners.size}`);
        }
        return removed;
    }

    /**
     * Уведомляет всех слушателей об изменении статуса
     * @param {PlayStatus|null} oldStatus - Предыдущий статус
     * @param {PlayStatus|null} newStatus - Новый статус
     */
    notifyStatusChange(oldStatus, newStatus) {
        if (this.statusChangeListeners.size > 0) {
            console.log(`📢 BeatUnit(${this.index}): уведомление ${this.statusChangeListeners.size} слушателей об изменении статуса: "${oldStatus ? oldStatus.getStatusString() : 'null'}" -> "${newStatus ? newStatus.getStatusString() : 'null'}"`);
            
            // Вызываем всех слушателей
            this.statusChangeListeners.forEach(listener => {
                try {
                    listener(this, oldStatus, newStatus);
                } catch (error) {
                    console.error(`❌ BeatUnit(${this.index}): ошибка при вызове слушателя:`, error);
                }
            });
        }
    }

    /**
     * Устанавливает ссылку на родительский Bar
     * @param {Bar|null} parentBar - Родительский Bar или null
     */
    setParentBar(parentBar) {
        const oldParent = this.parentBar;
        this.parentBar = parentBar;
        
        if (parentBar) {
            console.log(`🔗 BeatUnit(${this.index}): установлена связь с родительским Bar(${parentBar.barIndex})`);
        } else {
            console.log(`🔗 BeatUnit(${this.index}): удалена связь с родительским Bar (был: ${oldParent ? oldParent.barIndex : 'null'})`);
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
            playStatus: this.playStatus || PlayStatus.getInstance(PlayStatus.STATUS.SKIP),
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
        console.log(`🔄 BeatUnit(${this.index}): НАЧИНАЕМ СОЗДАНИЕ КОПИИ`);
        
        if (this.playStatus) {
            console.log(`🔄 BeatUnit(${this.index}): ЗАПРАШИВАЕМ СТАТИЧЕСКИЙ PlayStatus для клона со статусом ${this.playStatus.getStatus()}`);
        }
        
        const clonedBeatUnit = new BeatUnit(
            this.index,
            this.playStatus ? PlayStatus.getInstance(this.playStatus.getStatus()) : null,
            this.chord ? this.chord.clone() : null,
            this.syllable ? this.syllable.clone() : null
        );
        
        // Примечание: слушатели событий не копируются, так как они относятся к конкретному экземпляру
        // и parentBar также не копируется, так как копия будет использоваться в другом контексте
        console.log(`🔄 BeatUnit(${this.index}): создана копия без слушателей событий и parentBar`);
        
        return clonedBeatUnit;
    }

    /**
     * Возвращает объект для сериализации
     * @returns {Object}
     */
    toJSON() {
        const result = {
            index: this.index,
            playStatus: this.playStatus ? this.playStatus.toJSON() : PlayStatus.getInstance(PlayStatus.STATUS.SKIP).toJSON()
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
            playStatus = PlayStatus.getInstance(PlayStatus.STATUS.SKIP);
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
