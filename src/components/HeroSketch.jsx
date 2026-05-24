import { useEffect, useRef, useState } from 'react';

export default function HeroSketch() {
  const containerRef = useRef(null);
  const [effect, setEffect] = useState('waves');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let p5Instance;

    import('p5').then(({ default: p5 }) => {
      const sketch = (p) => {
        let typed = '';

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.frameRate(30);
        };

        p.draw = () => {
          p.background(0);
          p.noFill();
          p.stroke(255);
          p.strokeWeight(0.8);
          const t = p.frameCount * 0.007;
          const amp = typed.length > 0 ? p.map(typed.length, 0, 30, 30, 100, true) : 40;
          const freq = typed.length > 0 ? p.map(typed.length, 0, 30, 0.003, 0.008, true) : 0.003;

          if (effect === 'particles') {
            p.noStroke();
            p.fill(255);
            for (let y = 0; y < p.height; y += 8) {
              for (let x = 0; x <= p.width; x += 8) {
                const n = p.noise(x * freq, y * freq * 1.5, t);
                const size = p.map(n, 0, 1, 0.3, 3.5);
                if (n > 0.45) p.ellipse(x + p.map(n, 0.45, 1, 0, 6), y + p.map(n, 0.45, 1, 0, 6), size, size);
              }
            }
          } else {
            for (let y = 0; y < p.height + amp; y += 7) {
              p.beginShape();
              for (let x = 0; x <= p.width; x += 4) {
                const n = p.noise(x * freq, y * freq * 2, t);
                p.vertex(x, y + p.map(n, 0, 1, -amp, amp));
              }
              p.endShape();
            }
          }
        };

        p.keyReleased = () => {
          if (p.keyCode === p.BACKSPACE) typed = typed.slice(0, -1);
          else if (p.key.length === 1) typed += p.key;
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      p5Instance = new p5(sketch, container);
    });

    return () => p5Instance?.remove();
  }, [effect]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
      <div className="hero-controls">
        {['waves', 'particles'].map(e => (
          <button key={e} className={`tf-tag-chip${effect === e ? ' is-active' : ''}`} onClick={() => setEffect(e)}>{e}</button>
        ))}
      </div>
    </div>
  );
}
