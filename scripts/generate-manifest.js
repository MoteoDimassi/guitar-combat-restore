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
    console.log('🏗️  Генерация manifest.json...');

    try {
      const templateFiles = this.getTemplateFiles();
      console.log(`📁 Найдено ${templateFiles.length} файлов шаблонов`);

      const templates = this.processTemplateFiles(templateFiles);
      console.log(`✅ Обработано ${templates.length} шаблонов`);

      const manifest = this.createManifest(templates);
      this.writeManifest(manifest);

      console.log('🎉 manifest.json успешно сгенерирован!');
      console.log(`📊 Всего шаблонов: ${templates.length}`);

    } catch (error) {
      console.error('❌ Ошибка генерации manifest:', error.message);
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
      file !== '.DS_Store' // Игнорировать системные файлы
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
        console.warn(`⚠️  Пропущен файл ${fileName}: ${error.message}`);
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
    const newFileName = `${id}.json`;

    // Переименовать файл в ASCII-имя, если оно отличается
    if (fileName !== newFileName) {
      const oldPath = path.join(this.templatesDir, fileName);
      const newPath = path.join(this.templatesDir, newFileName);

      try {
        if (fs.existsSync(newPath)) {
          console.warn(`⚠️  Файл ${newFileName} уже существует, пропускаем переименование ${fileName}`);
        } else {
          fs.renameSync(oldPath, newPath);
          console.log(`🔄 Переименован: ${fileName} → ${newFileName}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка переименования ${fileName}: ${error.message}`);
        // Если переименование не удалось, используем оригинальное имя
      }
    }

    return {
      name: displayName,
      file: newFileName,
      id: id,
      description: this.generateDescription(templateData, displayName)
    };
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
      'Бой Восьмёрка': 'Бой Восьмёрка',
      'Бой Восьмёрка': 'Бой Восьмёрка',
      'boy-pyaterka': 'Бой Пятёрка',
      'boy-vosmerka': 'Бой Восьмёрка',
      'blues': 'Blues',
      'rock': 'Rock',
      'popular': 'Popular',
      'custom': 'Custom',
      // Добавляем маппинги для транслитерированных имен
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
      version: '1.0',
      generatedAt: new Date().toISOString(),
      templates: templates.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    };
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