import { useEffect, useRef, useState } from 'react';

export default function HeroSketch() {
  const containerRef = useRef(null);
  const [isDark, setIsDark] = useState(true);
  const [effect, setEffect] = useState('waves');

  // Sync with prefers-color-scheme
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Recreate sketch when theme or effect changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let p5Instance;

    import('p5').then(({ default: p5 }) => {
      const sketch = (p) => {
        let texte = [];
        let fond;
        const defaultText = 'SSArtSemestr';

        const bg = () => isDark ? 0 : 255;
        const fg = () => isDark ? 255 : 0;

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.frameRate(30);
          fond = p.createGraphics(p.width, p.height);
          p.textAlign(p.CENTER, p.CENTER);
          document.fonts.load('128px "Svar"').then(() => drawDefaultText()).catch(() => drawDefaultText());
        };

        function drawToBuffer(t) {
          fond.beginDraw();
          fond.background(bg());
          fond.fill(fg());
          fond.textFont('Svar');
          fond.textSize(128);
          fond.textAlign(p.CENTER, p.CENTER);
          fond.text(t, p.width / 2, p.height / 2);
          fond.filter(p.BLUR, 5);
          fond.text(t, p.width / 2, p.height / 2);
          fond.endDraw();
          fond.loadPixels();
        }

        function drawWaves() {
          p.background(bg());
          p.noFill();
          p.stroke(fg());
          p.strokeWeight(1);
          for (let a = 0; a < fond.height; a += 4) {
            p.beginShape();
            for (let b = 0; b < fond.width; b += 3) {
              const idx = (a * fond.width + b) * 4;
              const c = fond.pixels[idx];
              p.vertex(
                (b + a * 0.4) * 1.8 - 200,
                (a - c * 0.1 - b * 0.1) * 1.8 - 50
              );
            }
            p.endShape();
          }
        }

        function drawParticles() {
          p.background(bg());
          p.noStroke();
          p.fill(fg());
          for (let a = 0; a < fond.height; a += 5) {
            for (let b = 0; b < fond.width; b += 5) {
              const idx = (a * fond.width + b) * 4;
              const c = fond.pixels[idx];
              if (c > 30) {
                const x = (b + a * 0.4) * 1.8 - 200;
                const y = (a - c * 0.1 - b * 0.1) * 1.8 - 50;
                const r = p.map(c, 30, 255, 0.8, 4);
                p.ellipse(x, y, r, r);
              }
            }
          }
        }

        function redessine() {
          const t = texte.length > 0 ? texte.join('') : defaultText;
          drawToBuffer(t);
          if (effect === 'particles') {
            drawParticles();
          } else {
            drawWaves();
          }
        }

        function drawDefaultText() {
          drawToBuffer(defaultText);
          if (effect === 'particles') {
            drawParticles();
          } else {
            drawWaves();
          }
        }

        p.draw = () => {};

        p.keyReleased = () => {
          if (p.keyCode === p.BACKSPACE || p.keyCode === 8) {
            if (texte.length > 0) {
              texte.pop();
              redessine();
            }
          } else if (p.key.length === 1 && p.key.match(/[a-zA-Z0-9 ]/)) {
            texte.push(p.key);
            redessine();
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          fond = p.createGraphics(p.width, p.height);
          document.fonts.load('128px "Svar"').then(() => drawDefaultText()).catch(() => drawDefaultText());
        };
      };

      p5Instance = new p5(sketch, container);
    });

    return () => p5Instance?.remove();
  }, [isDark, effect]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      />
      <div className="hero-controls">
        {['waves', 'particles'].map(e => (
          <button
            key={e}
            className={`tf-tag-chip${effect === e ? ' is-active' : ''}`}
            onClick={() => setEffect(e)}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
