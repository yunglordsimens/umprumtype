import { useRef, useState, useEffect, useCallback } from 'react';

const SIZE_STEPS = [12, 16, 22, 32, 48, 72, 96, 144, 200];

function nearest(val, steps) {
  return steps.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a));
}

export default function TypefaceCard({ tf, isOpen, onOpen }) {
  const clampedIdx = Math.min(
    Math.max(0, tf.mainStyleNo),
    Math.max(0, tf.otfVariants.length - 1)
  );
  const defaultText = tf.styleTexts[clampedIdx] || tf.styleTexts[0] || tf.title;
  const initialSizePx = Math.round((parseFloat(tf.mainSize) || 6) * 16);

  const [size, setSize] = useState(nearest(Math.max(72, initialSizePx), SIZE_STEPS));
  const [variantIdx, setVariantIdx] = useState(clampedIdx);
  const [text, setText] = useState(defaultText);
  const textRef = useRef(null);
  const panelRef = useRef(null);

  const current = tf.otfVariants[variantIdx] ?? null;
  const fam = tf.title.replace(/"/g, '\\"');

  // sync contentEditable when text state changes externally
  useEffect(() => {
    if (textRef.current && textRef.current.textContent !== text) {
      textRef.current.textContent = text;
    }
  }, [text]);

  // animate panel height
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (isOpen) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.opacity = '1';
    } else {
      panel.style.maxHeight = '0';
      panel.style.opacity = '0';
    }
  }, [isOpen]);

  // re-measure panel when content changes (size slider, etc.)
  useEffect(() => {
    const panel = panelRef.current;
    if (panel && isOpen) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }, [size, variantIdx, isOpen]);

  function switchVariant(i) {
    setVariantIdx(i);
    if (tf.styleTexts[i]) setText(tf.styleTexts[i]);
  }

  const lh = size > 96 ? 0.95 : size > 48 ? 1.1 : size > 24 ? 1.3 : 1.5;

  return (
    <li className="tfa-item">
      <button
        className={`tfa-trigger${isOpen ? ' is-open' : ''}`}
        onClick={onOpen}
        aria-expanded={isOpen}
      >
        <span
          className="tfa-trigger__name"
          style={{
            fontFamily: `"${fam}", var(--font-ui)`,
            fontWeight: current?.weight || 400,
            fontStyle: current?.style || 'normal',
          }}
        >
          {tf.title}
        </span>
        <span className="tfa-trigger__meta">
          {tf.designer && <span className="tfa-trigger__designer">{tf.designer}</span>}
          {tf.year && <span className="tfa-trigger__year">{tf.year}</span>}
          <span className="tfa-trigger__arrow" aria-hidden="true">{isOpen ? '↑' : '↓'}</span>
        </span>
      </button>

      <div
        ref={panelRef}
        className="tfa-panel"
        aria-hidden={!isOpen}
      >
        <div className="tfa-panel__inner">

          {/* controls */}
          <div className="specimen__controls">
            <div className="specimen__group">
              <label>size</label>
              <input
                type="range" min="8" max="240" step="1" value={size}
                onChange={e => setSize(+e.target.value)}
              />
              <span className="specimen__value">{size}px</span>
              <div className="specimen__presets">
                {SIZE_STEPS.map(p => (
                  <button
                    key={p}
                    className={p === nearest(size, SIZE_STEPS) && SIZE_STEPS.includes(size) ? 'is-active' : ''}
                    onClick={() => setSize(p)}
                  >{p}</button>
                ))}
              </div>
            </div>

            {tf.otfVariants.length > 1 && (
              <div className="specimen__group">
                <label>style</label>
                {tf.otfVariants.map((v, i) => (
                  <button
                    key={i}
                    className={variantIdx === i ? 'is-active' : ''}
                    onClick={() => switchVariant(i)}
                  >{v.variantName || 'Regular'}</button>
                ))}
              </div>
            )}

            <div className="specimen__group">
              <button
                className="specimen__reset"
                title="Reset text"
                onClick={() => setText(defaultText)}
              >↺</button>
            </div>
          </div>

          {/* editable specimen text */}
          <div
            ref={textRef}
            className="specimen__text"
            contentEditable
            suppressContentEditableWarning
            spellCheck="false"
            onInput={e => setText(e.currentTarget.textContent ?? '')}
            style={{
              fontFamily: `"${fam}", var(--font-ui)`,
              fontSize: `${size}px`,
              fontWeight: current?.weight || 400,
              fontStyle: current?.style || 'normal',
              lineHeight: lh,
            }}
          >
            {defaultText}
          </div>

          {/* about */}
          {tf.aboutFont && (
            <div className="tfa-about">
              <h3>About</h3>
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
    </li>
  );
}
