import { useState, useMemo, useEffect, useRef } from 'react';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9pcn-Vt6gV9lCYZEK1Ly6ZKdEIYqN-VoIu9EkPqDqkFCAwT5R_eqaKz6priy-ixFZQWD3CtX263O_/pub?output=csv';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
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

const FALLBACK_COVERS = [
  { bg: '#1f2937', text: '#ffffff' },
  { bg: '#d4d4d4', text: '#111111' },
  { bg: '#334155', text: '#ffffff' },
  { bg: '#3f3f46', text: '#ffffff' },
  { bg: '#44403c', text: '#ffffff' },
];

const ALL_TAGS = Object.keys(TAG_COVERS).sort();

function getCover(book) {
  for (const tag of book.tags) {
    if (TAG_COVERS[tag]) return TAG_COVERS[tag];
  }
  return FALLBACK_COVERS[book.id % FALLBACK_COVERS.length];
}

function parseRow(row) {
  const cols = [];
  let i = 0;
  const s = row.replace(/\r$/, '');
  while (i <= s.length) {
    if (i === s.length) { cols.push(''); break; }
    if (s[i] === '"') {
      let val = ''; i++;
      while (i < s.length) {
        if (s[i] === '"' && s[i + 1] === '"') { val += '"'; i += 2; }
        else if (s[i] === '"') { i++; break; }
        else { val += s[i++]; }
      }
      cols.push(val);
      if (s[i] === ',') i++;
    } else {
      const end = s.indexOf(',', i);
      if (end === -1) { cols.push(s.slice(i)); break; }
      cols.push(s.slice(i, end));
      i = end + 1;
    }
  }
  return cols;
}

function toThumb(url) {
  if (!url) return null;
  const m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600`;
  return url.startsWith('http') ? url : null;
}

function BookDetail({ book, onTagClick }) {
  const cover = getCover(book);
  return (
    <div className="lib-accordion__content">
      <div className="lib-book lib-book--lg">
        <div className="lib-book__cover" style={{ background: cover.bg }}>
          {book.image ? (
            <img src={book.image} alt={book.title} className="lib-book__img" loading="lazy" />
          ) : (
            <div className="lib-book__text" style={{ color: cover.text }}>
              <span className="lib-book__text-title">{book.title}</span>
              <span className="lib-book__text-author">{book.author || ''}</span>
            </div>
          )}
          <div className="lib-book__spine" />
          <div className="lib-book__shine" />
        </div>
      </div>
      <div className="lib-accordion__meta">
        <h2 className="lib-accordion__title">{book.title}</h2>
        {book.author && <p className="lib-accordion__author">{book.author}</p>}
        {book.year   && <p className="lib-accordion__year">{book.year}</p>}
        {book.tags.length > 0 && (
          <div className="lib-accordion__tags">
            {book.tags.map(t => (
              <button key={t} className="lib-accordion__tag" onClick={() => onTagClick?.(t)}>{t}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid card — shows cover + basic info, click to toggle
function BookCard({ book, isOpen, onToggle }) {
  const cover = getCover(book);
  return (
    <div
      className={`lib-card${isOpen ? ' is-open' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
    >
      <div className="lib-book">
        <div className="lib-book__cover" style={{ background: cover.bg }}>
          {book.image ? (
            <img src={book.image} alt={book.title} className="lib-book__img" loading="lazy" />
          ) : (
            <div className="lib-book__text" style={{ color: cover.text }}>
              <span className="lib-book__text-title">{book.title}</span>
              <span className="lib-book__text-author">{book.author || ''}</span>
            </div>
          )}
          <div className="lib-book__spine" />
          <div className="lib-book__shine" />
        </div>
      </div>
      <div className="lib-card__info">
        <h4 className="lib-card__title">{book.title}</h4>
        <p className="lib-card__author">{book.author || <em>—</em>}</p>
        {book.year && <p className="lib-card__year">{book.year}</p>}
      </div>
    </div>
  );
}

// List row — opens orange side panel (no accordion)
function LibRow({ book, isOpen, onToggle }) {
  return (
    <li className={`lib-row${isOpen ? ' is-open' : ''}`}>
      <button className="lib-row__trigger" onClick={onToggle}>
        <span className="lib-row__title">{book.title}</span>
        <span className="lib-row__author">{book.author || '—'}</span>
        <span className="lib-row__year">{book.year || '—'}</span>
        <span className="lib-row__tags">
          {book.tags.slice(0, 3).map(t => {
            const c = TAG_COVERS[t];
            return <span key={t} className="lib-row__tag-chip" style={{ background: c?.bg || '#404040', color: c?.text || '#fff' }}>{t}</span>;
          })}
          {book.tags.length > 3 && <span className="lib-row__tag-more">+{book.tags.length - 3}</span>}
        </span>
      </button>
    </li>
  );
}

