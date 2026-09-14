# lunchmoney.sh landing page

Static landing page for **lunchmoney.sh**, an independent, unofficial project
building a [Model Context Protocol](https://modelcontextprotocol.io) connector
for [Lunch Money](https://lunchmoney.app).

This project is **not affiliated with, endorsed by, or sponsored by Lunch
Money**. The official product is at <https://lunchmoney.app>.

## Status: pre-release

The connector does not exist yet. Authentication, credential storage, tenant
isolation, and read-only enforcement are planned but **not implemented or
verified**. Accordingly, this site:

- has no signup or token-entry forms
- has no install or connect button (the `mcp.lunchmoney.sh` address is shown
  as planned text only — it is not live)
- collects no analytics and sends no data anywhere
- renders the chat preview locally with fictional sample data

## Layout

```
site/          # source: index.html, styles.css, main.js, favicon.svg
build.js       # dependency-free Node build script
dist/          # build output (gitignored)
```

## Build and preview

Requires Node.js 18+ (uses `fs.rmSync`, `URL`). No npm dependencies.

```bash
npm run build     # copies site/ into dist/
npm run preview   # builds, then serves dist/ at http://localhost:4173
```

Any static file server works equally well, e.g. `npx serve dist`.

## Deployment

The site is a plain static bundle — deploy `dist/` as-is to any static host.
For Vercel, set the build command to `npm run build` and the output directory
to `dist`.
