import { useState } from 'react';
import GridCard from './GridCard.jsx';
import DetailPanel from './DetailPanel.jsx';

const TAG_COVERS = {
  'type':                  { bg: '#18181b', text: '#ffffff' },
  'teorie':                { bg: '#e7e5e4', text: '#18181b' },
  'history':               { bg: '#78350f', text: '#ffffff' },
  'graphic design':        { bg: '#1e3a5f', text: '#ffffff' },
  'magazine':              { bg: '#dc2626', text: '#ffffff' },
  'cyrillic':              { bg: '#3730a3', text: '#ffffff' },
  'book making':           { bg: '#064e3b', text: '#ffffff' },
  'katalog':               { bg: '#52525b', text: '#ffffff' },
  'polygraphy and print':  { bg: '#7c2d12', text: '#ffffff' },
  'umprumtype':            { bg: '#4c1d95', text: '#ffffff' },
  'umprum':                { bg: '#6b21a8', text: '#ffffff' },
  'specimen':              { bg: '#9f1239', text: '#ffffff' },
  'beletrie':              { bg: '#115e59', text: '#ffffff' },
  'fine art':              { bg: '#be185d', text: '#ffffff' },
  'other':                 { bg: '#404040', text: '#ffffff' },
  'bachelor/diploma work': { bg: '#365314', text: '#ffffff' },
  'final work':            { bg: '#164e63', text: '#ffffff' },
  'artists book':          { bg: '#4a044e', text: '#ffffff' },
};

function coverFromTags(tags = []) {
  for (const t of tags) {
    if (TAG_COVERS[t]) return TAG_COVERS[t];
  }
  return null;
}

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
    <div className="archive-layout">
      <div className="archive-main">
        <div className="store-grid">
          {items.map(item => {
            const cover = coverFromTags(item.tags);
            return (
              <GridCard
                key={item.slug}
                title={item.title}
                author={item.author}
                year={item.year}
                image={item.image}
                tags={item.tags}
                coverBg={cover?.bg}
                coverText={cover?.text}
                onClick={() => openItem(item)}
              />
            );
          })}
        </div>
      </div>

      <DetailPanel isOpen={!!openSlug} onClose={closeItem} variant="accent">
        {activeItem && (
          <StoreDetail item={activeItem} html={panelHtml} />
        )}
      </DetailPanel>
    </div>
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

      {item.contact && (
        <aside className="post-detail__contact store-contact">
          <h3>Contact author</h3>
          <p>{item.contact}</p>
        </aside>
      )}
    </article>
  );
}
