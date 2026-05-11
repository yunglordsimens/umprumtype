import { useState } from 'react';

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
        {open && (
          <span className="filter-panel__close-icon" aria-hidden="true">
            <CloseIcon />
          </span>
        )}
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
