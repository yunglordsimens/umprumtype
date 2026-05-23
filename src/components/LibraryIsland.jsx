import { useState, useMemo, useEffect, useRef } from 'react';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9pcn-Vt6gV9lCYZEK1Ly6ZKdEIYqN-VoIu9EkPqDqkFCAwT5R_eqaKz6priy-ixFZQWD3CtX263O_/pub?output=csv';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

function BookDetail({ book }) {
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
            {book.tags.map(t => <span key={t} className="lib-accordion__tag">{t}</span>)}
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

// List row — expandable accordion
function LibRow({ book, isOpen, onToggle }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.maxHeight = isOpen ? panel.scrollHeight + 'px' : '0';
  }, [isOpen]);

  return (
    <li className={`lib-row${isOpen ? ' is-open' : ''}`}>
      <button className="lib-row__trigger" onClick={onToggle}>
        <span className="lib-row__title">{book.title}</span>
        <span className="lib-row__author">{book.author || '—'}</span>
        <span className="lib-row__year">{book.year || '—'}</span>
        <span className="lib-row__tags">
          {book.tags.slice(0, 3).join(', ')}
          {book.tags.length > 3 && ` +${book.tags.length - 3}`}
        </span>
      </button>
      <div
        ref={panelRef}
        className="lib-row__panel"
        style={{ maxHeight: 0, overflow: 'hidden', transition: 'max-height 400ms cubic-bezier(0.16,1,0.3,1)' }}
      >
        <BookDetail book={book} />
      </div>
    </li>
  );
}

export default function LibraryIsland() {
  const [library, setLibrary]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTags, setActiveTags]   = useState([]);
  const [search, setSearch]           = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [newBook, setNewBook]         = useState({ title: '', author: '', year: '', tags: '' });
  const [viewMode, setViewMode]       = useState('grid');
  const [openId, setOpenId]           = useState(null);

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
              title: c(0) || '',
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
    if (search.trim()) {
      const q = search.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q))
      );
    }
    return books;
  }, [activeTags, search, library]);

  function toggleTag(tag) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleBook(id) {
    setOpenId(prev => prev === id ? null : id);
  }

  function addBook() {
    if (!newBook.title.trim()) return;
    const tags = newBook.tags.split(',').map(t => t.trim()).filter(Boolean);
    setLibrary(prev => [
      ...prev,
      { id: prev.length + 1, title: newBook.title, author: newBook.author || null, year: newBook.year || null, tags },
    ]);
    setNewBook({ title: '', author: '', year: '', tags: '' });
    setShowAdd(false);
  }

  const openBook = filtered.find(b => b.id === openId) || null;

  if (loading) return <div className="lib-loading">Loading…</div>;

  return (
    <div className="lib-layout">

      {/* ── Left filter panel ── */}
      <aside className={`lib-filter${showFilters ? ' is-open' : ''}`}>
        <div className="lib-filter__inner">
          <div className="lib-filter__head">
            <h2 className="lib-filter__title">Tags</h2>
            <button className="lib-filter__close" onClick={() => setShowFilters(false)} aria-label="Close tags">
              <CloseIcon />
            </button>
          </div>
          <div>
            <h3 className="lib-filter__section-title">Tags &amp; Categories</h3>
            <div className="lib-filter__tags">
              {ALL_TAGS.map(tag => {
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

      {/* ── Main area ── */}
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
                placeholder="Search titles, authors…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* View toggle */}
          <div className="lib-view-toggle">
            <button
              className={viewMode === 'grid' ? 'is-active' : ''}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
            >Grid</button>
            <button
              className={viewMode === 'list' ? 'is-active' : ''}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >List</button>
          </div>

          <div className="lib-right">
            <span className="lib-wordmark">UMPRUM Type Library</span>
            <button className="lib-add-btn" onClick={() => setShowAdd(true)}>
              <PlusIcon /><span>Add</span>
            </button>
          </div>
        </header>

        <div className="lib-scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">Nothing found.</div>
          ) : viewMode === 'grid' ? (
            <>
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
              {openBook && (
                <div className="lib-grid-accordion">
                  <BookDetail book={openBook} />
                </div>
              )}
            </>
          ) : (
            <div className="lib-list-wrap">
              <div className="lib-list-header">
                <span>Title</span>
                <span>Author</span>
                <span>Year</span>
                <span>Tags</span>
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
          <div className="lib-count">{filtered.length} of {library.length} books</div>
        </div>
      </div>

      {/* ── Add book modal ── */}
      {showAdd && (
        <div className="library-modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="library-modal" onClick={e => e.stopPropagation()}>
            <div className="library-modal__header">
              <h2>Add book</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Close"><CloseIcon /></button>
            </div>
            <div className="library-modal__fields">
              <label>Title *<input value={newBook.title} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))} placeholder="Book title" /></label>
              <label>Author<input value={newBook.author} onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))} placeholder="Author name" /></label>
              <label>Year<input value={newBook.year} onChange={e => setNewBook(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 2024" /></label>
              <label>Tags<input value={newBook.tags} onChange={e => setNewBook(p => ({ ...p, tags: e.target.value }))} placeholder="type, history, teorie" /></label>
            </div>
            <div className="library-modal__actions">
              <button onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="library-modal__submit" onClick={addBook}>Add book</button>
            </div>
            <p className="library-modal__note muted">Session-only — additions reset on reload.</p>
          </div>
        </div>
      )}
    </div>
  );
}
