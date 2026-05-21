import { useEffect, useRef, useState } from 'react';

export default function HeroSketch() {
  const containerRef = useRef(null);
  const [isDark, setIsDark] = useState(true);

  // Sync with prefers-color-scheme
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // p5 sketch — recreates on theme change
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
          document.fonts.ready.then(() => drawDefaultText());
        };

        function drawDefaultText() {
          fond.beginDraw();
          fond.background(bg());
          fond.fill(fg());
          fond.textFont('Svar', 128);
          fond.textAlign(p.CENTER, p.CENTER);
          fond.text(defaultText, p.width / 2, p.height / 2);
          fond.endDraw();
          redessine();
        }

        function redessine() {
          const t = texte.length > 0 ? texte.join('') : defaultText;
          fond.beginDraw();
          fond.background(bg());
          fond.fill(fg());
          fond.textFont('Svar', 128);
          fond.textAlign(p.CENTER, p.CENTER);
          fond.text(t, p.width / 2, p.height / 2);
          fond.filter(p.BLUR, 5);
          fond.text(t, p.width / 2, p.height / 2);
          fond.endDraw();

          p.background(bg());
          p.noFill();
          p.stroke(fg());
          p.strokeWeight(1);
          for (let a = 0; a < fond.height; a += 4) {
            p.beginShape();
            for (let b = 0; b < fond.width; b += 3) {
              const c = p.brightness(fond.get(b, a));
              p.vertex((b + a * 0.4) * 1.8 - 200, (a - c * 0.1 - b * 0.1) * 1.8 - 50);
            }
            p.endShape();
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
          document.fonts.ready.then(() => drawDefaultText());
        };
      };

      p5Instance = new p5(sketch, container);
    });

    return () => p5Instance?.remove();
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    />
  );
}
