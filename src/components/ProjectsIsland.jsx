import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SORTS = [
  { key: 'name',    label: 'Name' },
  { key: 'author',  label: 'Author' },
  { key: 'year',    label: 'Year' },
  { key: 'shuffle', label: 'Shuffle' },
];

function getPostHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

const ViewStackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
    <rect x="0" y="0" width="13" height="5" rx="1"/><rect x="0" y="8" width="13" height="5" rx="1"/>
  </svg>
);
const ViewSlideIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
    <rect x="0" y="0" width="5" height="13" rx="1"/><rect x="8" y="0" width="5" height="13" rx="1"/>
  </svg>
);
const ViewGridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
    <rect x="0" y="0" width="5" height="5" rx="1"/><rect x="8" y="0" width="5" height="5" rx="1"/>
    <rect x="0" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/>
  </svg>
);

function sizeGalleryImg(e) {
  const img = e.currentTarget;
  const { naturalWidth: nw, naturalHeight: nh } = img;
  if (!nw || !nh) return;
  const containerW = img.closest('.post-detail__gallery')?.clientWidth || img.parentElement?.clientWidth || 0;
  if (nh > nw && containerW > 0) {
    img.style.height = Math.round(containerW * nw / nh) + 'px';
    img.style.width = 'auto';
  } else {
    img.style.width = '100%';
    img.style.height = 'auto';
  }
}

