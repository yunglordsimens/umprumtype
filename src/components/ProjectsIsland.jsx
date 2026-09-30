import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import TagsPill from './TagsPill.jsx';
import { useSiteSearch, matchesQuery } from '../lib/siteSearch.js';
import { interleaveImages } from '../lib/interleave.js';

// Images shown in the row's preview strip (the rest appear in the article)
const STRIP_MAX = 8;

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

function PostRow({ post, isOpen, onToggle, onTagClick, galleryView }) {
  // Read after mount so the server and client first render match
  const [html, setHtml] = useState('');
  useEffect(() => { setHtml(getPostHtml(post.slug) || ''); }, [post.slug]);
  // Reading column: body text with the gallery images spread between paragraphs
  const articleHtml = useMemo(
    () => (galleryView === 'stack' ? interleaveImages(html, post.gallery, post.galleryCaptions) : ''),
    [html, galleryView, post.gallery, post.galleryCaptions]
  );
  const strip = post.gallery.slice(0, STRIP_MAX);

  return (
    <li id={post.slug} className={`post-row${isOpen ? ' is-open' : ''}`}>
      <button className="post-row__btn" onClick={onToggle} aria-expanded={isOpen}>
        <span className="post-row__head">
          <span className="post-row__title">{post.title}</span>
          <span className="post-row__author">{post.author}</span>
          <time className="post-row__year" dateTime={post.dateIso}>{post.year}</time>
        </span>
        {strip.length > 0 && (
          <span className="post-row__strip" aria-hidden="true">
            {strip.map((src, i) => <img key={i} src={src} alt="" loading="lazy" />)}
          </span>
        )}
      </button>
      <div className="post-row__panel">
        <div className="post-row__panel-inner">
          <article className="post-detail post-detail--inline">
            <div className="post-detail__meta">
              {post.category && <span>{post.category}</span>}
              <time dateTime={post.dateIso}>{post.date}</time>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="tfa-info__tags">
                {post.tags.map(tag => (
                  <button key={tag} className="tfa-info__tag" onClick={() => onTagClick?.(tag)}>{tag}</button>
                ))}
              </div>
            )}
            {galleryView === 'stack' ? (
              <div className="post-article">
                {post.excerpt && <p className="post-article__excerpt">{post.excerpt}</p>}
                <div className="post__body post-article__body" dangerouslySetInnerHTML={{ __html: articleHtml }} />
              </div>
            ) : (
              <>
                {post.gallery.length > 0 && (
                  galleryView === 'carousel' ? (
                    <GalleryCarousel images={post.gallery} captions={post.galleryCaptions} excerpt={post.excerpt} />
                  ) : (
                    <GalleryGrid images={post.gallery} captions={post.galleryCaptions} />
                  )
                )}
                {galleryView !== 'carousel' && post.excerpt && <p className="post-detail__excerpt">{post.excerpt}</p>}
                <div className="post__body post-article" dangerouslySetInnerHTML={{ __html: html }} />
              </>
            )}
            {post.siteUrl && <SiteEmbed url={post.siteUrl} />}
            {post.contact && (
              <aside className="post-detail__contact">
                <h3>Contact</h3>
                <p>{post.contact}</p>
              </aside>
            )}
          </article>
          <div className="post-row__close-wrap">
            <button className="post-row__close-btn" onClick={onToggle} aria-label="Close">×</button>
          </div>
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
  const [galleryView, setGalleryView] = useState('stack');
  const searchQuery = useSiteSearch();
  const panelRef   = useRef(null);
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
    if (searchQuery.trim()) {
      list = list.filter(p => matchesQuery(searchQuery, [p.title, p.author, p.category, p.year, p.excerpt, ...p.tags]));
    }
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
  }, [activeTags, sort, shuffleSeed, searchQuery, posts]);

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
    <div className="lib-layout">
      <div className="lib-main">

        <header className="lib-toolbar">
          <TagsPill
            open={showTags}
            activeCount={activeTags.length}
            onToggle={() => setShowTags(v => !v)}
            onClear={() => { setShowTags(false); if (activeTags.length > 0) { captureFlip(); setActiveTags([]); } }}
          />
          <div className="tf-sort">
            {SORTS.map(s => (
              <button key={s.key} aria-pressed={sort === s.key} onClick={() => { captureFlip(); setSort(s.key); if (s.key === 'shuffle') setShuffleSeed(n => n + 1); }}>
                {s.label}
              </button>
            ))}
            {openSlug && (
              <>
                <span className="tf-sort__divider" />
                <button aria-pressed={galleryView === 'stack'}    onClick={() => setGalleryView('stack')}    title="Stack"><ViewStackIcon /></button>
                <button aria-pressed={galleryView === 'carousel'} onClick={() => setGalleryView('carousel')} title="Carousel"><ViewSlideIcon /></button>
                <button aria-pressed={galleryView === 'grid'}     onClick={() => setGalleryView('grid')}     title="Grid"><ViewGridIcon /></button>
              </>
            )}
          </div>
          <span className="lib-toolbar-count">
            {filtered.length < posts.length ? `${filtered.length} of ${posts.length}` : filtered.length}
          </span>
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
          </div>
        </div>

        <div className="lib-scroll post-island__scroll">
          {filtered.length === 0 ? (
            <div className="lib-empty">No projects match.</div>
          ) : (
            <>
              <ul ref={listRef} className="post-list post-island__list">
                {filtered.map(p => (
                  <PostRow
                    key={p.slug}
                    post={p}
                    isOpen={openSlug === p.slug}
                    onToggle={() => togglePost(p.slug)}
                    onTagClick={onTagClick}
                    galleryView={galleryView}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
