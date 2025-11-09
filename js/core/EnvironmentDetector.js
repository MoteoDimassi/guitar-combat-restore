export class EnvironmentDetector {
  constructor() {
    this.detected = this.detectEnvironment();
  }

  /**
   * Определение окружения
   */
  detectEnvironment() {
    return {
      // Браузер
      browser: this.detectBrowser(),

      // Устройство
      device: this.detectDevice(),

      // Платформа
      platform: this.detectPlatform(),

      // Возможности
      capabilities: this.detectCapabilities(),

      // Производительность
      performance: this.detectPerformance(),

      // Сеть
      network: this.detectNetwork(),

      // Пользовательские настройки
      preferences: this.detectPreferences(),
    };
  }

  /**
   * Определение браузера
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    const vendor = navigator.vendor || "";

    return {
      name: this.getBrowserName(ua, vendor),
      version: this.getBrowserVersion(ua),
      engine: this.getBrowserEngine(ua),
      isMobile: /Mobile|Android|iPhone|iPad|iPod/.test(ua),
      isTablet: /iPad|Android(?!.*Mobile)/.test(ua),
      isDesktop: !/Mobile|Android|iPhone|iPad|iPod/.test(ua),
    };
  }

  /**
   * Определение устройства
   */
  detectDevice() {
    const ua = navigator.userAgent;

    return {
      type: this.getDeviceType(ua),
      model: this.getDeviceModel(ua),
      os: this.getOperatingSystem(ua),
      osVersion: this.getOperatingSystemVersion(ua),
      pixelRatio: window.devicePixelRatio || 1,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Определение платформы
   */
  detectPlatform() {
    return {
      isWeb: true,
      isElectron:
        typeof window !== "undefined" && window.process && window.process.type,
      isCordova: typeof window !== "undefined" && window.cordova,
      isReactNative:
        typeof navigator !== "undefined" && navigator.product === "ReactNative",
    };
  }

  /**
   * Определение возможностей
   */
  detectCapabilities() {
    return {
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      webGL: this.detectWebGL(),
      webWorkers: typeof Worker !== "undefined",
      serviceWorker: "serviceWorker" in navigator,
      localStorage: this.detectLocalStorage(),
      sessionStorage: typeof sessionStorage !== "undefined",
      indexedDB: "indexedDB" in window,
      geolocation: "geolocation" in navigator,
      camera:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      microphone:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      gamepad: "getGamepads" in navigator,
      vibration: "vibrate" in navigator,
      fullscreen:
        "fullscreenEnabled" in document ||
        "webkitFullscreenEnabled" in document,
      webRTC: "RTCPeerConnection" in window,
      webSocket: "WebSocket" in window,
    };
  }

  /**
   * Определение производительности
   */
  detectPerformance() {
    return {
      memory: this.getMemoryInfo(),
      cpu: this.getCPUInfo(),
      connection: this.getConnectionInfo(),
      timing: this.getTimingInfo(),
    };
  }

  /**
   * Определение сети
   */
  detectNetwork() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    return {
      online: navigator.onLine,
      type: connection ? connection.effectiveType : "unknown",
      downlink: connection ? connection.downlink : null,
      rtt: connection ? connection.rtt : null,
      saveData: connection ? connection.saveData : false,
    };
  }

  /**
   * Определение пользовательских настроек
   */
  detectPreferences() {
    return {
      language: navigator.language || navigator.userLanguage,
      languages: navigator.languages || [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorScheme: this.detectColorScheme(),
      reducedMotion: this.detectReducedMotion(),
      highContrast: this.detectHighContrast(),
    };
  }

  /**
   * Получение имени браузера
   */
  getBrowserName(ua, vendor) {
    if (vendor.includes("Google")) return "Chrome";
    if (vendor.includes("Apple")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    if (ua.includes("MSIE") || ua.includes("Trident"))
      return "Internet Explorer";

    return "Unknown";
  }

  /**
   * Получение версии браузера
   */
  getBrowserVersion(ua) {
    const match = ua.match(
      /(Chrome|Firefox|Edge|Safari|Opera|MSIE|Trident)\/?(\d+)/
    );
    return match ? match[2] : "Unknown";
  }

  /**
   * Получение движка браузера
   */
  getBrowserEngine(ua) {
    if (ua.includes("WebKit")) return "WebKit";
    if (ua.includes("Gecko")) return "Gecko";
    if (ua.includes("Trident")) return "Trident";
    if (ua.includes("Presto")) return "Presto";

    return "Unknown";
  }

  /**
   * Определение типа устройства
   */
  getDeviceType(ua) {
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
      return /iPad|Android(?!.*Mobile)/.test(ua) ? "tablet" : "mobile";
    }

    return "desktop";
  }

  /**
   * Определение модели устройства
   */
  getDeviceModel(ua) {
    const match = ua.match(/\(([^)]+)\)/);
    if (match) {
      const deviceInfo = match[1];

      if (deviceInfo.includes("iPhone")) return "iPhone";
      if (deviceInfo.includes("iPad")) return "iPad";
      if (deviceInfo.includes("Android")) return "Android";
      if (deviceInfo.includes("Windows")) return "Windows";
      if (deviceInfo.includes("Mac")) return "Mac";
      if (deviceInfo.includes("Linux")) return "Linux";
    }

    return "Unknown";
  }

  /**
   * Определение операционной системы
   */
  getOperatingSystem(ua) {
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS")) return "iOS";

    return "Unknown";
  }

  /**
   * Определение версии ОС
   */
  getOperatingSystemVersion(ua) {
    const osMap = {
      Windows: /Windows NT (\d+\.\d+)/,
      macOS: /Mac OS X (\d+[._]\d+)/,
      Android: /Android (\d+\.\d+)/,
      iOS: /OS (\d+[._]\d+)/,
    };

    const os = this.getOperatingSystem(ua);
    const pattern = osMap[os];

    if (pattern) {
      const match = ua.match(pattern);
      return match ? match[1] : "Unknown";
    }

    return "Unknown";
  }

  /**
   * Определение WebGL
   */
  detectWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Определение localStorage
   */
  detectLocalStorage() {
    try {
      const test = "test";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Получение информации о памяти
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      };
    }

    return null;
  }

  /**
   * Получение информации о CPU
   */
  getCPUInfo() {
    if (navigator.hardwareConcurrency) {
      return {
        cores: navigator.hardwareConcurrency,
      };
    }

    return null;
  }

  /**
   * Получение информации о соединении
   */
  getConnectionInfo() {
    if (performance.timing) {
      return {
        dns:
          performance.timing.domainLookupEnd -
          performance.timing.domainLookupStart,
        tcp: performance.timing.connectEnd - performance.timing.connectStart,
        request:
          performance.timing.responseStart - performance.timing.requestStart,
        response:
          performance.timing.responseEnd - performance.timing.responseStart,
      };
    }

    return null;
  }

  /**
   * Получение информации о времени загрузки
   */
  getTimingInfo() {
    if (performance.timing) {
      return {
        domContentLoaded:
          performance.timing.domContentLoadedEventEnd -
          performance.timing.navigationStart,
        load:
          performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType("paint")[0]?.startTime,
        firstContentfulPaint:
          performance.getEntriesByType("paint")[1]?.startTime,
      };
    }

    return null;
  }

  /**
   * Определение цветовой схемы
   */
  detectColorScheme() {
    if (window.matchMedia) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }

    return "unknown";
  }

  /**
   * Определение сокращенного движения
   */
  detectReducedMotion() {
    if (window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    return false;
  }

  /**
   * Определение высокой контрастности
   */
  detectHighContrast() {
    if (window.matchMedia) {
      return window.matchMedia("(prefers-contrast: high)").matches;
    }

    return false;
  }

  /**
   * Получение обнаруженной информации
   */
  getDetected() {
    return this.detected;
  }

  /**
   * Получение адаптированной конфигурации
   */
  getAdaptedConfig(baseConfig) {
    const adapted = { ...baseConfig };

    // Адаптация под мобильные устройства
    if (this.detected.device.type === "mobile") {
      adapted.ui.compactMode = true;
      adapted.ui.animations = false;
      adapted.performance.enableProfiling = false;
    }

    // Адаптация под медленное соединение
    if (
      this.detected.network.type === "slow-2g" ||
      this.detected.network.type === "2g"
    ) {
      adapted.storage.autoSaveDelay = 5000;
      adapted.templates.cacheEnabled = false;
    }

    // Адаптация под ограниченную память
    if (this.detected.performance.memory) {
      const memoryMB = this.detected.performance.memory.limit / 1024 / 1024;

      if (memoryMB < 512) {
        adapted.audio.maxConcurrentSounds = 4;
        adapted.performance.maxEventHistory = 50;
      }
    }

    // Адаптация под предпочтения пользователя
    if (this.detected.preferences.reducedMotion) {
      adapted.ui.animations = false;
      adapted.ui.animationDuration = 0;
    }

    if (this.detected.preferences.highContrast) {
      adapted.ui.colorScheme = "high-contrast";
    }

    return adapted;
  }
}

export default EnvironmentDetector;