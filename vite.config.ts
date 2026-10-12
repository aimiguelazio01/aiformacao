import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        formacao: './formacao-ia/index.html',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  server: {
    watch: {
      ignored: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.md', '**/miguel-professional-context/**'],
    },
  },
});
