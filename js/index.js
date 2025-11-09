// Импортируем основное приложение
import './app.js';

// Импортируем стили
import '../css/styles.css';

// Логирование для отладки
console.log('Guitar Combat - Новая архитектура загружена');

// Глобальные переменные для совместимости со старым кодом
window.GuitarCombat = {
  version: '2.0.0',
  architecture: 'modular'
};