/**
 * Settings - компонент управления настройками звука
 * Управляет громкостью боя и метронома
 */
export class Settings {
  constructor() {
    this.strumVolume = 0.8; // По умолчанию 80%
    this.metronomeVolume = 1.0; // По умолчанию 100%
    
    this.settingsBtn = null;
    this.settingsMenu = null;
    this.strumVolumeSlider = null;
    this.metronomeVolumeSlider = null;
    this.strumVolumeLabel = null;
    this.metronomeVolumeLabel = null;
    
    // Загружаем сохраненные настройки
    this.loadSettings();
  }

  /**
   * Инициализирует компонент настроек
   */
  init() {
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsMenu = document.getElementById('settingsMenu');
    this.strumVolumeSlider = document.getElementById('strumVolume');
    this.metronomeVolumeSlider = document.getElementById('metronomeVolume');
    this.strumVolumeLabel = document.getElementById('strumVolumeLabel');
    this.metronomeVolumeLabel = document.getElementById('metronomeVolumeLabel');

    if (!this.settingsBtn || !this.settingsMenu) {
      console.warn('Settings: Required elements not found');
      return false;
    }

    this.attachEventListeners();
    this.updateUI();
    
    return true;
  }

  /**
   * Подключает обработчики событий
   */
  attachEventListeners() {
    // Открытие/закрытие меню настроек
    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
      if (!this.settingsMenu.contains(e.target) && !this.settingsBtn.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Обработчики для ползунков
    if (this.strumVolumeSlider) {
      this.strumVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.setStrumVolume(value / 100);
        this.strumVolumeLabel.textContent = `${value}%`;
      });

      this.strumVolumeSlider.addEventListener('change', () => {
        this.saveSettings();
      });
    }

    if (this.metronomeVolumeSlider) {
      this.metronomeVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.setMetronomeVolume(value / 100);
        this.metronomeVolumeLabel.textContent = `${value}%`;
      });

      this.metronomeVolumeSlider.addEventListener('change', () => {
        this.saveSettings();
      });
    }
  }

  /**
   * Переключает видимость меню настроек
   */
  toggleMenu() {
    this.settingsMenu.classList.toggle('hidden');
  }

  /**
   * Закрывает меню настроек
   */
  closeMenu() {
    this.settingsMenu.classList.add('hidden');
  }

  /**
   * Устанавливает громкость боя
   * @param {number} volume - Громкость от 0 до 1
   */
  setStrumVolume(volume) {
    this.strumVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Устанавливает громкость метронома
   * @param {number} volume - Громкость от 0 до 1
   */
  setMetronomeVolume(volume) {
    this.metronomeVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Возвращает текущую громкость боя
   * @returns {number} Громкость от 0 до 1
   */
  getStrumVolume() {
    return this.strumVolume;
  }

  /**
   * Возвращает текущую громкость метронома
   * @returns {number} Громкость от 0 до 1
   */
  getMetronomeVolume() {
    return this.metronomeVolume;
  }

  /**
   * Обновляет интерфейс в соответствии с текущими настройками
   */
  updateUI() {
    if (this.strumVolumeSlider) {
      const strumPercent = Math.round(this.strumVolume * 100);
      this.strumVolumeSlider.value = strumPercent;
      if (this.strumVolumeLabel) {
        this.strumVolumeLabel.textContent = `${strumPercent}%`;
      }
    }

    if (this.metronomeVolumeSlider) {
      const metronomePercent = Math.round(this.metronomeVolume * 100);
      this.metronomeVolumeSlider.value = metronomePercent;
      if (this.metronomeVolumeLabel) {
        this.metronomeVolumeLabel.textContent = `${metronomePercent}%`;
      }
    }
  }

  /**
   * Сохраняет настройки в localStorage
   */
  saveSettings() {
    try {
      const settings = {
        strumVolume: this.strumVolume,
        metronomeVolume: this.metronomeVolume
      };
      localStorage.setItem('guitarCombatSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Settings: Failed to save settings', error);
    }
  }

  /**
   * Загружает настройки из localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('guitarCombatSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (typeof settings.strumVolume === 'number') {
          this.strumVolume = settings.strumVolume;
        }
        if (typeof settings.metronomeVolume === 'number') {
          this.metronomeVolume = settings.metronomeVolume;
        }
      }
    } catch (error) {
      console.error('Settings: Failed to load settings', error);
    }
  }
}

