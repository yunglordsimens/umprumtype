import { useState, useMemo } from 'react';
import TypefaceCard from './TypefaceCard.jsx';

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

export default function TypefaceIsland({ typefaces }) {
  const [activeTags, setActiveTags]   = useState([]);
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openSlug, setOpenSlug]       = useState(null);

  const allTags = useMemo(
    () => [...new Set(typefaces.flatMap(t => t.tags ?? []))].sort(),
    [typefaces]
  );

  const filtered = useMemo(() => {
    let list = typefaces;
    if (activeTags.length > 0) {
      list = list.filter(t => (t.tags ?? []).some(tag => activeTags.includes(tag)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.designer && t.designer.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeTags, search, typefaces]);

  function toggleTag(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function toggleSlug(slug) {
    setOpenSlug(prev => prev === slug ? null : slug);
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
            <h3 className="lib-filter__section-title">Tags</h3>
            <div className="lib-filter__tags">
              {allTags.map(tag => {
                const active = activeTags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={`lib-filter__tag${active ? ' is-active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    <div className="lib-filter__check">
                      {active && <CheckIcon />}
                    </div>
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

        {/* Toolbar */}
        <header className="lib-toolbar">
          <button
            className="lib-filter-btn"
            onClick={() => setShowFilters(f => !f)}
            aria-pressed={showFilters}
          >
            <FilterIcon />
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
                placeholder="Search typefaces, designers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="lib-right">
            <span className="lib-wordmark">UMPRUM TYPEFACES</span>
          </div>
        </header>

        {/* Scrollable list */}
        <div className="lib-scroll tf-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No typefaces match.</div>
          ) : (
            <>
              <p className="tf-island__count">
                {filtered.length}{filtered.length < typefaces.length ? ` of ${typefaces.length}` : ''} typefaces
              </p>
              <ul className="tfa-list">
                {filtered.map(tf => (
                  <TypefaceCard
                    key={tf.slug}
                    tf={tf}
                    isOpen={openSlug === tf.slug}
                    onOpen={() => toggleSlug(tf.slug)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
