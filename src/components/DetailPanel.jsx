import { useEffect } from 'react';

export default function DetailPanel({ children, onClose, isOpen = false }) {
  // close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* backdrop */}
      <div
        className={`detail-panel-backdrop${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`detail-panel${isOpen ? ' is-open' : ''}`}
        aria-modal="true"
        role="dialog"
      >
        <div className="detail-panel__header">
          <button
            className="detail-panel__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>
        <div className="detail-panel__body">
          {children}
        </div>
      </aside>
    </>
  );
}
