import { useEffect, useState } from 'react';

const SCRIPT_PRIORITY = ['cs', 'uk', 'de', 'en'];
const SIZE_PRESETS = {
  text:    [12, 16, 22, 32, 56, 96],
  display: [56, 96, 160, 240],
  mono:    [12, 14, 16, 22, 32, 48],
  script:  [28, 44, 72, 120],
};
const DEFAULT_SIZE = { text: 22, display: 96, mono: 16, script: 56 };

export default function SpecimenTester({
  fontFamily,
  variants = [],
  specimens = {},
  mode = 'text',
  scripts = [],
  prevSlug,
  nextSlug,
}) {
  const pickText = () => {
    for (const k of SCRIPT_PRIORITY) if (specimens[k]) return specimens[k];
    const v = Object.values(specimens).find(Boolean);
    return v || 'The quick brown fox jumps over the lazy dog.';
  };

  const [text, setText] = useState(pickText);
  const [size, setSize] = useState(DEFAULT_SIZE[mode] ?? 22);
  const [variant, setVariant] = useState(variants[0] || null);
  const [colMode, setColMode] = useState('auto');

  const cols = colMode === 'auto'
    ? (size <= 16 ? 3 : size <= 28 ? 2 : 1)
    : colMode;

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA'].includes(t.tagName))) return;
      if (e.key === 'ArrowLeft' && prevSlug) window.location.href = `/typefaces/${prevSlug}`;
      else if (e.key === 'ArrowRight' && nextSlug) window.location.href = `/typefaces/${nextSlug}`;
      else if (e.key === 'Escape') window.location.href = '/typefaces';
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevSlug, nextSlug]);

  const presets = SIZE_PRESETS[mode] || SIZE_PRESETS.text;
  const available = SCRIPT_PRIORITY.filter(k => specimens[k]);

  return (
    <div className="specimen">
      <div className="specimen__controls">
        <div className="specimen__group">
          <label>size</label>
          <input
            type="range"
            min="8"
            max="320"
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          />
          <span className="specimen__value">{size}px</span>
          <div className="specimen__presets">
            {presets.map((p) => (
              <button
                key={p}
                className={p === size ? 'is-active' : ''}
                onClick={() => setSize(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="specimen__group">
          <label>columns</label>
          {['auto', 1, 2, 3].map((c) => (
            <button
              key={c}
              className={colMode === c ? 'is-active' : ''}
              onClick={() => setColMode(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {variants.length > 1 && (
          <div className="specimen__group">
            <label>style</label>
            {variants.map((v) => (
              <button
                key={v.variant}
                className={variant?.variant === v.variant ? 'is-active' : ''}
                onClick={() => setVariant(v)}
              >
                {v.variant}
              </button>
            ))}
          </div>
        )}

        {available.length > 1 && (
          <div className="specimen__group">
            <label>script</label>
            {available.map((k) => (
              <button
                key={k}
                className={specimens[k] === text ? 'is-active' : ''}
                onClick={() => setText(specimens[k])}
              >
                {k}
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
          fontStyle: variant?.style || 'normal',
          fontWeight: variant?.weight || 400,
          columnCount: cols,
          columnGap: '2em',
          lineHeight: mode === 'display' ? 1.0 : mode === 'script' ? 1.25 : 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
}
