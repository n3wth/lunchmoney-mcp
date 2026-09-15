#!/usr/bin/env node
// Copy the static site and bundle the isolated AI Elements conversation.
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
  require('esbuild').buildSync({
    entryPoints: [path.join(__dirname, 'preview/index.tsx')],
    outfile: path.join(OUT, 'conversation-preview.js'),
    bundle: true,
    minify: true,
    format: 'esm',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'linked',
  });
  require('child_process').execFileSync(process.execPath, [
    path.join(__dirname, 'node_modules/@tailwindcss/cli/dist/index.mjs'),
    '-i', path.join(__dirname, 'preview/styles.css'),
    '-o', path.join(OUT, 'conversation-preview.css'), '--minify',
  ], { stdio: 'inherit' });
  fs.copyFileSync(path.join(__dirname, 'preview/ai-elements/LICENSE'), path.join(OUT, 'ai-elements-LICENSE.txt'));
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
