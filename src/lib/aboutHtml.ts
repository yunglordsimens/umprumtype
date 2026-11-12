// The designer paragraph comes from info.txt / the CMS as a little HTML
// (<br> and links). It is rendered with innerHTML, so at build time it is
// reduced to that safe subset — every other tag is escaped — and e-mail
// addresses are hidden from address-harvesting bots: the page (and the island
// props) only carry "name [at] domain [dot] cz" plus an encoded copy, which
// the browser turns back into a mailto link (see revealEmails in TypefaceCard).

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const ONE_EMAIL = new RegExp(`^${EMAIL.source}$`);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function encodeEmail(email: string): string {
  return Buffer.from([...email].reverse().join(''), 'utf-8').toString('base64');
}

function obfuscatedEmail(email: string): string {
  const [user, domain] = email.split('@');
  const shown = `${user} [at] ${domain.split('.').join(' [dot] ')}`;
  return `<span class="obf-mail" data-m="${encodeEmail(email)}">${escapeHtml(shown)}</span>`;
}

// Plain text → escaped HTML with e-mails hidden
function textToHtml(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(EMAIL)) {
    out += escapeHtml(text.slice(last, m.index));
    out += obfuscatedEmail(m[0]);
    last = m.index! + m[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

const TOKEN = /<br\s*\/?>|<a\s[^>]*>|<\/a\s*>/gi;

export function sanitizeAboutHtml(html: string): string {
  if (!html) return '';
  let out = '';
  let last = 0;
  let open: 'link' | 'mail' | 'drop' | null = null;

  const text = (s: string) => {
    if (!s) return;
    // inside a mailto link the text is the address itself — already hidden
    if (open === 'mail') return;
    out += textToHtml(decodeEntities(s));
  };

  for (const m of html.matchAll(TOKEN)) {
    text(html.slice(last, m.index));
    last = m.index! + m[0].length;
    const tag = m[0];

    if (/^<br/i.test(tag)) { out += '<br>'; continue; }

    if (/^<\/a/i.test(tag)) {
      if (open === 'link') out += '</a>';
      open = null;
      continue;
    }

    // opening <a …>; a second one before </a> closes the first
    if (open === 'link') out += '</a>';
    const href = decodeEntities(tag.match(/href\s*=\s*["']([^"']*)["']/i)?.[1] ?? '').trim();
    if (/^mailto:/i.test(href)) {
      const email = href.replace(/^mailto:/i, '').split('?')[0];
      out += ONE_EMAIL.test(email) ? obfuscatedEmail(email) : '';
      open = 'mail';
    } else if (/^https?:\/\//i.test(href)) {
      out += `<a href="${escapeHtml(href)}" rel="noopener">`;
      open = 'link';
    } else {
      open = 'drop'; // unknown scheme: keep the text, drop the link
    }
  }
  text(html.slice(last));
  if (open === 'link') out += '</a>';
  return out;
}
