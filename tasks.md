Вот полный tasklist — от текущего момента до завершения всех разделов. Ты можешь отмечать выполненные пункты и возвращаться к списку после каждого шага.

---

## 📋 ПОЛНЫЙ ПЛАН РАБОТ (TASKLIST)

### 🔧 ЭТАП 1 — ИСПРАВЛЕНИЯ на `/typefaces`

- [ ] **1.1.** В компонент `TypefaceCard.jsx` вернуть кнопки переключения колонок (1, 2, 3) и логику `column-count`.
- [ ] **1.2.** Стили для колонок (`.specimen__text.col-2`, `.col-3`) вынести в `global.css`, чтобы не потерялись при скопинге Astro.
- [ ] **1.3.** Проверить, что мобильное меню работает (оверлей с блюром) — уже должно быть исправлено, но перепроверить.
- [ ] **1.4.** Убедиться, что все стили `.specimen__controls`, `.specimen__group`, `.specimen__reset` перенесены в `global.css` (если они были в scoped `<style>`).

*Результат этапа: на `/typefaces` работают шрифты, размеры, колонки, меню.*

---

### 🧩 ЭТАП 2 — БАЗОВЫЕ КОМПОНЕНТЫ (переиспользуемые)

- [ ] **2.1.** Создать `src/components/FilterPanel.jsx` (левая панель фильтров) на основе кода из `App.jsx` (без Tailwind, с CSS-переменными).
- [ ] **2.2.** Создать `src/components/DetailPanel.jsx` (правая боковая панель для просмотра поста/книги) — аналог правой панели из `App.jsx`, но с возможностью вставлять Markdown и галерею.
- [ ] **2.3.** Создать `src/components/GridCard.jsx` (карточка для сетки) — для Store и Library.
- [ ] **2.4.** Создать `src/components/SearchBar.jsx` (строка поиска) — переиспользовать код из `App.jsx`.

*Результат: набор универсальных компонентов, готовых к сборке страниц.*

Для Этапа 2 создай в src/components/ четыре файла:

1. FilterPanel.jsx — левая панель фильтров.
   - Принимает пропсы: allTags (массив строк), activeTags, onToggle.
   - Визуально: список чекбоксов с названиями тегов.
   - Стилизация: без Tailwind, только CSS-переменные проекта (--surface, --text, --border).
   - Анимация открытия/закрытия: transition max-width + opacity, как в umprumtype-lib.

2. DetailPanel.jsx — правая боковая панель для просмотра поста/книги.
   - Принимает children (любой контент) и onClose.
   - Кнопка закрытия (стрелка или крестик).
   - Анимация появления: transform translateX(100%) → 0, transition 500ms ease.
   - Стилизация через CSS-переменные.

3. GridCard.jsx — карточка для сетки (Store/Library).
   - Принимает title, author, year, image (опционально), tags, onClick.
   - Если нет картинки — показывает цветной блок с инициалами (как в App.jsx).
   - Стилизация без Tailwind.

4. SearchBar.jsx — строка поиска.
   - Принимает value, onChange.
   - Иконка поиска, скруглённый инпут.
   - Стилизация без Tailwind.

Все анимации: cubic-bezier(0.16, 1, 0.3, 1), только opacity/transform/max-height.
Использовать существующие CSS-переменные проекта.

---

### 📝 ЭТАП 3 — CMS для проектов и журнала

- [ ] **3.1.** В `public/admin/config.yml` (или в `src/admin/config.yml`) добавить коллекции `projects` и `journal` с полями:
  - `title` (string, required)
  - `date` (datetime, required)
  - `tags` (list of strings)
  - `body` (markdown)
  - `gallery` (list of images, optional)
  - `author` (string, optional)
  - `purchasable` (boolean, default false)
  - `contact` (text, optional — для связи с автором)
- [ ] **3.2.** Проверить, что CMS доступна по `/admin` и новые поля отображаются.

*Результат: можно добавлять посты через веб-интерфейс.*

## Этап 3: Настройка CMS для Journal и Projects

В проекте уже есть Decap CMS, доступная по /admin. Нужно добавить две коллекции:
journal и projects. Они будут иметь одинаковую структуру полей.

### 1. Обновить `public/admin/config.yml` (или `src/admin/config.yml`)
Добавь в секцию collections:

collections:
  - name: 'journal'
    label: 'Journal'
    folder: 'src/content/journal'
    create: true
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Date', name: 'date', widget: 'datetime' }
      - { label: 'Tags', name: 'tags', widget: 'list', default: [] }
      - { label: 'Author', name: 'author', widget: 'string', required: false }
      - { label: 'Body', name: 'body', widget: 'markdown' }
      - { label: 'Gallery', name: 'gallery', widget: 'list', required: false, fields: [
          { label: 'Image', name: 'image', widget: 'image' }
        ]}
      - { label: 'Purchasable', name: 'purchasable', widget: 'boolean', default: false }
      - { label: 'Contact', name: 'contact', widget: 'text', required: false }

  - name: 'projects'
    label: 'Projects'
    folder: 'src/content/projects'
    create: true
    fields:
      # Точно такие же поля, как у journal
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Date', name: 'date', widget: 'datetime' }
      - { label: 'Tags', name: 'tags', widget: 'list', default: [] }
      - { label: 'Author', name: 'author', widget: 'string', required: false }
      - { label: 'Body', name: 'body', widget: 'markdown' }
      - { label: 'Gallery', name: 'gallery', widget: 'list', required: false, fields: [
          { label: 'Image', name: 'image', widget: 'image' }
        ]}
      - { label: 'Purchasable', name: 'purchasable', widget: 'boolean', default: false }
      - { label: 'Contact', name: 'contact', widget: 'text', required: false }
