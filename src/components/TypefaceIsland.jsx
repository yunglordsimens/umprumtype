import { useState, useMemo } from 'react';
import FilterPanel from './FilterPanel.jsx';
import SearchBar from './SearchBar.jsx';
import TypefaceCard from './TypefaceCard.jsx';

export default function TypefaceIsland({ typefaces }) {
  const [activeTags, setActiveTags] = useState([]);
  const [search,     setSearch]     = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [openSlug,   setOpenSlug]   = useState(null);

  const allTags = useMemo(
    () => [...new Set(typefaces.flatMap(t => t.tags ?? []))].sort(),
    [typefaces]
  );

  const filtered = useMemo(() => {
    let list = typefaces;
    if (activeTags.length > 0) {
      list = list.filter(t => (t.tags ?? []).some(tag => activeTags.includes(tag)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.designer && t.designer.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeTags, search, typefaces]);

  function toggleSlug(slug) {
    setOpenSlug(prev => (prev === slug ? null : slug));
  }

  return (
    <div className="archive-layout">
      {allTags.length > 0 && (
        <FilterPanel
          allTags={allTags}
          activeTags={activeTags}
          onToggle={tag =>
            setActiveTags(prev =>
              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            )
          }
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="archive-main">
        <div className="archive-main__toolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search typefaces…"
          />
          {!showFilters && allTags.length > 0 && (
            <button
              className="archive-main__filters-btn"
              onClick={() => setShowFilters(true)}
            >
              Filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="archive-empty muted">No typefaces match.</p>
        ) : (
          <ul className="tfa-list">
            {filtered.map(tf => (
              <TypefaceCard
                key={tf.slug}
                tf={tf}
                isOpen={openSlug === tf.slug}
                onOpen={() => toggleSlug(tf.slug)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
