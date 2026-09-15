# Lunch Money for Agents

<img src="site/icon.png" alt="Lunch Money for Agents icon" width="64" height="64">

[Website](https://lunchmoney.sh) · [Privacy](https://lunchmoney.sh/privacy) · [Setup guide](docs/user-guide.md)

An unofficial, open-source MCP integration by n3wth, built from a desire to make
[Lunch Money](https://lunchmoney.app) easier to use with AI agents.

Explore transactions, budgets, accounts, and recurring expenses through
natural-language conversations in MCP-compatible tools. Connect your own
account; financial access is read-only. The connector uses
[Model Context Protocol](https://modelcontextprotocol.io) (MCP).

This project is **not affiliated with, endorsed by, or sponsored by Lunch
Money**. The official product is at <https://lunchmoney.app>.

## Release status

Staging is live at `https://mcp-staging.lunchmoney.sh/mcp` with a verified
Auth0 → Nango → Lunch Money read flow. Production is deployed at
`https://mcp.lunchmoney.sh/mcp`, using `auth.n3wth.com` for login. External beta acceptance requires
two users other than the developer. See the [operator runbook](docs/runbook.md)
for deployment evidence and outstanding gates; production deployment does not
mean those user acceptance gates are complete.

Start with the [user guide](docs/user-guide.md) or the client-specific
installation instructions below.

The server permits financial reads only. Users enter their Lunch Money token
in Nango's browser UI, never in chat. Financial results reach the requesting
MCP client and may be sent to its model provider.

The landing page follows n3wth UI, with a clearly labeled fictional preview,
direct setup guides, no token-entry form, and no third-party tracking.
The website, MCP metadata, registry listing, and plugin packages share the
same icon, derived from `site/favicon.svg`.

## Client setup

- [Codex plugin and manual configuration](packages/codex-plugin/README.md)
- [Claude Code plugin](packages/claude-plugin/README.md)
- [Cursor plugin and MCP configuration](packages/cursor-plugin/README.md)
- MCP endpoint: `https://mcp.lunchmoney.sh/mcp`
- Login: `https://auth.n3wth.com/`

Plugin packages are available in this public source repository. Directory
submissions and acceptance are tracked separately in the
[submission record](docs/plugin-submissions.md); no store publication is claimed.
Claude Cowork has not yet been validated.

## Layout

```
site/          # source: index.html, styles.css, main.js, favicon.svg
packages/      # MCP server, auth contract, adapter, and client plugins
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
