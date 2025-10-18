
import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import dts from 'unplugin-dts/vite';

// const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf8'));

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    build: {
      lib: {
        entry: './src/index.ts',
        name: 'WebDirective',
        fileName: 'web-directive'
      },
      sourcemap: true,
      // rollupOptions: {
      //   input: path.resolve(__dirname, 'src/index.ts'),
      //   output: outputs,
      //   // note: intentionally not passing Rollup plugins here because Vite's build uses its
      //   // own copy of Rollup types; including plugins imported from the project's Rollup
      //   // package caused a TypeScript type incompatibility.
      // },
    },

    // Custom plugin to generate d.ts using rollup-plugin-dts when requested
    plugins: [
      dts({
        bundleTypes: true
      }),
    ],
  };
});
