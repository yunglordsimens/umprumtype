function initials(title = '') {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || '?';
}

// deterministic hue from title string
function titleHue(title = '') {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) % 360;
  }
  return h;
}

export default function GridCard({ title = '', author, year, image, tags = [], onClick, coverBg, coverText }) {
  const hue = titleHue(title);
  const bg  = coverBg  || `hsl(${hue} 35% 55%)`;
  const fg  = coverText || '#fff';

  return (
    <article
      className="grid-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div className="grid-card__thumb">
        {image ? (
          <img src={image} alt={title} loading="lazy" />
        ) : (
          <span
            className="grid-card__initials"
            style={{ background: bg, color: fg }}
          >
            {initials(title)}
          </span>
        )}
      </div>

      <div className="grid-card__info">
        <h3 className="grid-card__title">{title}</h3>
        {(author || year) && (
          <p className="grid-card__meta">
            {[author, year].filter(Boolean).join(', ')}
          </p>
        )}
        {tags.length > 0 && (
          <ul className="grid-card__tags">
            {tags.map(t => (
              <li key={t} className="grid-card__tag">{t}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
