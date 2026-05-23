import { useRef, useState, useEffect } from 'react';

function lineHeightFor(size) {
  return size > 96 ? 0.9 : size > 48 ? 1.05 : size > 24 ? 1.3 : 1.5;
}

function VariantWindow({ variant, fam, size, baseText }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = (baseText + ' ').repeat(20).trim();
    }
  }, [baseText]);

  return (
    <div
      ref={ref}
      className="specimen__text"
      contentEditable
      suppressContentEditableWarning
      spellCheck="false"
      style={{
        fontFamily: `"${fam}", var(--font-ui)`,
        fontSize: `${size}px`,
        fontWeight: variant.weight || 400,
        fontStyle: variant.style || 'normal',
        lineHeight: lineHeightFor(size),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        display: 'block',
      }}
    />
  );
}

export default function TypefaceCard({ tf, isOpen, onOpen, onTagClick }) {
  const clampedIdx = Math.min(
    Math.max(0, tf.mainStyleNo),
    Math.max(0, tf.otfVariants.length - 1)
  );
  const initialSizePx = Math.round((parseFloat(tf.mainSize) || 6) * 16);

  const [size, setSize] = useState(Math.max(72, initialSizePx));
  const panelRef = useRef(null);

  const fam = tf.title.replace(/"/g, '\\"');
  const current = tf.otfVariants[clampedIdx] ?? null;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (isOpen) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.opacity = '1';
      panel.style.transform = 'scaleY(1)';
    } else {
      panel.style.maxHeight = '0';
      panel.style.opacity = '0';
      panel.style.transform = 'scaleY(0.96)';
    }
  }, [isOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (panel && isOpen) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }, [size, isOpen]);

  return (
    <li className="tfa-item">
      <button
        className={`tfa-trigger${isOpen ? ' is-open' : ''}`}
        onClick={onOpen}
        aria-expanded={isOpen}
      >
        {tf.tags && tf.tags.length > 0 && (
          <span className="tfa-trigger__tags">{tf.tags.join(' · ')}</span>
        )}
        <span className="tfa-trigger__meta-inline">
          <span className="tfa-trigger__meta-name">{tf.title}</span>
          {tf.designer && <span className="tfa-trigger__meta-designer">{tf.designer}</span>}
          {tf.year && <span className="tfa-trigger__meta-year">{tf.year}</span>}
        </span>
        <span
          className="tfa-trigger__preview"
          style={{
            fontFamily: `"${fam}", var(--font-ui)`,
            fontWeight: current?.weight || 400,
            fontStyle: current?.style || 'normal',
          }}
        >
          {tf.styleTexts[0] || tf.mainText || tf.title}
        </span>
      </button>

      <div ref={panelRef} className="tfa-panel" aria-hidden={!isOpen}>
        <div className="tfa-panel__inner">

          {/* Size slider only */}
          <div className="specimen__controls">
            <input
              type="range" min="8" max="240" step="1" value={size}
              onChange={e => setSize(+e.target.value)}
            />
            <span className="specimen__value">{size} px</span>
          </div>

          {/* All variants stacked one below another */}
          <div className="tfa-specimens">
            {tf.otfVariants.map((v, i) => (
              <div key={i} className="tfa-specimen">
                {tf.otfVariants.length > 1 && v.variantName && (
                  <span className="tfa-specimen__label">{v.variantName}</span>
                )}
                <VariantWindow
                  variant={v}
                  fam={fam}
                  size={size}
                  baseText={tf.styleTexts[i] || tf.styleTexts[0] || tf.mainText || tf.title}
                />
              </div>
            ))}
          </div>

          {/* Tags + about below specimens */}
          {(tf.tags?.length > 0 || tf.aboutFont || tf.aboutDesigner) && (
            <div className="tfa-panel__info">
              {tf.tags && tf.tags.length > 0 && (
                <div className="tfa-info__tags">
                  {tf.tags.map(tag => (
                    <button key={tag} className="tfa-info__tag" onClick={() => onTagClick?.(tag)}>{tag}</button>
                  ))}
                </div>
              )}
              {tf.aboutFont && (
                <div className="tfa-about">
                  <h3>about</h3>
                  <p>{tf.aboutFont}</p>
                </div>
              )}
              {tf.aboutDesigner && (
                <div
                  className="tfa-about tfa-about--designer"
                  dangerouslySetInnerHTML={{ __html: tf.aboutDesigner }}
                />
              )}
            </div>
          )}

        </div>
      </div>
    </li>
  );
}
