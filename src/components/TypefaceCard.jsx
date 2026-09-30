import { useRef, useState, useEffect } from 'react';

function lineHeightFor(size) {
  return size > 96 ? 0.9 : size > 48 ? 1.05 : size > 24 ? 1.3 : 1.5;
}

// Enough characters to fill three 450px-tall columns at the smallest size,
// so paragraphs never come up short at the bottom.
const SPECIMEN_MIN_CHARS = 20000;
// Fixed gap between tester columns (it used to scale with the font size)
const SPECIMEN_COLUMN_GAP = '24px';

function VariantSpecimen({ variant, fam, initialSize, baseText }) {
  const [size, setSize] = useState(initialSize);
  const ref = useRef(null);

  // Set text only once on mount — never overwrite user edits
  useEffect(() => {
    if (ref.current) {
      const unit = baseText.trim() + ' ';
      const reps = Math.max(12, Math.ceil(SPECIMEN_MIN_CHARS / unit.length));
      ref.current.textContent = unit.repeat(reps).trim();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = size > 80 ? 1 : size > 40 ? 2 : 3;
  const multiLine = cols > 1;

  return (
    <div className="tfa-specimen">
      <div className="tfa-specimen__header">
        <span className="tfa-specimen__label">{variant.variantName || 'Regular'}</span>
        <span className="tfa-specimen__size">
          <input
            type="range" min="8" max="240" step="1" value={size}
            onChange={e => setSize(+e.target.value)}
            className="tfa-specimen__slider"
            aria-label="Font size"
          />
          <span className="tfa-specimen__value">{size} px</span>
        </span>
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
          columnGap: SPECIMEN_COLUMN_GAP,
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

// Preview line above the tester: an endless loop of the sample text that can be
// spun sideways — horizontal trackpad swipe / shift+wheel, or a finger drag.
function LoopingPreview({ text, style }) {
  const boxRef   = useRef(null);
  const trackRef = useRef(null);
  const offset   = useRef(0);
  const dragged  = useRef(false);
  // Enough copies that the line never runs out, even for a short sample text
  const [copies, setCopies] = useState(3);

  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const w = trackRef.current?.firstElementChild?.offsetWidth;
      const boxW = boxRef.current?.offsetWidth;
      if (!cancelled && w && boxW) setCopies(Math.max(3, Math.ceil(boxW / w) + 2));
    };
    (document.fonts?.ready ?? Promise.resolve()).then(measure);
    window.addEventListener('resize', measure);
    return () => { cancelled = true; window.removeEventListener('resize', measure); };
  }, [text]);

  useEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!box || !track) return;

    const loopWidth = () => track.firstElementChild?.offsetWidth || 0;
    const move = dx => {
      const w = loopWidth();
      if (!w) return;
      offset.current = (((offset.current + dx) % w) + w) % w;
      track.style.transform = `translateX(${-offset.current}px)`;
    };

    const onWheel = e => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      // Only sideways gestures — vertical scrolling keeps scrolling the page
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      move(dx);
    };

    let startX = 0, lastX = 0, pointerId = null;
    const onDown = e => {
      if (e.pointerType === 'mouse') return;
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      dragged.current = false;
    };
    const onMove = e => {
      if (e.pointerId !== pointerId) return;
      if (Math.abs(e.clientX - startX) > 6) dragged.current = true;
      move(lastX - e.clientX);
      lastX = e.clientX;
    };
    const onUp = e => { if (e.pointerId === pointerId) pointerId = null; };
    // A drag shouldn't also open/close the typeface
    const onClick = e => {
      if (dragged.current) { e.stopPropagation(); e.preventDefault(); dragged.current = false; }
    };

    box.addEventListener('wheel', onWheel, { passive: false });
    box.addEventListener('pointerdown', onDown);
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerup', onUp);
    box.addEventListener('pointercancel', onUp);
    box.addEventListener('click', onClick, true);
    return () => {
      box.removeEventListener('wheel', onWheel);
      box.removeEventListener('pointerdown', onDown);
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerup', onUp);
      box.removeEventListener('pointercancel', onUp);
      box.removeEventListener('click', onClick, true);
    };
  }, []);

  return (
    <span ref={boxRef} className="tfa-trigger__preview" style={style}>
      <span ref={trackRef} className="tfa-trigger__track">
        {Array.from({ length: copies }, (_, i) => (
          <span key={i} className="tfa-trigger__copy" aria-hidden={i > 0 || undefined}>{text}</span>
        ))}
      </span>
    </span>
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
          <span className="tfa-trigger__meta-designer">{tf.designer}</span>
          <span className="tfa-trigger__meta-year">{tf.year}</span>
        </span>
        <LoopingPreview
          text={tf.styleTexts[0] || tf.mainText || tf.title}
          style={{
            fontFamily: `"${fam}", var(--font-ui)`,
            fontWeight: current?.weight || 400,
            fontStyle: current?.style || 'normal',
            fontSize: tf.mainSize || '6em',
          }}
        />
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
