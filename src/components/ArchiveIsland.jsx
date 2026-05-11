import { useState } from 'react';
import FilterPanel from './FilterPanel.jsx';
import DetailPanel from './DetailPanel.jsx';
import SearchBar from './SearchBar.jsx';

// Read pre-rendered Astro HTML from hidden DOM store
function getPostHtml(slug) {
  const el = document.querySelector(`[data-post-slug="${slug}"]`);
  return el ? el.innerHTML : '';
}

export default function ArchiveIsland({ posts }) {
  const [activeTags, setActiveTags] = useState([]);
  const [query,      setQuery]      = useState('');
  const [openSlug,   setOpenSlug]   = useState(null);
  const [panelHtml,  setPanelHtml]  = useState('');

  const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();

  const filtered = posts.filter(p => {
    const matchTag = activeTags.length === 0 || activeTags.some(t => p.tags.includes(t));
    const q = query.trim().toLowerCase();
    const matchQ = !q
      || p.title.toLowerCase().includes(q)
      || (p.author ?? '').toLowerCase().includes(q);
    return matchTag && matchQ;
  });

  function openPost(post) {
    setOpenSlug(post.slug);
    setPanelHtml(getPostHtml(post.slug));
  }

  function closePost() {
    setOpenSlug(null);
  }

  const activePost = posts.find(p => p.slug === openSlug) ?? null;

  return (
    <div className="archive-layout">

      {/* left sidebar */}
      <aside className="archive-sidebar">
        <SearchBar value={query} onChange={setQuery} placeholder="Search…" />
        {allTags.length > 0 && (
          <FilterPanel
            allTags={allTags}
            activeTags={activeTags}
            onToggle={tag =>
              setActiveTags(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
              )
            }
          />
        )}
      </aside>

      {/* post list */}
      <section className="archive-main">
        <ul className="post-list">
          {filtered.map(p => (
            <li key={p.slug} className={`post-row${openSlug === p.slug ? ' is-active' : ''}`}>
              <button className="post-row__btn" onClick={() => openPost(p)}>
                <time className="post-row__date" dateTime={p.dateIso}>{p.date}</time>
                <span className="post-row__title">{p.title}</span>
                <span className="post-row__category">{p.category}</span>
              </button>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="archive-empty muted">No entries match the current filters.</p>
        )}
      </section>

      {/* right detail panel */}
      <DetailPanel isOpen={!!openSlug} onClose={closePost} variant="accent">
        {activePost && (
          <PostContent post={activePost} html={panelHtml} />
        )}
      </DetailPanel>

    </div>
  );
}

function PostContent({ post, html }) {
  return (
    <article className="post-detail">
      <div className="post-detail__meta">
        <time dateTime={post.dateIso}>{post.date}</time>
        {post.category && <span>{post.category}</span>}
        {post.author   && <span>{post.author}</span>}
      </div>

      <h2 className="post-detail__title">{post.title}</h2>

      {post.excerpt && (
        <p className="post-detail__excerpt">{post.excerpt}</p>
      )}

      {post.gallery.length > 0 && (
        <div className="post-detail__gallery">
          {post.gallery.map((img, i) => (
            <img key={i} src={img} alt="" loading="lazy" />
          ))}
        </div>
      )}

      <div
        className="post__body post-detail__body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {post.purchasable && post.contact && (
        <aside className="post-detail__contact">
          <h3>Contact author</h3>
          <p>{post.contact}</p>
        </aside>
      )}
    </article>
  );
}
