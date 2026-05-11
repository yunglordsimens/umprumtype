import { useState } from 'react';

export default function FilterPanel({ allTags = [], activeTags = [], onToggle }) {
  const [open, setOpen] = useState(true);

  return (
    <aside className={`filter-panel${open ? ' is-open' : ''}`}>
      <button
        className="filter-panel__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>Filters</span>
        <span className="filter-panel__arrow" aria-hidden="true">{open ? '↑' : '↓'}</span>
      </button>

      <div className="filter-panel__body" aria-hidden={!open}>
        {allTags.map(tag => (
          <label key={tag} className="filter-panel__item">
            <input
              type="checkbox"
              checked={activeTags.includes(tag)}
              onChange={() => onToggle(tag)}
            />
            <span>{tag}</span>
          </label>
        ))}
        {allTags.length === 0 && (
          <p className="filter-panel__empty">No filters available</p>
        )}
      </div>
    </aside>
  );
}
