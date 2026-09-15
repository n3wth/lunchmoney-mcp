# Routes
/ → src/app/App.tsx, prerendered by src/app/render.tsx and hydrated by src/app/client.tsx. /privacy and /terms → site/privacy/index.html and site/terms/index.html, legacy static legal pages with site/styles.css. No router config. build.js copies static assets and replaces root HTML body only.

## build.js
```
#!/usr/bin/env node
// Prerender the Astryx landing page and bundle its interactive demo.
// Usage: node build.js          build into dist/
//        node build.js --serve  build, then serve dist/ locally

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'site');
const OUT = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
      console.log(`  ${path.relative(__dirname, to)}`);
    }
  }
}

function build() {
  if (!fs.existsSync(path.join(SRC, 'index.html'))) {
    console.error('error: site/index.html not found');
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('building into dist/');
  copyDir(SRC, OUT);
  require('child_process').execFileSync(process.execPath, [
    path.join(__dirname, 'node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs'),
    'theme', 'build', 'src/themes/neutral/neutralTheme.ts', '-o', '.cache/neutral.css',
    '--icons-specifier', '../src/themes/neutral/icons.tsx',
  ], { stdio: 'pipe' });
  const esbuild = require('esbuild');
  const common = { bundle: true, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'linked' };
  esbuild.buildSync({ ...common, entryPoints: ['src/app/client.tsx'], outfile: path.join(OUT, 'app.js'), minify: true, format: 'esm' });
  const renderer = path.join(__dirname, '.cache/render.cjs');
  esbuild.buildSync({ ...common, entryPoints: ['src/app/render.tsx'], outfile: renderer, platform: 'node', format: 'cjs' });
  delete require.cache[require.resolve(renderer)];
  const markup = require(renderer).render();
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8')
    .replace(/<body>[\s\S]*<\/body>/, () => '<body><div id="app">' + markup + '</div></body>')
    .replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="app.css">')
    .replace('<link rel="stylesheet" href="conversation-preview.css">', '')
    .replace('<script src="conversation-preview.js" defer></script>', '<script type="module" src="app.js"></script>');
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  fs.writeFileSync(path.join(OUT, 'app.css'), [
    '@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;',
    fs.readFileSync(require.resolve('@astryxdesign/core/reset.css'), 'utf8'),
    fs.readFileSync(require.resolve('@astryxdesign/core/astryx.css'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '.cache/neutral.css'), 'utf8'),
    fs.readFileSync(path.join(__dirname, 'src/app/fonts.css'), 'utf8'),
  ].join('\n'));
  console.log('done');
}

function serve() {
  const http = require('http');
  http
    .createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.normalize(path.join(OUT, urlPath));
      if (file !== OUT && !file.startsWith(OUT + path.sep)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
      }
      if (!fs.existsSync(file)) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(PORT, '127.0.0.1', () => console.log(`serving dist/ at http://127.0.0.1:${PORT}`));
}

build();
if (process.argv.includes('--serve')) serve();

```
