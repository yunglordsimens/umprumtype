import { Fragment, useState, useMemo, useEffect, useRef } from 'react';
import TagsPill from './TagsPill.jsx';
import { useSiteSearch, matchesQuery } from '../lib/siteSearch.js';

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

// Column lookup by header name, so added/reordered sheet columns keep working.
// Falls back to the original fixed order: NAME, AUTHOR, YEAR, TAGS, IMAGE.
const COLUMN_ALIASES = {
  title:     ['name', 'title', 'název', 'nazev'],
  author:    ['author', 'authors', 'autor'],
  year:      ['year', 'rok'],
  tags:      ['tags', 'tag'],
  image:     ['image', 'img', 'cover', 'obrázek', 'obrazek'],
  publisher: ['publisher', 'published by', 'vydavatel', 'vydavatelství', 'vydavatelstvi', 'nakladatel', 'nakladatelství'],
};
const DEFAULT_COLUMNS = { title: 0, author: 1, year: 2, tags: 3, image: 4, publisher: -1 };

function columnMap(headerRow) {
  const header = parseRow(headerRow || '').map(h => h.trim().toLowerCase());
  const map = {};
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = header.findIndex(h => aliases.includes(h));
    map[key] = idx >= 0 ? idx : DEFAULT_COLUMNS[key];
  }
  return map;
}

// Covers live on Google Drive. They're requested at the size they're shown
// (grid ~140px, detail ~220px — doubled for retina) straight from Google's
// image server, which skips the redirect behind drive.google.com/thumbnail.
// If that address ever fails, CoverImg falls back to the thumbnail URL.
const COVER_GRID_W   = 300;
const COVER_DETAIL_W = 500;

function driveId(url) {
  const m = url?.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url?.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : null;
}

function toImage(url) {
  if (!url) return null;
  const id = driveId(url);
  if (id) return { driveId: id };
  return url.startsWith('http') ? { src: url } : null;
}

function coverUrls(image, width) {
  if (image.driveId) {
    return [
      `https://lh3.googleusercontent.com/d/${image.driveId}=w${width}`,
      `https://drive.google.com/thumbnail?id=${image.driveId}&sz=w${width}`,
    ];
  }
  return [image.src];
}

function CoverImg({ image, width, alt, className }) {
  const urls = coverUrls(image, width);
  const [i, setI] = useState(0);
  return (
    <img
      src={urls[i]}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => { if (i < urls.length - 1) setI(i + 1); }}
    />
  );
}

