import { useEffect, useRef } from 'react';

export default function HeroSketch({ isDark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let p5Instance;

    import('p5').then(({ default: p5 }) => {
      const sketch = (p) => {
        let texte = [];
        let fond;
        let defaultText = "SSArtSemestr";

        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          p.frameRate(30);
          fond = p.createGraphics(p.width, p.height);
          updateColors();
          p.textAlign(p.CENTER, p.CENTER);
          drawDefaultText();
        };

        function updateColors() {
          p.background(isDark ? 0 : 255);
          p.fill(isDark ? 255 : 0);
          p.stroke(isDark ? 255 : 0);
          p.strokeWeight(1);
        }

        function drawDefaultText() {
          fond.beginDraw();
          fond.background(isDark ? 0 : 255);
          fond.textFont('Svar', 128);
          fond.textAlign(p.CENTER, p.CENTER);
          fond.text(defaultText, p.width / 2, p.height / 2);
          fond.endDraw();
          redessine();
        }

        function redessine() {
          const t = texte.length > 0 ? texte.join('') : defaultText;
          fond.beginDraw();
          fond.background(isDark ? 0 : 255);
          fond.text(t, p.width / 2, p.height / 2);
          fond.filter(p.BLUR, 5);
          fond.text(t, p.width / 2, p.height / 2);
          fond.endDraw();

          p.background(isDark ? 0 : 255);
          p.noFill();
          p.stroke(isDark ? 255 : 0);
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
          drawDefaultText();
        };

        p.updateTheme = (dark) => {
          isDark = dark;
          updateColors();
          drawDefaultText();
        };
      };

      p5Instance = new p5(sketch, containerRef.current);
    });

    return () => p5Instance?.remove();
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      id="hero-sketch"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    />
  );
}
