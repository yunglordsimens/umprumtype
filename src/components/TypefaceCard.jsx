import { useRef, useState, useEffect } from 'react';

const SIZE_STEPS = [12, 16, 22, 32, 48, 72, 96, 144, 200];

function nearest(val, steps) {
  return steps.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a));
}

const autoCols = (s) => s <= 32 ? 3 : s <= 56 ? 2 : 1;

function lineHeightFor(size) {
  return size > 96 ? 0.95 : size > 48 ? 1.1 : size > 24 ? 1.3 : 1.5;
}

function VariantWindow({ variant, fam, size, cols, baseText, isLarge, fixedHeight, showLabel }) {
  const ref = useRef(null);
  const lh = lineHeightFor(size);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = (baseText + ' ').repeat(50).trim();
    }
  }, []);

  return (
    <div className="specimen__variant-window">
      {showLabel && (
        <div className="specimen__variant-label">{variant.variantName || 'Regular'}</div>
      )}
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
          lineHeight: lh,
          padding: 0,
          ...(isLarge ? {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            height: `${Math.round(size * lh)}px`,
            columnCount: 1,
          } : {
            overflow: 'hidden',
            height: `${fixedHeight}px`,
            columnCount: cols,
            columnGap: '1em',
            wordBreak: 'break-word',
            hyphens: 'auto',
          }),
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
  const initialSizePx = Math.round((parseFloat(tf.mainSize) || 6) * 16);

  const [size, setSize] = useState(nearest(Math.max(72, initialSizePx), SIZE_STEPS));
  const [manualCols, setManualCols] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const panelRef = useRef(null);

  const cols = manualCols ?? autoCols(size);
  const isLarge = size >= 144;
  const fam = tf.title.replace(/"/g, '\\"');
  const current = tf.otfVariants[clampedIdx] ?? null;

  // Fixed height derived from initial size — stays constant regardless of slider
  const lhInitial = lineHeightFor(Math.max(72, initialSizePx));
  const fixedHeight = Math.max(160, Math.round(Math.max(72, initialSizePx) * lhInitial * 3));

  function changeSize(val) {
    setSize(val);
    setManualCols(null);
  }

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
  }, [size, cols, isOpen, resetKey]);

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
          <div className="tfa-panel__cols">

            {/* LEFT: tester */}
            <div className="tfa-panel__tester">
              <div className="specimen__controls">

                <div className="specimen__group">
                  <input
                    type="range" min="8" max="240" step="1" value={size}
                    onChange={e => changeSize(+e.target.value)}
                  />
                  <span className="specimen__value">{size}px</span>
                  <div className="specimen__presets">
                    {SIZE_STEPS.map(p => (
                      <button
                        key={p}
                        className={p === size ? 'is-active' : ''}
                        onClick={() => changeSize(p)}
                      >{p}</button>
                    ))}
                  </div>
                </div>

                <div className="specimen__group">
                  {[1, 2, 3].map(c => (
                    <button
                      key={c}
                      className={cols === c ? 'is-active' : ''}
                      onClick={() => setManualCols(c)}
                    >{c}</button>
                  ))}
                </div>

                <div className="specimen__group">
                  <button
                    className="specimen__reset"
                    title="Reset text"
                    onClick={() => setResetKey(k => k + 1)}
                  >↺</button>
                </div>

              </div>

              {tf.otfVariants.map((variant, i) => {
                const baseText = tf.styleTexts[i] || tf.styleTexts[0] || tf.mainText || tf.title;
                return (
                  <VariantWindow
                    key={`${i}-${resetKey}`}
                    variant={variant}
                    fam={fam}
                    size={size}
                    cols={cols}
                    baseText={baseText}
                    isLarge={isLarge}
                    fixedHeight={fixedHeight}
                    showLabel={tf.otfVariants.length > 1}
                  />
                );
              })}
            </div>

            {/* RIGHT: info */}
            <div className="tfa-panel__info">
              {tf.tags && tf.tags.length > 0 && (
                <div className="tfa-info__tags">
                  {tf.tags.map(tag => (
                    <button
                      key={tag}
                      className="tfa-info__tag"
                      onClick={() => onTagClick?.(tag)}
                    >{tag}</button>
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

          </div>
        </div>
      </div>
    </li>
  );
}
