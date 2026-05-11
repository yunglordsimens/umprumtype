import { useEffect } from 'react';

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function DetailPanel({ children, onClose, isOpen = false, variant = '' }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const cls = [
    'detail-panel',
    variant && `detail-panel--${variant}`,
    isOpen  && 'is-open',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={`detail-panel-backdrop${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={cls} aria-modal="true" role="dialog">
        <button className="detail-panel__close" onClick={onClose} aria-label="Back">
          <ChevronLeft />
        </button>

        <div className="detail-panel__scroll">
          <div className="detail-panel__body">
            <span className="detail-panel__label">Details</span>
            {children}
          </div>
          <div className="detail-panel__footer">
            UMPRUM Type Library × 2026
          </div>
        </div>
      </aside>
    </>
  );
}
