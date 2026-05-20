import { useState, useMemo } from 'react';
import TypefaceCard from './TypefaceCard.jsx';


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

const SORTS = [
  { key: 'name',     label: 'A–Z' },
  { key: 'year',     label: 'Year' },
  { key: 'designer', label: 'Designer' },
];

// Flat list of filter-able values for a typeface:
// explicit tags if present; otherwise year + designer as fallback.
function effectiveTags(tf) {
  if (tf.tags && tf.tags.length > 0) return tf.tags;
  const out = [];
  if (tf.year) out.push(String(tf.year));
  if (tf.designer && tf.designer !== 'Unknown') out.push(tf.designer);
  return out;
}

export default function TypefaceIsland({ typefaces }) {
  const [activeTags, setActiveTags]   = useState([]);
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openSlug, setOpenSlug]       = useState(null);
  const [sort, setSort]               = useState('name');

  // Derive year and designer lists for filter panel
  const allYears = useMemo(
    () => [...new Set(typefaces.map(tf => tf.year).filter(Boolean))]
            .sort((a, b) => b - a)
            .map(String),
    [typefaces]
  );
  const allDesigners = useMemo(
    () => [...new Set(typefaces.map(tf => tf.designer).filter(d => d && d !== 'Unknown'))]
            .sort((a, b) => a.localeCompare(b, 'cs')),
    [typefaces]
  );

  const filtered = useMemo(() => {
    let list = typefaces;

    if (activeTags.length > 0) {
      list = list.filter(tf =>
        activeTags.some(tag => effectiveTags(tf).includes(tag))
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tf =>
        tf.title.toLowerCase().includes(q) ||
        (tf.designer && tf.designer.toLowerCase().includes(q))
      );
    }

    const out = [...list];
    if (sort === 'year') {
      out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else if (sort === 'designer') {
      out.sort((a, b) => (a.designer ?? '').localeCompare(b.designer ?? '', 'cs'));
    } else {
      out.sort((a, b) => a.title.localeCompare(b.title, 'cs'));
    }
    return out;
  }, [activeTags, search, sort, typefaces]);

  function toggleTag(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function toggleSlug(slug) {
    setOpenSlug(prev => prev === slug ? null : slug);
  }

  const hasExplicitTags = typefaces.some(tf => tf.tags && tf.tags.length > 0);

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

          {hasExplicitTags && (
            <div>
              <h3 className="lib-filter__section-title">Tags</h3>
              <div className="lib-filter__tags">
                {[...new Set(typefaces.flatMap(tf => tf.tags ?? []))].sort().map(tag => {
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
            </div>
          )}

          <div>
            <h3 className="lib-filter__section-title">Year</h3>
            <div className="lib-filter__tags">
              {allYears.map(year => {
                const active = activeTags.includes(year);
                return (
                  <label
                    key={year}
                    className={`lib-filter__tag${active ? ' is-active' : ''}`}
                    onClick={() => toggleTag(year)}
                  >
                    <div className="lib-filter__check">{active && <CheckIcon />}</div>
                    <span className="lib-filter__tag-label">{year}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="lib-filter__section-title">Designer</h3>
            <div className="lib-filter__tags">
              {allDesigners.map(designer => {
                const active = activeTags.includes(designer);
                return (
                  <label
                    key={designer}
                    className={`lib-filter__tag${active ? ' is-active' : ''}`}
                    onClick={() => toggleTag(designer)}
                  >
                    <div className="lib-filter__check">{active && <CheckIcon />}</div>
                    <span className="lib-filter__tag-label">{designer}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {activeTags.length > 0 && (
            <button className="lib-filter__clear" onClick={() => setActiveTags([])}>
              Clear filters
            </button>
          )}
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
                placeholder="Search typefaces, designers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="tf-sort">
            {SORTS.map(s => (
              <button
                key={s.key}
                aria-pressed={sort === s.key}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="lib-right">
            <span className="lib-wordmark">UMPRUM Typefaces</span>
          </div>
        </header>

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
                    onTagClick={tag => { setOpenSlug(null); setActiveTags([tag]); }}
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
