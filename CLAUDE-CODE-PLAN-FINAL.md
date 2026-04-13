# UMPRUM Type — Claude Code Master Plan
## Repo: github.com/yunglordsimens/umprumtype
## Stack: Astro 6 + Decap CMS + Vercel + GitHub OAuth

---

## КОНТЕКСТ

Сайт-архив шрифтов студии типографики UMPRUM (Прага).
CMS работает, деплой на Vercel работает, скелет на месте.
Нужно: стили, лейауты, компоненты, контент.

Принципы:
- Главная = вырви-глаз, каждый визит разная
- Архивы = вне времени, чистые, функциональные
- Посты = простой контейнер: галерея + текст
- Store = витрина без цен, клик → пост
- Все анимации = opacity + translateY, один easing
- Фильтры = AND между измерениями, OR внутри

---

## СТРУКТУРА КОНТЕНТА В CMS

### Typefaces (src/content/typefaces/*.md)
Ядро сайта. Каждый файл = один шрифт.
Данные: name, author, year, description, classification, mode,
scripts, fonts[], specimens{}, tags[]
Specimen text = конкретный текст на который отточены глифы.
НЕ показываем набор глифов, только текст.

### Projects (src/content/projects/*.md)
Статьи о выставках, воркшопах, публикациях.
Данные: title, author, date, category, gallery[], heroImage,
relatedTypeface (slug из typefaces), customFont (файл),
showCustomFontInArchive (boolean), purchasable, productTitle,
productImage, excerpt, body (markdown)

### Journal (src/content/journal/*.md)
Эссе, интервью, обзоры, новости.
Данные: title, author, date, category, gallery[], heroImage,
relatedTypeface, excerpt, body

---

## ФАЗЫ РАБОТЫ

### ФАЗА 0: Контент-схема (обновить content.config.ts)

Промпт для Claude Code:
```
Прочитай src/content.config.ts и обнови:

1. В projects добавь поля:
   - gallery: z.array(z.string()).default([])
   - heroImage: z.string().optional()
   - relatedTypeface: z.string().optional()  // slug шрифта
   - customFont: z.string().optional()  // путь к .woff2
   - showCustomFontInArchive: z.boolean().default(false)

2. В journal добавь:
   - gallery: z.array(z.string()).default([])
   - heroImage: z.string().optional()
   - relatedTypeface: z.string().optional()

3. Обнови public/admin/config.yml чтобы новые поля
   были доступны в CMS. Gallery = list of images.
   relatedTypeface = string (slug вручную пока).
```

### ФАЗА 1: Все markdown файлы шрифтов

Промпт:
```
Прочитай FONT-REFERENCE.md в корне проекта.
Создай все 16 markdown файлов в src/content/typefaces/.
Используй точные данные из справочника.
Имена файлов: ananas.md, chlebiczech.md, korchma.md,
marz-grotesk.md, b-rot.md, aft.md, asystematik.md,
benzsch.md, block-antiqua.md, burnout-script.md,
centavra.md, ecken-stil.md, frot.md, eclipse.md,
empe-sans.md, ciment.md
```

### ФАЗА 2: Global CSS + Base Layout

Промпт:
```
Создай src/styles/global.css:
- CSS custom properties (цвета, типографика, spacing, easing)
- Нейтральная палитра: #fafaf8 bg, #111 text, #e4e4e1 borders
- Dark mode через prefers-color-scheme
- CSS reset
- Scroll reveal: [data-reveal] opacity+translateY,
  [data-reveal-stagger] для детей с задержкой
- Один easing везде: cubic-bezier(0.16, 1, 0.3, 1)
- Навигация: sticky, hide on scroll down
- Типографика: system fonts (НЕ Inter, НЕ Roboto),
  используй "Helvetica Neue", Helvetica, Arial, sans-serif
- Адаптив: mobile-first

Создай src/layouts/Base.astro:
- Подключает global.css
- <nav> sticky: logo слева, ссылки справа
  (Typefaces, Projects, Journal, Store, Info)
- <footer>: "Umprum Type" + "Prague {year}"
- Mobile: burger menu
- <script>: IntersectionObserver для [data-reveal],
  scroll direction detection для nav hide,
  burger toggle
- <slot /> для контента
```

### ФАЗА 3: Typefaces архив

Промпт:
```
Перепиши src/pages/typefaces/index.astro:
- Использует Base layout
- getCollection('typefaces'), сортировка по year desc
- Фильтры в 3 строки: Classification, Year, Script
  (рендерятся из данных, не захардкожены)
- Поиск по имени/автору
- Кнопки сортировки: shuffle (default), year, name, author
- Кнопка "→ random" — скроллит к случайному шрифту
- Каждая строка: название, classification badge, автор, год
- Клик → client-side expand с specimen
- @font-face генерится из frontmatter каждого шрифта
- Шрифт грузится лениво (IntersectionObserver)
- data-reveal анимации на строках

Создай src/components/SpecimenTester.jsx:
- Props: fontFamily, variants[], initialText, mode, scripts[]
- contentEditable текст
- Слайдер размера + пресеты (зависят от mode)
- Авто-колонки: size <= 16 → 3 cols, <= 28 → 2, else 1
- Ручные кнопки колонок: Auto, 1, 2, 3
- Начертание switcher
- Текст выбирается по scripts (cs > uk > de > en > latin)
- ← → клавиатурная навигация между шрифтами
- Escape закрывает
- About + Author info внизу

Создай src/components/BottomBar.jsx:
- Sticky внизу, появляется при scrollY > 200
- Показывает: имя открытого шрифта, ← →, close, ↑ top
- Keyboard hints
- Анимация появления

Перепиши src/pages/typefaces/[...slug].astro:
- Полная страница шрифта с Base layout
- @font-face из frontmatter
- Полный SpecimenTester
- About, Author (URL, Instagram, email), Tags
```