2. Проверить

После пуша убедись, что:

В админке по адресу /admin появились разделы Journal и Projects.
Можно создать новый пост, загрузить картинки в галерею.
Сохраняется markdown-файл в соответствующей папке (src/content/journal или projects).
3. Создать тестовые посты

Создай 1-2 тестовых поста через админку для проверки (потом можно удалить).

text

---

Когда этот этап будет готов, мы сразу перейдём к **Этапу 4** — страницам-архивам Journal и Projects, которые будут использовать созданные компоненты и данные из CMS.

---

### 📚 ЭТАП 4 — СТРАНИЦЫ АРХИВОВ (Journal / Projects)

- [ ] **4.1.** Создать `src/pages/journal.astro` — страница со списком постов журнала.
  - Слева: `FilterPanel` (фильтр по тегам, годам).
  - Центр: список заголовков постов (как в Typefaces, но без аккордеона).
  - При клике на заголовок — открывается `DetailPanel` справа.
- [ ] **4.2.** Создать `src/pages/projects.astro` — аналогично journal.
- [ ] **4.3.** Внутри `DetailPanel` рендерить:
  - заголовок, дату, автора,
  - галерею (горизонтальный скролл, если есть изображения),
  - markdown-текст,
  - блок "Contact author" (если `purchasable` и есть `contact`).

*Результат: рабочие разделы журнала и проектов с унифицированным просмотром.*

## Этап 4: Страницы-архивы Journal и Projects

### 4.1 — Страница Journal (`src/pages/journal/index.astro`)
1.  **Сбор данных:** Через `Astro.glob` импортируй все `.md` файлы из `src/content/journal/`. Отсортируй их по дате (новые сверху).
2.  **Левая панель:** Используй созданный компонент `FilterPanel`.
    *   Собери все уникальные теги из постов журнала.
    *   `activeTags` и `onToggle` реализуй через React-стейт в родительском компоненте.
3.  **Центральный список:** Аналог списка в `Typefaces`, но без аккордеона.
    *   Каждый элемент: название поста, дата, автор (набранные системным шрифтом).
    *   При клике на элемент — открывается правая панель `DetailPanel`.
4.  **Правая панель:** Используй `DetailPanel`. При открытии в неё передаётся контент выбранного поста:
    *   Заголовок.
    *   Мета-информация (дата, автор, теги).
    *   Галерея (горизонтальный скролл, если есть фото).
    *   Текст поста (отрендеренный Markdown).
    *   Блок «Contact Author» (если `purchasable: true` и заполнено поле `contact`).

### 4.2 — Страница Projects (`src/pages/projects/index.astro`)
Сделай абсолютно то же самое, что и для Journal, но источник данных — файлы из `src/content/projects/`.

### Важные требования к стилю
- Используй существующие **CSS-переменные** и системные шрифты.
- Список элементов должен быть визуально лёгким, с разделителями (`border-bottom: 1px solid var(--border)`).
- Галерея внутри панели: горизонтальный скролл с `scroll-snap-type: x mandatory`.

---

### 🛍️ ЭТАП 5 — STORE

- [ ] **5.1.** Создать `src/pages/store.astro`.
- [ ] **5.2.** На странице автоматически собирать все посты из коллекций `projects` и `journal`, у которых `purchasable: true`.
- [ ] **5.3.** Отображать их сеткой (`GridCard`).
  - Карточка: обложка (первое фото из `gallery` или цветная плашка), название, автор.
- [ ] **5.4.** При клике на карточку — открывать `DetailPanel` (как в journal/projects), с акцентом на контакты автора.

*Результат: витрина без цен, ведущая к контактам.*

---

### 📖 ЭТАП 6 — LIBRARY (если понадобится сейчас)

- [ ] **6.1.** Перенести код из `umprumtype-lib` (App.jsx) в Astro-страницу `/library`, переиспользуя созданные компоненты (`FilterPanel`, `DetailPanel`, `GridCard`, `SearchBar`).
- [ ] **6.2.** Подключить Google Sheets как источник данных.
- [ ] **6.3.** Убедиться, что модальное окно Add Book работает (опционально).

*Результат: Library встроена в основной сайт.*

---

### 🏠 ЭТАП 7 — ГЛАВНАЯ СТРАНИЦА (отложено)

- [ ] **7.1.** Разработать дизайн эфемерной главной (p5.js или Canvas) — вернуться позже.

---

### ✅ ПОСЛЕ КАЖДОГО ШАГА
- Проверить результат локально (`npm run dev`) или на Vercel.
- Если что-то не работает, сообщить мне с конкретной проблемой.
- После проверки отметить пункт как выполненный и переходить к следующему.

---

Этот список покрывает всё, что мы обсуждали: от текущих багов до готовой экосистемы разделов. Ты можешь давать его порциями Claude Code или использовать как roadmap для себя.
