import { useEffect, useRef, useState } from 'react';

const DEFAULT_WORD = 'ARTSEMESTR\nSS26\nKŘIŽÍKOVA 12\n[C11]\n03—10/06';

export default function HeroSketch() {
  const containerRef = useRef(null);
  const [effect, setEffect] = useState('waves');

  const colorsRef = useRef({ bg: 20, fg: 235 });
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

    // kinetic state
    let kineticParticles = [];
    let kineticDirty = false;
    let prevEffect = 'waves';

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
        const lw = offCtx.measureText(line).width;
        if (lw > maxLineWidth) maxLineWidth = lw;
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

      // blur pass for smooth wave slopes
      offCtx.filter = 'blur(6px)';
      lines.forEach((line, i) => offCtx.fillText(line, w / 2, startY + i * lineHeight));
      offCtx.filter = 'none';
      lines.forEach((line, i) => offCtx.fillText(line, w / 2, startY + i * lineHeight));

      pixelData = offCtx.getImageData(0, 0, w, h).data;
      needsRedraw = false;
      kineticDirty = true; // text changed — rebuild kinetic particles
    }

    function buildKineticParticles(w, h) {
      const step = 4;
      const newTargets = [];
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          if (pixelData[idx] > 100) {
            newTargets.push({ bx: x, by: y });
          }
        }
      }

      const cx = w / 2;
      const cy = h / 2;
      const prev = kineticParticles;

      // reuse existing particle positions for smooth transition
      kineticParticles = newTargets.map((t, i) => {
        if (prev[i]) {
          // explode outward from current position so they fly to new targets
          const angle = Math.atan2(prev[i].y - cy, prev[i].x - cx);
          return { x: prev[i].x + Math.cos(angle) * 60, y: prev[i].y + Math.sin(angle) * 60, bx: t.bx, by: t.by };
        }
        // new particles spawn from center
        return { x: cx, y: cy, bx: t.bx, by: t.by };
      });

      kineticDirty = false;
    }

    import('p5').then(({ default: p5 }) => {
      const sketch = p => {
        const MOUSE_R = 100;
        const DOT_SIZE = 2;

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.frameRate(60);
          resizeBuffer(p.width, p.height);
          renderTextToBuffer();
        };

        p.draw = () => {
          if (needsRedraw) renderTextToBuffer();

          const cur = effectRef.current;
          const { bg, fg } = colorsRef.current;
          p.background(bg);
          if (!pixelData) return;

          const w = offCanvas.width;
          const h = offCanvas.height;
          const time = p.frameCount * 0.03;

          // rebuild kinetic particles when switching to kinetic or text changed
          if (cur === 'kinetic' && (kineticDirty || prevEffect !== 'kinetic')) {
            buildKineticParticles(w, h);
          }
          prevEffect = cur;

          if (cur === 'waves') {
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

          } else if (cur === 'particles') {
            p.noStroke();
            p.fill(fg);

            for (let y = 0; y < h; y += 6) {
              for (let x = 0; x < w; x += 6) {
                const idx = (y * w + x) * 4;
                if (pixelData[idx] > 50) {
                  const n = p.noise(x * 0.005, y * 0.005, time);

                  const distToMouse = p.dist(p.mouseX, p.mouseY, x, y);
                  let offsetX = 0, offsetY = 0;
                  if (distToMouse < 100) {
                    const force = p.map(distToMouse, 0, 100, 15, 0);
                    offsetX = (x - p.mouseX) * force * 0.01;
                    offsetY = (y - p.mouseY) * force * 0.01;
                  }

                  const drawX = x + (n * 10 - 5) + offsetX;
                  const drawY = y + (n * 10 - 5) + offsetY;

                  if (n > 0.75)       p.rect(drawX, drawY, 8, 1);
                  else if (n < 0.25)  p.rect(drawX, drawY, 1, 8);
                  else                p.rect(drawX, drawY, n * 3, n * 3);
                }
              }
            }

          } else if (cur === 'kinetic') {
            p.noStroke();
            p.fill(fg);

            const mx = p.mouseX;
            const my = p.mouseY;

            for (let i = 0; i < kineticParticles.length; i++) {
              const pt = kineticParticles[i];
              const dx = mx - pt.x;
              const dy = my - pt.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < MOUSE_R) {
                const force = (MOUSE_R - dist) / MOUSE_R;
                const angle = Math.atan2(dy, dx);
                pt.x -= Math.cos(angle) * force * 5 - Math.cos(angle + Math.PI / 2) * force * 15;
                pt.y -= Math.sin(angle) * force * 5 - Math.sin(angle + Math.PI / 2) * force * 15;
              } else {
                pt.x += (pt.bx - pt.x) * 0.03;
                pt.y += (pt.by - pt.y) * 0.03;
              }

              p.ellipse(pt.x, pt.y, DOT_SIZE, DOT_SIZE);
            }

            // mouse radius hint
            if (mx > 0 && my > 0) {
              p.noFill();
              p.stroke(fg, 12);
              p.strokeWeight(1);
              p.ellipse(mx, my, MOUSE_R * 2, MOUSE_R * 2);
              p.noStroke();
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
      kineticParticles = [];
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
      <div className="hero-controls">
        <div className="tf-sort">
          {['waves', 'particles', 'kinetic'].map(e => (
            <button key={e} aria-pressed={effect === e} onClick={() => setEffect(e)}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
