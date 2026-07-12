import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Builds the whole game as ONE self-contained HTML file (all JS/CSS inlined)
 * for hosting on single-file platforms. Normal builds use vite.config.ts.
 *   npx vite build --config vite.artifact.config.ts
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
  },
});
