#### 🔴 Приоритет 1: Критические правки (DetailPanel)

1. **Исправить цвет текста в оранжевой панели**  
   - В `.detail-panel--accent` **убрать** переопределение `--text: #ffffff`.  
   - Текст должен быть **чёрным** (`color: #111`).  
   - Переопределить только `--text-muted` (opacity 0.7 от чёрного) и `--text-subtle` (opacity 0.5).

2. **Кнопка закрытия — стрелка влево**  
   - Заменить крестик на **ChevronLeft** (стрелку влево).  
   - Позиционировать: `position: absolute; top: 2rem; left: 1.5rem`.  
   - Убедиться, что при наведении стрелка меняет цвет на чёрный.

3. **Добавить заголовок «Details» внутри панели**  
   - Перед контентом вставить `<span>Details</span>`.  
   - Стиль: `font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(0,0,0,0.2); padding-bottom: 1rem; margin-bottom: 2.5rem; display: block`.

4. **Увеличить обложку в детальной панели**  
   - Размер: `width: 192px; height: 288px` (мобильные), `width: 224px; height: 320px` (десктоп).  
   - Обновить CSS-класс `.book-cover--lg`.

5. **Усилить тень обложки**  
   - `box-shadow: 15px 25px 40px rgba(0,0,0,0.25)`.

6. **Теги в деталях — привести к оригиналу**  
   - `background: rgba(0,0,0,0.05); border-radius: 999px; padding: 0.2em 0.75em; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em`.

7. **Добавить нижний колонтитул в DetailPanel**  
   - `<div class="detail-panel__footer">UMPRUM Type Library × 2026</div>`.  
   - `border-top: 1px solid rgba(0,0,0,0.1); padding: 2rem; text-align: center; font-size: 0.75rem; opacity: 0.6`.

---

#### 🟡 Приоритет 2: Косметические правки (FilterPanel, сетка, общие стили)

1. **Глобальный фон**  
   - Поменять `--bg: #f8f8f8` (было `#fafaf8`).

2. **FilterPanel**  
   - Чекбоксы: увеличить радиус скругления до `4px`. Активный — чёрный фон, белая галочка.  
   - Заголовок «Filters»: `font-size: 1.25rem; font-weight: 500; letter-spacing: -0.01em`.  
   - Кнопку сворачивания/закрытия заменить на **SVG-крестик** (как в App.jsx), убрать стрелку.

3. **Library — сетка книг**  
   - Размер обложек: `width: 128px; height: 192px` (мобильные), `width: 160px; height: 224px` (десктоп).  
   - Отступ от обложки до названия: `margin-top: 1.5rem` (24px).  
   - Шрифт внутри обложки без картинки: название — `10px`, автор — `8px`.  
   - Добавить текст «UMPRUM TYPE LIBRARY» в тулбар (рядом с поиском или под ним). Стиль: `font-size: 0.75rem; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.1em`.

4. **Строка поиска (SearchBar)**  
   - Фон: `var(--surface-alt)` (сероватый).  
   - При фокусе: `background: white; box-shadow: 0 0 0 1px var(--border-strong)`.

5. **Анимации**  
   - Убедиться, что все переходы используют `cubic-bezier(0.16, 1, 0.3, 1)` и длительность 300–500ms.
