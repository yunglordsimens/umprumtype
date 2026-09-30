// Builds the article column for an opened Project / Journal post: the rendered
// markdown body with the gallery images spread evenly after its paragraphs,
// so text and images alternate instead of all images coming first.

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function figure(src, caption) {
  const cap = caption ? `<figcaption class="gallery-caption">${escapeAttr(caption)}</figcaption>` : '';
  return `<figure class="post-article__figure"><img src="${escapeAttr(src)}" alt="" loading="lazy" />${cap}</figure>`;
}

export function interleaveImages(html, images = [], captions = []) {
  const figures = images.map((src, i) => figure(src, captions[i]));
  if (!html) return figures.join('');

  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const nodes = [...wrap.children];
  // Images are only placed after paragraphs, never between a heading and its text
  const anchors = nodes.filter(n => n.tagName === 'P');
  if (anchors.length === 0) return html + figures.join('');

  let next = 0;
  let out = '';
  for (const node of nodes) {
    out += node.outerHTML;
    const a = anchors.indexOf(node);
    if (a < 0) continue;
    const until = Math.round(((a + 1) * figures.length) / anchors.length);
    while (next < until) out += figures[next++];
  }
  while (next < figures.length) out += figures[next++];
  return out;
}
