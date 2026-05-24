import { useState, useMemo, useEffect, useRef } from 'react';
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
  const panelRef = useRef(null);

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

  function toggleTag(tag) {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleSlug(slug) {
    setOpenSlug(prev => prev === slug ? null : slug);
  }

  return (
    <div className="lib-layout">
      <div className="lib-main">

        <header className="lib-toolbar">
          <div className="tf-sort">
            <button
              aria-pressed={showTags}
              onClick={() => setShowTags(f => !f)}
            >
              Tags{activeTags.length > 0 && <span className="tf-tag-count">{activeTags.length}</span>}
            </button>
          </div>

          <div className="tf-sort">
            {SORTS.map(s => (
              <button
                key={s.key}
                aria-pressed={sort === s.key}
                onClick={() => { setSort(s.key); if (s.key === 'shuffle') setShuffleSeed(n => n + 1); }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span className="lib-toolbar-count">
            {filtered.length}{filtered.length < typefaces.length ? ` of ${typefaces.length}` : ''} typefaces
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
            <div className="tf-tags-panel__actions">
              {activeTags.length > 0 && (
                <button className="tf-tags-clear" onClick={() => setActiveTags([])}>
                  Clear
                </button>
              )}
              <button
                className="tf-tags-close"
                onClick={() => setShowTags(false)}
                aria-label="Close tags"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="lib-scroll tf-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No typefaces match.</div>
          ) : (
            <>
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
