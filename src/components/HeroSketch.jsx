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

    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d');
    let pixelData = null;
    let typed = '';
    let needsRedraw = true;

    // Native listener — p.keyReleased is unreliable in p5 v2 instance mode
    const onKey = (e) => {
      if (e.key === 'Backspace') {
        typed = typed.slice(0, -1);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typed += e.key.toUpperCase();
      } else {
        return;
      }
      needsRedraw = true;
    };
    window.addEventListener('keydown', onKey);

    function resizeBuffer(w, h) {
      offCanvas.width = w;
      offCanvas.height = h;
    }

    function renderTextToBuffer() {
      const w = offCanvas.width;
      const h = offCanvas.height;
      const word = typed || DEFAULT_WORD;

      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, w, h);

      // Auto-fit font so text fills ~85% of canvas width
      let fontSize = Math.max(60, h * 0.22);
      offCtx.font = `${fontSize}px "Times New Roman", serif`;
      const measured = offCtx.measureText(word).width;
      if (measured > w * 0.85) fontSize *= (w * 0.85) / measured;

      offCtx.filter = 'none';
      offCtx.globalAlpha = 1;
      offCtx.fillStyle = '#fff';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.font = `${fontSize}px "Times New Roman", serif`;
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

            for (let a = 0; a < h; a += 5) {
              p.beginShape();
              for (let b = 0; b < w; b += 3) {
                const idx = (a * w + b) * 4;
                const brightness = pixelData[idx];
                const vx = b + a * 0.06;
                const vy = a - brightness * 0.18;
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
