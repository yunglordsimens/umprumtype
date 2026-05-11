import { useState, useEffect, useMemo } from 'react';

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

function getPostHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

export default function JournalIsland({ posts }) {
  const [activeTags, setActiveTags]   = useState([]);
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openSlug, setOpenSlug]       = useState(null);
  const [panelHtml, setPanelHtml]     = useState('');

  const allTags = useMemo(
    () => [...new Set(posts.flatMap(p => p.tags))].sort(),
    [posts]
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeTags.length > 0) {
      list = list.filter(p => activeTags.some(t => p.tags.includes(t)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.author && p.author.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeTags, search, posts]);

  function openPost(post) {
    setOpenSlug(post.slug);
    setPanelHtml(getPostHtml(post.slug));
  }

  function closePost() { setOpenSlug(null); }

  function toggleTag(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  useEffect(() => {
    if (!openSlug) return;
    const onKey = e => { if (e.key === 'Escape') closePost(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSlug]);

  const activePost = posts.find(p => p.slug === openSlug) ?? null;

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
            <h3 className="lib-filter__section-title">Categories</h3>
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
                placeholder="Search entries, authors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="lib-right">
            <span className="lib-wordmark">UMPRUM JOURNAL</span>
          </div>
        </header>

        <div className="lib-scroll post-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No entries match.</div>
          ) : (
            <>
              <p className="tf-island__count">
                {filtered.length}{filtered.length < posts.length ? ` of ${posts.length}` : ''} entries
              </p>
              <ul className="post-list post-island__list">
                {filtered.map(p => (
                  <li key={p.slug} className={`post-row${openSlug === p.slug ? ' is-active' : ''}`}>
                    <button className="post-row__btn" onClick={() => openPost(p)}>
                      <time className="post-row__date" dateTime={p.dateIso}>{p.date}</time>
                      <span className="post-row__title">{p.title}</span>
                      <span className="post-row__category">{p.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── Right detail panel ── */}
      <aside className={`lib-detail${activePost ? ' is-open' : ''}`}>
        <div className="lib-detail__inner">
          <button className="lib-detail__close" onClick={closePost} aria-label="Close">
            <ChevronLeftIcon />
          </button>
          <div className="lib-detail__scroll">
            <span className="lib-detail__label">Post details</span>
            {activePost && (
              <article className="post-detail post-detail--panel">
                <div className="post-detail__meta">
                  <time dateTime={activePost.dateIso}>{activePost.date}</time>
                  {activePost.category && <span>{activePost.category}</span>}
                  {activePost.author   && <span>{activePost.author}</span>}
                </div>
                <h2 className="post-detail__title">{activePost.title}</h2>
                {activePost.excerpt && (
                  <p className="post-detail__excerpt">{activePost.excerpt}</p>
                )}
                {activePost.gallery.length > 0 && (
                  <div className="post-detail__gallery">
                    {activePost.gallery.map((img, i) => (
                      <img key={i} src={img} alt="" loading="lazy" />
                    ))}
                  </div>
                )}
                <div
                  className="post__body post-detail__body"
                  dangerouslySetInnerHTML={{ __html: panelHtml }}
                />
                {activePost.purchasable && activePost.contact && (
                  <aside className="post-detail__contact">
                    <h3>Contact author</h3>
                    <p>{activePost.contact}</p>
                  </aside>
                )}
              </article>
            )}
          </div>
          <div className="lib-detail__footer">UMPRUM Type × 2026</div>
        </div>
      </aside>

    </div>
  );
}
