import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import TypefaceCard from './TypefaceCard.jsx';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SORTS = [
  { key: 'name',     label: 'Name' },
  { key: 'year',     label: 'Year' },
  { key: 'designer', label: 'Author' },
  { key: 'shuffle',  label: 'Shuffle' },
];

function effectiveTags(tf) {
  if (tf.tags && tf.tags.length > 0) return tf.tags;
  const out = [];
  if (tf.year) out.push(String(tf.year));
  if (tf.designer && tf.designer !== 'Unknown') out.push(tf.designer);
  return out;
}

export default function TypefaceIsland({ typefaces }) {
  const [activeTags, setActiveTags] = useState([]);
  const [showTags, setShowTags]     = useState(false);
  const [openSlug, setOpenSlug]     = useState(null);
  const [sort, setSort]             = useState('name');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const panelRef  = useRef(null);
  const listRef   = useRef(null);
  const flipSnap  = useRef(new Map());
  const prevKeys  = useRef(new Set());

  function captureFlip() {
    const ul = listRef.current;
    if (!ul) return;
    flipSnap.current.clear();
    for (const el of ul.children) {
      if (el.id) flipSnap.current.set(el.id, el.getBoundingClientRect().top);
    }
  }

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    setOpenSlug(hash);
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Flat ordered tag list: classification → authors → years
  const allTagsOrdered = useMemo(() => {
    const classTags  = [...new Set(typefaces.flatMap(tf => tf.tags ?? []))].sort();
    const authorTags = [...new Set(typefaces.map(tf => tf.designer).filter(d => d && d !== 'Unknown'))].sort((a, b) => a.localeCompare(b, 'cs'));
    const yearTags   = [...new Set(typefaces.map(tf => tf.year).filter(Boolean))].sort((a, b) => b - a).map(String);
    return [...classTags, ...authorTags, ...yearTags];
  }, [typefaces]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.maxHeight = showTags ? '1000px' : '0';
    panel.style.opacity   = showTags ? '1' : '0';
  }, [showTags]);

  const filtered = useMemo(() => {
    let list = typefaces;
    if (activeTags.length > 0) {
      list = list.filter(tf => activeTags.some(tag => effectiveTags(tf).includes(tag)));
    }
    const out = [...list];
    if (sort === 'year') {
      out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else if (sort === 'designer') {
      out.sort((a, b) => (a.designer ?? '').localeCompare(b.designer ?? '', 'cs'));
    } else if (sort === 'shuffle') {
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
    } else {
      out.sort((a, b) => a.title.localeCompare(b.title, 'cs'));
    }
    return out;
  }, [activeTags, sort, shuffleSeed, typefaces]);

  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const newKeys = new Set();
    for (const el of ul.children) {
      if (!el.id) continue;
      newKeys.add(el.id);
      const oldTop = flipSnap.current.get(el.id);
      const isNew  = prevKeys.current.size > 0 && !prevKeys.current.has(el.id);
      if (isNew) {
        el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'opacity 220ms ease, transform 220ms ease';
          el.style.opacity = ''; el.style.transform = '';
        }));
      } else if (oldTop !== undefined) {
        const dy = oldTop - el.getBoundingClientRect().top;
        if (Math.abs(dy) > 0.5) {
          el.style.transform = `translateY(${dy}px)`; el.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transition = 'transform 380ms cubic-bezier(0.16,1,0.3,1)';
            el.style.transform = '';
          }));
        }
      }
    }
    prevKeys.current = newKeys;
    flipSnap.current.clear();
  }, [filtered]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTag(tag) {
    captureFlip();
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleSlug(slug) {
    setOpenSlug(prev => prev === slug ? null : slug);
  }

  return (
    <div className="lib-layout">
      <div className="lib-main">

        <header className="lib-toolbar">
          <button className="lib-filter-btn" onClick={() => setShowTags(f => !f)} aria-pressed={showTags}>
            <span className="lib-filter-btn__label">Tags</span>
            {activeTags.length > 0 && <span className="tf-tag-count">{activeTags.length}</span>}
          </button>

          <div className="tf-sort">
            {SORTS.map(s => (
              <button
                key={s.key}
                aria-pressed={sort === s.key}
                onClick={() => { captureFlip(); setSort(s.key); if (s.key === 'shuffle') setShuffleSeed(n => n + 1); }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span className="lib-toolbar-count">
            {filtered.length < typefaces.length ? `${filtered.length} of ${typefaces.length}` : filtered.length}
          </span>
        </header>

        {/* Tags panel — slides down under toolbar */}
        <div
          ref={panelRef}
          className="tf-tags-panel"
          style={{ maxHeight: 0, opacity: 0, overflow: 'hidden',
            transition: 'max-height 400ms var(--ease), opacity 280ms var(--ease)' }}
        >
          <div className="tf-tags-panel__inner">
            <div className="tf-tags-panel__actions">
              {activeTags.length > 0 && (
                <button className="tf-tags-clear" onClick={() => { captureFlip(); setActiveTags([]); }}>Clear</button>
              )}
              <button className="tf-tags-close" onClick={() => setShowTags(false)} aria-label="Close tags">
                <CloseIcon />
              </button>
            </div>
            <div className="tf-tags-panel__chips">
              {allTagsOrdered.map(tag => (
                <button
                  key={tag}
                  className={`tf-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lib-scroll tf-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No typefaces match.</div>
          ) : (
            <>
              <ul ref={listRef} className="tfa-list">
                {filtered.map(tf => (
                  <TypefaceCard
                    key={tf.slug}
                    tf={tf}
                    isOpen={openSlug === tf.slug}
                    onOpen={() => toggleSlug(tf.slug)}
                    onTagClick={tag => { captureFlip(); setOpenSlug(null); setActiveTags([tag]); }}
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
