import { useState, useMemo, useEffect } from 'react';
import FilterPanel from './FilterPanel.jsx';
import SearchBar from './SearchBar.jsx';
import DetailPanel from './DetailPanel.jsx';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9pcn-Vt6gV9lCYZEK1Ly6ZKdEIYqN-VoIu9EkPqDqkFCAwT5R_eqaKz6priy-ixFZQWD3CtX263O_/pub?output=csv';

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

function BookCoverInner({ book, cover }) {
  return (
    <>
      {book.image ? (
        <img src={book.image} alt={book.title} loading="lazy" />
      ) : (
        <div className="book-cover__text" style={{ color: cover.text }}>
          <span className="book-cover__text-title">{book.title}</span>
          <span className="book-cover__text-author">{book.author || ''}</span>
        </div>
      )}
      <div className="book-cover__spine-shadow" />
      <div className="book-cover__spine-highlight" />
    </>
  );
}

function BookCard({ book, onClick }) {
  const cover = getCover(book);
  return (
    <div
      className="book-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div className="book-cover book-cover--sm" style={{ background: cover.bg }}>
        <BookCoverInner book={book} cover={cover} />
      </div>
      <div className="book-card__info">
        <h4 className="book-card__title">{book.title}</h4>
        <p className="book-card__author">{book.author || <em>—</em>}</p>
        {book.year && <p className="book-card__year">{book.year}</p>}
      </div>
    </div>
  );
}

function BookDetail({ book }) {
  if (!book) return null;
  const cover = getCover(book);
  return (
    <article className="book-detail">
      <div className="book-cover book-cover--lg" style={{ background: cover.bg }}>
        <BookCoverInner book={book} cover={cover} />
      </div>
      <div className="book-detail__meta">
        <h2 className="book-detail__title">{book.title}</h2>
        {book.author && <p className="book-detail__author">{book.author}</p>}
        {book.year   && <p className="book-detail__year">{book.year}</p>}
        {book.tags.length > 0 && (
          <ul className="book-detail__tags">
            {book.tags.map(t => (
              <li
                key={t}
                className="book-detail__tag"
                style={TAG_COVERS[t]
                  ? { background: TAG_COVERS[t].bg, color: TAG_COVERS[t].text, borderColor: 'transparent' }
                  : undefined
                }
              >{t}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function LibraryIsland() {
  const [library, setLibrary]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTags, setActiveTags]     = useState([]);
  const [search, setSearch]             = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [newBook, setNewBook]           = useState({ title: '', author: '', year: '', tags: '' });

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
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
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

  if (loading) return <p className="muted library-loading">Loading library…</p>;

  return (
    <>
      <div className="library-toolbar">
        <button className="library-add-btn" onClick={() => setShowAdd(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add book
        </button>
        <p className="library-count muted">{filtered.length} of {library.length}</p>
      </div>

      <div className="archive-layout">
        <FilterPanel allTags={ALL_TAGS} activeTags={activeTags} onToggle={toggleTag} />

        <div className="library-main">
          <div className="library-search">
            <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles, authors…" />
          </div>

          {filtered.length === 0 ? (
            <p className="muted library-empty">Nothing found.</p>
          ) : (
            <div className="library-grid">
              {filtered.map(book => (
                <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <DetailPanel isOpen={!!selectedBook} onClose={() => setSelectedBook(null)} variant="accent">
        <BookDetail book={selectedBook} />
      </DetailPanel>

      {showAdd && (
        <div className="library-modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="library-modal" onClick={e => e.stopPropagation()}>
            <div className="library-modal__header">
              <h2>Add book</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Close">×</button>
            </div>
            <div className="library-modal__fields">
              <label>
                Title *
                <input
                  value={newBook.title}
                  onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))}
                  placeholder="Book title"
                />
              </label>
              <label>
                Author
                <input
                  value={newBook.author}
                  onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))}
                  placeholder="Author name"
                />
              </label>
              <label>
                Year
                <input
                  value={newBook.year}
                  onChange={e => setNewBook(p => ({ ...p, year: e.target.value }))}
                  placeholder="e.g. 2024"
                />
              </label>
              <label>
                Tags
                <input
                  value={newBook.tags}
                  onChange={e => setNewBook(p => ({ ...p, tags: e.target.value }))}
                  placeholder="type, history, teorie"
                />
              </label>
            </div>
            <div className="library-modal__actions">
              <button onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="library-modal__submit" onClick={addBook}>Add book</button>
            </div>
            <p className="library-modal__note muted">Session-only — additions reset on reload.</p>
          </div>
        </div>
      )}
    </>
  );
}
