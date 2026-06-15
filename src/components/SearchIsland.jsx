import { useState, useEffect, useRef, useCallback } from 'react';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TYPE_LABEL = { typeface: 'Typeface', journal: 'Journal', project: 'Project' };

function placeholderForPath(pathname) {
  if (!pathname || pathname === '/') return 'Global search';
  if (pathname.startsWith('/typefaces')) return 'Search typeface';
  if (pathname.startsWith('/library'))   return 'Search in library';
  if (pathname.startsWith('/projects'))  return 'Search projects';
  if (pathname.startsWith('/journal'))   return 'Search journal';
  if (pathname.startsWith('/store'))     return 'Search store';
  return 'Global search';
}

export default function SearchIsland() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [index, setIndex]       = useState(null);
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [placeholder, setPlaceholder] = useState('Global search');
  const inputRef = useRef(null);
  const dropRef  = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => {
    setPlaceholder(placeholderForPath(window.location.pathname));
  }, []);

  const loadIndex = useCallback(async () => {
    if (index) return index;
    const data = await fetch('/search.json').then(r => r.json());
    setIndex(data);
    return data;
  }, [index]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setOpen(false); return; }
    loadIndex().then(data => {
      const filtered = data
        .filter(item =>
          item.title.toLowerCase().includes(q) ||
          item.sub.toLowerCase().includes(q)
        )
        .slice(0, 10);
      setResults(filtered);
      setOpen(filtered.length > 0);
      setActiveIdx(-1);
    });
  }, [query]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && activeIdx >= 0) { window.location.href = results[activeIdx].url; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, activeIdx]);

  useEffect(() => {
    const onOut = e => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  return (
    <div className={`site-search${open ? ' is-open' : ''}`} ref={wrapRef} role="search">
      <div className="site-search__wrap">
        <span className="site-search__icon" aria-hidden="true"><SearchIcon /></span>
        <input
          ref={inputRef}
          className="site-search__input"
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {query && (
          <button
            type="button"
            className="site-search__clear"
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>
      {open && (
        <ul ref={dropRef} className="site-search__dropdown" role="listbox">
          {results.map((item, i) => (
            <li key={item.url} role="option" aria-selected={i === activeIdx}>
              <a
                href={item.url}
                className={`site-search__result${i === activeIdx ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className="site-search__result-icon" aria-hidden="true"><SearchIcon /></span>
                <span className="site-search__result-title" title={item.title}>{item.title}</span>
                <span className="site-search__result-type">{TYPE_LABEL[item.type]}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
