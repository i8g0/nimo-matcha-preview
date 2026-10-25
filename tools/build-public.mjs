import * as esbuild from 'esbuild';
import path from 'path';
const ASSETS = path.resolve('theme/src/assets');
const OUT = path.resolve('theme/public');
await esbuild.build({ entryPoints: ['nm-app','nm-home','nm-product','nm-listing','nm-cart'].map(n=>path.join(ASSETS,'js',`${n}.js`)), outdir: OUT, bundle: true, minify: true, format: 'iife', target: ['es2018'], logLevel: 'warning' });
await esbuild.build({ entryPoints: [path.join(ASSETS,'styles','nm.css')], outfile: path.join(OUT,'nm-app.css'), bundle: true, minify: true, logLevel: 'warning' });
