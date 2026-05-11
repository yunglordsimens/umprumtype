import { useEffect, useState } from 'react';

export default function SpecimenTesterOtf({
  fontFamily,
  variants = [],
  specimens = [],
  mainStyleNo = 0,
  prevSlug,
  nextSlug,
}) {
  const idx0 = Math.min(Math.max(0, mainStyleNo), Math.max(0, variants.length - 1));
  const [text, setText] = useState(specimens[0] || fontFamily);
  const [size, setSize] = useState(56);
  const [variantIdx, setVariantIdx] = useState(idx0);
  const [colMode, setColMode] = useState('auto');

  const current = variants[variantIdx] ?? null;
  const cols = colMode === 'auto'
    ? (size <= 16 ? 3 : size <= 32 ? 2 : 1)
    : Number(colMode);
  const lh = size > 80 ? 1.0 : size > 40 ? 1.15 : 1.5;

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA'].includes(t.tagName))) return;
      if (e.key === 'ArrowLeft'  && prevSlug) window.location.href = `/typefaces/${prevSlug}`;
      else if (e.key === 'ArrowRight' && nextSlug) window.location.href = `/typefaces/${nextSlug}`;
      else if (e.key === 'Escape') window.location.href = '/typefaces';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevSlug, nextSlug]);

  return (
    <div className="specimen">
      <div className="specimen__controls">

        <div className="specimen__group">
          <label>size</label>
          <input type="range" min="8" max="320" value={size}
            onChange={(e) => setSize(+e.target.value)} />
          <span className="specimen__value">{size}px</span>
          <div className="specimen__presets">
            {[14, 22, 36, 56, 96, 160].map((p) => (
              <button key={p} className={p === size ? 'is-active' : ''} onClick={() => setSize(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div className="specimen__group">
          <label>columns</label>
          {['auto', 1, 2, 3].map((c) => (
            <button key={c} className={colMode === c ? 'is-active' : ''} onClick={() => setColMode(c)}>{c}</button>
          ))}
        </div>

        {variants.length > 1 && (
          <div className="specimen__group">
            <label>style</label>
            {variants.map((v, i) => (
              <button key={i} className={variantIdx === i ? 'is-active' : ''} onClick={() => setVariantIdx(i)}>
                {v.variantName || 'Regular'}
              </button>
            ))}
          </div>
        )}

        {specimens.length > 1 && (
          <div className="specimen__group">
            <label>text</label>
            {specimens.map((s, i) => (
              <button key={i} className={text === s ? 'is-active' : ''} onClick={() => setText(s)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}

      </div>

      <div
        className="specimen__text"
        contentEditable
        suppressContentEditableWarning
        spellCheck="false"
        style={{
          fontFamily: `"${fontFamily}", var(--font-ui)`,
          fontSize: `${size}px`,
          fontStyle: current?.style || 'normal',
          fontWeight: current?.weight || 400,
          columnCount: cols,
          columnGap: '2em',
          lineHeight: lh,
        }}
      >
        {text}
      </div>
    </div>
  );
}
