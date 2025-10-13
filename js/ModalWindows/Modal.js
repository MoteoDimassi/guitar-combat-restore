/**
 * Базовый класс модального окна
 */
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
}
