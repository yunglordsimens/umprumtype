import { useEffect, useRef, useState } from 'react';

const SIZE_STEPS = [12, 16, 22, 32, 48, 72, 96, 144, 200];

function nearest(val, steps) {
  return steps.reduce((a, b) => Math.abs(b - val) < Math.abs(a - val) ? b : a);
}

export default function SpecimenTesterOtf({
  fontFamily,
  variants   = [],
  specimens  = [],
  mainStyleNo = 0,
  initialSize = 72,
  prevSlug,
  nextSlug,
}) {
  const clampedIdx   = Math.min(Math.max(0, mainStyleNo), Math.max(0, variants.length - 1));
  const defaultText  = specimens[clampedIdx] || specimens[0] || fontFamily;

  const [text,       setText]       = useState(defaultText);
  const [size,       setSize]       = useState(nearest(initialSize, SIZE_STEPS));
  const [variantIdx, setVariantIdx] = useState(clampedIdx);
  const [colMode,    setColMode]    = useState('auto');
  const textRef = useRef(null);

  const current = variants[variantIdx] ?? null;
  const cols    = colMode === 'auto'
    ? (size <= 16 ? 3 : size <= 36 ? 2 : 1)
    : Number(colMode);
  const lh = size > 96 ? 0.95 : size > 48 ? 1.1 : size > 24 ? 1.3 : 1.5;

  /* keyboard navigation */
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA'].includes(t.tagName))) return;
      if      (e.key === 'ArrowLeft'  && prevSlug) location.href = `/typefaces/${prevSlug}`;
      else if (e.key === 'ArrowRight' && nextSlug) location.href = `/typefaces/${nextSlug}`;
      else if (e.key === 'Escape')                 location.href = '/typefaces';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevSlug, nextSlug]);

  /* sync contentEditable when specimen text is switched */
  useEffect(() => {
    if (textRef.current && textRef.current.textContent !== text) {
      textRef.current.textContent = text;
    }
  }, [text]);

  function switchSpecimen(s) {
    setText(s);
  }

  function switchVariant(i) {
    setVariantIdx(i);
    /* keep specimen in sync with variant if specimens[] mirrors variants[] */
    if (specimens[i]) setText(specimens[i]);
  }

  return (
    <div className="specimen">
      {/* controls row */}
      <div className="specimen__controls">

        {/* size */}
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

        {/* columns */}
        <div className="specimen__group">
          <label>col</label>
          {['auto', 1, 2, 3].map(c => (
            <button
              key={c}
              className={colMode === c ? 'is-active' : ''}
              onClick={() => setColMode(c)}
            >{c}</button>
          ))}
        </div>

        {/* style variants */}
        {variants.length > 1 && (
          <div className="specimen__group">
            <label>style</label>
            {variants.map((v, i) => (
              <button
                key={i}
                className={variantIdx === i ? 'is-active' : ''}
                onClick={() => switchVariant(i)}
              >{v.variantName || 'Regular'}</button>
            ))}
          </div>
        )}

        {/* specimen texts */}
        {specimens.length > 1 && (
          <div className="specimen__group">
            <label>text</label>
            {specimens.map((s, i) => (
              <button
                key={i}
                className={text === s ? 'is-active' : ''}
                onClick={() => switchSpecimen(s)}
              >{i + 1}</button>
            ))}
          </div>
        )}

        {/* reset */}
        <div className="specimen__group">
          <button
            className="specimen__reset"
            title="Reset text"
            onClick={() => setText(defaultText)}
          >↺</button>
        </div>

      </div>

      {/* editable specimen area */}
      <div
        ref={textRef}
        className="specimen__text"
        contentEditable
        suppressContentEditableWarning
        spellCheck="false"
        onInput={e => setText(e.currentTarget.textContent ?? '')}
        style={{
          fontFamily:   `"${fontFamily}", var(--font-ui)`,
          fontSize:     `${size}px`,
          fontStyle:    current?.style  || 'normal',
          fontWeight:   current?.weight || 400,
          columnCount:  cols,
          columnGap:    '2em',
          lineHeight:   lh,
        }}
      >
        {defaultText}
      </div>
    </div>
  );
}
