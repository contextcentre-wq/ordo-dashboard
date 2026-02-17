/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'convex/lib/**',
        'convex/*.ts',
        'components/**',
        'App.tsx',
        'hooks/**',
      ],
      exclude: [
        'convex/_generated/**',
        'convex/integrations/**',
        'node_modules/**',
      ],
    },
  },
});
