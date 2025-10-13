// Компонент мобильного меню с анимацией
export class MobileMenu {
  constructor() {
    this.menu = null;
    this.menuBtn = null;
    this.isOpen = false;
  }

  init() {
    this.menu = document.getElementById('mobileMenu');
    this.menuBtn = document.getElementById('mobileMenuBtn');
    
    if (this.menu && this.menuBtn) {
      this.bindEvents();
      // Инициализируем начальное состояние меню
      this.menu.style.display = 'none';
    }
  }

  bindEvents() {
    this.menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Закрытие меню при клике вне его области
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menu.contains(e.target) && e.target !== this.menuBtn) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.menuBtn.classList.add('active');
    
    // Показываем меню и запускаем анимацию
    this.menu.style.display = 'block';
    this.menu.style.opacity = '0';
    this.menu.style.transform = 'translateY(-10px)';
    this.menu.style.transition = 'none';
    
    // Принудительная перерисовка
    this.menu.offsetHeight;
    
    // Запускаем анимацию
    this.menu.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    this.menu.style.opacity = '1';
    this.menu.style.transform = 'translateY(0)';
  }

  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.menuBtn.classList.remove('active');
    
    // Запускаем анимацию закрытия
    this.menu.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    this.menu.style.opacity = '0';
    this.menu.style.transform = 'translateY(-10px)';
    
    // Скрываем меню после завершения анимации
    setTimeout(() => {
      if (!this.isOpen) {
        this.menu.style.display = 'none';
      }
    }, 200);
  }
}
