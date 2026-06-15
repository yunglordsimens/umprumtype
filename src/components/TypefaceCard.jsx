import { useRef, useState, useEffect } from 'react';

function lineHeightFor(size) {
  return size > 96 ? 0.9 : size > 48 ? 1.05 : size > 24 ? 1.3 : 1.5;
}

function VariantSpecimen({ variant, fam, initialSize, baseText, showLabel }) {
  const [size, setSize] = useState(initialSize);
  const ref = useRef(null);

  // Set text only once on mount — never overwrite user edits
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = (baseText + ' ').repeat(12).trim();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = size > 80 ? 1 : size > 40 ? 2 : 3;
  const multiLine = cols > 1;

  return (
    <div className="tfa-specimen">
      <div className="tfa-specimen__header">
        <input
          type="range" min="8" max="240" step="1" value={size}
          onChange={e => setSize(+e.target.value)}
          className="tfa-specimen__slider"
          aria-label="Font size"
        />
        <span className="tfa-specimen__label">{showLabel ? (variant.variantName || 'Regular') : ''}</span>
        <span className="tfa-specimen__value">{size}px</span>
      </div>
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
          columnCount: cols,
          columnGap: '1em',
          whiteSpace: multiLine ? 'normal' : 'nowrap',
          overflowX: multiLine ? 'hidden' : 'auto',
          overflowY: multiLine ? 'hidden' : 'hidden',
          height: multiLine ? '450px' : undefined,
          display: 'block',
          outline: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
      />
    </div>
  );
}

export default function TypefaceCard({ tf, isOpen, onOpen, onTagClick }) {
  const clampedIdx = Math.min(
    Math.max(0, tf.mainStyleNo),
    Math.max(0, tf.otfVariants.length - 1)
  );
  const initialSizePx = Math.max(16, Math.round((parseFloat(tf.styleSize) || 4) * 16));

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
      const onEnd = () => { panel.style.maxHeight = 'none'; };
      panel.addEventListener('transitionend', onEnd, { once: true });
      return () => panel.removeEventListener('transitionend', onEnd);
    } else {
      if (panel.style.maxHeight === 'none') {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        panel.getBoundingClientRect(); // force reflow before animating
      }
      panel.style.maxHeight = '0';
      panel.style.opacity = '0';
      panel.style.transform = 'scaleY(0.96)';
    }
  }, [isOpen]);

  return (
    <li className="tfa-item" id={tf.slug}>
      <button
        className={`tfa-trigger${isOpen ? ' is-open' : ''}`}
        onClick={onOpen}
        aria-expanded={isOpen}
      >
        <span className="tfa-trigger__meta-inline">
          <span className="tfa-trigger__meta-name">{tf.title}</span>
          <span className="tfa-trigger__meta-byline">
            {tf.designer && <span className="tfa-trigger__meta-designer">{tf.designer}</span>}
            {tf.year && <span className="tfa-trigger__meta-year">{tf.year}</span>}
          </span>
        </span>
        <span
          className="tfa-trigger__preview"
          style={{
            fontFamily: `"${fam}", var(--font-ui)`,
            fontWeight: current?.weight || 400,
            fontStyle: current?.style || 'normal',
            fontSize: tf.mainSize || '6em',
          }}
        >
          {tf.styleTexts[0] || tf.mainText || tf.title}
        </span>
      </button>

      <div ref={panelRef} className="tfa-panel" aria-hidden={!isOpen}>
        <div className="tfa-panel__inner">
          <div className="tfa-specimens">
            {tf.otfVariants.map((v, i) => (
              <VariantSpecimen
                key={i}
                variant={v}
                fam={fam}
                initialSize={initialSizePx}
                baseText={tf.styleTexts[i] || tf.styleTexts[0] || tf.mainText || tf.title}
                showLabel={tf.otfVariants.length > 1}
              />
            ))}
          </div>

          {(tf.tags?.length > 0 || tf.aboutFont || tf.aboutDesigner) && (
            <div className="tfa-panel__info">
              {tf.tags?.length > 0 && (
                <div className="tfa-info__tags">
                  {tf.tags.map(tag => (
                    <button key={tag} className="tfa-info__tag" onClick={() => onTagClick?.(tag)}>{tag}</button>
                  ))}
                </div>
              )}
              {tf.aboutFont && (
                <div className="tfa-about">
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
