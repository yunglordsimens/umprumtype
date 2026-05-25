import { useEffect, useRef, useState } from 'react';

const DEFAULT_WORD = 'UMPRUM TYPE';

export default function HeroSketch() {
  const containerRef = useRef(null);
  const [effect, setEffect] = useState('waves');

  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const colorsRef = useRef({ bg: 0, fg: 255 });
  useEffect(() => {
    colorsRef.current = isDark ? { bg: 255, fg: 0 } : { bg: 0, fg: 255 };
  }, [isDark]);

  const effectRef = useRef(effect);
  useEffect(() => { effectRef.current = effect; }, [effect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let p5Instance;

    // Native canvas buffer — bypasses p5 v2.x filter bugs
    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d');
    let pixelData = null;
    let typed = '';
    let needsRedraw = true;

    function resizeBuffer(w, h) {
      offCanvas.width = w;
      offCanvas.height = h;
    }

    function renderTextToBuffer() {
      const w = offCanvas.width;
      const h = offCanvas.height;
      const word = typed || DEFAULT_WORD;
      const fontSize = Math.max(72, h * 0.16);

      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, w, h);

      offCtx.fillStyle = '#fff';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.font = `${fontSize}px "Times New Roman", serif`;

      // Soft glow layers
      offCtx.filter = 'blur(16px)';
      offCtx.globalAlpha = 0.5;
      offCtx.fillText(word, w / 2, h / 2);

      offCtx.filter = 'blur(6px)';
      offCtx.globalAlpha = 0.75;
      offCtx.fillText(word, w / 2, h / 2);

      // Sharp text
      offCtx.filter = 'none';
      offCtx.globalAlpha = 1;
      offCtx.fillText(word, w / 2, h / 2);

      pixelData = offCtx.getImageData(0, 0, w, h).data;
      needsRedraw = false;
    }

    import('p5').then(({ default: p5 }) => {
      const sketch = p => {
        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.frameRate(30);
          resizeBuffer(p.width, p.height);
          renderTextToBuffer();
        };

        p.draw = () => {
          if (needsRedraw) renderTextToBuffer();

          const { bg, fg } = colorsRef.current;
          p.background(bg);

          if (effectRef.current === 'waves') {
            if (!pixelData) return;
            p.stroke(fg);
            p.noFill();
            p.strokeWeight(0.75);

            const w = offCanvas.width;
            const h = offCanvas.height;

            for (let a = 0; a < h; a += 4) {
              p.beginShape();
              for (let b = 0; b < w; b += 3) {
                const idx = (a * w + b) * 4;
                const brightness = pixelData[idx]; // R channel — white text on black

                // Adapted from Processing: diagonal lean + brightness displacement
                const vx = b + a * 0.08;
                const vy = a - brightness * 0.22;
                p.vertex(vx, vy);
              }
              p.endShape();
            }
          } else {
            // Perlin noise particles
            p.noStroke();
            p.fill(fg);
            const t = p.frameCount * 0.007;
            const freq = 0.004;
            for (let y = 0; y < p.height; y += 8) {
              for (let x = 0; x <= p.width; x += 8) {
                const n = p.noise(x * freq, y * freq * 1.5, t);
                const size = p.map(n, 0, 1, 0.3, 3.5);
                if (n > 0.45) p.ellipse(x + p.map(n, 0.45, 1, 0, 6), y + p.map(n, 0.45, 1, 0, 6), size, size);
              }
            }
          }
        };

        p.keyReleased = () => {
          if (p.keyCode === p.BACKSPACE) typed = typed.slice(0, -1);
          else if (p.key && p.key.length === 1) typed += p.key;
          needsRedraw = true;
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
      p5Instance?.remove();
      offCanvas = null;
      offCtx = null;
      pixelData = null;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
      <div className="hero-controls">
        <div className="tf-sort">
          {['waves', 'particles'].map(e => (
            <button key={e} aria-pressed={effect === e} onClick={() => setEffect(e)}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
