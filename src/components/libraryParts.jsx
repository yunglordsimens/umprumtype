import { useState } from 'react';

// Shared by Library and Store: cover image, grid card, inline detail

// Covers live on Google Drive. They're requested at the size they're shown
// (grid ~140px, detail ~220px — doubled for retina) straight from Google's
// image server, which skips the redirect behind drive.google.com/thumbnail.
// If that address ever fails, CoverImg falls back to the thumbnail URL.
const COVER_GRID_W   = 300;
const COVER_DETAIL_W = 500;

function driveId(url) {
  const m = url?.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url?.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : null;
}

export function toImage(url) {
  if (!url) return null;
  const id = driveId(url);
  if (id) return { driveId: id };
  return url.startsWith('http') || url.startsWith('/') ? { src: url } : null;
}

function coverUrls(image, width) {
  if (image.driveId) {
    return [
      `https://lh3.googleusercontent.com/d/${image.driveId}=w${width}`,
      `https://drive.google.com/thumbnail?id=${image.driveId}&sz=w${width}`,
    ];
  }
  return [image.src];
}

export function CoverImg({ image, width, alt, className }) {
  const urls = coverUrls(image, width);
  const [i, setI] = useState(0);
  return (
    <img
      src={urls[i]}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => { if (i < urls.length - 1) setI(i + 1); }}
    />
  );
}

// Enlarged cover + metadata: tags first, then title, author, year and
// publisher stacked, all at one text size (like the typeface detail)
export function BookDetail({ book, onTagClick, onClose, children }) {
  const hasImage = !!book.image;
  return (
    <div className="lib-accordion__inner">
      <div className="lib-accordion__cover">
        {hasImage ? (
          <CoverImg image={book.image} width={COVER_DETAIL_W} alt={book.title} className="lib-accordion__img" />
        ) : (
          <div className="lib-accordion__cover-default" aria-hidden="true" />
        )}
      </div>
      <div className="lib-accordion__meta">
        {book.tags.length > 0 && (
          <div className="lib-accordion__tags">
            {book.tags.map(t => (
              <button
                key={t}
                className="tfa-info__tag"
                onClick={(e) => { e.stopPropagation(); onTagClick?.(t); }}
              >{t}</button>
            ))}
          </div>
        )}
        <dl className="lib-accordion__fields">
          <dt>Title</dt><dd className="lib-accordion__title">{book.title}</dd>
          {book.author    && <><dt>Author</dt><dd>{book.author}</dd></>}
          {book.year      && <><dt>Year</dt><dd>{book.year}</dd></>}
          {book.publisher && <><dt>Publisher</dt><dd>{book.publisher}</dd></>}
        </dl>
        {children}
      </div>
      <button className="lib-accordion__close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

// Grid card — cover + title only; author/year live in the detail
export function BookCard({ book, isOpen, onToggle }) {
  const hasImage = !!book.image;
  return (
    <div
      className={`lib-card${isOpen ? ' is-open' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
    >
      <div className="lib-book">
        <div className={`lib-book__cover${hasImage ? '' : ' lib-book__cover--default'}`}>
          {hasImage && (
            <CoverImg image={book.image} width={COVER_GRID_W} alt={book.title} className="lib-book__img" />
          )}
          {hasImage && <div className="lib-book__spine" />}
          {hasImage && <div className="lib-book__shine" />}
        </div>
      </div>
      <div className="lib-card__info">
        <h4 className="lib-card__title">{book.title}</h4>
      </div>
    </div>
  );
}

