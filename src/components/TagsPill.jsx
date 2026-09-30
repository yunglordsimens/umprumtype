// Tags toggle for the section toolbars. Styled like the sort pills (Name,
// Author…): outlined by default, solid black while any tag is selected.
// While the panel is open or tags are selected it grows a ×, which clears
// the selection and closes the panel.
export default function TagsPill({ open, activeCount, onToggle, onClear }) {
  const active = activeCount > 0;
  return (
    <button
      type="button"
      className={`tf-cap tf-cap--tags${active ? ' is-active' : ''}${open ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-pressed={active}
    >
      <span>Tags</span>
      {(open || active) && (
        <span
          className="tf-cap__x"
          role="button"
          aria-label="Clear tags"
          onClick={e => { e.stopPropagation(); onClear(); }}
        >×</span>
      )}
    </button>
  );
}
