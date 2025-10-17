/**
 * Класс NoteMapper - отвечает за сопоставление музыкальных нот с путями к аудиофайлам
 * Аудиофайлы находятся в папке audio/NotesMP3/
 * Паттерн именования: [Нота]#[Октава].mp3 или [Нота][Октава].mp3
 * Диапазон октав: 1-3
 * Ноты с диезами: A#, C#, D#, F#, G#
 * Специальный файл: Mute.mp3
 */
class NoteMapper {
    constructor() {
        // Базовый путь к аудиофайлам
        this.audioBasePath = 'audio/NotesMP3/';

        // Доступные ноты без диезов
        this.naturalNotes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        // Ноты с диезами
        this.sharpNotes = ['A#', 'C#', 'D#', 'F#', 'G#'];

        // Диапазон октав
        this.octaveRange = [1, 2, 3];

        // Соответствие бемолей диезам
        this.flatToSharpMap = {
            'Bb': 'A#',
            'Db': 'C#',
            'Eb': 'D#',
            'Gb': 'F#',
            'Ab': 'G#'
        };
    }

    /**
     * Получает путь к аудиофайлу по названию ноты и октаве
     * @param {string} note - Название ноты (например, 'A', 'C#', 'Bb')
     * @param {number} octave - Октав (1, 2 или 3)
     * @returns {string} Путь к аудиофайлу или null, если файл не существует
     */
    getAudioPath(note, octave) {
        // Обрабатываем специальный случай Mute
        if (note.toLowerCase() === 'mute') {
            return this.audioBasePath + 'Mute.mp3';
        }

        // Проверяем валидность октавы
        if (!this.octaveRange.includes(octave)) {
            return null;
        }

        // Преобразуем бемоль в диез, если необходимо
        const normalizedNote = this.flatToSharpMap[note] || note;

        // Проверяем, является ли нота валидной
        if (!this.naturalNotes.includes(normalizedNote) && !this.sharpNotes.includes(normalizedNote)) {
            return null;
        }

        // Формируем путь к файлу
        const fileName = `${normalizedNote}${octave}.mp3`;
        const fullPath = this.audioBasePath + fileName;

        // Проверяем существование файла (в браузере это может быть асинхронно,
        // но для синхронного интерфейса возвращаем путь, а проверку делаем отдельно)
        return fullPath;
    }

    /**
     * Проверяет существование файла ноты
     * @param {string} note - Название ноты
     * @param {number} octave - Октав
     * @returns {Promise<boolean>} true, если файл существует
     */
    async checkNoteExists(note, octave) {
        const path = this.getAudioPath(note, octave);
        if (!path) return false;

        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Получает все доступные ноты для указанной октавы
     * @param {number} octave - Октав (если не указан, возвращает для всех октав)
     * @returns {Array<string>} Массив доступных нот
     */
    getAvailableNotes(octave = null) {
        const notes = [];

        // Определяем октавы для проверки
        const octavesToCheck = octave !== null ? [octave] : this.octaveRange;

        // Добавляем все натуральные ноты и диезы
        const allNotes = [...this.naturalNotes, ...this.sharpNotes];

        for (const oct of octavesToCheck) {
            for (const note of allNotes) {
                notes.push(`${note}${oct}`);
            }
        }

        // Добавляем Mute
        notes.push('Mute');

        return notes;
    }

    /**
     * Получает все доступные ноты в формате объектов
     * @param {number} octave - Октав (если не указан, возвращает для всех октав)
     * @returns {Array<{note: string, octave: number, path: string}>} Массив объектов нот
     */
    getAvailableNoteObjects(octave = null) {
        const notes = [];
        const octavesToCheck = octave !== null ? [octave] : this.octaveRange;
        const allNotes = [...this.naturalNotes, ...this.sharpNotes];

        for (const oct of octavesToCheck) {
            for (const note of allNotes) {
                const path = this.getAudioPath(note, oct);
                if (path) {
                    notes.push({
                        note: note,
                        octave: oct,
                        path: path
                    });
                }
            }
        }

        // Добавляем Mute
        notes.push({
            note: 'Mute',
            octave: null,
            path: this.audioBasePath + 'Mute.mp3'
        });

        return notes;
    }

    /**
     * Нормализует название ноты (преобразует бемоли в диезы)
     * @param {string} note - Название ноты
     * @returns {string} Нормализованная нота
     */
    normalizeNoteName(note) {
        return this.flatToSharpMap[note] || note;
    }
}

// Экспортируем класс для использования в других модулях
export { NoteMapper };