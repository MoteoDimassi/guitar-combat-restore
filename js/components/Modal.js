// Компонент модального окна для отображения политики конфиденциальности и других документов
import { SyllableHighlighter } from '../utils/SyllableHighlighter.js';

export class Modal {
  constructor() {
    this.isOpen = false;
    this.currentContent = '';
    this.onCloseCallback = null;
  }

  init() {
    // Создаем HTML структуру модального окна
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    // Проверяем, существует ли уже модальное окно
    if (document.getElementById('modal-container')) {
      return;
    }

    const modalHTML = `
      <div id="modal-container" class="fixed inset-0 z-50 hidden">
        <!-- Оверлей -->
        <div id="modal-overlay" class="absolute inset-0 bg-black bg-opacity-75 transition-opacity"></div>
        
        <!-- Контент модального окна -->
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <div id="modal-content" class="relative transform overflow-hidden rounded-lg bg-gray-900 border border-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <!-- Заголовок с кнопкой закрытия -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h3 id="modal-title" class="text-xl font-semibold text-white"></h3>
                <button id="modal-close-btn" class="text-gray-400 hover:text-white transition-colors">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <!-- Основной контент -->
              <div id="modal-body" class="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div id="modal-text" class="text-gray-300 text-base leading-relaxed"></div>
              </div>
              
              <!-- Футер с кнопкой закрытия -->
              <div class="px-6 py-4 border-t border-gray-800">
                <button id="modal-footer-close-btn" class="w-full sm:w-auto flex justify-center rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Добавляем модальное окно в конец body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  bindEvents() {
    const modalContainer = document.getElementById('modal-container');
    const closeButtons = document.querySelectorAll('#modal-close-btn, #modal-footer-close-btn');
    const overlay = document.getElementById('modal-overlay');

    if (modalContainer && overlay) {
      // Закрытие по клику на оверлей
      overlay.addEventListener('click', () => {
        this.close();
      });

      // Закрытие по кнопкам
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.close();
        });
      });

      // Закрытие по клавише ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
  }

  open(title, content, onCloseCallback = null) {
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');

    if (modalContainer && modalTitle && modalText) {
      this.currentContent = content;
      this.onCloseCallback = onCloseCallback;
      
      modalTitle.textContent = title;
      modalText.innerHTML = content;
      
      modalContainer.classList.remove('hidden');
      modalContainer.classList.add('block');
      
      // Анимация появления
      const modalContent = document.getElementById('modal-content');
      if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
          modalContent.classList.remove('scale-95', 'opacity-0');
          modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
      }
      
      this.isOpen = true;
      document.body.style.overflow = 'hidden'; // Предотвращаем скролл основной страницы
    }
  }

  close() {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');

    if (modalContainer && this.isOpen) {
      // Анимация исчезновения
      if (modalContent) {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
      }
      
      setTimeout(() => {
        modalContainer.classList.add('hidden');
        modalContainer.classList.remove('block');
        document.body.style.overflow = ''; // Восстанавливаем скролл
        
        this.isOpen = false;
        this.currentContent = '';
        
        if (this.onCloseCallback) {
          this.onCloseCallback();
          this.onCloseCallback = null;
        }
      }, 150);
    }
  }

  // Метод для отображения политики конфиденциальности
  showPrivacyPolicy() {
    const title = 'Политика конфиденциальности';
    const content = this.getPrivacyPolicyContent();
    this.open(title, content);
  }

  // Метод для отображения условий использования
  showTermsOfUse() {
    const title = 'Условия использования';
    const content = this.getTermsOfUseContent();
    this.open(title, content);
  }

  // Метод для отображения формы добавления текста песни
  showAddSongText() {
    const title = 'Добавить текст песни';
    const content = this.getAddSongTextContent();
    this.open(title, content);
    // Добавляем обработчики после открытия модального окна
    this.bindAddSongTextEvents();
  }

  // Метод для отображения формы редактирования текста песни
  showEditSongText() {
    const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
    if (songs.length === 0) {
      alert('Нет сохраненного текста песни для редактирования.');
      return;
    }
    
    const latestSong = songs[songs.length - 1];
    const title = 'Редактировать текст песни';
    const content = this.getEditSongTextContent(latestSong.title, latestSong.text);
    this.open(title, content);
    // Добавляем обработчики после открытия модального окна
    this.bindEditSongTextEvents();
  }

  /**
   * Модалка для ручного редактирования слогов в слове
   * @param {string} word — исходное слово (без пунктуации)
   * @param {string[]} currentSyllables — текущие слоги (массив)
   * @param {function} onSave — колбэк (syllablesArray)
   */
  showSyllableEdit(word, currentSyllables, onSave) {
    const title = 'Редактирование слогов';
    const value = (currentSyllables && currentSyllables.length > 0) ? currentSyllables.join(' ') : word;
    const content = `
      <div class="space-y-4">
        <div class="text-gray-300 text-base">Слово: <span class="font-bold text-white">${word}</span></div>
        <div>
          <label for="syllable-edit-input" class="block text-sm font-medium text-gray-300 mb-2">Разделите слоги пробелами</label>
          <input type="text" id="syllable-edit-input" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#38e07b] focus:border-transparent" value="${value}" autocomplete="off" spellcheck="false">
          <p class="text-xs text-gray-500 mt-2">Пример: <span class="italic">мо ло ко</span></p>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button id="syllable-edit-cancel" class="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors font-medium">Отмена</button>
          <button id="syllable-edit-save" class="px-4 py-2 bg-[#38e07b] text-gray-950 rounded-md hover:bg-emerald-400 transition-colors font-medium">Сохранить</button>
        </div>
      </div>
    `;
    this.open(title, content, () => {
      // onClose: ничего не делаем
    });
    // Фокус на input
    setTimeout(() => {
      const input = document.getElementById('syllable-edit-input');
      if (input) input.focus();
    }, 50);
    // Кнопки
    const saveBtn = document.getElementById('syllable-edit-save');
    const cancelBtn = document.getElementById('syllable-edit-cancel');
    saveBtn && saveBtn.addEventListener('click', () => {
      const input = document.getElementById('syllable-edit-input');
      const val = input.value.trim();
      if (!val) {
        input.classList.add('border-red-500');
        return;
      }
      const sylls = val.split(/\s+/).filter(Boolean);
      this.close();
      if (typeof onSave === 'function') onSave(sylls);
    });
    cancelBtn && cancelBtn.addEventListener('click', () => {
      this.close();
    });
  }

  // Содержание политики конфиденциальности
  getPrivacyPolicyContent() {
    return `
      <div class="space-y-6">
        <p class="text-gray-400 text-sm">Дата последнего обновления: 09 сентября 2025 года</p>
        
        <section>
          <h4 class="text-lg font-semibold text-white mb-3">1. Общие положения</h4>
          <p class="mb-3">Настоящая политика конфиденциальности регулирует сбор, использование и защиту персональной информации пользователей веб-приложения StrumGen ("Приложение").</p>
          <p>Используя наше Приложение, вы соглашаетесь с условиями настоящей политики конфиденциальности.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">2. Собираемая информация</h4>
          <p class="mb-2">Мы собираем следующие виды информации:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li><strong>Информация, которую вы предоставляете:</strong> аккорды, настройки темпа, предпочтения по количеству стрелок</li>
            <li><strong>Техническая информация:</strong> тип браузера, операционная система, IP-адрес (для аналитики)</li>
            <li><strong>Данные использования:</strong> как вы взаимодействуете с Приложением</li>
          </ul>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">3. Использование информации</h4>
          <p class="mb-2">Собранная информация используется для:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Предоставления и улучшения функциональности Приложения</li>
            <li>Персонализации пользовательского опыта</li>
            <li>Анализа использования Приложения и улучшения его производительности</li>
            <li>Обеспечения безопасности и предотвращения мошенничества</li>
          </ul>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">4. Файлы cookie и аналогичные технологии</h4>
          <p>Мы используем файлы cookie и аналогичные технологии для:</p>
          <ul class="list-disc list-inside space-y-2 ml-4 mt-2">
            <li>Запоминания ваших настроек и предпочтений</li>
            <li>Анализа трафика и использования Приложения</li>
            <li>Персонализации контента и рекламы</li>
          </ul>
          <p class="mt-2">Вы можете настроить свой браузер на блокировку файлов cookie, но это может повлиять на функциональность Приложения.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">5. Защита информации</h4>
          <p>Мы принимаем разумные меры для защиты вашей информации от несанкционированного доступа, изменения, раскрытия или уничтожения. Однако ни одна передача данных через интернет не может быть гарантированно безопасной.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">6. Хранение данных</h4>
          <p>Данные хранятся на клиентской стороне (в браузере пользователя) и не передаются на сервер. Все настройки и созданные бои сохраняются локально в вашем браузере.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">7. Ваши права</h4>
          <p class="mb-2">Вы имеете право:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Получать информацию о том, какие данные мы собираем</li>
            <li>Запрашивать исправление неточных данных</li>
            <li>Удалять свои данные (очистка локального хранилища браузера)</li>
            <li>Отказаться от сбора данных (настройки браузера)</li>
          </ul>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">8. Изменения в политике</h4>
          <p>Мы можем обновлять настоящую политику конфиденциальности. Все изменения будут опубликованы на этой странице с указанием даты обновления.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">9. Контактная информация</h4>
          <p>Если у вас есть вопросы по поводу настоящей политики конфиденциальности, вы можете связаться с нами по адресу: dmitriydzhioev@gmail.com</p>
        </section>
      </div>
    `;
  }

  // Метод для привязки событий формы добавления текста песни
  bindAddSongTextEvents() {
    const saveBtn = document.getElementById('save-song-text-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const title = document.getElementById('song-title').value.trim();
        const text = document.getElementById('song-text').value.trim();

        if (title && text) {
          // Сохраняем песню в localStorage
          const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
          songs.push({ title, text, date: new Date().toISOString() });
          localStorage.setItem('userSongs', JSON.stringify(songs));

          // Инициализируем такты из текста песни
          if (window.app && window.app.barManager) {
            const chordsInput = document.getElementById('chordsInput');
            const chordsString = chordsInput ? chordsInput.value : '';
            const chords = chordsString.split(' ').map(ch => ch.trim()).filter(ch => ch.length > 0);
            
            window.app.barManager.initializeBarsFromText(text, chords);
            window.app.barManager.saveToLocalStorage('bars_' + title);
          }

          // Отображаем текст песни
          this.displaySongText(title, text);

          // Показываем drop-зоны после добавления текста
          if (window.app && window.app.syllableDragDrop) {
            window.app.syllableDragDrop.showDropZones();
          }

          this.close();
        } else {
          alert('Пожалуйста, заполните название и текст песни.');
        }
      });
    }
  }

  // Метод для отображения текста песни
  displaySongText(title, text) {
    const songTextDisplay = document.getElementById('song-text-display');
    const songContent = document.getElementById('song-content');

    // --- Загрузка тактов из localStorage ---
    if (window.app && window.app.barManager) {
      const loaded = window.app.barManager.loadFromLocalStorage('bars_' + title);
      if (!loaded) {
        // Если такты не были сохранены, инициализируем их заново
        const chordsInput = document.getElementById('chordsInput');
        const chordsString = chordsInput ? chordsInput.value : '';
        const chords = chordsString.split(' ').map(ch => ch.trim()).filter(ch => ch.length > 0);
        window.app.barManager.initializeBarsFromText(text, chords);
      }
    }

    // --- ДОБАВЛЕНО: загрузка пользовательских слогов из localStorage ---
    let userSyllableMap = {};
    try {
      const stored = localStorage.getItem('userSyllables_' + title);
      if (stored) userSyllableMap = JSON.parse(stored);
    } catch (e) { userSyllableMap = {}; }
    // ---

    if (songTextDisplay && songContent) {
      // Используем SyllableHighlighter для обработки текста
      const highlighter = new SyllableHighlighter();
      highlighter.userSyllableMap = userSyllableMap;
      const processedText = highlighter.processText(text);

      // Форматируем текст с заголовком
      songContent.innerHTML = `<strong>${title}</strong><br><br>${processedText}`;

      // Инициализируем обработчики событий для слогов
      highlighter.initializeEventHandlers(songContent);

      // --- обработчик клика по .syllable ---
      const saveUserSyllables = () => {
        try {
          localStorage.setItem('userSyllables_' + title, JSON.stringify(highlighter.userSyllableMap));
        } catch (e) {}
      };
      const bindSyllableClick = () => {
        songContent.querySelectorAll('[data-word]').forEach(span => {
          span.addEventListener('click', (e) => {
            const word = span.getAttribute('data-word');
            if (!word) return;
            let currentSylls = highlighter.userSyllableMap[word] || highlighter.splitIntoSyllables(word);
            this.showSyllableEdit(word, currentSylls, (newSylls) => {
              highlighter.setUserSyllables(word, newSylls);
              saveUserSyllables();
              const updatedText = highlighter.processText(text);
              songContent.innerHTML = `<strong>${title}</strong><br><br>${updatedText}`;
              highlighter.initializeEventHandlers(songContent);
              bindSyllableClick();
              // Инициализируем drag-and-drop для обновленных слогов
              if (window.app && window.app.syllableDragDrop) {
                window.app.syllableDragDrop.initializeSyllables();
              }
              // Обновляем отображение слогов под стрелочками
              if (window.app && window.app.barSyllableDisplay) {
                window.app.barSyllableDisplay.refresh();
              }
            });
          });
        });
      };
      bindSyllableClick();
      // ---

      // Добавляем обработчик для кнопки очистки
      const clearBtn = document.getElementById('clear-song-text-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          // Скрываем отображение текста песни
          songTextDisplay.classList.add('hidden');
          songContent.innerHTML = '';
          // Очищаем весь буфер песен из localStorage
          localStorage.removeItem('userSongs');
          // --- очищаем пользовательские слоги для этой песни ---
          localStorage.removeItem('userSyllables_' + title);
          
          // Скрываем drop-зоны после удаления текста
          if (window.app && window.app.syllableDragDrop) {
            window.app.syllableDragDrop.hideDropZones();
            // Очищаем историю позиций слогов для тактов
            window.app.syllableDragDrop.clearBarSyllablePositions();
          }

          // Скрываем кнопки навигации
          if (window.app && window.app.lineNavigation) {
            window.app.lineNavigation.hide();
          }

          // Скрываем секцию управления тактами
          if (window.app && window.app.settings) {
            window.app.settings.hideBarManagement();
          }
        });
      }

      // Показываем блок с текстом
      songTextDisplay.classList.remove('hidden');
      
      // Инициализируем drag-and-drop для слогов
      if (window.app && window.app.syllableDragDrop) {
        window.app.syllableDragDrop.initializeSyllables();
      }

      // Инициализируем отображение слогов под стрелочками
      if (window.app && window.app.barSyllableDisplay) {
        window.app.barSyllableDisplay.init();
        // Автоматически отображаем первую строку текста под стрелками
        window.app.barSyllableDisplay.goToBar(0);
      }

      // Показываем кнопки навигации
      if (window.app && window.app.lineNavigation) {
        window.app.lineNavigation.show();
      }

      // Показываем секцию управления тактами
      if (window.app && window.app.settings) {
        window.app.settings.showBarManagement();
      }
    }
  }

  // Содержание формы добавления текста песни
  getAddSongTextContent() {
    return `
      <div class="space-y-4">
        <div>
          <label for="song-title" class="block text-sm font-medium text-gray-300 mb-2">Название песни</label>
          <input type="text" id="song-title" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#38e07b] focus:border-transparent" placeholder="Введите название песни">
        </div>
        <div>
          <label for="song-text" class="block text-sm font-medium text-gray-300 mb-2">Текст песни</label>
          <textarea id="song-text" rows="10" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#38e07b] focus:border-transparent resize-vertical" placeholder="Введите текст песни (каждый куплет с новой строки)"></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button id="save-song-text-btn" class="px-4 py-2 bg-[#38e07b] text-gray-950 rounded-md hover:bg-emerald-400 transition-colors font-medium">
            Сохранить
          </button>
        </div>
      </div>
    `;
  }

  // Содержание формы редактирования текста песни
  getEditSongTextContent(currentTitle, currentText) {
    // Экранирование HTML-символов для безопасности
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const escapedTitle = escapeHtml(currentTitle);
    const escapedText = escapeHtml(currentText);
    
    return `
      <div class="space-y-4">
        <div>
          <label for="edit-song-title" class="block text-sm font-medium text-gray-300 mb-2">Название песни</label>
          <input type="text" id="edit-song-title" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#38e07b] focus:border-transparent" placeholder="Введите название песни" value="${escapedTitle}">
        </div>
        <div>
          <label for="edit-song-text" class="block text-sm font-medium text-gray-300 mb-2">Текст песни</label>
          <textarea id="edit-song-text" rows="10" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#38e07b] focus:border-transparent resize-vertical" placeholder="Введите текст песни (каждый куплет с новой строки)">${escapedText}</textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button id="update-song-text-btn" class="px-4 py-2 bg-[#38e07b] text-gray-950 rounded-md hover:bg-emerald-400 transition-colors font-medium">
            Сохранить изменения
          </button>
        </div>
      </div>
    `;
  }

  // Метод для привязки событий формы редактирования текста песни
  bindEditSongTextEvents() {
    const updateBtn = document.getElementById('update-song-text-btn');

    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        const title = document.getElementById('edit-song-title').value.trim();
        const text = document.getElementById('edit-song-text').value.trim();

        if (title && text) {
          // Обновляем песню в localStorage
          const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
          if (songs.length > 0) {
            // Обновляем последнюю песню
            songs[songs.length - 1] = { title, text, date: new Date().toISOString() };
            localStorage.setItem('userSongs', JSON.stringify(songs));

            // Инициализируем такты из обновленного текста песни
            if (window.app && window.app.barManager) {
              const chordsInput = document.getElementById('chordsInput');
              const chordsString = chordsInput ? chordsInput.value : '';
              const chords = chordsString.split(' ').map(ch => ch.trim()).filter(ch => ch.length > 0);
              
              window.app.barManager.initializeBarsFromText(text, chords);
              window.app.barManager.saveToLocalStorage('bars_' + title);
            }

            // Обновляем отображение текста песни
            this.displaySongText(title, text);

            this.close();
          }
        } else {
          alert('Пожалуйста, заполните название и текст песни.');
        }
      });
    }
  }

  // Содержание условий использования
  getTermsOfUseContent() {
    return `
      <div class="space-y-6">
        <p class="text-gray-400 text-sm">Дата последнего обновления: 09 сентября 2025 года</p>
        
        <section>
          <h4 class="text-lg font-semibold text-white mb-3">1. Общие положения</h4>
          <p class="mb-3">Настоящие Условия использования регулируют использование веб-приложения StrumGen ("Приложение") пользователями.</p>
          <p>Используя наше Приложение, вы соглашаетесь с настоящими Условиями использования.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">2. Лицензия и ограничения</h4>
          <p class="mb-2">Приложение предоставляется под лицензией MIT, что означает:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Вы можете свободно использовать Приложение в личных и коммерческих целях</li>
            <li>Вы можете модифицировать исходный код Приложения</li>
            <li>Вы можете распространять модифицированные версии Приложения</li>
            <li>При распространении необходимо сохранять уведомление об авторском праве</li>
          </ul>
          <p class="mt-3">Приложение предоставляется "как есть", без каких-либо гарантий.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">3. Интеллектуальная собственность</h4>
          <p class="mb-2">Все права на Приложение принадлежат его разработчику. Приложение может содержать:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Открытые библиотеки с собственными лицензиями (указаны в package.json)</li>
            <li>Графические элементы и иконки</li>
            <li>Торговые марки и логотипы третьих сторон</li>
          </ul>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">4. Использование Приложения</h4>
          <p class="mb-2">Вы обязуетесь не использовать Приложение для:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Нарушения законодательства Российской Федерации и других юрисдикций</li>
            <li>Создания вредоносного кода или вирусов</li>
            <li>Несанкционированного доступа к системам третьих сторон</li>
            <li>Распространения запрещенного контента</li>
          </ul>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">5. Ограничение ответственности</h4>
          <p class="mb-2">Разработчик не несет ответственности за:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Ущерб, возникший в результате использования или невозможности использования Приложения</li>
            <li>Потерю данных или информации</li>
            <li>Косвенные, случайные или последующие убытки</li>
          </ul>
          <p class="mt-3">Все данные хранятся локально в браузере пользователя и не передаются на сервер.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">6. Изменения условий</h4>
          <p>Мы оставляем за собой право изменять настоящие Условия использования в любое время. Изменения вступают в силу с момента публикации на данной странице.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">7. Прекращение использования</h4>
          <p>Мы можем прекратить ваш доступ к Приложению без предварительного уведомления, если вы нарушите настоящие Условия использования.</p>
        </section>

        <section>
          <h4 class="text-lg font-semibold text-white mb-3">8. Контактная информация</h4>
          <p>Если у вас есть вопросы по поводу настоящих Условий использования, вы можете связаться с нами по адресу: dmitriydzhioev@gmail.com</p>
        </section>
      </div>
    `;
  }
}
