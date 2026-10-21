import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Homepage hero — WebGL2. All per-frame motion runs on the GPU; the CPU only
// rasterises the text once per change. No quality slider needed.

// dots/waves keep the exhibition text; glyphs carries the open day
const OLD_TEXT = 'typoumprum.doc\n4-9/6/2026\nKasárny Karlín\nC12.02';
const OPEN_DAY_TEXT = 'den\notevřených\ndveří 22/10';
const OPEN_DAY_CAPTION = '22/10/2026 · 10–18 · Kasárny Karlín, C12.02';
const SCRAMBLE = 'abcdefghijklmnopqrstuvwxyz0123456789&@#%*+=/';
const EFFECTS = ['glyphs', 'dots', 'waves'];
const textFor = e => (e === 'glyphs' ? OPEN_DAY_TEXT : OLD_TEXT);

// colour button: each effect flips black/white to its own accent on black
const ACCENTS = {
  dots:  { fg: [245, 196, 18], label: 'Y/B' },
  waves: { fg: [230, 38, 28],  label: 'R/B' },
};
const readTheme = () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
function colorsFor(effect, accent, theme) {
  if (accent && ACCENTS[effect]) return { bg: [0, 0, 0], fg: ACCENTS[effect].fg, light: false };
  return theme === 'dark' ? { bg: 0, fg: 255, light: false } : { bg: 255, fg: 0, light: true };
}

const FONT_COUNT = 10;        // random typefaces loaded per visit (was: all)
const FONT_WAIT_MS = 1400;    // morph to real fonts once they arrive, or give up
const DUR = 1.2;              // seconds a dot takes to reach its target
const TRAIL = 16;             // mouse wake points
const TILE = 48;              // glyph atlas tile, px
const ATLAS_COLS = 32;
const GLYPH_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&@#%*+=:.-/?!';

