import { useState, useEffect, useMemo } from 'react';

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
    <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

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

function titleHue(title = '') {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  return h;
}

function getCover(item) {
  for (const tag of (item.tags || [])) {
    if (TAG_COVERS[tag]) return TAG_COVERS[tag];
  }
  const hue = titleHue(item.title);
  return { bg: `hsl(${hue} 35% 55%)`, text: '#fff' };
}

function getPostHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

// storeImage > gallery image > null
function itemImage(item) {
  return item.storeImage ?? item.image ?? null;
}

function StoreCard({ item, onClick }) {
  const cover = getCover(item);
  const img   = itemImage(item);
  return (
    <div
      className="store-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div className="store-card__cover" style={{ background: cover.bg }}>
        {img ? (
          <img src={img} alt={item.title} loading="lazy" />
        ) : (
          <span className="store-card__initials" style={{ color: cover.text }}>
            {item.title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="store-card__info">
        <h4 className="store-card__title">{item.title}</h4>
        <p className="store-card__author">{item.author || <em>—</em>}</p>
        {item.year && <p className="store-card__year">{item.year}</p>}
      </div>
    </div>
  );
}

export default function StoreIsland({ items }) {
  const [activeTags, setActiveTags]   = useState([]);
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openSlug, setOpenSlug]       = useState(null);
  const [panelHtml, setPanelHtml]     = useState('');
  const [expanded, setExpanded]       = useState(false);

  const allTags = useMemo(
    () => [...new Set(items.flatMap(i => i.tags ?? []))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    let list = items;
    if (activeTags.length > 0) {
      list = list.filter(i => activeTags.some(t => (i.tags ?? []).includes(t)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.author && i.author.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeTags, search, items]);

  function openItem(item) {
    setOpenSlug(item.slug);
    setPanelHtml(getPostHtml(item.slug));
  }

  function closeItem() { setOpenSlug(null); setExpanded(false); }

  function toggleTag(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  useEffect(() => {
    if (!openSlug) return;
    const onKey = e => { if (e.key === 'Escape') closeItem(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSlug]);

  const activeItem  = items.find(i => i.slug === openSlug) ?? null;
  const activeCover = activeItem ? getCover(activeItem) : null;
  const activeImg   = activeItem ? itemImage(activeItem) : null;

  if (items.length === 0) {
    return (
      <div className="lib-layout">
        <div className="lib-main">
          <header className="lib-toolbar">
            <div className="lib-right" style={{ marginLeft: 'auto' }}>
              <span className="lib-wordmark">UMPRUM Type Store</span>
            </div>
          </header>
          <div className="lib-scroll">
            <div className="lib-empty">No items available right now — check back soon.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lib-layout">

      {/* ── Left filter panel ── */}
      <aside className={`lib-filter${showFilters ? ' is-open' : ''}`}>
        <div className="lib-filter__inner">
          <div className="lib-filter__head">
            <h2 className="lib-filter__title">Filters</h2>
            <button className="lib-filter__close" onClick={() => setShowFilters(false)} aria-label="Close filters">
              <CloseIcon />
            </button>
          </div>
          <div>
            <h3 className="lib-filter__section-title">Tags &amp; Categories</h3>
            <div className="lib-filter__tags">
              {allTags.map(tag => {
                const active = activeTags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`lib-filter__tag${active ? ' is-active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    <div className="lib-filter__check">{active && <CheckIcon />}</div>
                    <span className="lib-filter__tag-label">{tag}</span>
                  </label>
                );
              })}
            </div>
            {activeTags.length > 0 && (
              <button className="lib-filter__clear" onClick={() => setActiveTags([])}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="lib-main">
        <header className="lib-toolbar">
          <button
            className="lib-filter-btn"
            onClick={() => setShowFilters(f => !f)}
            aria-pressed={showFilters}
          >
            <span className="lib-filter-btn__label">
              {showFilters ? 'Hide filters' : 'Filters'}
            </span>
          </button>
          <div className="lib-search-wrap">
            <div className="lib-search">
              <span className="lib-search__icon"><SearchIcon /></span>
              <input
                className="lib-search__input"
                type="text"
                placeholder="Search items, authors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="lib-right">
            <span className="lib-wordmark">UMPRUM Type Store</span>
          </div>
        </header>

        <div className="lib-scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No items match.</div>
          ) : (
            <>
              <p className="tf-island__count">
                {filtered.length}{filtered.length < items.length ? ` of ${items.length}` : ''} items
              </p>
              <div className="store-grid">
                {filtered.map(item => (
                  <StoreCard key={item.slug} item={item} onClick={() => openItem(item)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right detail panel ── */}
      <aside className={`lib-detail${activeItem ? ' is-open' : ''}${expanded ? ' is-expanded' : ''}`}>
        <div className="lib-detail__inner">
          <button className="lib-detail__close" onClick={closeItem} aria-label="Close">
            <ChevronLeftIcon />
          </button>
          {activeItem && (
            <button className="lib-detail__expand" onClick={() => setExpanded(e => !e)} aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          )}
          <div className="lib-detail__scroll">
            <span className="lib-detail__label">Item details</span>
            {activeItem && (
              <div className="store-detail">
                <div className="store-detail__header">
                  <div className="lib-detail__cover" style={{ background: activeCover.bg }}>
                    {activeImg ? (
                      <img src={activeImg} alt={activeItem.title} className="lib-book__img" />
                    ) : (
                      <div className="lib-detail__cover-text" style={{ color: activeCover.text }}>
                        <span className="lib-detail__cover-title">{activeItem.title}</span>
                        {activeItem.author && (
                          <span className="lib-detail__cover-author">{activeItem.author}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="lib-detail__meta">
                    <h2 className="lib-detail__title">{activeItem.title}</h2>
                    {activeItem.author && <p className="lib-detail__author">{activeItem.author}</p>}
                    {activeItem.year   && <p className="lib-detail__year">{activeItem.year}</p>}
                    {activeItem.tags.length > 0 && (
                      <ul className="lib-detail__tags">
                        {activeItem.tags.map(t => (
                          <li key={t} className="lib-detail__tag">{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {panelHtml && (
                  <div
                    className="post__body post-detail__body store-detail__body"
                    dangerouslySetInnerHTML={{ __html: panelHtml }}
                  />
                )}
                {activeItem.contact && (
                  <aside className="post-detail__contact store-detail__contact">
                    <h3>Contact author</h3>
                    <p>{activeItem.contact}</p>
                  </aside>
                )}
              </div>
            )}
          </div>
          <div className="lib-detail__footer">UMPRUM Type × 2026</div>
        </div>
      </aside>

    </div>
  );
}