export default function LibraryIsland() {
  const [library, setLibrary]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTags, setActiveTags]   = useState([]);
  const [showTags, setShowTags]       = useState(false);
  const [viewMode, setViewMode]       = useState('grid');
  const [openId, setOpenId]           = useState(null);
  const [sort, setSort]               = useState('title');
  const [sortDir, setSortDir]         = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.maxHeight = showTags ? '600px' : '0';
    panel.style.opacity   = showTags ? '1' : '0';
  }, [showTags]);


  useEffect(() => {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(csv => {
        const rows = csv.split('\n').slice(1);
        const books = rows
          .filter(row => row.trim())
          .map((row, i) => {
            const cols = parseRow(row);
            const c = n => cols[n]?.trim() || null;
            return {
              id: i + 1,
              title: (c(0) || '').split(/\s*:\s*/)[0].trim(),
              author: c(1),
              year: c(2),
              tags: (c(3) || '').split(/[,;]/).map(t => t.trim()).filter(Boolean),
              image: toThumb(c(4)),
            };
          })
          .filter(b => b.title);
        setLibrary(books);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let books = library;
    if (activeTags.length > 0) {
      books = books.filter(b => b.tags.some(t => activeTags.includes(t)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q)
      );
    }
    return [...books].sort((a, b) => {
      let av, bv;
      if (sort === 'year') {
        av = parseInt(a.year) || 0;
        bv = parseInt(b.year) || 0;
        return (av - bv) * sortDir;
      }
      if (sort === 'tags') {
        av = (a.tags[0] || '').toLowerCase();
        bv = (b.tags[0] || '').toLowerCase();
      } else {
        av = (a[sort] || '').toLowerCase();
        bv = (b[sort] || '').toLowerCase();
      }
      return av.localeCompare(bv, 'cs') * sortDir;
    });
  }, [activeTags, library, sort, sortDir]);

  function cycleSort(col) {
    if (sort === col) setSortDir(d => d * -1);
    else { setSort(col); setSortDir(1); }
  }

  function toggleTag(tag) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleBook(id) {
    setOpenId(prev => prev === id ? null : id);
  }

  function onTagClick(tag) {
    setOpenId(null);
    setActiveTags([tag]);
  }

  const openBook = filtered.find(b => b.id === openId) || null;

  if (loading) return <div className="lib-loading">Loading…</div>;

  return (
    <div className="lib-layout">
      <div className="lib-main">

        <header className="lib-toolbar">
          <button className="lib-filter-btn" onClick={() => setShowTags(f => !f)} aria-pressed={showTags}>
            <span className="lib-filter-btn__label">Tags</span>
            {activeTags.length > 0 && <span className="tf-tag-count">{activeTags.length}</span>}
          </button>

          <div className="tf-sort">
            <input
              className="lib-search-input"
              type="search"
              placeholder="Search…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            <span className="tf-sort__divider" />
            {[['title','Title'],['author','Author']].map(([col, label]) => (
              <button key={col} aria-pressed={sort === col} onClick={() => cycleSort(col)}>
                {label}{sort === col ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
            <span className="tf-sort__divider" />
            <button aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}>Grid</button>
            <button aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>List</button>
          </div>
        </header>

        {/* Tags panel — slides down under toolbar */}
        <div ref={panelRef} className="tf-tags-panel" style={{ maxHeight: 0, opacity: 0, overflow: 'hidden', transition: 'max-height 400ms var(--ease), opacity 280ms var(--ease)' }}>
          <div className="tf-tags-panel__inner">
            <div className="tf-tags-panel__chips">
              {ALL_TAGS.map(tag => (
                <button key={tag} className={`tf-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
            </div>
            {activeTags.length > 0 && (
              <button className="tf-tag-clear" onClick={() => setActiveTags([])}>Clear</button>
            )}
          </div>
        </div>

        <div className="lib-scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">Nothing found.</div>
          ) : viewMode === 'grid' ? (
            <div className="lib-grid">
              {filtered.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  isOpen={openId === book.id}
                  onToggle={() => toggleBook(book.id)}
                />
              ))}
            </div>
          ) : (
            <div className="lib-list-wrap">
              <div className="lib-list-header">
                {[['title','Title'],['author','Author'],['year','Year'],['tags','Tags']].map(([col, label]) => (
                  <button key={col} className={`lib-list-header__col${sort === col ? ' is-active' : ''}`} onClick={() => cycleSort(col)}>
                    {label}{sort === col ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
                  </button>
                ))}
              </div>
              <ul className="lib-list">
                {filtered.map(book => (
                  <LibRow
                    key={book.id}
                    book={book}
                    isOpen={openId === book.id}
                    onToggle={() => toggleBook(book.id)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Right detail panel (orange, same as store) ── */}
      <aside className={`lib-detail${openBook ? ' is-open' : ''}`}>
        <div className="lib-detail__inner">
          <button className="lib-detail__close" onClick={() => setOpenId(null)} aria-label="Close">
            <ChevronLeftIcon />
          </button>
          <div className="lib-detail__scroll">
            {openBook && <BookDetail book={openBook} onTagClick={onTagClick} />}
          </div>
          <div className="lib-detail__footer">UMPRUM Type × 2026</div>
        </div>
      </aside>

    </div>
  );
}