function toRGB(c) { return Array.isArray(c) ? c.map(v => v / 255) : [c / 255, c / 255, c / 255]; }
function toCSS(c) { return Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgb(${c},${c},${c})`; }
function ease(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return 1 - Math.pow(1 - t, 4); }

// shared GLSL: mouse wake + click shockwave
const GLSL_FORCES = `
uniform vec4 uTrail[${TRAIL}];
uniform vec3 uShock;
uniform float uTime;
vec2 forces(vec2 p, float push, float swirl, float shock){
  vec2 disp = vec2(0.);
  for(int i = 0; i < ${TRAIL}; i++){
    vec4 m = uTrail[i];
    if(m.z <= 0.002) continue;
    vec2 d = p - m.xy; float dist = length(d);
    if(dist < 120.){
      float f = 1. - dist / 120.; f = f * f * m.z;
      vec2 dir = d / (dist + 0.0001);
      disp += dir * f * push + vec2(-dir.y, dir.x) * f * swirl;
    }
  }
  float dl = length(disp); if(dl > 90.) disp *= 90. / dl;
  if(uShock.z >= 0.){
    float age = uTime - uShock.z;
    if(age < 1.4){
      vec2 d = p - uShock.xy; float dist = length(d) + 0.0001;
      float band = 1. - clamp(abs(dist - age * 700.) / 60., 0., 1.);
      disp += d / dist * band * band * shock * (1. - age / 1.4);
    }
  }
  return disp;
}
vec4 toClip(vec2 p, vec2 res){ vec2 c = p / res * 2. - 1.; return vec4(c.x, -c.y, 0., 1.); }
`;

const VS_DOTS = `#version 300 es
precision highp float;
in vec2 aStart; in vec2 aTarget; in float aSeed;
uniform vec2 uRes; uniform float uDpr; uniform float uMorphT; uniform float uSpread;
uniform float uSize; uniform float uMotion;
${GLSL_FORCES}
void main(){
  float t = clamp((uMorphT - aSeed * uSpread) / ${DUR.toFixed(2)}, 0., 1.);
  vec2 p = mix(aStart, aTarget, 1. - pow(1. - t, 4.));
  float ph = aSeed * 6.2831;
  p += uMotion * vec2(sin(uTime * 0.9 + ph), cos(uTime * 0.7 + ph * 1.3)) * 0.6;
  p += uMotion * forces(p, 24., 38., 28.);
  gl_Position = toClip(p, uRes);
  gl_PointSize = uSize * uDpr;
}`;

const FS_DOTS = `#version 300 es
precision mediump float;
uniform vec3 uColor; out vec4 o;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.36, r);
  if(a <= 0.) discard;
  o = vec4(uColor, a);
}`;

const VS_WAVES = `#version 300 es
precision highp float;
in vec2 aGrid;
uniform sampler2D uText; uniform vec2 uRes; uniform vec2 uOff; uniform float uStretch;
uniform float uT; uniform float uMotion;
${GLSL_FORCES}
void main(){
  float b = aGrid.x, a = aGrid.y;
  float c = 0.;
  if(b >= 0. && a >= 0. && b < uRes.x && a < uRes.y) c = texture(uText, vec2(b, a) / uRes).r * 255.;
  float s = uStretch, b01s = 0.1 * s;
  float noise = sin(b * 0.007 + a * 0.004 + uT * 0.18) * 8. + sin(b * 0.013 - a * 0.007 - uT * 0.13) * 5.;
  float wd = sin(b * 0.02 - uT * 2.5) * 6. + cos(a * 0.02 + uT * 1.5) * 4.;
  float disp = (noise + wd) * (c >= 150. ? 0. : 1. - c * 0.006667) * uMotion;
  vec2 p = vec2(b * s + a * 0.4 * s, a * s - c * b01s - b * b01s + disp) + uOff;
  p += uMotion * forces(p, 18., 0., 22.);
  gl_Position = toClip(p, uRes);
}`;

const FS_WAVES = `#version 300 es
precision mediump float;
uniform vec3 uColor; uniform float uAlpha; out vec4 o;
void main(){ o = vec4(uColor, uAlpha); }`;

// glyphs: a grid of characters cut from the school's typefaces. Cells flicker
// through random glyphs as a wave passes, then lock into a density ramp of the
// text mask. The pointer (and clicks) shake cells loose again.
const VS_GLYPHS = `#version 300 es
precision highp float;
in vec2 aCell; in float aSeed;
uniform vec2 uRes; uniform float uCell; uniform sampler2D uText; uniform float uTiles;
uniform float uWaveT; uniform vec2 uOrigin; uniform float uSpeed; uniform float uJitter; uniform float uMotion;
${GLSL_FORCES}
out vec2 vUV; flat out float vTile; out float vAlpha;
float hash(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  int v = gl_VertexID;
  vec2 corner = vec2(float(v == 1 || v == 2 || v == 4), float(v == 2 || v == 4 || v == 5));
  vec2 c = (aCell + 0.5) * uCell;
  float b = texture(uText, c / uRes).r;
  float dist = length(c - uOrigin);
  float showAt = dist / (uSpeed * 1.8) + aSeed * 0.12;
  float lockAt = dist / uSpeed + aSeed * uJitter + 0.15;

  float m = 0.;
  for(int i = 0; i < ${TRAIL}; i++){
    vec4 tr = uTrail[i];
    if(tr.z <= 0.002) continue;
    float d = length(c - tr.xy);
    if(d < 110.) m = max(m, (1. - d / 110.) * tr.z);
  }
  if(uShock.z >= 0.){
    float age = uTime - uShock.z;
    if(age < 1.2){
      float band = 1. - clamp(abs(length(c - uShock.xy) - age * 800.) / 50., 0., 1.);
      m = max(m, band * (1. - age / 1.2));
    }
  }
  m *= uMotion;

  bool ink = b > 0.5;     // letter body
  bool halo = b > 0.12;   // blurred glow around it
  float tile = 0., alpha = 0.;
  if(uWaveT >= showAt){
    if(uWaveT < lockAt || m > 0.25){
      tile = floor(hash(floor(uTime * 16. + aSeed * 91.) + aSeed * 7.) * uTiles);
      alpha = ink ? 1. : 0.28 + 0.5 * m;
    } else if(ink){
      float k = 0.5 + 0.5 * smoothstep(0.5, 1., b) + (aSeed - 0.5) * 0.15;
      tile = clamp(floor(k * (uTiles - 1.)), 0., uTiles - 1.);
      alpha = 1.;
    } else if(halo){
      tile = floor((0.05 + 0.25 * b) * (uTiles - 1.));
      alpha = 0.35;
    }
  }
  vec2 p = c + (corner - 0.5) * uCell * (1. + 0.6 * m);
  gl_Position = toClip(p, uRes);
  vUV = corner; vTile = tile; vAlpha = alpha;
}`;

const FS_GLYPHS = `#version 300 es
precision mediump float;
in vec2 vUV; flat in float vTile; in float vAlpha;
uniform sampler2D uAtlas; uniform vec2 uAtlasGrid; uniform vec3 uColor; out vec4 o;
void main(){
  if(vAlpha <= 0.) discard;
  vec2 cr = vec2(mod(vTile, uAtlasGrid.x), floor(vTile / uAtlasGrid.x));
  float a = texture(uAtlas, (cr + vUV) / uAtlasGrid).r * vAlpha;
  if(a < 0.01) discard;
  o = vec4(uColor, a);
}`;

// atlas of (char × typeface) tiles, sorted by ink coverage → density ramp
function buildAtlas(families) {
  const fams = [...families, null];
  const n = fams.length * GLYPH_CHARS.length;
  const rows = Math.ceil(n / ATLAS_COLS);
  const make = () => { const c = document.createElement('canvas'); c.width = ATLAS_COLS * TILE; c.height = rows * TILE; return c; };
  const raw = make(), rc = raw.getContext('2d', { willReadFrequently: true });
  rc.fillStyle = '#000'; rc.fillRect(0, 0, raw.width, raw.height);
  rc.fillStyle = '#fff'; rc.textAlign = 'center'; rc.textBaseline = 'middle';
  let i = 0;
  for (const fam of fams) {
    rc.font = `${Math.round(TILE * 0.72)}px ${fam ? `"${fam}", ` : ''}"Helvetica Neue", Helvetica, Arial, sans-serif`;
    for (const ch of GLYPH_CHARS) {
      rc.fillText(ch, (i % ATLAS_COLS + 0.5) * TILE, (Math.floor(i / ATLAS_COLS) + 0.55) * TILE);
      i++;
    }
  }
  const px = rc.getImageData(0, 0, raw.width, raw.height).data;
  const cov = [];
  for (let t = 0; t < n; t++) {
    const x0 = (t % ATLAS_COLS) * TILE, y0 = Math.floor(t / ATLAS_COLS) * TILE;
    let sum = 0;
    for (let y = 0; y < TILE; y += 2) for (let x = 0; x < TILE; x += 2) sum += px[((y0 + y) * raw.width + x0 + x) * 4];
    if (sum > 0) cov.push([sum, t]);
  }
  cov.sort((a, b) => a[0] - b[0]);
  const out = make(), oc = out.getContext('2d');
  oc.fillStyle = '#000'; oc.fillRect(0, 0, out.width, out.height);
  cov.forEach(([, t], k) => {
    oc.drawImage(raw, (t % ATLAS_COLS) * TILE, Math.floor(t / ATLAS_COLS) * TILE, TILE, TILE,
      (k % ATLAS_COLS) * TILE, Math.floor(k / ATLAS_COLS) * TILE, TILE, TILE);
  });
  return { canvas: out, tiles: cov.length, rows };
}

function compile(gl, vs, fs) {
  const mk = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name.replace('[0]', '');
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

export default function HeroSketch({ fontData = [] }) {
  const containerRef = useRef(null);
  const [effect, setEffect] = useState('glyphs');
  const [accent, setAccent] = useState(false);
  // 'light' matches SSR; synced from <html data-theme> after mount
  const [theme, setTheme] = useState('light');
  const [mobileSlot, setMobileSlot] = useState(null);

  const effectRef = useRef(effect);
  const colorsRef = useRef(colorsFor('glyphs', false, readTheme()));
  const [caption, setCaption] = useState('');
  const fontsReadyRef = useRef(null);   // set by the GL effect: (families) => void
  const effectSwitchRef = useRef(null); // set by the GL effect: () => void

  useEffect(() => {
    const changed = effectRef.current !== effect;
    effectRef.current = effect;
    if (changed) effectSwitchRef.current?.();
  }, [effect]);

  // follow the site theme (system or the nav toggle)
  useEffect(() => {
    setTheme(readTheme());
    setMobileSlot(document.getElementById('anim-controls-slot'));
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // caption decodes left→right through random glyphs
  useEffect(() => {
    if (effect !== 'glyphs') { setCaption(''); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCaption(OPEN_DAY_CAPTION); return; }
    const t0 = performance.now();
    const id = setInterval(() => {
      const k = (performance.now() - t0 - 500) / 1400;
      const lock = Math.floor(k * OPEN_DAY_CAPTION.length);
      setCaption([...OPEN_DAY_CAPTION].map((ch, i) =>
        i < lock || ch === ' ' ? ch : i < lock + 12 ? SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0] : ' '
      ).join(''));
      if (k >= 1.2) { setCaption(OPEN_DAY_CAPTION); clearInterval(id); }
    }, 45);
    return () => clearInterval(id);
  }, [effect]);

  // light theme → light page, dark → dark; accent palettes are always on black
  const colors = colorsFor(effect, accent, theme);
  useEffect(() => {
    const c = colorsFor(effect, accent, readTheme());
    colorsRef.current = c;
    document.body.classList.toggle('home-light', c.light);
    document.body.classList.toggle('home-dark', !c.light);
  }, [effect, accent, theme]);

  // Load only a few random typefaces, never block first paint on them
  useEffect(() => {
    if (!fontData.length) return;
    const pick = [...fontData].sort(() => Math.random() - 0.5).slice(0, FONT_COUNT);
    const loaded = [];
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      if (loaded.length) fontsReadyRef.current?.(loaded.slice());
    };
    const timer = setTimeout(finish, FONT_WAIT_MS);
    Promise.allSettled(pick.map(({ family, path, weight }) =>
      new FontFace(family, `url(${path})`, { weight: String(weight || 400) }).load()
        .then(f => { document.fonts.add(f); loaded.push(family); })
    )).then(() => { clearTimeout(timer); finish(); });
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'high-performance' });
    const ctx2d = gl ? null : canvas.getContext('2d', { alpha: false });

    let W = 0, H = 0, dpr = 1, mobile = false;
    let typed = '';
    let fonts = [];
    let charFont = null;

    // ── text raster (CPU, once per change) ──
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d', { willReadFrequently: true });
    let bufScale = 1, pixels = null;

    function layoutLines() {
      let lines = (typed || textFor(effectRef.current)).split('\n');
      if (W < 600) {
        lines = lines.flatMap(l => l.split(' ')).flatMap(w => {
          if (w.length <= 7) return [w];
          const half = Math.ceil(w.length / 2); // long words split in two halves
          return [w.slice(0, half), w.slice(half)];
        }).filter(Boolean);
      }
      return lines;
    }

    function renderText() {
      const BUF_MAX = 1200;
      bufScale = Math.min(1, BUF_MAX / Math.max(W, H));
      const w = off.width = Math.max(1, Math.round(W * bufScale));
      const h = off.height = Math.max(1, Math.round(H * bufScale));
      const lines = layoutLines();
      if (!charFont) {
        charFont = {};
        lines.forEach((line, li) => [...line].forEach((_, ci) => {
          charFont[`${li}_${ci}`] = fonts.length ? fonts[(li * 17 + ci * 13) % fonts.length] : null;
        }));
      }
      const build = size => lines.map((line, li) => {
        let total = 0;
        const items = [...line].map((ch, ci) => {
          const fam = effectRef.current === 'glyphs' && !typed ? null : charFont[`${li}_${ci}`];
          const font = `900 ${size}px ${fam ? `"${fam}", ` : ''}"Helvetica Neue", Helvetica, Arial, sans-serif`;
          offCtx.font = font;
          const cw = offCtx.measureText(ch).width;
          total += cw;
          return { ch, cw, font };
        });
        return { items, total };
      });
      let size = Math.max(20, (h * 0.8) / (lines.length || 1));
      let data = build(size);
      const maxW = data.reduce((m, d) => Math.max(m, d.total), 0);
      const limit = W < 600 ? 0.97 : 0.9;
      if (maxW > 0 && (W < 600 || maxW > w * limit)) {
        // fit width, but never taller than the screen
        size = Math.min(size * (w * limit) / maxW, (h * 0.9) / (lines.length * 0.85));
        data = build(size);
      }

      offCtx.fillStyle = '#000'; offCtx.fillRect(0, 0, w, h);
      offCtx.fillStyle = '#fff'; offCtx.textAlign = 'left'; offCtx.textBaseline = 'middle';
      const lh = size * 0.85;
      const y0 = (h - lines.length * lh) / 2 + lh / 2;
      const draw = () => data.forEach((d, li) => {
        let x = (w - d.total) / 2;
        d.items.forEach(({ ch, cw, font }) => { offCtx.font = font; offCtx.fillText(ch, x, y0 + li * lh); x += cw; });
      });
      offCtx.filter = 'blur(6px)'; draw();
      offCtx.filter = 'none'; draw();
      pixels = offCtx.getImageData(0, 0, w, h).data;
      if (gl) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
      }
    }

    // ── dot targets ──
    let N = 0, start = new Float32Array(0), target = new Float32Array(0), seed = new Float32Array(0);
    let morphAt = 0, spread = 0.7, pointSize = 2.5;

    function sampleTargets() {
      const bw = off.width, bh = off.height;
      let spacing = mobile ? 2.6 : 3.2;
      const cap = mobile ? 45000 : 90000;
      for (let attempt = 0; attempt < 6; attempt++) {
        const pts = [];
        for (let y = spacing / 2; y < H; y += spacing) {
          const by = Math.min(bh - 1, Math.round(y * bufScale));
          for (let x = spacing / 2; x < W; x += spacing) {
            const bx = Math.min(bw - 1, Math.round(x * bufScale));
            if (pixels[(by * bw + bx) * 4] > 110) {
              pts.push(x + (Math.random() - 0.5) * spacing * 0.35, y + (Math.random() - 0.5) * spacing * 0.35);
            }
          }
        }
        if (pts.length / 2 <= cap) { pointSize = spacing * 0.78; return new Float32Array(pts); }
        spacing *= Math.sqrt(pts.length / 2 / cap) * 1.02;
      }
      return new Float32Array(0);
    }

    function now() { return performance.now() / 1000; }

    function currentPos(i, t) {
      const k = ease((t - morphAt - seed[i] * spread) / DUR);
      return [start[2 * i] + (target[2 * i] - start[2 * i]) * k, start[2 * i + 1] + (target[2 * i + 1] - start[2 * i + 1]) * k];
    }

    function retarget(intro) {
      const next = sampleTargets();
      const n = next.length / 2;
      const t = now();
      const s = new Float32Array(n * 2), sd = new Float32Array(n);
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < n; i++) {
        if (intro || !N) {
          s[2 * i] = Math.random() * W; s[2 * i + 1] = Math.random() * H;
          sd[i] = 0.6 * (next[2 * i] / W) + 0.4 * Math.random();
        } else {
          const [px, py] = currentPos(Math.floor(i * N / n), t);
          const a = Math.atan2(py - cy, px - cx);
          s[2 * i] = px + Math.cos(a) * 30; s[2 * i + 1] = py + Math.sin(a) * 30;
          sd[i] = Math.random();
        }
      }
      start = s; target = next; seed = sd; N = n;
      morphAt = reduced ? -100 : t;
      spread = intro ? 0.7 : 0.25;
      if (gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufStart); gl.bufferData(gl.ARRAY_BUFFER, start, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufTarget); gl.bufferData(gl.ARRAY_BUFFER, target, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufSeed); gl.bufferData(gl.ARRAY_BUFFER, seed, gl.DYNAMIC_DRAW);
      }
    }

    // ── GL setup ──
    let dots, waves, vaoDots, vaoWaves, bufStart, bufTarget, bufSeed, bufGrid, bufIdx, tex;
    let waveCount = 0, waveOff = [0, 0];
    let glyphs, vaoGlyphs, bufCell, bufCellSeed, atlasTex, atlas = { tiles: 1, rows: 1 };
    let cellSize = 12, cellCount = 0;
    let wave = { t0: 0, origin: [0, 0], speed: 1100, jitter: 0.6 };
    const STRETCH = 0.88;

    if (gl) {
      dots = compile(gl, VS_DOTS, FS_DOTS);
      waves = compile(gl, VS_WAVES, FS_WAVES);
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      vaoDots = gl.createVertexArray();
      gl.bindVertexArray(vaoDots);
      const attr = (prog, name, size) => {
        const b = gl.createBuffer();
        const loc = gl.getAttribLocation(prog.p, name);
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        return b;
      };
      bufStart = attr(dots, 'aStart', 2);
      bufTarget = attr(dots, 'aTarget', 2);
      bufSeed = attr(dots, 'aSeed', 1);

      glyphs = compile(gl, VS_GLYPHS, FS_GLYPHS);
      vaoGlyphs = gl.createVertexArray();
      gl.bindVertexArray(vaoGlyphs);
      bufCell = attr(glyphs, 'aCell', 2);
      bufCellSeed = attr(glyphs, 'aSeed', 1);
      gl.vertexAttribDivisor(gl.getAttribLocation(glyphs.p, 'aCell'), 1);
      gl.vertexAttribDivisor(gl.getAttribLocation(glyphs.p, 'aSeed'), 1);
      atlasTex = gl.createTexture();

      vaoWaves = gl.createVertexArray();
      gl.bindVertexArray(vaoWaves);
      bufGrid = attr(waves, 'aGrid', 2);
      bufIdx = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx);
      gl.bindVertexArray(null);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    function buildWaveGrid() {
      const s = STRETCH;
      waveOff = [W / 2 - (W / 2 + H / 2 * 0.4) * s, H / 2 - (H / 2 - W / 2 * 0.1) * s + H * 0.06];
      const extX = Math.floor(H * 0.4), extY = Math.floor(W * 0.15);
      const rowStep = mobile ? 9 : 7, colStep = 6;
      const cols = Math.ceil((W + 2 * extX) / colStep);
      const rows = Math.ceil((H + 2 * extY) / rowStep);
      const grid = new Float32Array(rows * cols * 2);
      const idx = new Uint32Array(rows * (cols - 1) * 2);
      let g = 0, k = 0;
      for (let r = 0; r < rows; r++) {
        const a = -extY + r * rowStep;
        for (let c = 0; c < cols; c++) {
          grid[g++] = -extX + c * colStep; grid[g++] = a;
          if (c > 0) { const v = r * cols + c; idx[k++] = v - 1; idx[k++] = v; }
        }
      }
      waveCount = k;
      gl.bindVertexArray(vaoWaves);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufGrid); gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
    }

    function uploadAtlas(families) {
      if (!gl) return;
      atlas = buildAtlas(families);
      gl.bindTexture(gl.TEXTURE_2D, atlasTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    function buildCells() {
      cellSize = mobile ? 8 : 10;
      const cols = Math.ceil(W / cellSize), rows = Math.ceil(H / cellSize);
      cellCount = cols * rows;
      const cells = new Float32Array(cellCount * 2), seeds = new Float32Array(cellCount);
      for (let r = 0, k = 0; r < rows; r++) for (let c = 0; c < cols; c++, k++) {
        cells[2 * k] = c; cells[2 * k + 1] = r; seeds[k] = Math.random();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, bufCell); gl.bufferData(gl.ARRAY_BUFFER, cells, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufCellSeed); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    }

    // a scramble wave rolling out from a point; cells lock behind it
    function startWave(origin, speed, jitter) {
      wave = { t0: reduced ? -100 : now(), origin, speed, jitter };
    }

    function measure() {
      W = container.offsetWidth || window.innerWidth;
      H = container.offsetHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      mobile = W < 720;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      if (gl) { gl.viewport(0, 0, canvas.width, canvas.height); buildWaveGrid(); buildCells(); }
    }

    // ── input ──
    const trail = new Float32Array(TRAIL * 4); // [0] = live pointer, rest = wake ring
    let ring = 1, lastX = -1e4, lastY = -1e4, hover = false, px = -1, py = -1;
    let shock = [0, 0, -1];

    const onMove = (x, y) => {
      const r = canvas.getBoundingClientRect();
      px = x - r.left; py = y - r.top;
      hover = px >= 0 && py >= 0 && px < W && py < H;
      if (hover && Math.hypot(px - lastX, py - lastY) > 10) {
        trail[ring * 4] = px; trail[ring * 4 + 1] = py; trail[ring * 4 + 2] = 1;
        ring = ring + 1 >= TRAIL ? 1 : ring + 1;
        lastX = px; lastY = py;
      }
    };
    const onMouse = e => onMove(e.clientX, e.clientY);
    const onLeave = () => { hover = false; };
    const onTouch = e => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onDown = e => {
      const r = canvas.getBoundingClientRect();
      shock = [e.clientX - r.left, e.clientY - r.top, now()];
    };
    let textTimer;
    const onKey = e => {
      if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
      if (e.key === 'Backspace') typed = typed.slice(0, -1);
      else if (e.key === 'Enter') typed += '\n';
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typed += e.key.toUpperCase();
      else return;
      charFont = null;
      clearTimeout(textTimer);
      textTimer = setTimeout(() => {
        renderText(); retarget(false); drawFallback();
        if (effectRef.current === 'glyphs') startWave([W / 2, H / 2], 3000, 0.2);
      }, 80);
    };
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { measure(); charFont = null; renderText(); retarget(false); drawFallback(); }, 150);
    };

    if (!reduced) {
      window.addEventListener('mousemove', onMouse);
      document.documentElement.addEventListener('mouseleave', onLeave);
      canvas.addEventListener('touchstart', onTouch, { passive: true });
      canvas.addEventListener('touchmove', onTouch, { passive: true });
      canvas.addEventListener('touchend', onLeave);
      canvas.addEventListener('pointerdown', onDown);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    fontsReadyRef.current = families => {
      fonts = families; charFont = null;
      renderText(); retarget(false); drawFallback();
      uploadAtlas(families);
      startWave([W / 2, H / 2], 2600, 0.25);
    };

    effectSwitchRef.current = () => {
      if (typed) return;
      charFont = null;
      renderText(); retarget(false); drawFallback();
      if (effectRef.current === 'glyphs') startWave(hover ? [px, py] : [W / 2, H / 2], 1600, 0.4);
    };

    // ── no-WebGL fallback: static dots ──
    function drawFallback() {
      if (gl) return;
      const { bg, fg } = colorsRef.current;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.fillStyle = toCSS(bg); ctx2d.fillRect(0, 0, W, H);
      ctx2d.fillStyle = toCSS(fg);
      const p = new Path2D(), r = pointSize / 2;
      for (let i = 0; i < N; i++) { p.moveTo(target[2 * i] + r, target[2 * i + 1]); p.arc(target[2 * i], target[2 * i + 1], r, 0, 6.2832); }
      ctx2d.fill(p);
    }

    // ── frame loop ──
    let raf, prev = now(), fallbackColors = '';
    const t0 = now();

    function frame() {
      raf = requestAnimationFrame(frame);
      const t = now(), dt = Math.min(0.1, t - prev); prev = t;
      if (!gl) {
        const key = JSON.stringify(colorsRef.current);
        if (key !== fallbackColors) { fallbackColors = key; drawFallback(); }
        return;
      }
      // wake decays, live pointer eases in/out
      const decay = Math.exp(-dt / 0.45);
      for (let i = 1; i < TRAIL; i++) trail[i * 4 + 2] *= decay;
      trail[0] = px; trail[1] = py;
      trail[2] += ((hover ? 1 : 0) - trail[2]) * Math.min(1, dt * 8);

      const { bg, fg } = colorsRef.current;
      const [br, bgG, bb] = toRGB(bg);
      gl.clearColor(br, bgG, bb, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const time = t - t0;
      const motion = reduced ? 0 : 1;
      const shockT = shock[2] >= 0 ? [shock[0], shock[1], shock[2] - t0] : [0, 0, -1];

      if (effectRef.current === 'glyphs') {
        const { u } = glyphs;
        gl.useProgram(glyphs.p);
        gl.uniform2f(u.uRes, W, H);
        gl.uniform1f(u.uCell, cellSize);
        gl.uniform1f(u.uTiles, atlas.tiles);
        gl.uniform2f(u.uAtlasGrid, ATLAS_COLS, atlas.rows);
        gl.uniform1f(u.uWaveT, t - wave.t0);
        gl.uniform2f(u.uOrigin, wave.origin[0], wave.origin[1]);
        gl.uniform1f(u.uSpeed, wave.speed);
        gl.uniform1f(u.uJitter, wave.jitter);
        gl.uniform1f(u.uTime, time);
        gl.uniform1f(u.uMotion, motion);
        gl.uniform4fv(u.uTrail, trail);
        gl.uniform3fv(u.uShock, shockT);
        gl.uniform3fv(u.uColor, toRGB(fg));
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(u.uText, 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atlasTex);
        gl.uniform1i(u.uAtlas, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindVertexArray(vaoGlyphs);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, cellCount);
      } else if (effectRef.current === 'waves') {
        const { u } = waves;
        gl.useProgram(waves.p);
        gl.uniform2f(u.uRes, W, H);
        gl.uniform2f(u.uOff, waveOff[0], waveOff[1]);
        gl.uniform1f(u.uStretch, STRETCH);
        gl.uniform1f(u.uT, time * 1.32);
        gl.uniform1f(u.uTime, time);
        gl.uniform1f(u.uMotion, motion);
        gl.uniform4fv(u.uTrail, trail);
        gl.uniform3fv(u.uShock, shockT);
        gl.uniform3fv(u.uColor, toRGB(fg));
        gl.uniform1f(u.uAlpha, dpr < 1.5 ? 0.7 : 1);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(u.uText, 0);
        gl.bindVertexArray(vaoWaves);
        gl.drawElements(gl.LINES, waveCount, gl.UNSIGNED_INT, 0);
      } else if (N) {
        const { u } = dots;
        gl.useProgram(dots.p);
        gl.uniform2f(u.uRes, W, H);
        gl.uniform1f(u.uDpr, dpr);
        gl.uniform1f(u.uTime, time);
        gl.uniform1f(u.uMorphT, t - morphAt);
        gl.uniform1f(u.uSpread, spread);
        gl.uniform1f(u.uSize, pointSize);
        gl.uniform1f(u.uMotion, motion);
        gl.uniform4fv(u.uTrail, trail);
        gl.uniform3fv(u.uShock, shockT);
        gl.uniform3fv(u.uColor, toRGB(fg));
        gl.bindVertexArray(vaoDots);
        gl.drawArrays(gl.POINTS, 0, N);
      }
      gl.bindVertexArray(null);
    }

    measure();
    renderText();
    retarget(true);
    uploadAtlas([]);
    startWave([W / 2, H / 2], 1100, 0.6);
    drawFallback();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(textTimer); clearTimeout(resizeTimer);
      fontsReadyRef.current = null;
      effectSwitchRef.current = null;
      window.removeEventListener('mousemove', onMouse);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  const controls = (
    <div className="tf-sort">
      {EFFECTS.map(e => (
        <button key={e} aria-pressed={effect === e} onClick={() => setEffect(e)}>{e}</button>
      ))}
      {ACCENTS[effect] && (
        <button className="hero-palette-cycle" onClick={() => setAccent(a => !a)} aria-label="Switch colours">
          {accent ? ACCENTS[effect].label : 'B/W'}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div className={['hero-controls', colors.light ? 'hero-controls--light' : ''].filter(Boolean).join(' ')}>
        {controls}
      </div>
      <div ref={containerRef} style={{ flex: 1, width: '100%', overflow: 'hidden', position: 'relative' }} />
      {effect === 'glyphs' && <p className="hero-caption" aria-label={OPEN_DAY_CAPTION}>{caption}</p>}
      <p className="hero-type-hint">Try to type · click</p>
      {mobileSlot && createPortal(<div className="hero-controls-mobile">{controls}</div>, mobileSlot)}
    </div>
  );
}
