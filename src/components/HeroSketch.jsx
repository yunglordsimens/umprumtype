import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DEFAULT_WORD = 'typoumprum.doc\nopening 3/6 6 pm\nKasárny Karlín\nC12.02';

const PALETTE_CYCLE = [
  { key: 'mono'         },
  { key: 'yellow-dark'  },
  { key: 'yellow-light' },
];
const PALETTE_LABELS = { mono: 'B/W', 'yellow-dark': 'Y/B', 'yellow-light': 'B/Y' };

const QUALITY_PARTICLES = [4000, 8000, 22000, 40000, 60000];
const QUALITY_WAVE_STEP = [18, 14, 10, 7, 5];

function detectQuality() {
  if (typeof window === 'undefined') return 3;
  const isMobile = 'ontouchstart' in window && window.innerWidth < 1024;
  if (isMobile) return 2;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = navigator.deviceMemory ?? 4;
  if (cores >= 8 && mem >= 8) return 4;
  if (cores >= 4) return 3;
  return 2;
}

function toCSSColor(c) { return Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgb(${c},${c},${c})`; }

// deterministic font assignment per character position
function getCharFont(fonts, li, ci) {
  if (!fonts.length) return null;
  return fonts[(li * 17 + ci * 13) % fonts.length];
}

export default function HeroSketch({ fontData = [] }) {
  const containerRef = useRef(null);
  const [effect,  setEffect]  = useState('dots');
  const [palette, setPalette] = useState('mono');

  function cyclePalette() {
    const keys = PALETTE_CYCLE.map(p => p.key);
    setPalette(cur => keys[(keys.indexOf(cur) + 1) % keys.length]);
  }

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

  const [quality, setQuality] = useState(() => detectQuality());

  const colorsRef          = useRef({ bg: 28, fg: 235 });
  const effectRef          = useRef(effect);
  const qualityRef         = useRef(quality);
  const loadedFontsRef     = useRef([]);
  const charFontMapRef     = useRef(null);
  const needsFontRedrawRef = useRef(false);

  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => { qualityRef.current = quality; }, [quality]);

  useEffect(() => {
    if (palette === 'yellow-dark') {
      colorsRef.current = { bg: [0, 0, 0], fg: [245, 196, 18] };
    } else if (palette === 'yellow-light') {
      colorsRef.current = { bg: [245, 196, 18], fg: [10, 10, 10] };
    } else {
      // mono: always contrasting with system
      colorsRef.current = isDark ? { bg: 255, fg: 0 } : { bg: 0, fg: 255 };
    }
  }, [palette, isDark]);

  // Load a random subset of typefaces via FontFace API
  useEffect(() => {
    if (!fontData.length) return;
    const shuffled = [...fontData].sort(() => Math.random() - 0.5);
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

    // ── off-screen text buffer ──
    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let pixelData = null;
    let typed = '';
    let needsRedraw = true;
    let textTimer = null;
    let typewriterTimer = null;

    let nDots = 0;
    let dotsX = null, dotsY = null, dotsBX = null, dotsBY = null;
    let dotsDirty = false, prevEffect = '', prevPerfMode = qualityRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HALF_PI = Math.PI / 2;
    const TWO_PI  = Math.PI * 2;

    // ── main canvas (no p5 — raw RAF) ──
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    container.appendChild(canvas);

    let W = container.offsetWidth || window.innerWidth;
    let H = container.offsetHeight || window.innerHeight;
    canvas.width = W; canvas.height = H;

    // ── cached wave geometry — recomputed only on resize ──
    let wc = {};
    function updateWaveCache() {
      const stretch = 0.88;
      wc = {
        stretch,
        b01s: 0.1 * stretch,
        offX: W / 2 - (W / 2 + H / 2 * 0.4) * stretch,
        offY: H / 2 - (H / 2 - W / 2 * 0.1) * stretch + H * 0.06,
        extX: Math.floor(H * 0.4),
        extY: Math.floor(W * 0.15),
      };
    }
    updateWaveCache();

    const BUFFER_MAX = 900;
    let bufScale = 1;
    function resizeBuffer(w, h) {
      bufScale = Math.min(1, BUFFER_MAX / Math.max(w, h));
      offCanvas.width  = Math.max(1, Math.round(w * bufScale));
      offCanvas.height = Math.max(1, Math.round(h * bufScale));
    }
    resizeBuffer(W, H);

    // ── keyboard ──
    const onKey = e => {
      if (e.key === 'Backspace') typed = typed.slice(0, -1);
      else if (e.key === 'Enter') typed += '\n';
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)
        typed += e.key.toUpperCase();
      else return;
      charFontMapRef.current = null;
      clearTimeout(textTimer);
      textTimer = setTimeout(() => { needsRedraw = true; }, 80);
    };
    window.addEventListener('keydown', onKey);

    // ── mouse ──
    let mouseX = -1, mouseY = -1;
    const onMouseMove = e => { mouseX = e.clientX; mouseY = e.clientY; };
    const onMouseLeave = () => { mouseX = -1; mouseY = -1; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // ── resize ──
    const onResize = () => {
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || window.innerHeight;
      canvas.width = W; canvas.height = H;
      resizeBuffer(W, H);
      updateWaveCache();
      needsRedraw = true; dotsDirty = true;
    };
    window.addEventListener('resize', onResize);

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
      const rawLines = (typed || DEFAULT_WORD).split('\n');
      const lines = W < 600
        ? rawLines.flatMap(line => {
            const chunks = [];
            for (let i = 0; i < line.length; i += 4) chunks.push(line.slice(i, i + 4));
            return chunks.length ? chunks : [''];
          })
        : rawLines;
      const fonts = loadedFontsRef.current;
      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, w, h);
      offCtx.letterSpacing = '0px';
      let fontSize = Math.max(20, (h * 0.8) / (lines.length || 1));
      if (!charFontMapRef.current) {
        const map = {};
        lines.forEach((line, li) => {
          [...line].forEach((ch, ci) => { map[`${li}_${ci}`] = getCharFont(fonts, li, ci); });
        });
        charFontMapRef.current = map;
      }
      let lineData = buildLineData(lines, fontSize);
      const maxLineW = lineData.reduce((m, ld) => Math.max(m, ld.totalW), 0);
      if (W < 600 && maxLineW > 0) {
        fontSize = fontSize * (w * 0.97) / maxLineW;
        lineData = buildLineData(lines, fontSize);
      } else if (maxLineW > w * 0.9) {
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
        ld.items.forEach(({ ch, cw, fontStr }) => { offCtx.font = fontStr; offCtx.fillText(ch, x, y); x += cw; });
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
      // work in buffer space, then scale to screen
      const bw = offCanvas.width, bh = offCanvas.height;
      const inv = 1 / bufScale; // buffer → screen scale
      const MAX_PARTICLES = QUALITY_PARTICLES[qualityRef.current - 1];
      const totalPixels = bw * bh;
      let step = qualityRef.current <= 2 ? Math.max(2, Math.round(bw / 500)) : 1;
      while ((totalPixels / (step * step)) > MAX_PARTICLES) step++;
      const MAX_D = MAX_PARTICLES;
      const txs = [], tys = [];
      for (let y = 0; y < bh; y += step)
        for (let x = 0; x < bw; x += step)
          if (pixelData[(y * bw + x) * 4] > 100) { txs.push(x); tys.push(y); }
      const srcN = txs.length;
      const skip = srcN > MAX_D ? Math.ceil(srcN / MAX_D) : 1;
      const newN = Math.ceil(srcN / skip);
      const prevX = dotsX, prevY = dotsY, prevN = nDots;
      const cx = w / 2, cy = h / 2;
      dotsX = new Float32Array(newN);
      dotsY = new Float32Array(newN);
      dotsBX = new Float32Array(newN);
      dotsBY = new Float32Array(newN);
      nDots = 0;
      for (let si = 0; si < srcN && nDots < newN; si += skip) {
        // scale buffer coords → screen coords
        const bx = txs[si] * inv, by = tys[si] * inv;
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

    // ── frame loop ──
    const FRAME_MS = reducedMotion ? 125 : 1000 / 60;
    let lastTs = 0, frameCount = 0, rafId;

    function loop(ts) {
      rafId = requestAnimationFrame(loop);
      const dt = ts - lastTs;
      if (dt < FRAME_MS) return;
      lastTs = ts - (dt % FRAME_MS);
      frameCount++;

      if (qualityRef.current !== prevPerfMode) { prevPerfMode = qualityRef.current; dotsDirty = true; }
      if (needsRedraw || needsFontRedrawRef.current) renderTextToBuffer();

      const cur = effectRef.current;
      const { bg, fg } = colorsRef.current;
      ctx.fillStyle = toCSSColor(bg);
      ctx.fillRect(0, 0, W, H);
      if (!pixelData) return;

      const time = frameCount * 0.022;
      const fgCSS = toCSSColor(fg);

      if (cur === 'dots') {
        if (dotsDirty || prevEffect !== 'dots') buildDots(W, H);
        prevEffect = 'dots';

        const hasMouse = !reducedMotion && mouseX >= 0 && mouseX < W && mouseY >= 0 && mouseY < H;
        ctx.fillStyle = fgCSS;
        const dotPath = new Path2D();
        for (let i = 0; i < nDots; i++) {
          let x = dotsX[i], y = dotsY[i];
          const bx = dotsBX[i], by = dotsBY[i];
          if (hasMouse) {
            const dx = mouseX - x, dy = mouseY - y;
            const dSq = dx * dx + dy * dy;
            if (dSq < 10000) {
              const dist = Math.sqrt(dSq);
              const force = (100 - dist) / 100;
              const angle = Math.atan2(dy, dx);
              x -= Math.cos(angle) * force * 5 - Math.cos(angle + HALF_PI) * force * 15;
              y -= Math.sin(angle) * force * 5 - Math.sin(angle + HALF_PI) * force * 15;
            } else {
              x += (bx - x) * 0.014; y += (by - y) * 0.014;
            }
          } else {
            const ex = bx - x, ey = by - y;
            if (ex * ex + ey * ey > 0.04) { x += ex * 0.014; y += ey * 0.014; }
          }
          dotsX[i] = x; dotsY[i] = y;
          dotPath.moveTo(x + 1.5, y);
          dotPath.arc(x, y, 1.5, 0, TWO_PI);
        }
        ctx.fill(dotPath);

        if (hasMouse) {
          ctx.save();
          ctx.strokeStyle = fgCSS;
          ctx.globalAlpha = 12 / 255;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(mouseX, mouseY, 100, 0, TWO_PI);
          ctx.stroke();
          ctx.restore();
        }

      } else if (cur === 'waves') {
        prevEffect = 'waves';
        const { stretch, b01s, offX, offY, extX, extY } = wc;

        // precompute time factors (constant for every vertex this frame)
        const t_b  = -time * 2.5;
        const t_a  =  time * 1.5;
        const t_n1 =  time * 0.18;
        const t_n2 = -time * 0.13;

        ctx.save();
        ctx.strokeStyle = fgCSS;
        ctx.lineWidth = 0.6;
        ctx.translate(offX, offY);
        ctx.beginPath(); // single path — single GPU flush for ALL rows

        const waveStep = QUALITY_WAVE_STEP[qualityRef.current - 1];
        for (let a = -extY; a < H + extY; a += waveStep) {
          // hoist a-dependent terms outside inner loop
          const a04s  = a * 0.4 * stretch;
          const a_s   = a * stretch;
          const wdCos = Math.cos(a * 0.02 + t_a) * 4;
          const na1   =  a * 0.004 + t_n1;
          const na2   = -a * 0.007 + t_n2;
          let first = true;

          for (let b = -extX; b < W + extX; b += 8) {
            let c = 0;
            const ba = Math.round(a * bufScale), bb = Math.round(b * bufScale);
            const bw = offCanvas.width, bh = offCanvas.height;
            if (ba >= 0 && ba < bh && bb >= 0 && bb < bw) c = pixelData[(ba * bw + bb) * 4];
            const vx    = b * stretch + a04s;
            const noise = Math.sin(b * 0.007 + na1) * 8 + Math.sin(b * 0.013 + na2) * 5;
            const wd    = Math.sin(b * 0.02 + t_b) * 6 + wdCos;
            const disp  = (noise + wd) * (c >= 150 ? 0 : 1 - c * 0.006667);
            const vy    = a_s - c * b01s - b * b01s + disp;
            if (first) { ctx.moveTo(vx, vy); first = false; }
            else ctx.lineTo(vx, vy);
          }
        }
        ctx.stroke(); // one call instead of ~130

        ctx.restore();
      }
    }

    renderTextToBuffer();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(textTimer);
      clearTimeout(typewriterTimer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
      canvas.remove();
      offCanvas = null; offCtx = null; pixelData = null;
      dotsX = dotsY = dotsBX = dotsBY = null; nDots = 0;
    };
  }, []);

  const controls = (
    <div className="tf-sort">
      {['dots', 'waves'].map(e => (
        <button key={e} aria-pressed={effect === e} onClick={() => setEffect(e)}>{e}</button>
      ))}
      <span className="tf-sort__divider" />
      <button className="hero-palette-cycle" onClick={cyclePalette} aria-label="Cycle color palette">
        {PALETTE_LABELS[palette]}
      </button>
      <span className="tf-sort__divider" />
      <span className="hero-quality-label">
        <span className="hero-quality-label__full">Animation performance</span>
        <span className="hero-quality-label__short">AP</span>
      </span>
      <input
        type="range" min="1" max="5" step="1"
        value={quality}
        onChange={e => setQuality(+e.target.value)}
        className="hero-quality-slider"
        aria-label="Performance quality"
      />
    </div>
  );

  const mobileSlot = typeof document !== 'undefined' && document.getElementById('anim-controls-slot');

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
      <div className={[
        'hero-controls',
        (palette === 'yellow-light' || (palette === 'mono' && isDark)) ? 'hero-controls--light' : '',
        palette === 'yellow-light' ? 'hero-controls--yellow' : '',
      ].filter(Boolean).join(' ')}>
        {controls}
      </div>
      {mobileSlot && createPortal(
        <div className="hero-controls-mobile">{controls}</div>,
        mobileSlot
      )}
    </div>
  );
}
