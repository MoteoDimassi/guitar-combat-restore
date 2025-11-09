import { GuitarCombatApp } from "./app.js";

/**
 * Главный файл приложения Guitar Combat
 * Использует новую модульную архитектуру с системой зависимостей
 */

// Создаем экземпляр приложения с оптимизированной системой зависимостей
const app = new GuitarCombatApp();

// Инициализация при загрузке DOM
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Конфигурация приложения
    const config = {
      debug: true, // В браузерном окружении всегда включаем debug
      maxEventHistory: 100,
      initialState: {
        settings: {
          beatCount: 8,
          bpm: 90,
          volume: {
            strum: 80,
            metronome: 100,
          },
        },
      },
      audio: {
        volume: 0.8,
        muteVolume: 0.3,
      },
      storage: {
        key: "guitarCombatData",
        autoSave: true,
        autoSaveDelay: 1000,
      },
    };

    // Инициализация приложения
    const success = await app.initialize();

    if (success) {
      // Запускаем приложение
      await app.start();
      
      // Делаем приложение доступным глобально для отладки
      window.guitarCombatApp = app;

      console.log("🎸 Guitar Combat Application started successfully with optimized DI!");
      
      // Выводим статистику системы зависимостей
      console.log("📊 Dependency Injection Stats:", app.getDependencyStats());
    } else {
      console.error("❌ Failed to initialize Guitar Combat Application");
    }
  } catch (error) {
    console.error("❌ Failed to start application:", error);

    // Показываем критическую ошибку
    document.body.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-900">
        <div class="bg-red-500 text-white p-8 rounded-lg shadow-xl max-w-md">
          <h2 class="text-2xl font-bold mb-4">Критическая ошибка</h2>
          <p class="mb-4">Не удалось запустить приложение. Пожалуйста, обновите страницу.</p>
          <button onclick="location.reload()" class="bg-white text-red-500 px-6 py-2 rounded font-semibold hover:bg-gray-100">
            Обновить страницу
          </button>
        </div>
      </div>
    `;
  }
});

// Обработка выгрузки страницы
window.addEventListener("beforeunload", async () => {
  if (app.isInitialized) {
    try {
      await app.shutdown();
    } catch (error) {
      console.warn("Warning: Failed to shutdown application:", error);
    }
  }
});

// Экспорт для использования в других модулях
export default app;