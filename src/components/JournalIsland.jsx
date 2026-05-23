import { useState, useMemo, useEffect, useRef } from 'react';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SORTS = [
  { key: 'name',    label: 'Name' },
  { key: 'author',  label: 'Author' },
  { key: 'year',    label: 'Year' },
  { key: 'shuffle', label: 'Shuffle' },
];

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
            {post.purchasable && post.contact && (
              <aside className="post-detail__contact">
                <h3>Contact author</h3>
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

export default function JournalIsland({ posts }) {
  const [activeTags, setActiveTags] = useState([]);
  const [search, setSearch]         = useState('');
  const [showTags, setShowTags]     = useState(false);
  const [openSlug, setOpenSlug]     = useState(null);
  const [sort, setSort]             = useState('name');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const panelRef = useRef(null);

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
    const out = [...list];
    if (sort === 'author') {
      out.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'cs'));
    } else if (sort === 'year') {
      out.sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
    } else if (sort === 'shuffle') {
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
    } else {
      out.sort((a, b) => a.title.localeCompare(b.title, 'cs'));
    }
    return out;
  }, [activeTags, search, sort, shuffleSeed, posts]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (showTags) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.opacity   = '1';
    } else {
      panel.style.maxHeight = '0';
      panel.style.opacity   = '0';
    }
  }, [showTags]);

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
      <div className="lib-main">

        <header className="lib-toolbar">
          <button className="lib-filter-btn" onClick={() => setShowTags(f => !f)} aria-pressed={showTags}>
            <span className="lib-filter-btn__label">Tags</span>
            {activeTags.length > 0 && <span className="tf-tag-count">{activeTags.length}</span>}
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
          <div className="tf-sort">
            {SORTS.map(s => (
              <button key={s.key} aria-pressed={sort === s.key} onClick={() => { setSort(s.key); if (s.key === 'shuffle') setShuffleSeed(n => n + 1); }}>
                {s.label}
              </button>
            ))}
          </div>
        </header>

        <div
          ref={panelRef}
          className="tf-tags-panel"
          style={{ maxHeight: 0, opacity: 0, overflow: 'hidden',
            transition: 'max-height 400ms cubic-bezier(0.16,1,0.3,1), opacity 280ms' }}
        >
          <div className="tf-tags-panel__inner">
            <div className="tf-tags-panel__chips">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`tf-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tf-tags-panel__actions">
              {activeTags.length > 0 && (
                <button className="tf-tags-clear" onClick={() => setActiveTags([])}>Clear</button>
              )}
              <button className="tf-tags-close" onClick={() => setShowTags(false)} aria-label="Close tags">
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>

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
