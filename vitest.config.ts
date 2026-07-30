import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default defineConfig({
  ...viteConfig,
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setupAssets.ts'],
  },
});