// Enlarged cover + metadata: tags first, then title, author, year and
// publisher stacked, all at one text size (like the typeface detail)
function BookDetail({ book, onTagClick, onClose }) {
  const hasImage = !!book.image;
  return (
    <div className="lib-accordion__inner">
      <div className="lib-accordion__cover">
        {hasImage ? (
          <CoverImg image={book.image} width={COVER_DETAIL_W} alt={book.title} className="lib-accordion__img" />
        ) : (
          <div className="lib-accordion__cover-default" aria-hidden="true" />
        )}
      </div>
      <div className="lib-accordion__meta">
        {book.tags.length > 0 && (
          <div className="lib-accordion__tags">
            {book.tags.map(t => (
              <button
                key={t}
                className="tfa-info__tag"
                onClick={(e) => { e.stopPropagation(); onTagClick?.(t); }}
              >{t}</button>
            ))}
          </div>
        )}
        <dl className="lib-accordion__fields">
          <dt>Title</dt><dd className="lib-accordion__title">{book.title}</dd>
          {book.author    && <><dt>Author</dt><dd>{book.author}</dd></>}
          {book.year      && <><dt>Year</dt><dd>{book.year}</dd></>}
          {book.publisher && <><dt>Publisher</dt><dd>{book.publisher}</dd></>}
        </dl>
      </div>
      <button className="lib-accordion__close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

// Grid card — cover + title only; author/year live in the detail
function BookCard({ book, isOpen, onToggle }) {
  const hasImage = !!book.image;
  return (
    <div
      className={`lib-card${isOpen ? ' is-open' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
    >
      <div className="lib-book">
        <div className={`lib-book__cover${hasImage ? '' : ' lib-book__cover--default'}`}>
          {hasImage && (
            <CoverImg image={book.image} width={COVER_GRID_W} alt={book.title} className="lib-book__img" />
          )}
          {hasImage && <div className="lib-book__spine" />}
          {hasImage && <div className="lib-book__shine" />}
        </div>
      </div>
      <div className="lib-card__info">
        <h4 className="lib-card__title">{book.title}</h4>
      </div>
    </div>
  );
}

// List row — accordion (detail opens inline under the row)
function LibRow({ book, isOpen, onToggle, onTagClick }) {
  return (
    <li className={`lib-row${isOpen ? ' is-open' : ''}`}>
      <button className="lib-row__trigger" onClick={onToggle}>
        <span className="lib-row__title">{book.title}</span>
        <span className="lib-row__author">{book.author || '—'}</span>
        <span className="lib-row__year">{book.year || '—'}</span>
      </button>
      {isOpen && (
        <div className="lib-row__panel">
          <BookDetail book={book} onTagClick={onTagClick} onClose={onToggle} />
        </div>
      )}
    </li>
  );
}

export default function LibraryIsland() {
  const [library, setLibrary]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTags, setActiveTags]   = useState([]);
  const [showTags, setShowTags]       = useState(false);
  // List by default so covers are only loaded when someone asks for the grid
  const [viewMode, setViewMode]       = useState('list');
  const [openId, setOpenId]           = useState(null);
  const [sort, setSort]               = useState('title');
  const [sortDir, setSortDir]         = useState(1);
  const searchQuery = useSiteSearch();
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
        const [headerRow, ...rows] = csv.split('\n');
        const col = columnMap(headerRow);
        const books = rows
          .filter(row => row.trim())
          .map((row, i) => {
            const cols = parseRow(row);
            const c = key => (col[key] >= 0 ? cols[col[key]]?.trim() : null) || null;
            return {
              id: i + 1,
              title: (c('title') || '').split(/\s*:\s*/)[0].trim(),
              author: c('author'),
              year: c('year'),
              publisher: c('publisher'),
              tags: (c('tags') || '').split(/[,;]/).map(t => t.trim()).filter(Boolean),
              image: toImage(c('image')),
            };
          })
          .filter(b => b.title);
        setLibrary(books);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Tags come from the sheet itself, so edits to the table show up here too
  const allTags = useMemo(
    () => [...new Set(library.flatMap(b => b.tags))].sort((a, b) => a.localeCompare(b, 'cs')),
    [library]
  );

  const filtered = useMemo(() => {
    let books = library;
    if (activeTags.length > 0) {
      books = books.filter(b => b.tags.some(t => activeTags.includes(t)));
    }
    if (searchQuery.trim()) {
      books = books.filter(b => matchesQuery(searchQuery, [b.title, b.author, b.year, b.publisher, ...b.tags]));
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
  }, [activeTags, library, sort, sortDir, searchQuery]);

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

  if (loading) return <div className="lib-loading">Loading…</div>;

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
            {[['title','Title'],['author','Author'],['year','Year']].map(([col, label]) => (
              <button key={col} className="tf-cap" aria-pressed={sort === col} onClick={() => cycleSort(col)}>
                <span>{label}</span>
                {sort === col && <span className="tf-cap__arrow">{sortDir === 1 ? '↑' : '↓'}</span>}
              </button>
            ))}
            <span className="tf-sort__divider" />
            <button aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>List</button>
            <button aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}>Grid</button>
          </div>
          <span className="lib-toolbar-count">
            {filtered.length < library.length ? `${filtered.length} of ${library.length}` : filtered.length}
          </span>
        </header>

        {/* Tags panel — slides down under toolbar */}
        <div ref={panelRef} className="tf-tags-panel" style={{ maxHeight: 0, opacity: 0, overflow: 'hidden', transition: 'max-height 400ms var(--ease), opacity 280ms var(--ease)' }}>
          <div className="tf-tags-panel__inner">
            <div className="tf-tags-panel__chips">
              {allTags.map(tag => (
                <button key={tag} className={`tf-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        <div className={`lib-scroll${viewMode === 'list' ? ' lib-scroll--list' : ''}`}>
          {filtered.length === 0 ? (
            <div className="lib-empty">Nothing found.</div>
          ) : viewMode === 'grid' ? (
            <div className="lib-grid">
              {filtered.map(book => (
                <Fragment key={book.id}>
                  <BookCard
                    book={book}
                    isOpen={openId === book.id}
                    onToggle={() => toggleBook(book.id)}
                  />
                  {openId === book.id && (
                    <div className="lib-grid-accordion">
                      <BookDetail book={book} onTagClick={onTagClick} onClose={() => setOpenId(null)} />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="lib-list-wrap">
              <div className="lib-list-header">
                {[['title','Title'],['author','Author'],['year','Year']].map(([col, label]) => (
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
                    onTagClick={onTagClick}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
