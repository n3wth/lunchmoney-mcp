# Lunch Money MCP

An independent, unofficial project providing a read-only
[Model Context Protocol](https://modelcontextprotocol.io) connector
for [Lunch Money](https://lunchmoney.app).

This project is **not affiliated with, endorsed by, or sponsored by Lunch
Money**. The official product is at <https://lunchmoney.app>.

## Release status

Staging is live at `https://mcp-staging.lunchmoney.sh/mcp` with a verified
Auth0 → Nango → Lunch Money read flow. Production is deployed at
`https://mcp.lunchmoney.sh/mcp`, using `auth.n3wth.com` for login. External beta acceptance requires
two users other than the developer. See the [operator runbook](docs/runbook.md)
for deployment evidence and outstanding gates; production deployment does not
mean those user acceptance gates are complete.

Start with the [user guide](docs/user-guide.md),
[Codex package](packages/codex-plugin/README.md), or
[Claude Code package](packages/claude-plugin/README.md).

The server permits financial reads only. Users enter their Lunch Money token
in Nango's browser UI, never in chat. Financial results reach the requesting
MCP client and may be sent to its model provider.

The separate static landing page remains pre-release, with fictional sample
data, no token-entry form, and no analytics or third-party tracking.

## Layout

```
site/          # source: index.html, styles.css, main.js, favicon.svg
packages/      # MCP server, auth contract, adapter, Codex and Claude plugins
docs/          # user guide, operator runbook, architecture and release gates
scripts/       # release validation
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

## Server validation

Use Node.js 22+ and run the packages in dependency order, as in
[CI](.github/workflows/ci.yml):

```bash
npm --prefix packages/auth-contract ci
npm --prefix packages/auth-contract test
npm --prefix packages/lunchmoney-adapter ci
npm --prefix packages/lunchmoney-adapter test
npm --prefix packages/server ci
npm --prefix packages/server test
node scripts/validate-release.mjs
```

## Deployment

The Worker has separate staging and production configurations and databases.
Default Wrangler commands target staging; production requires
`--config wrangler.production.jsonc`. Follow the runbook for secrets,
migrations, health checks, routing, and rollback.

The site is a plain static bundle — deploy `dist/` as-is to any static host.
For Vercel, set the build command to `npm run build` and the output directory
to `dist`.
