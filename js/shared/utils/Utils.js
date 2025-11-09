class Utils {
  // Генерация уникального ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Глубокое копирование объекта
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => Utils.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = Utils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  // Форматирование времени
  static formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Форматирование темпа
  static formatTempo(bpm) {
    return `${bpm} BPM`;
  }

  // Проверка, является ли значение числом
  static isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  // Ограничение числа в диапазоне
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Проверка, является ли строка пустой или null/undefined
  static isEmpty(str) {
    return !str || str.trim().length === 0;
  }

  // Капитализация первой буквы строки
  static capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Преобразование строки в camelCase
  static toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  // Преобразование строки в kebab-case
  static toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
  }

  // Задержка выполнения
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Проверка поддержки Web Audio API
  static isWebAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  // Проверка поддержки localStorage
  static isLocalStorageSupported() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Получение типа данных
  static getType(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  }

  // Сравнение двух объектов на равенство
  static isEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!Utils.isEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }

  // Удаление дубликатов из массива
  static unique(array) {
    return [...new Set(array)];
  }

  // Сортировка массива объектов по свойству
  static sortByProperty(array, property, ascending = true) {
    return array.sort((a, b) => {
      const valueA = a[property];
      const valueB = b[property];
      
      if (valueA < valueB) return ascending ? -1 : 1;
      if (valueA > valueB) return ascending ? 1 : -1;
      return 0;
    });
  }

  // Группировка массива объектов по свойству
  static groupByProperty(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  // Форматирование размера файла
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Создание DOM элемента с атрибутами
  static createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    }
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }

  // Добавление CSS класса к элементу
  static addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
    }
  }

  // Удаление CSS класса из элемента
  static removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
    }
  }

  // Переключение CSS класса элемента
  static toggleClass(element, className) {
    if (element && className) {
      element.classList.toggle(className);
    }
  }

  // Проверка наличия CSS класса у элемента
  static hasClass(element, className) {
    return element && className ? element.classList.contains(className) : false;
  }
}

export default Utils;