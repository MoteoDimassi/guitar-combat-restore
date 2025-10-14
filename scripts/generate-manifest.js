const fs = require('fs');
const path = require('path');

/**
 * Генератор manifest.json для шаблонов боя
 * Автоматически сканирует папку templates/ и создаёт manifest со всеми найденными JSON файлами
 */

class ManifestGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.manifestPath = path.join(this.templatesDir, 'manifest.json');
  }

  /**
   * Основной метод генерации manifest
   */
  generate() {
    try {
      const templateFiles = this.getTemplateFiles();
      const templates = this.processTemplateFiles(templateFiles);
      const manifest = this.createManifest(templates);
      this.writeManifest(manifest);

    } catch (error) {
      process.exit(1);
    }
  }

  /**
   * Получить список всех JSON файлов в папке templates (кроме manifest.json)
   */
  getTemplateFiles() {
    const files = fs.readdirSync(this.templatesDir);
    return files.filter(file =>
      file.endsWith('.json') &&
      file !== 'manifest.json' &&
      file !== '.DS_Store' && // Игнорировать системные файлы
      !file.includes('test-import') // Игнорировать тестовые файлы
    );
  }

  /**
   * Обработать каждый файл шаблона и сгенерировать метаданные
   */
  processTemplateFiles(files) {
    return files.map(fileName => {
      try {
        const filePath = path.join(this.templatesDir, fileName);
        const content = fs.readFileSync(filePath, 'utf8');
        const templateData = JSON.parse(content);

        return this.generateTemplateMetadata(fileName, templateData);
      } catch (error) {
        return null;
      }
    }).filter(Boolean); // Убрать null значения
  }

  /**
   * Сгенерировать метаданные для шаблона
   */
  generateTemplateMetadata(fileName, templateData) {
    const nameWithoutExt = path.parse(fileName).name;
    const displayName = this.fileNameToDisplayName(nameWithoutExt);
    const id = this.generateId(nameWithoutExt);

    const metadata = {
      name: displayName,
      file: fileName,
      id: id,
      category: this.determineCategory(fileName),
      description: this.generateDescription(templateData, displayName),
      difficulty: this.determineDifficulty(fileName),
      tags: this.generateTags(fileName),
      formats: this.determineFormats(templateData)
    };

    return metadata;
  }

  /**
   * Преобразовать имя файла в человеко-читаемое имя
   */
  fileNameToDisplayName(fileName) {
    const nameMap = {
      'блюз': 'Блюз',
      'рок': 'Рок',
      'популярный': 'Популярный',
      'кастомный': 'Кастомный',
      'Бой Пятёрка': 'Бой Пятёрка',
      'Бой Восьмёрка': 'Бой Восьмёрка',
      'boy-pyaterka': 'Бой Пятёрка',
      'boy-vosmerka': 'Бой Восьмёрка',
      'blues': 'Blues',
      'rock': 'Rock',
      'popular': 'Popular',
      'custom': 'Custom',
      // Добавляем маппинги для всех текущих шаблонов
      'восьме-рка': 'Восьмёрка',
      'восьмёрка': 'Восьмёрка',
      'пяте-рка': 'Пятёрка',
      'пятёрка': 'Пятёрка',
      'шесте-рка': 'Шестёрка',
      'шестёрка': 'Шестёрка',
      'пяте-рка-с-глушением': 'Пятёрка с глушением',
      'пятёрка-с-глушением': 'Пятёрка с глушением',
      'шесте-рка-с-глушением': 'Шестёрка с глушением',
      'шестёрка-с-глушением': 'Шестёрка с глушением',
      // Старые транслитерированные имена
      'бои-восьме-рка': 'Бой Восьмёрка',
      'бои-пяте-рка': 'Бой Пятёрка'
    };

    return nameMap[fileName] || this.capitalizeFirstLetter(fileName.replace(/[-_]/g, ' '));
  }

  /**
   * Сгенерировать уникальный ID для шаблона
   */
  generateId(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Сгенерировать описание на основе данных шаблона
   */
  generateDescription(templateData, displayName) {
    if (templateData.description) {
      return templateData.description;
    }

    if (templateData.bpm && templateData.count) {
      return `${displayName} паттерн (${templateData.count} стрелок, ${templateData.bpm} BPM)`;
    }

    if (templateData.beats && templateData.beats.length) {
      return `${displayName} паттерн (${templateData.beats.length} ударов)`;
    }

    return `${displayName} паттерн боя`;
  }

  /**
   * Создать структуру manifest файла
   */
  createManifest(templates) {
    return {
      version: '2.0',
      generatedAt: new Date().toISOString(),
      formats: ['v2', 'legacy'],
      categories: [
        {
          "id": "basic",
          "name": "Базовые паттерны",
          "description": "Основные паттерны бо́я для начинающих"
        },
        {
          "id": "advanced",
          "name": "Сложные паттерны",
          "description": "Продвинутые паттерны с элементами перебора"
        },
        {
          "id": "song",
          "name": "Примеры песен",
          "description": "Готовые примеры песен с аккордами и текстом"
        }
      ],
      migration: {
        legacySupport: true,
        autoConvert: true,
        fallbackFormat: "legacy"
      },
      templates: templates.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    };
  }

  /**
   * Определить категорию по имени файла
   */
  determineCategory(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('пример') || name.includes('песн')) {
      return 'song';
    }
    if (name.includes('глушен') || name.includes('mute')) {
      return 'advanced';
    }
    return 'basic';
  }

  /**
   * Определить сложность по имени файла
   */
  determineDifficulty(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('глушен') || name.includes('mute')) {
      return 'intermediate';
    }
    if (name.includes('пример') || name.includes('песн')) {
      return 'intermediate';
    }
    return 'beginner';
  }

  /**
   * Сгенерировать теги по имени файла
   */
  generateTags(fileName) {
    const tags = ['basic', 'strumming'];
    const name = fileName.toLowerCase();

    if (name.includes('глушен') || name.includes('mute')) {
      tags.push('muted');
    }
    if (name.includes('пример') || name.includes('песн')) {
      tags.push('song', 'chords', 'lyrics');
    }
    if (name.includes('популярн') || name.includes('popular')) {
      tags.push('popular');
    }
    if (name.includes('legacy')) {
      tags.push('legacy');
    }

    return tags;
  }

  /**
   * Определить поддерживаемые форматы
   */
  determineFormats(templateData) {
    if (templateData.version === '2.0' || templateData.metadata || templateData.songStructure) {
      return ['v2'];
    }
    return ['legacy'];
  }

  /**
   * Записать manifest файл
   */
  writeManifest(manifest) {
    const jsonContent = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(this.manifestPath, jsonContent, 'utf8');
  }

  /**
   * Вспомогательный метод для капитализации первой буквы
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

// Запуск генерации
const generator = new ManifestGenerator();
generator.generate();
