Готово. Вот финальная инструкция для Клода, которая добавит гибкие блоки в CMS и на страницы постов. Ты можешь скопировать её и отправить.

---

```
## Задача: добавить гибкие блоки контента (текст/изображения) в проекты и журнал

### 1. ОБНОВИТЬ CMS (public/admin/config.yml или src/admin/config.yml)

В коллекциях `projects` и `journal` добавить новое поле `blocks`:

```yaml
- label: "Content Blocks"
  name: "blocks"
  widget: "list"
  hint: "Build the page by adding text and image blocks in any order."
  types:
    - label: "Text"
      name: "text"
      widget: "object"
      fields:
        - { label: "Content", name: "content", widget: "markdown", default: "Write your text here..." }
    - label: "Images"
      name: "images"
      widget: "object"
      fields:
        - label: "Images"
          name: "items"
          widget: "list"
          field: { label: "Image", name: "image", widget: "image" }
  default:
    - type: text
      content: "Enter your opening text."
    - type: images
      items: []
```

**Важно:**  
Убедись, что старые поля `body` и `gallery` остаются в коллекциях, но будут использоваться как fallback (см. шаг 3).

### 2. СОЗДАТЬ КОМПОНЕНТ FLEXCONTENT

Создать `src/components/FlexContent.astro`:

```astro
---
import { Image } from 'astro:assets';

interface Block {
  type: 'text' | 'images';
  content?: string;
  items?: string[];
}

const { blocks = [] } = Astro.props as { blocks: Block[] };
---

{
  blocks.map((block) => {
    if (block.type === 'text' && block.content) {
      return (
        <div class="flex-content__text" data-reveal>
          <div class="measure" set:html={block.content} />
        </div>
      );
    }
    if (block.type === 'images' && block.items?.length) {
      return (
        <div class="flex-content__images" data-reveal>
          <div class="flex-content__grid">
            {block.items.map((img, i) => (
              <img src={img} alt="" loading="lazy" />
            ))}
          </div>
        </div>
      );
    }
    return null;
  })
}
```

Добавить в `global.css`:

```css
.flex-content__text {
  margin-bottom: var(--space-8);
}
.flex-content__images {
  margin-bottom: var(--space-8);
}
.flex-content__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.flex-content__grid img {
  width: 100%;
  height: auto;
  object-fit: cover;
}
@media (max-width: 640px) {
  .flex-content__grid {
    grid-template-columns: 1fr;
  }
}
```

### 3. ОБНОВИТЬ СТРАНИЦЫ ПОСТОВ (projects/[slug].astro и journal/[slug].astro)

Заменить текущий рендеринг контента на использование `FlexContent`.

**Для `projects/[slug].astro`:**

Удалить или закомментировать старые блоки `<div class="post__body">`, `<div class="post__gallery">`, `<Content />`.

Вставить вместо них:

```astro
{
  d.blocks && d.blocks.length > 0 ? (
    <FlexContent blocks={d.blocks} />
  ) : (
    <>
      {d.gallery && d.gallery.length > 0 && (
        <div class="post__gallery" data-reveal>
          {d.gallery.map(img => <img src={img} alt="" loading="lazy" />)}
        </div>
      )}
      <div class="post__body measure" data-reveal>
        <Content />
      </div>
    </>
  )
}
```

Импортировать `FlexContent`:

```astro
import FlexContent from '../../components/FlexContent.astro';
```

Аналогично обновить `journal/[slug].astro`.

### 4. ПРОВЕРИТЬ ОБРАТНУЮ СОВМЕСТИМОСТЬ

- Если пост создан без `blocks` (старый формат), он должен показать `gallery` + `body` как раньше.
- Если в посте заполнены `blocks`, они заменяют старый вывод.
- Убедиться, что `post-content-store` (для ArchiveIsland) всё ещё получает корректный HTML предпросмотра. Если нужно, добавить туда поддержку `blocks` или оставить как есть — для предпросмотра в списке можно использовать первый текстовый блок из `blocks` или `excerpt`.
```
