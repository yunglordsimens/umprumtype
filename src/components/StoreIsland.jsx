import { useState } from 'react';
import GridCard from './GridCard.jsx';
import DetailPanel from './DetailPanel.jsx';

function getPostHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

export default function StoreIsland({ items }) {
  const [openSlug,  setOpenSlug]  = useState(null);
  const [panelHtml, setPanelHtml] = useState('');

  function openItem(item) {
    setOpenSlug(item.slug);
    setPanelHtml(getPostHtml(item.slug));
  }

  function closeItem() {
    setOpenSlug(null);
  }

  const activeItem = items.find(i => i.slug === openSlug) ?? null;

  if (items.length === 0) {
    return (
      <p className="muted store-empty">No items available right now — check back soon.</p>
    );
  }

  return (
    <>
      <div className="store-grid">
        {items.map(item => (
          <GridCard
            key={item.slug}
            title={item.title}
            author={item.author}
            year={item.year}
            image={item.image}
            tags={item.tags}
            onClick={() => openItem(item)}
          />
        ))}
      </div>

      <DetailPanel isOpen={!!openSlug} onClose={closeItem}>
        {activeItem && (
          <StoreDetail item={activeItem} html={panelHtml} />
        )}
      </DetailPanel>
    </>
  );
}

function StoreDetail({ item, html }) {
  return (
    <article className="post-detail">
      <div className="post-detail__meta">
        <time dateTime={item.dateIso}>{item.date}</time>
        {item.category && <span>{item.category}</span>}
        {item.author   && <span>{item.author}</span>}
      </div>

      <h2 className="post-detail__title">{item.title}</h2>

      {item.excerpt && (
        <p className="post-detail__excerpt">{item.excerpt}</p>
      )}

      {item.gallery.length > 0 && (
        <div className="post-detail__gallery">
          {item.gallery.map((img, i) => (
            <img key={i} src={img} alt="" loading="lazy" />
          ))}
        </div>
      )}

      <div
        className="post__body post-detail__body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* contact block — primary CTA for store items */}
      {item.contact && (
        <aside className="post-detail__contact store-contact">
          <h3>Contact author</h3>
          <p>{item.contact}</p>
        </aside>
      )}
    </article>
  );
}
