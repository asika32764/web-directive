import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import dts from 'rollup-plugin-dts';
import { minify } from 'rollup-plugin-esbuild';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.browser,
        format: 'umd',
        sourcemap: true,
        name: 'WebDirective',
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
      ...(process.env.NODE_ENV === 'production'
        ? [
          {
            file: addMinToFilename(pkg.browser),
            format: 'esm',
            sourcemap: true,
            name: 'WebDirective',
            plugins: [
              minify(),
            ]
          },
          {
            file: addMinToFilename(pkg.module),
            format: 'es',
            sourcemap: true,
            plugins: [
              minify(),
            ]
          }
        ]
        : [])
    ],
    plugins: [
      nodeResolve(),
      typescript(),
      commonjs()
    ]
  },
  {
    input: 'src/index.ts',
    output: {
      file: pkg.typings,
      format: 'es',
    },
    plugins: [
      dts()
    ]
  }
];

function addMinToFilename(fileName) {
  return fileName.replace(/.js$/, '.min.js');
}
