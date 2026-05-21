import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://typoumprum.cz',
  integrations: [react()],
  output: 'static',
  vite: {
    ssr: {
      noExternal: ['p5'],
    },
  },
});
