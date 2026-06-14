import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = process.cwd();
const distDir = path.join(root, 'assets', 'dist');

await fs.mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.join(root, 'products.js')],
  outfile: path.join(distDir, 'products.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  treeShaking: true,
});

const bundled = await fs.readFile(path.join(distDir, 'products.js'), 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(bundled, {
  compact: true,
  controlFlowFlattening: false,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false,
  seed: 20260614,
  stringArray: true,
  stringArrayEncoding: [],
  stringArrayThreshold: 0.7,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  target: 'browser',
  sourceMap: false,
  module: true,
});
await fs.writeFile(path.join(distDir, 'products.js'), obfuscated.getObfuscatedCode(), 'utf8');

function minifyHtml(html) {
  return html
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
