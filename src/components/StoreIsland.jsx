import { Fragment, useState, useMemo, useEffect, useRef } from 'react';
import TagsPill from './TagsPill.jsx';
import { toImage, BookCard, BookDetail } from './libraryParts.jsx';
import { useSiteSearch, matchesQuery } from '../lib/siteSearch.js';

// Store = Library logic, grid only. Item body HTML is rendered at build time
// into a hidden container on the page and picked up by slug.
function postHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

export default function StoreIsland({ items }) {
  const [activeTags, setActiveTags] = useState([]);
  const [showTags, setShowTags]     = useState(false);
  const [openId, setOpenId]         = useState(null);
  const [sort, setSort]             = useState('title');
  const [sortDir, setSortDir]       = useState(1);
  const searchQuery = useSiteSearch();
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.maxHeight = showTags ? '600px' : '0';
    panel.style.opacity   = showTags ? '1' : '0';
  }, [showTags]);

  const products = useMemo(() => items.map(i => ({
    ...i,
    id: i.slug,
    year: i.year ? String(i.year) : null,
    image: toImage(i.storeImage || (i.gallery ?? [])[0]),
  })), [items]);

  const allTags = useMemo(
    () => [...new Set(products.flatMap(p => p.tags))].sort((a, b) => a.localeCompare(b, 'cs')),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (activeTags.length) list = list.filter(p => p.tags.some(t => activeTags.includes(t)));
    if (searchQuery.trim()) list = list.filter(p => matchesQuery(searchQuery, [p.title, p.author, p.year, ...p.tags]));
    return [...list].sort((a, b) => {
      if (sort === 'year') return ((parseInt(a.year) || 0) - (parseInt(b.year) || 0)) * sortDir;
      return (a[sort] || '').toLowerCase().localeCompare((b[sort] || '').toLowerCase(), 'cs') * sortDir;
    });
  }, [products, activeTags, searchQuery, sort, sortDir]);

  function cycleSort(col) {
    if (sort === col) setSortDir(d => d * -1);
    else { setSort(col); setSortDir(1); }
  }
  const toggleTag = tag => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const onTagClick = tag => { setOpenId(null); setActiveTags([tag]); };

  if (products.length === 0) {
    return (
      <div className="lib-layout">
        <div className="lib-main">
          <div className="lib-scroll">
            <div className="lib-empty store-soon">Coming soon</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lib-layout">
      <div className="lib-main">
        <header className="lib-toolbar">
          <TagsPill
            open={showTags}
            activeCount={activeTags.length}
            onToggle={() => setShowTags(v => !v)}
            onClear={() => { setShowTags(false); setActiveTags([]); }}
          />
          <div className="tf-sort">
            {[['title', 'Title'], ['author', 'Author'], ['year', 'Year']].map(([col, label]) => (
              <button key={col} className="tf-cap" aria-pressed={sort === col} onClick={() => cycleSort(col)}>
                <span>{label}</span>
                {sort === col && <span className="tf-cap__arrow">{sortDir === 1 ? '↑' : '↓'}</span>}
              </button>
            ))}
          </div>
          <span className="lib-toolbar-count">
            {filtered.length < products.length ? `${filtered.length} of ${products.length}` : filtered.length}
          </span>
        </header>

        <div ref={panelRef} className="tf-tags-panel" style={{ maxHeight: 0, opacity: 0, overflow: 'hidden', transition: 'max-height 400ms var(--ease), opacity 280ms var(--ease)' }}>
          <div className="tf-tags-panel__inner">
            <div className="tf-tags-panel__chips">
              {allTags.map(tag => (
                <button key={tag} className={`tf-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="lib-scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">Nothing found.</div>
          ) : (
            <div className="lib-grid">
              {filtered.map(p => (
                <Fragment key={p.id}>
                  <BookCard book={p} isOpen={openId === p.id} onToggle={() => setOpenId(o => o === p.id ? null : p.id)} />
                  {openId === p.id && (
                    <div className="lib-grid-accordion">
                      <BookDetail book={p} onTagClick={onTagClick} onClose={() => setOpenId(null)}>
                        {p.excerpt && <p className="store-detail__excerpt">{p.excerpt}</p>}
                        <div className="post__body store-detail__body" dangerouslySetInnerHTML={{ __html: postHtml(p.slug) }} />
                        {p.contact && (
                          <p className="store-detail__contact">
                            Contact author: <a href={p.contact.includes('@') ? `mailto:${p.contact}` : p.contact}>{p.contact}</a>
                          </p>
                        )}
                      </BookDetail>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
