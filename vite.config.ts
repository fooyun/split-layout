import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),
    dts({
      insertTypesEntry: true,
      include: ['./src'],
    }),
  ],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    // minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'SplitLayout',
      // the proper extensions will be added
      fileName: 'split-layout',
      formats: ['cjs', 'es', 'umd'],
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['react', 'react-dom'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
