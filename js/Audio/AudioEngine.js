/**
 * Класс AudioEngine - управляет воспроизведением аудиофайлов нот
 * Загружает, кэширует и воспроизводит аудиофайлы, управляет состоянием воспроизведения
 */
import { NoteMapper } from './NoteMapper.js';
import { ChordAudioParser } from './ChordAudioParser.js';
import { PlayStatus } from '../Measure/PlayStatus.js';

export class AudioEngine {
    constructor(options = {}) {
        // Опции конфигурации
        this.options = {
            volume: options.volume || 0.7,
            fadeInTime: options.fadeInTime || 0.05,
            fadeOutTime: options.fadeOutTime || 0.1,
            ...options
        };

        // AudioContext с кроссбраузерной поддержкой
        this.audioContext = null;
        this.masterGainNode = null;

        // Кэш загруженных аудиобуферов
        this.audioCache = new Map();

        // Активные источники звука для управления
        this.activeSources = new Set();

        // Зависимости
        this.noteMapper = new NoteMapper();
        this.chordAudioParser = new ChordAudioParser();

        // Инициализация AudioContext
        this.initAudioContext();

        // Предзагрузка файла Mute.mp3
        this.preloadMuteSound();
    }

    /**
     * Инициализация AudioContext с кроссбраузерной поддержкой
     */
    initAudioContext() {
        try {
            // Кроссбраузерная инициализация AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            
            if (!AudioContextClass) {
                console.error('Web Audio API не поддерживается в этом браузере');
                return;
            }

            this.audioContext = new AudioContextClass();

            // Создаем узел управления громкостью
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.options.volume;
            this.masterGainNode.connect(this.audioContext.destination);

            // Обработка возобновления контекста (для браузеров с автополитикой)
            if (this.audioContext.state === 'suspended') {
                const resumeAudio = () => {
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('touchstart', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                };

                // Добавляем обработчики для возобновления аудиоконтекста
                document.addEventListener('click', resumeAudio, { once: true });
                document.addEventListener('touchstart', resumeAudio, { once: true });
                document.addEventListener('keydown', resumeAudio, { once: true });
            }

            console.log('AudioEngine инициализирован успешно');
        } catch (error) {
            console.error('Ошибка при инициализации AudioContext:', error);
        }
    }

    /**
     * Предзагрузка файла Mute.mp3
     */
    async preloadMuteSound() {
        try {
            await this.loadAudioFile('Mute');
            console.log('Файл Mute.mp3 предзагружен');
        } catch (error) {
            console.error('Ошибка при предзагрузке Mute.mp3:', error);
        }
    }

    /**
     * Загрузка аудиофайла и кэширование
     * @param {string} note - Название ноты (например, 'A', 'C#', 'Mute')
     * @param {number} octave - Октава (1, 2 или 3)
     * @returns {Promise<AudioBuffer>} Загруженный аудиобуфер
     */
    async loadAudioFile(note, octave = null) {
        // Формируем ключ для кэша
        const cacheKey = octave !== null ? `${note}${octave}` : note;

        // Проверяем, уже ли файл загружен
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }

        try {
            // Получаем путь к файлу
            let audioPath;
            if (note.toLowerCase() === 'mute') {
                audioPath = this.noteMapper.getAudioPath('Mute');
            } else {
                audioPath = this.noteMapper.getAudioPath(note, octave);
            }

            if (!audioPath) {
                throw new Error(`Не найден путь к аудиофайлу для ноты ${note}${octave ? octave : ''}`);
            }

            // Загружаем файл
            console.log(`Загрузка аудиофайла: ${audioPath}`);
            const response = await fetch(audioPath);
            if (!response.ok) {
                throw new Error(`Ошибка загрузки аудиофайла: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Сохраняем в кэш
            this.audioCache.set(cacheKey, audioBuffer);

            return audioBuffer;
        } catch (error) {
            console.error(`Ошибка при загрузке аудиофайла ${note}${octave ? octave : ''}:`, error);
            throw error;
        }
    }

    /**
     * Воспроизведение отдельной ноты
     * @param {string} note - Название ноты
     * @param {number} octave - Октава
     * @param {Object} options - Дополнительные опции воспроизведения
     * @returns {Promise<AudioBufferSourceNode>} Созданный источник звука
     */
    async playNote(note, octave = 1, options = {}) {
        if (!this.audioContext || this.audioContext.state === 'suspended') {
            console.warn('AudioContext не инициализирован или приостановлен');
            return null;
        }

        try {
            // Загружаем аудиофайл, если еще не загружен
            const audioBuffer = await this.loadAudioFile(note, octave);

            // Создаем источник звука
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;

            // Создаем узел для управления громкостью этой ноты
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = options.volume || 1.0;

            // Подключаем узлы
            source.connect(gainNode);
            gainNode.connect(this.masterGainNode);

            // Добавляем в список активных источников
            this.activeSources.add(source);

            // Обработчик окончания воспроизведения
            source.onended = () => {
                this.activeSources.delete(source);
            };

            // Начинаем воспроизведение
            const startTime = options.startTime || 0;
            source.start(startTime);

            return source;
        } catch (error) {
            console.error(`Ошибка при воспроизведении ноты ${note}${octave}:`, error);
            return null;
        }
    }

    /**
     * Воспроизведение аккорда (нескольких нот одновременно)
     * @param {Array<string>} notes - Массив нот
     * @param {number} octave - Октава по умолчанию
     * @param {Object} options - Дополнительные опции воспроизведения
     * @returns {Promise<Array<AudioBufferSourceNode>>} Массив созданных источников звука
     */
    async playChord(notes, octave = 1, options = {}) {
        if (!Array.isArray(notes)) {
            console.error('notes должен быть массивом');
            return [];
        }

        const sources = [];

        for (const note of notes) {
            try {
                const source = await this.playNote(note, octave, options);
                if (source) {
                    sources.push(source);
                }
            } catch (error) {
                console.error(`Ошибка при воспроизведении ноты ${note} в аккорде:`, error);
            }
        }

        return sources;
    }

    /**
     * Воспроизведение аккорда по его названию
     * @param {string} chordName - Название аккорда
     * @param {number} octave - Октава по умолчанию
     * @param {Object} options - Дополнительные опции воспроизведения
     * @returns {Promise<Array<AudioBufferSourceNode>>} Массив созданных источников звука
     */
    async playChordByName(chordName, octave = 1, options = {}) {
        try {
            const chordNotes = await this.chordAudioParser.getChordNotes(chordName);
            if (!chordNotes || chordNotes.length === 0) {
                console.error(`Не удалось получить ноты для аккорда ${chordName}`);
                return [];
            }

            return await this.playChord(chordNotes, octave, options);
        } catch (error) {
            console.error(`Ошибка при воспроизведении аккорда ${chordName}:`, error);
            return [];
        }
    }

    /**
     * Воспроизведение звука в соответствии со статусом PlayStatus
     * @param {string|Array<string>} notes - Нота или массив нот
     * @param {number|PlayStatus} octaveOrStatus - Октава или объект PlayStatus
     * @param {number} octave - Октава (если второй параметр - PlayStatus)
     * @param {Object} options - Дополнительные опции воспроизведения
     * @returns {Promise<Array<AudioBufferSourceNode>|AudioBufferSourceNode|null>} Результат воспроизведения
     */
    async playWithStatus(notes, octaveOrStatus, octave = 1, options = {}) {
        let playStatus;
        let targetOctave = octave;

        // Определяем параметры в зависимости от типа второго аргумента
        if (octaveOrStatus instanceof PlayStatus) {
            playStatus = octaveOrStatus;
        } else if (typeof octaveOrStatus === 'number') {
            targetOctave = octaveOrStatus;
            playStatus = PlayStatus.INSTANCES.PLAY;
        } else {
            playStatus = PlayStatus.INSTANCES.PLAY;
        }

        // Обрабатываем статус SKIP
        if (playStatus.isSkipped()) {
            return null;
        }

        // Обрабатываем статус MUTED
        if (playStatus.isMuted()) {
            return await this.playNote('Mute', null, options);
        }

        // Обрабатываем статус PLAY
        if (playStatus.isPlayed()) {
            if (Array.isArray(notes)) {
                return await this.playChord(notes, targetOctave, options);
            } else {
                return await this.playNote(notes, targetOctave, options);
            }
        }

        return null;
    }

    /**
     * Установка громкости
     * @param {number} volume - Уровень громкости (0.0 - 1.0)
     */
    setVolume(volume) {
        if (typeof volume !== 'number' || volume < 0 || volume > 1) {
            console.error('Громкость должна быть числом от 0 до 1');
            return;
        }

        this.options.volume = volume;
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = volume;
        }
    }

    /**
     * Получение текущей громкости
     * @returns {number} Текущий уровень громкости
     */
    getVolume() {
        return this.options.volume;
    }

    /**
     * Плавное изменение громкости
     * @param {number} targetVolume - Целевая громкость
     * @param {number} duration - Длительность перехода в секундах
     */
    async fadeVolume(targetVolume, duration = 1.0) {
        if (!this.masterGainNode) {
            this.setVolume(targetVolume);
            return;
        }

        if (typeof targetVolume !== 'number' || targetVolume < 0 || targetVolume > 1) {
            console.error('Целевая громкость должна быть числом от 0 до 1');
            return;
        }

        const currentTime = this.audioContext.currentTime;
        this.masterGainNode.gain.cancelScheduledValues(currentTime);
        this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, currentTime);
        this.masterGainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);

        this.options.volume = targetVolume;
    }

    /**
     * Остановка всех активных источников звука
     */
    stopAll() {
        for (const source of this.activeSources) {
            try {
                if (source.stop) {
                    source.stop(0);
                }
            } catch (error) {
                // Источник может быть уже остановлен, игнорируем ошибку
            }
        }
        this.activeSources.clear();
    }

    /**
     * Пауза всех активных источников звука
     * В Web Audio API нет настоящей паузы, поэтому реализуем через остановку с сохранением состояния
     */
    pauseAll() {
        this.stopAll();
    }

    /**
     * Проверка инициализации AudioContext
     * @returns {boolean} True, если AudioContext инициализирован
     */
    isInitialized() {
        return this.audioContext !== null && this.audioContext.state !== 'closed';
    }

    /**
     * Получение состояния AudioContext
     * @returns {string} Состояние AudioContext
     */
    getContextState() {
        return this.audioContext ? this.audioContext.state : 'uninitialized';
    }

    /**
     * Предзагрузка аудиофайлов для указанных нот
     * @param {Array<string>} notes - Массив нот
     * @param {number} octave - Октава по умолчанию
     * @returns {Promise<void>}
     */
    async preloadNotes(notes, octave = 1) {
        const promises = [];

        for (const note of notes) {
            if (note.toLowerCase() === 'mute') {
                promises.push(this.loadAudioFile('Mute'));
            } else {
                promises.push(this.loadAudioFile(note, octave));
            }
        }

        try {
            await Promise.all(promises);
            console.log(`Предзагружено ${notes.length} аудиофайлов`);
        } catch (error) {
            console.error('Ошибка при предзагрузке аудиофайлов:', error);
        }
    }

    /**
     * Очистка кэша аудиофайлов
     */
    clearCache() {
        this.stopAll();
        this.audioCache.clear();
        console.log('Кэш аудиофайлов очищен');
    }

    /**
     * Получение информации о кэше
     * @returns {Object} Информация о кэше
     */
    getCacheInfo() {
        return {
            size: this.audioCache.size,
            keys: Array.from(this.audioCache.keys()),
            activeSources: this.activeSources.size
        };
    }

    /**
     * Освобождение ресурсов
     */
    dispose() {
        this.stopAll();
        this.clearCache();

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.audioContext = null;
        this.masterGainNode = null;
        this.noteMapper = null;
        this.chordAudioParser = null;

        console.log('AudioEngine освобожден');
    }
}