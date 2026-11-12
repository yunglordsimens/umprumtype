import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// public/fonts/<Name>/info.txt is source data (read at build time); it holds
// the designers' e-mails, so it is not published next to the font files.
const stripFontSources = {
  name: 'strip-font-sources',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const fonts = join(fileURLToPath(dir), 'fonts');
      for (const entry of readdirSync(fonts, { recursive: true, withFileTypes: true })) {
        if (entry.isFile() && /\.(txt|md)$/i.test(entry.name)) {
          rmSync(join(entry.parentPath ?? entry.path, entry.name));
        }
      }
    },
  },
};

export default defineConfig({
  site: 'https://typoumprum.cz',
  integrations: [react(), stripFontSources],
  output: 'static',
});
