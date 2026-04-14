import { useEffect, useState } from 'react';

export default function BottomBar({ name, prevSlug, nextSlug }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className={`bottom-bar${visible ? ' is-visible' : ''}`}>
      <div className="bottom-bar__inner">
        <span className="bottom-bar__name">{name}</span>
        <div className="bottom-bar__actions">
          {prevSlug && <a href={`/typefaces/${prevSlug}`} aria-label="Previous typeface">←</a>}
          {nextSlug && <a href={`/typefaces/${nextSlug}`} aria-label="Next typeface">→</a>}
          <button onClick={top} aria-label="Back to top">↑ top</button>
          <a href="/typefaces">close</a>
        </div>
        <span className="bottom-bar__hints">← → navigate · esc close</span>
      </div>
    </div>
  );
}
