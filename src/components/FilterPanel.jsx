const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function FilterPanel({ allTags = [], activeTags = [], onToggle, isOpen = true, onClose }) {
  return (
    <aside className={`filter-panel${isOpen ? ' is-open' : ''}`}>
      <div className="filter-panel__header">
        <span className="filter-panel__title">Filters</span>
        <button className="filter-panel__close" onClick={onClose} aria-label="Close filters">
          <CloseIcon />
        </button>
      </div>
      <div className="filter-panel__body">
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
