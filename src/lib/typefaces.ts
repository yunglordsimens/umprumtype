import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

export interface OtfVariant {
  filename: string;
  webPath: string;
  variantName: string;
  weight: number;
  style: 'normal' | 'italic';
  index: number;
}

export interface TypefaceData {
  slug: string;
  folderName: string;
  title: string;
  designer: string;
  year: number | null;
  mainText: string;
  mainSize: string;
  styleTexts: string[];
  styleSize: string;
  mainStyleNo: number;
  aboutFont: string;
  aboutDesigner: string;
  tags: string[];
  otfVariants: OtfVariant[];
  defaultVariant: OtfVariant | null;
}

const FONTS_DIR = join(process.cwd(), 'public', 'fonts');

// Combining diacritical marks U+0300–U+036F
const COMBINING_MARKS = /[̀-ͯ]/g;

function toSlug(folderName: string): string {
  return folderName
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function guessWeight(text: string): number {
  const t = text.toLowerCase();
  if (/black|ultra(?!light)/.test(t)) return 900;
  if (/heavy|extrabold|extra.bold/.test(t)) return 800;
  if (/\bbold\b/.test(t)) return 700;
  if (/semi.?bold|demi.?bold/.test(t)) return 600;
  if (/\bmedium\b/.test(t)) return 500;
  if (/extralight|extra.light|ultralight|ultra.light/.test(t)) return 200;
  if (/\bthin\b|\bhairline\b/.test(t)) return 100;
  if (/\blight\b/.test(t)) return 300;
  return 400;
}

function parseOtfVariant(filename: string, folderName: string, index: number): OtfVariant {
  const withoutPrefix = filename.replace(/^\d+_/, '');
  const stem = basename(withoutPrefix, '.woff2');

  // Strip leading font name from stem to isolate the variant label
  const folderNorm = folderName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const stemNorm = stem.toLowerCase().replace(/[^a-z0-9]/g, '');
  let variantName = stemNorm.startsWith(folderNorm)
    ? stem.slice(folderName.length).trim()
    : stem.trim();
  if (!variantName) variantName = 'Regular';

  const webPath = `/fonts/${encodeURIComponent(folderName)}/${encodeURIComponent(filename)}`;

  return {
    filename,
    webPath,
    variantName,
    weight: guessWeight(variantName),
    style: /italic|oblique/i.test(variantName) ? 'italic' : 'normal',
    index,
  };
}

function parseInfoTxt(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const raw of content.split('\n')) {
    const eq = raw.indexOf('=');
    if (eq === -1) continue;
    const key = raw.slice(0, eq).trim();
    const value = raw.slice(eq + 1);
    if (key) result[key] = value;
  }
  return result;
}

let _cache: TypefaceData[] | null = null;

export function getAllTypefaces(): TypefaceData[] {
  if (_cache) return _cache;

  const entries = readdirSync(FONTS_DIR, { withFileTypes: true });

  _cache = entries
    .filter(e => e.isDirectory())
    .map(dir => {
      const folderName = dir.name;
      const folderPath = join(FONTS_DIR, folderName);

      const files = readdirSync(folderPath);
      const otfFiles = files.filter(f => extname(f).toLowerCase() === '.woff2').sort();

      const otfVariants: OtfVariant[] = otfFiles.map((filename, i) => {
        const prefixMatch = filename.match(/^(\d+)_/);
        const variantIndex = prefixMatch ? parseInt(prefixMatch[1], 10) : i;
        return parseOtfVariant(filename, folderName, variantIndex);
      });

      let info: Record<string, string> = {};
      const infoPath = join(folderPath, 'info.txt');
      if (existsSync(infoPath)) {
        try {
          info = parseInfoTxt(readFileSync(infoPath, 'utf-8'));
        } catch {
          // ignore read/parse errors
        }
      }

      const styleTexts: string[] = [];
      for (let i = 0; info[`styleText${i}`] !== undefined; i++) {
        styleTexts.push(info[`styleText${i}`].trim());
      }

      const mainStyleNo = Math.max(0, parseInt(info['mainStyleNo'] ?? '0', 10) || 0);
      const defaultVariant = otfVariants[mainStyleNo] ?? otfVariants[0] ?? null;

      const rawTags = (info['tags'] ?? '').trim();
      const tags =
        !rawTags || rawTags === '---'
          ? []
          : rawTags.split(',').map(t => t.trim()).filter(Boolean);

      return {
        slug: toSlug(folderName),
        folderName,
        title: info['name']?.trim() || folderName,
        designer: info['designer']?.trim() || 'Unknown',
        year: info['date'] ? parseInt(info['date'].trim(), 10) || null : null,
        mainText: info['mainText']?.trim() || '',
        mainSize: info['mainSize']?.trim() || '6em',
        styleTexts,
        styleSize: info['styleSize']?.trim() || '4em',
        mainStyleNo,
        aboutFont: info['aboutFont']?.trim() || '',
        aboutDesigner: info['aboutDesigner']?.trim() || '',
        tags,
        otfVariants,
        defaultVariant,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'cs'));

  return _cache;
}

export function getTypefaceBySlug(slug: string): TypefaceData | undefined {
  return getAllTypefaces().find(tf => tf.slug === slug);
}
