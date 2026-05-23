import { useState, useMemo, useEffect } from 'react';

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

function getPostHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

function PostRow({ post, isOpen, onToggle }) {
  const [html] = useState(() =>
    typeof document !== 'undefined' ? (getPostHtml(post.slug) || '') : ''
  );

  return (
    <li className={`post-row${isOpen ? ' is-open' : ''}`}>
      <button className="post-row__btn" onClick={onToggle}>
        <time className="post-row__date" dateTime={post.dateIso}>{post.date}</time>
        <span className="post-row__title">{post.title}</span>
        <span className="post-row__category">{post.category}</span>
      </button>
      <div className="post-row__panel">
        <div className="post-row__panel-inner">
          <article className="post-detail post-detail--inline">
            <div className="post-detail__meta">
              <time dateTime={post.dateIso}>{post.date}</time>
              {post.category && <span>{post.category}</span>}
              {post.author   && <span>{post.author}</span>}
            </div>
            <h2 className="post-detail__title">{post.title}</h2>
            {post.excerpt && <p className="post-detail__excerpt">{post.excerpt}</p>}
            {post.gallery.length > 0 && (
              <div className="post-detail__gallery">
                {post.gallery.map((img, i) => <img key={i} src={img} alt="" loading="lazy" />)}
              </div>
            )}
            <div className="post__body" dangerouslySetInnerHTML={{ __html: html }} />
            {post.contact && (
              <aside className="post-detail__contact">
                <h3>Contact</h3>
                <p>{post.contact}</p>
              </aside>
            )}
            <div className="post-row__close-wrap">
              <button className="post-row__close-btn" onClick={onToggle} aria-label="Close">×</button>
            </div>
          </article>
        </div>
      </div>
    </li>
  );
}

export default function ProjectsIsland({ posts }) {
  const [activeTags, setActiveTags]   = useState([]);
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openSlug, setOpenSlug]       = useState(null);

  const allTags = useMemo(
    () => [...new Set(posts.flatMap(p => p.tags))].sort(),
    [posts]
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeTags.length > 0) list = list.filter(p => activeTags.some(t => p.tags.includes(t)));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || (p.author && p.author.toLowerCase().includes(q)));
    }
    return list;
  }, [activeTags, search, posts]);

  function togglePost(slug) {
    setOpenSlug(prev => prev === slug ? null : slug);
  }

  function toggleTag(tag) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  useEffect(() => {
    if (!openSlug) return;
    const onKey = e => { if (e.key === 'Escape') setOpenSlug(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSlug]);

  return (
    <div className="lib-layout">

      <aside className={`lib-filter${showFilters ? ' is-open' : ''}`}>
        <div className="lib-filter__inner">
          <div className="lib-filter__head">
            <h2 className="lib-filter__title">Tags</h2>
            <button className="lib-filter__close" onClick={() => setShowFilters(false)} aria-label="Close tags">
              <CloseIcon />
            </button>
          </div>
          <div>
            <h3 className="lib-filter__section-title">Categories</h3>
            <div className="lib-filter__tags">
              {allTags.map(tag => {
                const active = activeTags.includes(tag);
                return (
                  <label key={tag} className={`lib-filter__tag${active ? ' is-active' : ''}`} onClick={() => toggleTag(tag)}>
                    <div className="lib-filter__check">{active && <CheckIcon />}</div>
                    <span className="lib-filter__tag-label">{tag}</span>
                  </label>
                );
              })}
            </div>
            {activeTags.length > 0 && (
              <button className="lib-filter__clear" onClick={() => setActiveTags([])}>Clear filters</button>
            )}
          </div>
        </div>
      </aside>

      <div className="lib-main">
        <header className="lib-toolbar">
          <button className="lib-filter-btn" onClick={() => setShowFilters(f => !f)} aria-pressed={showFilters}>
            <span className="lib-filter-btn__label">{showFilters ? 'Hide tags' : 'Tags'}</span>
          </button>
          <div className="lib-search-wrap">
            <div className="lib-search">
              <span className="lib-search__icon"><SearchIcon /></span>
              <input
                className="lib-search__input"
                type="text"
                placeholder="Search projects, authors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="lib-right">
            <span className="lib-wordmark">UMPRUM Type Projects</span>
          </div>
        </header>

        <div className="lib-scroll post-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No projects match.</div>
          ) : (
            <>
              <p className="tf-island__count">
                {filtered.length}{filtered.length < posts.length ? ` of ${posts.length}` : ''} projects
              </p>
              <ul className="post-list post-island__list">
                {filtered.map(p => (
                  <PostRow
                    key={p.slug}
                    post={p}
                    isOpen={openSlug === p.slug}
                    onToggle={() => togglePost(p.slug)}
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
