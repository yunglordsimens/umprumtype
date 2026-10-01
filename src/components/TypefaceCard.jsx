import { useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';

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
  // Read-only: only the font's own sample text is shown, never visitor input
  // (fonts have limited character sets)
  const text = useMemo(() => {
    const unit = baseText.trim() + ' ';
    const reps = Math.max(12, Math.ceil(SPECIMEN_MIN_CHARS / unit.length));
    return unit.repeat(reps).trim();
  }, [baseText]);

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
        className="specimen__text"
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
          overflowY: 'hidden',
          height: multiLine ? '450px' : undefined,
          display: 'block',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {text}
      </div>
    </div>
  );
}

// Preview line above the tester: an endless loop of the sample text that can be
// spun sideways. It is a plain native horizontal scroller (trackpad swipe,
// shift+wheel, finger drag) so every browser — Safari included — handles the
// gesture itself; there is no wheel interception. The line holds enough copies
// of the text for LOOP_REACH screens either way, and once scrolling stops it is
// silently re-parked on the middle copy, so it never reaches an end.
const LOOP_REACH = 10;
const LOOP_MAX_COPIES = 201;

function LoopingPreview({ text, style }) {
  const boxRef = useRef(null);
  const [copies, setCopies] = useState(3);
  const home = Math.floor(copies / 2);

  const copyWidth = () => boxRef.current?.querySelector('.tfa-trigger__copy')?.offsetWidth || 0;

  // Same visual position, but on the middle copy
  const park = () => {
    const box = boxRef.current;
    const w = copyWidth();
    if (!box || !w) return;
    const phase = ((box.scrollLeft % w) + w) % w;
    const target = home * w + phase;
    if (Math.abs(box.scrollLeft - target) >= 1) box.scrollLeft = target;
  };

  // How many copies are needed, once the font has loaded and on resize
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const w = copyWidth();
      const boxW = boxRef.current?.clientWidth || 0;
      if (cancelled || !w || !boxW) return;
      const reach = Math.ceil((LOOP_REACH * boxW) / w);
      setCopies(Math.min(LOOP_MAX_COPIES, Math.max(3, 2 * reach + 1)));
    };
    measure();
    (document.fonts?.ready ?? Promise.resolve()).then(measure);
    window.addEventListener('resize', measure);
    return () => { cancelled = true; window.removeEventListener('resize', measure); };
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(park, [copies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-park after each gesture (debounced — never during momentum scrolling)
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let timer = null;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const w = copyWidth();
        if (w && Math.abs(box.scrollLeft - home * w) > w) park();
      }, 200);
    };
    box.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(timer); box.removeEventListener('scroll', onScroll); };
  }, [home]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={boxRef} className="tfa-trigger__preview" style={style}>
      <div className="tfa-trigger__track">
        {Array.from({ length: copies }, (_, i) => (
          <span key={i} className="tfa-trigger__copy" aria-hidden={i !== home || undefined}>{text}</span>
        ))}
      </div>
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
      {/* Whole head toggles the panel; the scrollable preview can't live inside
          a <button> (Safari won't scroll it there), so only the meta row is one */}
      <div className={`tfa-trigger${isOpen ? ' is-open' : ''}`} onClick={onOpen}>
        <button type="button" className="tfa-trigger__meta-inline" aria-expanded={isOpen}>
          <span className="tfa-trigger__meta-name">{tf.title}</span>
          <span className="tfa-trigger__meta-designer">{tf.designer}</span>
          <span className="tfa-trigger__meta-year">{tf.year}</span>
        </button>
        <LoopingPreview
          text={tf.styleTexts[0] || tf.mainText || tf.title}
          style={{
            fontFamily: `"${fam}", var(--font-ui)`,
            fontWeight: current?.weight || 400,
            fontStyle: current?.style || 'normal',
            fontSize: tf.mainSize || '6em',
          }}
        />
      </div>

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
