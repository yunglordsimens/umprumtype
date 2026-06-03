import { useEffect, useRef, useState } from 'react';

const PALETTE_CYCLE = [
  { key: 'mono' },
  { key: 'yellow-dark' },
  { key: 'yellow-light' },
];
const PALETTE_LABELS = { mono: 'B/W', 'yellow-dark': 'Y/B', 'yellow-light': 'B/Y' };
const QUALITY_PARTICLES = [4000, 8000, 22000, 40000, 60000];
const QUALITY_WAVE_STEP = [18, 14, 10, 7, 5];

function toCSSColor(c) { return Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgb(${c},${c},${c})`; }

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

function getCharFont(fonts, li, ci) {
  if (!fonts.length) return null;
  return fonts[(li * 17 + ci * 13) % fonts.length];
}

export default function StudioPage({ fontData = [] }) {
  const containerRef = useRef(null);
  const [effect, setEffect]   = useState('dots');
  const [palette, setPalette] = useState('mono');
  const [quality, setQuality] = useState(() => detectQuality());
  const [panelOpen, setPanelOpen] = useState(true);
  const [inputText, setInputText] = useState('UMPRUM\nType');
  const [svgMode, setSvgMode] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  const effectRef          = useRef(effect);
  const qualityRef         = useRef(quality);
  const colorsRef          = useRef({ bg: 0, fg: 255 });
  const loadedFontsRef     = useRef([]);
  const charFontMapRef     = useRef(null);
  const needsFontRedrawRef = useRef(false);
  const textRef            = useRef(inputText);
  const needsRedrawExtRef  = useRef(true);
  const svgImgRef          = useRef(null);
  const svgModeRef         = useRef(false);

  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => { qualityRef.current = quality; }, [quality]);

  useEffect(() => {
    textRef.current = inputText;
    needsRedrawExtRef.current = true;
    charFontMapRef.current = null;
  }, [inputText]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = e => setIsDark(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    if (palette === 'yellow-dark') {
      colorsRef.current = { bg: [0, 0, 0], fg: [245, 196, 18] };
    } else if (palette === 'yellow-light') {
      colorsRef.current = { bg: [245, 196, 18], fg: [10, 10, 10] };
    } else {
      colorsRef.current = isDark ? { bg: 255, fg: 0 } : { bg: 0, fg: 255 };
    }
  }, [palette, isDark]);

  useEffect(() => {
    if (!fontData.length) return;
    const shuffled = [...fontData].sort(() => Math.random() - 0.5);
    Promise.all(
      shuffled.map(({ family, path, weight }) => {
        try {
          const font = new FontFace(family, `url(${path})`, { weight: String(weight || 400) });
          return font.load().then(f => { document.fonts.add(f); return family; }).catch(() => null);
        } catch { return Promise.resolve(null); }
      })
    ).then(results => {
      const loaded = results.filter(Boolean);
      if (loaded.length) { loadedFontsRef.current = loaded; needsFontRedrawRef.current = true; }
    });
  }, [fontData]);

  // ── canvas effect ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let pixelData = null;
    let rafId;
    let needsRedraw = true;
    let nDots = 0;
    let dotsX = null, dotsY = null, dotsBX = null, dotsBY = null;
    let dotsDirty = false, prevEffect = '', prevQuality = qualityRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TWO_PI = Math.PI * 2;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    container.appendChild(canvas);

    let W = container.offsetWidth || window.innerWidth;
    let H = container.offsetHeight || window.innerHeight;
    canvas.width = W; canvas.height = H;

    let wc = {};
    function updateWaveCache() {
      const stretch = 0.88;
      wc = {
        stretch, b01s: 0.1 * stretch,
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

    const onResize = () => {
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || window.innerHeight;
      canvas.width = W; canvas.height = H;
      resizeBuffer(W, H); updateWaveCache();
      needsRedraw = true; dotsDirty = true;
    };
    window.addEventListener('resize', onResize);

    let mouseX = -1, mouseY = -1;
    const onMouseMove = e => { mouseX = e.clientX; mouseY = e.clientY; };
    const onMouseLeave = () => { mouseX = -1; mouseY = -1; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

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
      if (needsFontRedrawRef.current) { charFontMapRef.current = null; needsFontRedrawRef.current = false; }
      const w = offCanvas.width, h = offCanvas.height;

      // SVG / image mode — use alpha channel to find shape
      if (svgModeRef.current && svgImgRef.current) {
        const img = svgImgRef.current;
        const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.9;
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        const dx = (w - dw) / 2, dy = (h - dh) / 2;

        // Draw to temp canvas to read alpha
        const tmp = document.createElement('canvas');
        tmp.width = w; tmp.height = h;
        const tctx = tmp.getContext('2d');
        tctx.drawImage(img, dx, dy, dw, dh);
        const tmpPx = tctx.getImageData(0, 0, w, h).data;

        // Paint white where image has content (non-transparent or dark)
        offCtx.fillStyle = '#000';
        offCtx.fillRect(0, 0, w, h);
        const id = offCtx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < tmpPx.length; i += 4) {
          // Use alpha for SVG, brightness for raster
          const bright = (tmpPx[i] + tmpPx[i+1] + tmpPx[i+2]) / 3;
          const hasContent = tmpPx[i+3] > 30 ? true : bright < 200;
          if (hasContent) { d[i] = 255; d[i+1] = 255; d[i+2] = 255; d[i+3] = 255; }
        }
        offCtx.putImageData(id, 0, 0);
        pixelData = d;
        needsRedraw = false; dotsDirty = true;
        return;
      }

      // Text mode
      const rawLines = (textRef.current || 'UMPRUM\nType').split('\n');
      const lines = W < 600
        ? rawLines.flatMap(line => {
            const chunks = [];
            for (let i = 0; i < line.length; i += 4) chunks.push(line.slice(i, i + 4));
            return chunks.length ? chunks : [''];
          })
        : rawLines;
      const fonts = loadedFontsRef.current;
      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#000'; offCtx.fillRect(0, 0, w, h);
      offCtx.letterSpacing = '0px';
      let fontSize = Math.max(20, (h * 0.8) / (lines.length || 1));
      if (!charFontMapRef.current) {
        const map = {};
        lines.forEach((line, li) => { [...line].forEach((ch, ci) => { map[`${li}_${ci}`] = getCharFont(fonts, li, ci); }); });
        charFontMapRef.current = map;
      }
      let lineData = buildLineData(lines, fontSize);
      const maxLineW = lineData.reduce((m, ld) => Math.max(m, ld.totalW), 0);
      if (W < 600 && maxLineW > 0) { fontSize = fontSize * (w * 0.97) / maxLineW; lineData = buildLineData(lines, fontSize); }
      else if (maxLineW > w * 0.9) { fontSize = fontSize * (w * 0.9) / maxLineW; lineData = buildLineData(lines, fontSize); }
      offCtx.fillStyle = '#fff'; offCtx.textAlign = 'left'; offCtx.textBaseline = 'middle';
      const lh = fontSize * 0.85;
      const startY = (h - lines.length * lh) / 2 + lh / 2;
      function drawLine(ld, li) {
        let x = (w - ld.totalW) / 2; const y = startY + li * lh;
        ld.items.forEach(({ ch, cw, fontStr }) => { offCtx.font = fontStr; offCtx.fillText(ch, x, y); x += cw; });
      }
      offCtx.filter = 'blur(6px)'; lineData.forEach((ld, li) => drawLine(ld, li));
      offCtx.filter = 'none';     lineData.forEach((ld, li) => drawLine(ld, li));
      pixelData = offCtx.getImageData(0, 0, w, h).data;
      needsRedraw = false; dotsDirty = true;
    }

    function buildDots(w, h) {
      const bw = offCanvas.width, bh = offCanvas.height;
      const inv = 1 / bufScale;
      const MAX_PARTICLES = QUALITY_PARTICLES[qualityRef.current - 1];
      let step = qualityRef.current <= 2 ? Math.max(2, Math.round(bw / 500)) : 1;
      while ((bw * bh) / (step * step) > MAX_PARTICLES) step++;
      const txs = [], tys = [];
      for (let y = 0; y < bh; y += step)
        for (let x = 0; x < bw; x += step)
          if (pixelData[(y * bw + x) * 4] > 100) { txs.push(x); tys.push(y); }
      const srcN = txs.length;
      const skip = srcN > MAX_PARTICLES ? Math.ceil(srcN / MAX_PARTICLES) : 1;
      const newN = Math.ceil(srcN / skip);
      const prevX = dotsX, prevY = dotsY, prevN = nDots;
      const cx = w / 2, cy = h / 2;
      dotsX = new Float32Array(newN); dotsY = new Float32Array(newN);
      dotsBX = new Float32Array(newN); dotsBY = new Float32Array(newN);
      nDots = 0;
      for (let si = 0; si < srcN && nDots < newN; si += skip) {
        const bx = txs[si] * inv, by = tys[si] * inv;
        if (prevX && nDots < prevN) {
          const px = prevX[nDots], py = prevY[nDots];
          const a = Math.atan2(py - cy, px - cx);
          dotsX[nDots] = px + Math.cos(a) * 60; dotsY[nDots] = py + Math.sin(a) * 60;
        } else { dotsX[nDots] = cx; dotsY[nDots] = cy; }
        dotsBX[nDots] = bx; dotsBY[nDots] = by; nDots++;
      }
      dotsDirty = false;
    }

    const FRAME_MS = reducedMotion ? 125 : 1000 / 60;
    let lastTs = 0, frameCount = 0;

    function loop(ts) {
      rafId = requestAnimationFrame(loop);
      const dt = ts - lastTs;
      if (dt < FRAME_MS) return;
      lastTs = ts - (dt % FRAME_MS);
      frameCount++;

      if (needsRedrawExtRef.current) { needsRedraw = true; needsRedrawExtRef.current = false; }
      if (qualityRef.current !== prevQuality) { prevQuality = qualityRef.current; dotsDirty = true; }
      if (needsRedraw || needsFontRedrawRef.current) renderTextToBuffer();

      const cur = effectRef.current;
      const { bg, fg } = colorsRef.current;
      ctx.fillStyle = toCSSColor(bg); ctx.fillRect(0, 0, W, H);
      if (!pixelData) return;
      const fgCSS = toCSSColor(fg);
      const time = frameCount * 0.022;

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
            const dx = mouseX - bx, dy = mouseY - by;
            const dist2 = dx * dx + dy * dy;
            const pull = dist2 < 14400 ? 1 - dist2 / 14400 : 0;
            x += (bx + (mouseX - bx) * pull * 0.35 - x) * 0.014;
            y += (by + (mouseY - by) * pull * 0.35 - y) * 0.014;
          } else {
            x += (bx - x) * 0.014; y += (by - y) * 0.014;
          }
          dotsX[i] = x; dotsY[i] = y;
          dotPath.moveTo(x + 1.5, y); dotPath.arc(x, y, 1.5, 0, TWO_PI);
        }
        ctx.fill(dotPath);
      } else {
        prevEffect = 'waves';
        const { offX, offY, b01s, stretch, extX, extY } = wc;
        const sinTime = Math.sin(time), cosTime = Math.cos(time);
        const sin2 = Math.sin(time * 0.7), cos3 = Math.cos(time * 1.3);
        ctx.strokeStyle = fgCSS; ctx.lineWidth = 0.8; ctx.globalAlpha = 12 / 255;
        ctx.beginPath();
        const waveStep = QUALITY_WAVE_STEP[qualityRef.current - 1];
        for (let a = -extY; a < H + extY; a += waveStep) {
          const aOff = a - offY;
          const sinA = Math.sin(aOff * 0.003 + time * b01s * 5);
          const cosA = Math.cos(aOff * 0.002 - time * b01s);
          let first = true;
          for (let b = -extX; b < W + extX; b += 3) {
            const bOff = b - offX;
            const wave = sinA * 40 + cosA * 20 +
              sinTime * 15 * Math.sin(bOff * 0.008) + cosTime * 10 * Math.cos(aOff * 0.005 + bOff * 0.003) +
              sin2 * 8 * Math.sin(bOff * 0.012 + aOff * 0.004) + cos3 * 6 * Math.cos(bOff * 0.006 - aOff * 0.007);
            const sx = (bOff + wave * 0.3) * stretch + offX;
            const sy = (aOff + wave) * stretch + offY;
            if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    renderTextToBuffer();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      canvas.remove();
      offCanvas = null; offCtx = null; pixelData = null;
      dotsX = dotsY = dotsBX = dotsBY = null; nDots = 0;
    };
  }, []);

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        svgImgRef.current = img;
        svgModeRef.current = true;
        needsRedrawExtRef.current = true;
        setSvgMode(true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    svgImgRef.current = null;
    svgModeRef.current = false;
    needsRedrawExtRef.current = true;
    setSvgMode(false);
  }

  return (
    <div className="studio">
      <div ref={containerRef} className="studio__canvas" />

      <button className="studio-toggle" onClick={() => setPanelOpen(p => !p)}>
        {panelOpen ? '×' : 'Edit'}
      </button>

      <aside className={`studio-panel${panelOpen ? ' is-open' : ''}`}>
        <div className="studio-panel__inner">

          <section className="studio-section">
            <label className="studio-label">Text</label>
            <textarea
              className="studio-textarea"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type something…"
              rows={5}
            />
          </section>

          <section className="studio-section">
            <label className="studio-label">Image <span className="studio-hint">SVG · PNG · JPG</span></label>
            <label className="studio-upload">
              <input type="file" accept=".svg,.png,.jpg,.jpeg,image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              {svgMode ? 'Image loaded — click to replace' : 'Upload file'}
            </label>
            {svgMode && <button className="studio-clear" onClick={clearImage}>Clear image</button>}
          </section>

          <section className="studio-section">
            <label className="studio-label">Effect</label>
            <div className="studio-pills">
              {['dots', 'waves'].map(e => (
                <button key={e} className={`studio-pill${effect === e ? ' is-active' : ''}`} onClick={() => setEffect(e)}>{e}</button>
              ))}
            </div>
          </section>

          <section className="studio-section">
            <label className="studio-label">Palette</label>
            <div className="studio-pills">
              {PALETTE_CYCLE.map(p => (
                <button key={p.key} className={`studio-pill${palette === p.key ? ' is-active' : ''}`} onClick={() => setPalette(p.key)}>
                  {PALETTE_LABELS[p.key]}
                </button>
              ))}
            </div>
          </section>

          <section className="studio-section">
            <label className="studio-label">
              Quality <span className="studio-hint">{quality} / 5</span>
            </label>
            <input type="range" min="1" max="5" step="1" value={quality}
              onChange={e => setQuality(+e.target.value)} className="studio-slider" />
          </section>

        </div>
      </aside>
    </div>
  );
}
