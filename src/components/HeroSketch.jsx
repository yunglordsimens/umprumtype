import { useEffect, useRef, useState } from 'react';

const DEFAULT_WORD = 'ARTSEMESTR\nSS26\nKŘIŽÍKOVA 12\n[C11]\n03—10/06';

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

  const colorsRef = useRef({ bg: 240, fg: 20 });
  useEffect(() => {
    colorsRef.current = isDark ? { bg: 20, fg: 235 } : { bg: 240, fg: 20 };
  }, [isDark]);

  const effectRef = useRef(effect);
  useEffect(() => { effectRef.current = effect; }, [effect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let p5Instance;

    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    let pixelData = null;
    let typed = '';
    let needsRedraw = true;

    const onKey = (e) => {
      if (e.key === 'Backspace') {
        typed = typed.slice(0, -1);
      } else if (e.key === 'Enter') {
        typed += '\n';
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
      const textToRender = typed || DEFAULT_WORD;
      const lines = textToRender.split('\n');

      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = '#000';
      offCtx.fillRect(0, 0, w, h);

      let fontSize = Math.max(20, (h * 0.8) / (lines.length || 1));
      offCtx.font = `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

      let maxLineWidth = 0;
      lines.forEach(line => {
        const width = offCtx.measureText(line).width;
        if (width > maxLineWidth) maxLineWidth = width;
      });
      if (maxLineWidth > w * 0.9) fontSize *= (w * 0.9) / maxLineWidth;

      offCtx.fillStyle = '#fff';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.font = `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      offCtx.letterSpacing = '-2px';

      const lineHeight = fontSize * 0.85;
      const totalHeight = lines.length * lineHeight;
      const startY = (h - totalHeight) / 2 + lineHeight / 2;

      // blur layer for smooth wave slopes
      offCtx.filter = 'blur(6px)';
      lines.forEach((line, i) => offCtx.fillText(line, w / 2, startY + i * lineHeight));
      offCtx.filter = 'none';
      lines.forEach((line, i) => offCtx.fillText(line, w / 2, startY + i * lineHeight));

      pixelData = offCtx.getImageData(0, 0, w, h).data;
      needsRedraw = false;
    }

    import('p5').then(({ default: p5 }) => {
      const sketch = p => {
        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.frameRate(60);
          resizeBuffer(p.width, p.height);
          renderTextToBuffer();
        };

        p.draw = () => {
          if (needsRedraw) renderTextToBuffer();

          const { bg, fg } = colorsRef.current;
          p.background(bg);
          if (!pixelData) return;

          const w = offCanvas.width;
          const h = offCanvas.height;
          const time = p.frameCount * 0.03;

          if (effectRef.current === 'waves') {
            p.stroke(fg);
            p.noFill();
            p.strokeWeight(0.5);

            const stretch = 1.2;
            const mapCenterX = (w / 2 + (h / 2) * 0.4) * stretch;
            const mapCenterY = (h / 2 - (w / 2) * 0.1) * stretch;

            p.push();
            p.translate(w / 2 - mapCenterX, h / 2 - mapCenterY);

            const extX = Math.floor(h * 0.6);
            const extY = Math.floor(w * 0.25);

            for (let a = -extY; a < h + extY; a += 4) {
              p.beginShape();
              for (let b = -extX; b < w + extX; b += 3) {
                let c = 0;
                if (a >= 0 && a < h && b >= 0 && b < w) {
                  const idx = (a * w + b) * 4;
                  c = pixelData[idx];
                }
                const vx = (b + a * 0.4) * stretch;
                let vy = (a - c * 0.1 - b * 0.1) * stretch;

                const noiseTerrain = (p.noise((b + extX) * 0.008, (a + extY) * 0.008, time * 0.5) - 0.5) * 25;
                const waveDrift = p.sin(b * 0.02 - time * 2.5) * 6 + p.cos(a * 0.02 + time * 1.5) * 4;
                const textPresence = p.constrain(c / 150, 0, 1);
                vy += (noiseTerrain + waveDrift) * (1 - textPresence);

                p.vertex(vx, vy);
              }
              p.endShape();
            }
            p.pop();
          } else {
            p.noStroke();
            p.fill(fg);

            for (let y = 0; y < h; y += 6) {
              for (let x = 0; x < w; x += 6) {
                const idx = (y * w + x) * 4;
                if (pixelData[idx] > 50) {
                  const n = p.noise(x * 0.005, y * 0.005, time);

                  const distToMouse = p.dist(p.mouseX, p.mouseY, x, y);
                  let offsetX = 0;
                  let offsetY = 0;
                  if (distToMouse < 100) {
                    const force = p.map(distToMouse, 0, 100, 15, 0);
                    offsetX = (x - p.mouseX) * force * 0.01;
                    offsetY = (y - p.mouseY) * force * 0.01;
                  }

                  const drawX = x + (n * 10 - 5) + offsetX;
                  const drawY = y + (n * 10 - 5) + offsetY;

                  if (n > 0.75) {
                    p.rect(drawX, drawY, 8, 1);
                  } else if (n < 0.25) {
                    p.rect(drawX, drawY, 1, 8);
                  } else {
                    const size = n * 3;
                    p.rect(drawX, drawY, size, size);
                  }
                }
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