### ФАЗА 4: Posts (Projects + Journal)

Промпт:
```
Перепиши src/pages/projects/index.astro:
- Base layout
- Список: дата, заголовок, категория
- Фильтр по категориям
- data-reveal stagger анимации

Создай src/pages/projects/[...slug].astro:
- Base layout
- Если heroImage → показать на полную ширину сверху
- Если gallery[] → горизонтальный скролл фото
  под hero. Фото = aspect-ratio auto, высота ~60vh,
  gap 8px, overflow-x scroll, snap-type x mandatory
- Если relatedTypeface → заголовок набран этим шрифтом
  (@font-face из связанного typeface)
- Если customFont → @font-face из файла, заголовок им
- Текст в узкой колонке (max-width 640px), markdown rendered
- Если purchasable → внизу блок "Contact author for purchase"

Скопируй ту же структуру для journal:
src/pages/journal/index.astro
src/pages/journal/[...slug].astro
(без purchasable)
```

### ФАЗА 5: Store + Info

Промпт:
```
Перепиши src/pages/store.astro:
- Base layout
- Собирает purchasable items из projects
- Фото-сетка: grid auto-fill minmax(220px, 1fr)
- Карточка: productImage (или heroImage, или первая из gallery),
  productTitle (или title), автор
- БЕЗ ЦЕНЫ, без "License"
- Hover: "→ view project"
- Клик → /projects/{slug}
- Вводный текст сверху: "Prints, zines, and objects.
  Contact the author through the project page."

Перепиши src/pages/info.astro:
- Base layout
- Текст о студии
- Контакт: typo@umprum.cz
- Адрес: UMPRUM, náměstí Jana Palacha 80, Praha 1
```

### ФАЗА 6: Homepage (bento)

Промпт:
```
Перепиши src/pages/index.astro:
- НЕ использует Base layout (своя структура)
- Fullscreen bento grid
- Горизонтальный скролл, бесконечный луп
- 2 ряда блоков разной высоты
- Блоки = featured typefaces + последние posts
- Каждый блок: фоновый градиент (рандомный),
  название шрифта набранное этим шрифтом КРУПНО,
  или заголовок проекта
- Ховер: теги, автор, год
- Рандомные пропорции ширин при каждом визите
- Плавная анимация ширин каждые 2.5 сек
- Клоны блоков для бесконечного скролла
- Навигация: маленький nav сверху (лого + ссылки)
- Wheel → horizontal scroll с инерцией
- Touch support
- Стиль: тёмный фон (#111118), цветные градиенты,
  noise overlay, glassmorphic tags
- CSS из того bento HTML что Маша скинула
```

### ФАЗА 7: Polish

```
- SEO: мета-теги на каждой странице, OG image
- Sitemap: @astrojs/sitemap
- 404 page
- Favicon
- font-display: swap на всех @font-face
- Lazy loading картинок
- Scroll progress indicator (тонкая линия вверху)
- Print stylesheet для typeface pages
```

---

## CMS ПОЛЯ ДЛЯ ПОСТОВ (config.yml)

Когда Claude Code обновит config.yml, посты будут иметь:

```yaml
# В CMS форме для Projects:
- Title (текст)
- Author (текст)
- Date (дата)
- Category (dropdown: exhibition/workshop/publication/...)
- Hero Image (картинка, опционально)
- Gallery (список картинок, до 8)
- Related Typeface (текст — slug шрифта, опционально)
- Custom Font File (файл .woff2, опционально)
- Show Custom Font in Archive (boolean)
- Tags (список)
- Excerpt (текст)
- Purchasable (boolean)
- Product Title (текст, опционально)
- Product Image (картинка, опционально)
- Body (markdown)
```

Минимум для создания поста: Title + Date + Category + Body.
Всё остальное опционально.

---

## ПОРЯДОК ВЫПОЛНЕНИЯ В CLAUDE CODE

1. Фаза 0 → обновить schema + CMS config
2. Фаза 1 → создать 16 markdown шрифтов
3. Фаза 2 → CSS + Base layout
4. Фаза 3 → Typefaces (архив + specimen + single page)
5. Фаза 4 → Posts (архив + single с галереей)
6. Фаза 5 → Store + Info
7. Фаза 6 → Homepage bento
8. Фаза 7 → Polish

После каждой фазы: `npm run build` → git push → проверить на Vercel.

---

## ФАЙЛЫ ШРИФТОВ

Маша должна вручную положить .woff2 файлы в public/fonts/.
Список нужных файлов — в FONT-REFERENCE.md.
Пока файлов нет — specimen будет показываться fallback шрифтом.
Это ок для разработки.
