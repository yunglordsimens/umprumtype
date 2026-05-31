import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const UPLOADS_DIR = 'public/uploads';
const MAX_WIDTH    = 2400;
const JPEG_Q       = 82;
const PNG_Q        = 85;
const MIN_BYTES    = 150 * 1024; // skip files already under 150 KB

const FORMAT = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' };

function walk(dir) {
  const out = [];
  try {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(full));
      else out.push(full);
    }
  } catch { /* folder may not exist yet */ }
  return out;
}

let saved = 0, count = 0;

for (const file of walk(UPLOADS_DIR)) {
  const fmt = FORMAT[extname(file).toLowerCase()];
  if (!fmt) continue;

  const before = statSync(file).size;
  if (before < MIN_BYTES) continue;

  try {
    let pipe = sharp(file).resize({ width: MAX_WIDTH, withoutEnlargement: true });
    if (fmt === 'jpeg') pipe = pipe.jpeg({ quality: JPEG_Q, mozjpeg: true });
    else if (fmt === 'png') pipe = pipe.png({ compressionLevel: 9, quality: PNG_Q });
    else if (fmt === 'webp') pipe = pipe.webp({ quality: JPEG_Q });

    const buf = await pipe.toBuffer();
    if (buf.length < before) {
      writeFileSync(file, buf);
      const kb = n => Math.round(n / 1024);
      console.log(`✓  ${file}  ${kb(before)} KB → ${kb(buf.length)} KB`);
      saved += before - buf.length;
      count++;
    }
  } catch (e) {
    console.error(`✗  ${file}: ${e.message}`);
  }
}

console.log(`\nOptimized ${count} file(s), saved ${Math.round(saved / 1024)} KB total.`);
