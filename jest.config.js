module.exports = {
  // Окружение тестов
  testEnvironment: 'jsdom',

  // Файлы с настройками
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Паттерны для поиска тестовых файлов
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
  ],

  // Паттерны для игнорирования файлов
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],

  // Модули, которые должны быть обработаны Babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Модули, которые не должны быть обработаны
  transformIgnorePatterns: [
    'node_modules/(?!(module-to-transform)/)',
  ],

  // Псевдонимы для модулей
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@core/(.*)$': '<rootDir>/js/core/$1',
    '^@domain/(.*)$': '<rootDir>/js/domain/$1',
    '^@infrastructure/(.*)$': '<rootDir>/js/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/js/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/js/shared/$1',
  },

  // Покрытие кода
  collectCoverage: true,
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js',
    '!js/**/*.spec.js',
    '!js/index.js',
    '!js/app.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Пороги покрытия (временно отключены)
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },

  // Вывод
  verbose: true,

  // Очистка моков
  clearMocks: true,
  restoreMocks: true,

  // Таймаут для тестов
  testTimeout: 10000,

  // Глобальные переменные
  globals: {
    'process.env': {
      NODE_ENV: 'test',
    },
  },
};