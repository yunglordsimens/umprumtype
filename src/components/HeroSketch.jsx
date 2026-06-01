import { useEffect, useRef, useState } from 'react';

const DEFAULT_WORD = 'ARTSEMESTR\nSS26\nDOXXXXXXXX\nTYPOUMPRUM.CZ\n03—10/06\nKASARNA KARLIN\n[C11]';

// poster palette colors [r,g,b]
const PALETTES = {
  mono:   null,
  red:    { bg: [10, 10, 10],  fg: [232, 50,  38]  },
  yellow: { bg: [245, 196, 18], fg: [10, 10, 10]   },
};

// helpers so p5 calls accept both greyscale numbers and [r,g,b] arrays
function pBg(p, c)            { Array.isArray(c) ? p.background(c[0], c[1], c[2]) : p.background(c); }
function pStroke(p, c, a)     { Array.isArray(c) ? p.stroke(c[0], c[1], c[2], a ?? 255) : p.stroke(c, a ?? 255); }
function pFill(p, c, a)       { Array.isArray(c) ? p.fill(c[0], c[1], c[2], a ?? 255) : p.fill(c, a ?? 255); }
function toCSSColor(c)        { return Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgb(${c},${c},${c})`; }

// deterministic font assignment per character position
function getCharFont(fonts, li, ci) {
  if (!fonts.length) return null;
  return fonts[(li * 17 + ci * 13) % fonts.length];
}

export default function HeroSketch({ fontData = [] }) {
  const containerRef = useRef(null);
  const [effect,  setEffect]  = useState('dots');
  const [palette, setPalette] = useState('mono');

  // system dark-mode — homepage is ALWAYS contrasting
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = e => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const colorsRef          = useRef({ bg: 14, fg: 235 });
  const effectRef          = useRef(effect);
  const paletteRef         = useRef(palette);
  const loadedFontsRef     = useRef([]);
  const charFontMapRef     = useRef(null);
  const needsFontRedrawRef = useRef(false);

  useEffect(() => { effectRef.current  = effect;  }, [effect]);
  useEffect(() => { paletteRef.current = palette; }, [palette]);

  useEffect(() => {
    if (palette !== 'mono') {
      colorsRef.current = PALETTES[palette];
    } else {
      // dark system → site is dark → homepage = light canvas
      // light system → site is light → homepage = dark canvas
      colorsRef.current = isDark ? { bg: 238, fg: 18 } : { bg: 14, fg: 235 };
    }
  }, [palette, isDark]);

  // Load a random subset of typefaces via FontFace API
  useEffect(() => {
    if (!fontData.length) return;
    const shuffled = [...fontData].sort(() => Math.random() - 0.5).slice(0, 8);
    Promise.all(
      shuffled.map(({ family, path, weight }) => {
        try {
          const font = new FontFace(family, `url(${path})`, { weight: String(weight || 400) });
          return font.load()
            .then(f => { document.fonts.add(f); return family; })
            .catch(() => null);
        } catch { return Promise.resolve(null); }
      })
    ).then(results => {
      const loaded = results.filter(Boolean);
      if (loaded.length > 0) {
        loadedFontsRef.current = loaded;
        charFontMapRef.current = null;
        needsFontRedrawRef.current = true;
      }
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let p5Instance;

    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let pixelData = null;
    let typed = '';
    let needsRedraw = true;

    // typed arrays for dots — 4× less GC, better cache locality
    let nDots = 0;
    let dotsX  = null, dotsY  = null;
    let dotsBX = null, dotsBY = null;
    let dotsDirty = false;
    let prevEffect = 'dots';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onKey = (e) => {
      if (e.key === 'Backspace')      typed = typed.slice(0, -1);
      else if (e.key === 'Enter')     typed += '\n';
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)
        typed += e.key.toUpperCase();
      else return;
      charFontMapRef.current = null; // text changed → re-assign fonts
      needsRedraw = true;
    };
    window.addEventListener('keydown', onKey);

    function resizeBuffer(w, h) { offCanvas.width = w; offCanvas.height = h; }

    function buildLineData(lines, fontSize) {
      return lines.map((line, li) => {
        const chars = [...line];
        let totalW = 0;
        const items = chars.map((ch, ci) => {
          const fam = charFontMapRef.current?.[`${li}_${ci}`] ?? null;
          const fontStr = fam
            ? `900 ${fontSize}px "${fam}", "Helvetica Neue", Helvetica, sans-serif`
            : `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
          offCtx.font = fontStr;
          const cw = offCtx.measureText(ch).width;
          totalW += cw;
          return { ch, cw, fontStr };
        });
        return { items, totalW };
      });
    }

    function renderTextToBuffer() {
      if (needsFontRedrawRef.current) {
        charFontMapRef.current = null;
        needsFontRedrawRef.current = false;
      }

      const w = offCanvas.width, h = offCanvas.height;
      const lines = (typed || DEFAULT_WORD).split('\n');
      const fonts = loadedFontsRef.current;

      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, w, h);
      offCtx.letterSpacing = '0px';

      let fontSize = Math.max(20, (h * 0.8) / (lines.length || 1));

      // Build per-char font assignment (stable per text state)
      if (!charFontMapRef.current) {
        const map = {};
        lines.forEach((line, li) => {
          [...line].forEach((ch, ci) => {
            map[`${li}_${ci}`] = getCharFont(fonts, li, ci);
          });
        });
        charFontMapRef.current = map;
      }

      // Build line data with per-char fonts; scale down if too wide
      let lineData = buildLineData(lines, fontSize);
      const maxLineW = lineData.reduce((m, ld) => Math.max(m, ld.totalW), 0);
      if (maxLineW > w * 0.9) {
        fontSize = fontSize * (w * 0.9) / maxLineW;
        lineData = buildLineData(lines, fontSize);
      }

      offCtx.fillStyle = '#fff';
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'middle';

      const lh = fontSize * 0.85;
      const startY = (h - lines.length * lh) / 2 + lh / 2;

      function drawLine(ld, li) {
        let x = (w - ld.totalW) / 2;
        const y = startY + li * lh;
        ld.items.forEach(({ ch, cw, fontStr }) => {
          offCtx.font = fontStr;
          offCtx.fillText(ch, x, y);
          x += cw;
        });
      }

      offCtx.filter = 'blur(6px)';
      lineData.forEach((ld, li) => drawLine(ld, li));
      offCtx.filter = 'none';
      lineData.forEach((ld, li) => drawLine(ld, li));

      pixelData = offCtx.getImageData(0, 0, w, h).data;
      needsRedraw = false;
      dotsDirty = true;
    }

    function buildDots(w, h) {
      const step = Math.max(4, Math.round(w / 360));
      const MAX_D = 7000;
      const txs = [], tys = [];
      for (let y = 0; y < h; y += step)
        for (let x = 0; x < w; x += step)
          if (pixelData[(y * w + x) * 4] > 100) { txs.push(x); tys.push(y); }

      const srcN = txs.length;
      const skip = srcN > MAX_D ? Math.ceil(srcN / MAX_D) : 1;
      const newN = Math.ceil(srcN / skip);

      const prevX = dotsX, prevY = dotsY, prevN = nDots;
      const cx = w / 2, cy = h / 2;

      dotsX  = new Float32Array(newN);
      dotsY  = new Float32Array(newN);
      dotsBX = new Float32Array(newN);
      dotsBY = new Float32Array(newN);
      nDots  = 0;

      for (let si = 0; si < srcN && nDots < newN; si += skip) {
        const bx = txs[si], by = tys[si];
        if (prevX && nDots < prevN) {
          const px = prevX[nDots], py = prevY[nDots];
          const a = Math.atan2(py - cy, px - cx);
          dotsX[nDots] = px + Math.cos(a) * 60;
          dotsY[nDots] = py + Math.sin(a) * 60;
        } else {
          dotsX[nDots] = cx; dotsY[nDots] = cy;
        }
        dotsBX[nDots] = bx; dotsBY[nDots] = by;
        nDots++;
      }
      dotsDirty = false;
    }

    import('p5').then(({ default: p5 }) => {
      const sketch = p => {
        const MOUSE_R = 100;

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.pixelDensity(1);   // skip retina overdraw — biggest perf win
          p.frameRate(reducedMotion ? 8 : 30);
          p.noSmooth();
          resizeBuffer(p.width, p.height);
          renderTextToBuffer();
        };

        p.draw = () => {
          if (needsRedraw || needsFontRedrawRef.current) renderTextToBuffer();

          const cur = effectRef.current;
          if (cur === 'waves' && p.frameCount % 2 !== 0) return;

          const { bg, fg } = colorsRef.current;
          pBg(p, bg);
          if (!pixelData) return;

          const w = offCanvas.width, h = offCanvas.height;
          const time = p.frameCount * 0.015;

          if ((cur === 'dots' || cur === 'waves') && (dotsDirty || prevEffect !== cur)) {
            if (cur === 'dots') buildDots(w, h);
          }
          prevEffect = cur;

          if (cur === 'waves') {
            pStroke(p, fg);
            p.noFill();
            p.strokeWeight(0.6);

            const stretch = 0.88;
            const mapCX = (w / 2 + (h / 2) * 0.4) * stretch;
            const mapCY = (h / 2 - (w / 2) * 0.1) * stretch;
            const yShift = h * 0.06;

            p.push();
            p.translate(w / 2 - mapCX, h / 2 - mapCY + yShift);

            const extX = Math.floor(h * 0.4);
            const extY = Math.floor(w * 0.15);

            for (let a = -extY; a < h + extY; a += 8) {
              p.beginShape();
              for (let b = -extX; b < w + extX; b += 6) {
                let c = 0;
                if (a >= 0 && a < h && b >= 0 && b < w) c = pixelData[(a * w + b) * 4];
                const vx = (b + a * 0.4) * stretch;
                let vy = (a - c * 0.1 - b * 0.1) * stretch;
                const noiseTerrain = (p.noise((b + extX) * 0.008, (a + extY) * 0.008, time * 0.5) - 0.5) * 25;
                const waveDrift = p.sin(b * 0.02 - time * 2.5) * 6 + p.cos(a * 0.02 + time * 1.5) * 4;
                vy += (noiseTerrain + waveDrift) * (1 - p.constrain(c / 150, 0, 1));
                p.vertex(vx, vy);
              }
              p.endShape();
            }
            p.pop();

          } else if (cur === 'dots') {
            const ctx = p.drawingContext;
            const mx = p.mouseX, my = p.mouseY;
            const MR2 = MOUSE_R * MOUSE_R;
            const hasMouse = !reducedMotion && mx >= 0 && my >= 0 && mx < p.width && my < p.height;

            // single path → single GPU flush instead of N individual draw calls
            ctx.fillStyle = toCSSColor(fg);
            ctx.beginPath();
            for (let i = 0; i < nDots; i++) {
              let x = dotsX[i], y = dotsY[i];
              const bx = dotsBX[i], by = dotsBY[i];
              if (hasMouse) {
                const dx = mx - x, dy = my - y;
                const dSq = dx * dx + dy * dy;
                if (dSq < MR2) {
                  const dist = Math.sqrt(dSq);
                  const force = (MOUSE_R - dist) / MOUSE_R;
                  const angle = Math.atan2(dy, dx);
                  x -= Math.cos(angle) * force * 5 - Math.cos(angle + Math.PI / 2) * force * 15;
                  y -= Math.sin(angle) * force * 5 - Math.sin(angle + Math.PI / 2) * force * 15;
                } else {
                  x += (bx - x) * 0.03; y += (by - y) * 0.03;
                }
              } else {
                x += (bx - x) * 0.03; y += (by - y) * 0.03;
              }
              dotsX[i] = x; dotsY[i] = y;
              ctx.rect(x - 1, y - 1, 2, 2);
            }
            ctx.fill();

            if (hasMouse) {
              ctx.save();
              ctx.strokeStyle = toCSSColor(fg);
              ctx.globalAlpha = 12 / 255;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(mx, my, MOUSE_R, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          resizeBuffer(p.width, p.height);
          needsRedraw = true;
        };
      };

      p5Instance = new p5(sketch, container);
    });

    return () => {
      window.removeEventListener('keydown', onKey);
      p5Instance?.remove();
      offCanvas = null; offCtx = null; pixelData = null;
      dotsX = dotsY = dotsBX = dotsBY = null; nDots = 0;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
      <div className={`hero-controls${palette === 'yellow' ? ' hero-controls--light' : ''}`}>
        <div className="tf-sort">
          {['dots', 'waves'].map(e => (
            <button key={e} aria-pressed={effect === e} onClick={() => setEffect(e)}>{e}</button>
          ))}
          <span className="tf-sort__divider" />
          <button
            className={`hero-palette-dot${palette === 'mono' ? ' is-active' : ''}`}
            onClick={() => setPalette('mono')}
            aria-label="Black & white"
            title="B&W"
          />
          <button
            className={`hero-palette-dot hero-palette-dot--red${palette === 'red' ? ' is-active' : ''}`}
            onClick={() => setPalette('red')}
            aria-label="Red"
            title="Red"
          />
          <button
            className={`hero-palette-dot hero-palette-dot--yellow${palette === 'yellow' ? ' is-active' : ''}`}
            onClick={() => setPalette('yellow')}
            aria-label="Yellow"
            title="Yellow"
          />
        </div>
      </div>
    </div>
  );
}