function GalleryCarousel({ images, captions, excerpt }) {
  const hasCaptions = captions?.some(Boolean);
  return (
    <div className={`gallery-carousel${!hasCaptions && excerpt ? ' gallery-carousel--sidebar' : ''}`}>
      {!hasCaptions && excerpt && (
        <p className="gallery-carousel__sidebar">{excerpt}</p>
      )}
      <div className="gallery-carousel__track">
        {images.map((src, i) => (
          <figure key={i} className="gallery-carousel__slide">
            <img src={src} alt="" loading="lazy" />
            {hasCaptions && captions[i] && (
              <figcaption className="gallery-caption">{captions[i]}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

function GalleryGrid({ images, captions }) {
  return (
    <div className="gallery-grid">
      {images.map((src, i) => (
        <figure key={i} className="gallery-grid__item">
          <img src={src} alt="" loading="lazy" />
          {captions?.[i] && <figcaption className="gallery-caption">{captions[i]}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function SiteEmbed({ url }) {
  const [active, setActive] = useState(false);
  return (
    <div className="site-embed">
      {active ? (
        <iframe
          src={url}
          className="site-embed__frame"
          title="Site preview"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <button className="site-embed__placeholder" onClick={() => setActive(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          <span>Нажмите для интерактивного просмотра</span>
        </button>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="site-embed__link">
        или перейдите на сайт
      </a>
    </div>
  );
}

function PostRow({ post, isOpen, onToggle, onTagClick, onEnter, galleryView }) {
  const [html] = useState(() =>
    typeof document !== 'undefined' ? (getPostHtml(post.slug) || '') : ''
  );

  return (
    <li id={post.slug} className={`post-row${isOpen ? ' is-open' : ''}`} onMouseEnter={isOpen ? undefined : onEnter}>
      <button className="post-row__btn" onClick={onToggle}>
        <time className="post-row__date" dateTime={post.dateIso}>{post.date}</time>
        <span className="post-row__title">{post.title}</span>
        <span className="post-row__category">{post.category}</span>
      </button>
      <div className="post-row__panel">
        <div className="post-row__panel-inner">
          <article className="post-detail post-detail--inline">
            <div className="post-detail__meta">
              {post.category && <span>{post.category}</span>}
              {post.author   && <span>{post.author}</span>}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="tfa-info__tags">
                {post.tags.map(tag => (
                  <button key={tag} className="tfa-info__tag" onClick={() => onTagClick?.(tag)}>{tag}</button>
                ))}
              </div>
            )}
            {post.gallery.length > 0 && (
              galleryView === 'carousel' ? (
                <GalleryCarousel images={post.gallery} captions={post.galleryCaptions} excerpt={post.excerpt} />
              ) : galleryView === 'grid' ? (
                <GalleryGrid images={post.gallery} captions={post.galleryCaptions} />
              ) : (
                <div className="post-detail__gallery">
                  {post.gallery.map((img, i) => (
                    <figure key={i} className="post-detail__gallery-item">
                      <img src={img} alt="" loading="lazy" onLoad={sizeGalleryImg} />
                      {post.galleryCaptions?.[i] && (
                        <figcaption className="gallery-caption">{post.galleryCaptions[i]}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )
            )}
            {galleryView !== 'carousel' && post.excerpt && <p className="post-detail__excerpt">{post.excerpt}</p>}
            <div className="post__body" dangerouslySetInnerHTML={{ __html: html }} />
            {post.siteUrl && <SiteEmbed url={post.siteUrl} />}
            {post.contact && (
              <aside className="post-detail__contact">
                <h3>Contact</h3>
                <p>{post.contact}</p>
              </aside>
            )}
            <div className="post-row__close-wrap">
              <button className="post-row__close-btn" onClick={onToggle} aria-label="Close">×</button>
            </div>
          </article>
        </div>
      </div>
    </li>
  );
}

export default function ProjectsIsland({ posts }) {
  const [activeTags, setActiveTags] = useState([]);
  const [showTags, setShowTags]     = useState(false);
  const [openSlug, setOpenSlug]     = useState(null);
  const [sort, setSort]             = useState('name');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [galleryView, setGalleryView] = useState('stack');
  const [mounted, setMounted]       = useState(false);
  const panelRef   = useRef(null);
  const previewRef = useRef(null);
  const listRef    = useRef(null);
  const flipSnap   = useRef(new Map());
  const prevKeys   = useRef(new Set());

  function captureFlip() {
    const ul = listRef.current;
    if (!ul) return;
    flipSnap.current.clear();
    for (const el of ul.children) {
      if (el.id) flipSnap.current.set(el.id, el.getBoundingClientRect().top);
    }
  }

  useEffect(() => setMounted(true), []);

  function handleMouseMove(e) {
    if (!previewRef.current) return;
    previewRef.current.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 80}px)`;
  }

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    setOpenSlug(hash);
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const allTags = useMemo(
    () => [...new Set(posts.flatMap(p => p.tags))].sort(),
    [posts]
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeTags.length > 0) list = list.filter(p => activeTags.some(t => p.tags.includes(t)));
    const out = [...list];
    if (sort === 'author') {
      out.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'cs'));
    } else if (sort === 'year') {
      out.sort((a, b) => new Date(b.dateIso) - new Date(a.dateIso));
    } else if (sort === 'shuffle') {
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
    } else {
      out.sort((a, b) => a.title.localeCompare(b.title, 'cs'));
    }
    return out;
  }, [activeTags, sort, shuffleSeed, posts]);

  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const newKeys = new Set();
    for (const el of ul.children) {
      if (!el.id) continue;
      newKeys.add(el.id);
      const oldTop = flipSnap.current.get(el.id);
      const isNew  = prevKeys.current.size > 0 && !prevKeys.current.has(el.id);
      if (isNew) {
        el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = 'opacity 220ms ease, transform 220ms ease';
          el.style.opacity = ''; el.style.transform = '';
        }));
      } else if (oldTop !== undefined) {
        const dy = oldTop - el.getBoundingClientRect().top;
        if (Math.abs(dy) > 0.5) {
          el.style.transform = `translateY(${dy}px)`; el.style.transition = 'none';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transition = 'transform 380ms cubic-bezier(0.16,1,0.3,1)';
            el.style.transform = '';
          }));
        }
      }
    }
    prevKeys.current = newKeys;
    flipSnap.current.clear();
  }, [filtered]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (showTags) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.opacity   = '1';
    } else {
      panel.style.maxHeight = '0';
      panel.style.opacity   = '0';
    }
  }, [showTags]);

  function togglePost(slug) {
    setPreviewSrc(null);
    setOpenSlug(prev => prev === slug ? null : slug);
  }

  function toggleTag(tag) {
    captureFlip();
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function onTagClick(tag) {
    captureFlip();
    setOpenSlug(null);
    setActiveTags([tag]);
  }

  useEffect(() => {
    if (!openSlug) return;
    const onKey = e => { if (e.key === 'Escape') setOpenSlug(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSlug]);

  return (
    <>
    {mounted && createPortal(
      <div ref={previewRef} className="post-cursor-preview" aria-hidden="true"
           style={{ opacity: previewSrc ? 1 : 0 }}>
        <img src={previewSrc || ''} alt="" />
      </div>,
      document.body
    )}
    <div className="lib-layout" onMouseMove={handleMouseMove}>
      <div className="lib-main">

        <header className="lib-toolbar">
          <button className="lib-filter-btn" onClick={() => setShowTags(f => !f)} aria-pressed={showTags}>
            <span className="lib-filter-btn__label">Tags</span>
            {activeTags.length > 0 && <span className="tf-tag-count">{activeTags.length}</span>}
          </button>
          <div className="tf-sort">
            {SORTS.map(s => (
              <button key={s.key} aria-pressed={sort === s.key} onClick={() => { captureFlip(); setSort(s.key); if (s.key === 'shuffle') setShuffleSeed(n => n + 1); }}>
                {s.label}
              </button>
            ))}
          </div>
          <span className="lib-toolbar-count">
            {filtered.length < posts.length ? `${filtered.length} of ${posts.length}` : filtered.length}
          </span>
          <span className="tf-sort__divider" />
          <div className="tf-sort gallery-view-toggle">
            <button aria-pressed={galleryView === 'stack'}    onClick={() => setGalleryView('stack')}    title="Stack"><ViewStackIcon /></button>
            <button aria-pressed={galleryView === 'carousel'} onClick={() => setGalleryView('carousel')} title="Carousel"><ViewSlideIcon /></button>
            <button aria-pressed={galleryView === 'grid'}     onClick={() => setGalleryView('grid')}     title="Grid"><ViewGridIcon /></button>
          </div>
        </header>

        <div
          ref={panelRef}
          className="tf-tags-panel"
          style={{ maxHeight: 0, opacity: 0, overflow: 'hidden',
            transition: 'max-height 400ms cubic-bezier(0.16,1,0.3,1), opacity 280ms' }}
        >
          <div className="tf-tags-panel__inner">
            <div className="tf-tags-panel__chips">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`tf-tag-chip${activeTags.includes(tag) ? ' is-active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tf-tags-panel__actions">
              {activeTags.length > 0 && (
                <button className="tf-tags-clear" onClick={() => { captureFlip(); setActiveTags([]); }}>Clear</button>
              )}
              <button className="tf-tags-close" onClick={() => setShowTags(false)} aria-label="Close tags">
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="lib-scroll post-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No projects match.</div>
          ) : (
            <>
              <ul ref={listRef} className="post-list post-island__list"
                  onMouseLeave={() => setPreviewSrc(null)}>
                {filtered.map(p => (
                  <PostRow
                    key={p.slug}
                    post={p}
                    isOpen={openSlug === p.slug}
                    onToggle={() => togglePost(p.slug)}
                    onTagClick={onTagClick}
                    onEnter={() => setPreviewSrc(p.gallery[0] || null)}
                    galleryView={galleryView}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

      </div>
    </div>
    </>
  );
}
