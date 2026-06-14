import fs from 'node:fs/promises';
import path from 'node:path';
import { minify } from 'terser';

const root = process.cwd();
const distDir = path.join(root, 'assets', 'dist');
const version = String(Date.now());

await fs.mkdir(distDir, { recursive: true });

const configSource = await fs.readFile(path.join(root, 'config', 'admin.config.js'), 'utf8');
const dataSource = await fs.readFile(path.join(root, 'products-data.js'), 'utf8');
const appSource = await fs.readFile(path.join(root, 'products.js'), 'utf8');

function stripModuleSyntax(source) {
  return source
    .replace(/^\s*import\s+[^;]+;\s*$/gm, '')
    .replace(/export\s+(?=function|const|let|class)/g, '')
    .replace(/export\s*\{[\s\S]*?\};?/g, '');
}

const bundle = [
  '(function(){',
  stripModuleSyntax(configSource),
  stripModuleSyntax(dataSource),
  stripModuleSyntax(appSource).replace(/^\s*const\s+root\s*=\s*process\.cwd\(\);\s*$/gm, ''),
  'window.DEW = { slugify, loadProducts, saveProducts, resetProducts, upsertProduct, deleteProduct, getSections, renderMenu, renderAdmin };',
  '})();',
].join('\n');

const minified = await minify(bundle, {
  compress: {
    passes: 2,
    drop_console: false,
    ecma: 2020,
  },
  format: {
    comments: false,
  },
  mangle: true,
  module: false,
  ecma: 2020,
  toplevel: true,
});

await fs.writeFile(path.join(distDir, 'products.js'), minified.code, 'utf8');

function minifyHtml(html) {
  return html
    .replace(/v=[0-9a-z]+/g, `v=${version}`)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

for (const fileName of ['index.html', 'admin.html', path.join('menu', 'index.html')]) {
  const filePath = path.join(root, fileName);
  const input = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, minifyHtml(input), 'utf8');
}
