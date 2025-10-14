# План реализации системы динамической подстановки шаблонов боя

## Анализ текущей системы

### Проблемы:
1. TemplateSetter читает шаблоны только из manifest.json, а не сканирует папку
2. При добавлении новых шаблонов требуется ручное обновление manifest.json
3. Нет автоматического обнаружения новых шаблонов в папке templates

### Ограничения браузерной среды:
JavaScript в браузере не имеет прямого доступа к файловой системе для сканирования папок из-за ограничений безопасности.

## Предлагаемое решение

### Шаг 1: Создание скрипта для генерации списка шаблонов

Создать Node.js скрипт `scripts/generate-templates-list.js`, который:
- Сканирует папку `templates/`
- Находит все JSON-файлы (кроме manifest.json)
- Читает метаданные из каждого файла
- Генерирует или обновляет `templates/manifest.json`

**Структура скрипта:**
```javascript
const fs = require('fs');
const path = require('path');

function scanTemplatesFolder() {
  // Сканирование папки templates
  // Чтение JSON-файлов
  // Извлечение метаданных
  // Генерация manifest.json
}
```

### Шаг 2: Модификация TemplateSetter

Изменить класс `TemplateSetter` в `js/Strum/TemplateSetter.js`:

1. **Добавить метод для динамического чтения шаблонов:**
   ```javascript
   async scanTemplatesFolder() {
     // Попытка чтения списка файлов из templates-list.json
     // Если файл отсутствует, использовать manifest.json
   }
   ```

2. **Обновить метод init:**
   ```javascript
   async init(templateManager, arrowDisplay) {
     this.templateManager = templateManager;
     this.arrowDisplay = arrowDisplay;
     
     await this.scanTemplatesFolder();
     await this.populateTemplateSelect();
   }
   ```

3. **Улучшить populateTemplateSelect:**
   - Добавить поддержку динамического списка шаблонов
   - Сохранить группировку по категориям

### Шаг 3: Улучшение интеграции с ImportStrumFromJSON

Убедиться, что при выборе шаблона:
1. TemplateSetter корректно вызывает TemplateManager.applyTemplate()
2. TemplateManager.applyTemplate() использует ImportStrumFromJSON для импорта данных
3. Все компоненты приложения обновляются после применения шаблона

### Шаг 4: Добавление уведомлений

Реализовать систему уведомлений для пользователя:
1. При успешном применении шаблона
2. При возникновении ошибок
3. При загрузке шаблонов

## Детальная реализация

### Скрипт генерации списка шаблонов

```javascript
// scripts/generate-templates-list.js
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates');
const manifestPath = path.join(templatesDir, 'manifest.json');

function scanTemplatesFolder() {
  try {
    const files = fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.json') && file !== 'manifest.json');
    
    const templates = [];
    
    for (const file of files) {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const templateData = JSON.parse(content);
      
      // Извлечение метаданных из шаблона
      const template = {
        id: file.replace('.json', '').toLowerCase().replace(/\s+/g, '-'),
        name: templateData.metadata?.title || file.replace('.json', ''),
        file: file,
        description: templateData.metadata?.description || '',
        category: 'basic', // По умолчанию
        difficulty: 'beginner',
        tags: ['user-template'],
        formats: ['v2']
      };
      
      templates.push(template);
    }
    
    // Читаем существующий manifest если есть
    let manifest = { version: "2.0", templates: [], categories: [] };
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    
    // Обновляем список шаблонов
    manifest.templates = templates;
    manifest.generatedAt = new Date().toISOString();
    
    // Сохраняем обновленный manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Обновлено ${templates.length} шаблонов в manifest.json`);
  } catch (error) {
    console.error('❌ Ошибка сканирования шаблонов:', error);
  }
}

scanTemplatesFolder();
```

### Модификация TemplateSetter

```javascript
// js/Strum/TemplateSetter.js

// Добавить новые методы
async scanTemplatesFolder() {
  try {
    // Сначала пробуем загрузить manifest
    await this.loadManifest();
    
    if (this.manifest && this.manifest.templates) {
      this.templates = this.manifest.templates;
      console.log(`📋 TemplateSetter: загружено ${this.templates.length} шаблонов из manifest`);
    } else {
      console.warn('⚠️ Манифест не содержит шаблонов');
    }
  } catch (error) {
    console.error('❌ Ошибка сканирования шаблонов:', error);
  }
}

// Обновить метод populateTemplateSelect
populateTemplateSelect() {
  if (!this.templatesSelect) return;

  // Очищаем список
  this.templatesSelect.innerHTML = '';

  // Добавляем плейсхолдер
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Выберите шаблон...';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  this.templatesSelect.appendChild(placeholderOption);

  // Группируем шаблоны по категориям
  const categories = new Map();
  
  this.templates.forEach(template => {
    if (!categories.has(template.category)) {
      categories.set(template.category, []);
    }
    categories.get(template.category).push(template);
  });

  // Получаем названия категорий
  const categoryNames = new Map();
  if (this.manifest && this.manifest.categories) {
    this.manifest.categories.forEach(cat => {
      categoryNames.set(cat.id, cat.name);
    });
  }

  // Добавляем опции по категориям
  categories.forEach((templates, categoryId) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = categoryNames.get(categoryId) || categoryId;

    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      option.title = template.description || '';
      optgroup.appendChild(option);
    });

    this.templatesSelect.appendChild(optgroup);
  });
}
```

### Интеграция с ImportStrumFromJSON

Убедиться, что в `js/Functions/TemplateManager.js` метод `applyTemplate` корректно использует `ImportStrumFromJSON`:

```javascript
// В TemplateManager.applyTemplate()
async applyTemplate(templateData) {
  const app = window.guitarCombatApp;
  if (!app) {
    throw new Error('Приложение Guitar Combat не найдено');
  }
  
  try {
    // Используем ImportStrumFromJSON для импорта данных шаблона
    await app.importStrumFromJSON.importV2Format(templateData);
    
    // Обновляем отображение
    app.updateDisplay(false);
    
    // Показываем уведомление
    this.showSuccessNotification(`Шаблон "${templateData.templateInfo?.name || 'Шаблон'}" применен`);
    
  } catch (error) {
    throw error;
  }
}
```

## Порядок выполнения

1. Создать скрипт для генерации manifest.json
2. Модифицировать TemplateSetter для динамического чтения
3. Обновить метод применения шаблонов
4. Добавить уведомления для пользователя
5. Протестировать функциональность

## Инструкции по использованию

1. **При добавлении новых шаблонов:**
   - Поместить JSON-файл в папку `templates/`
   - Запустить скрипт `node scripts/generate-templates-list.js`
   - Обновить страницу приложения

2. **Автоматизация (опционально):**
   - Можно добавить watch-скрипт для автоматического обновления manifest.json
   - Или интегрировать в процесс сборки

Этот подход обеспечивает динамическое обнаружение шаблонов в рамках ограничений браузерной среды.