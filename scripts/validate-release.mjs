import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const endpoint = 'https://mcp.lunchmoney.sh/mcp'

for (const [directory, manifestPath] of [
  ['codex-plugin', '.codex-plugin/plugin.json'],
  ['claude-plugin', '.claude-plugin/plugin.json']
]) {
  const base = resolve(root, 'packages', directory)
  const manifest = await readJson(`packages/${directory}/${manifestPath}`)
  assert.match(manifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/)
  assert.ok(manifest.description?.length > 0, `${directory}: description required`)
  assert.equal(manifest.mcpServers, './.mcp.json')
  const config = await readJson(`packages/${directory}/.mcp.json`)
  assert.deepEqual(Object.keys(config.mcpServers), ['lunchmoney'])
  const server = config.mcpServers.lunchmoney
  assert.equal(server.type, 'http')
  assert.equal(server.url, endpoint, `${directory}: production MCP endpoint required`)
  assert.ok(!server.headers, `${directory}: do not package authorization headers`)
  assert.ok(!server.env, `${directory}: do not package environment credentials`)
  assert.ok(!server.oauth?.clientSecret, `${directory}: public OAuth clients cannot embed secrets`)
  assert.equal(typeof server.oauth?.clientId, 'string', `${directory}: registered OAuth client ID required`)
  assert.match(server.oauth.clientId, /^[A-Za-z0-9_-]{8,}$/)
  assert.ok(!/placeholder|replace|your[_-]|todo/i.test(server.oauth.clientId), `${directory}: placeholder OAuth client ID`)
  if (directory === 'codex-plugin') {
    assert.equal(server.oauth.callbackPort, 1455)
    assert.equal(server.oauth.callbackUrl, 'http://127.0.0.1:1455/callback')
  } else {
    assert.equal(server.oauth.callbackPort, 8414)
    assert.equal(server.oauth.callbackUrl, undefined, 'Claude derives its localhost callback from callbackPort')
  }
  for (const field of ['skills', 'commands', 'agents']) {
    const references = manifest[field] === undefined ? []
      : Array.isArray(manifest[field]) ? manifest[field] : [manifest[field]]
    for (const reference of references) {
      assert.equal(typeof reference, 'string')
      const target = resolve(base, reference)
      assert.ok(target.startsWith(`${base}${sep}`), `${directory}: ${field} escapes plugin directory`)
      await access(target)
    }
  }
  console.log(`${directory}: release contract passed`)
}

// Cursor's documented static OAuth uses auth.CLIENT_ID, not oauth.clientId.
const cursorManifest = await readJson('packages/cursor-plugin/.cursor-plugin/plugin.json')
assert.match(cursorManifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
assert.match(cursorManifest.version, /^\d+\.\d+\.\d+$/)
assert.match(cursorManifest.description, /unofficial/i)
assert.equal(cursorManifest.mcpServers, 'mcp.json')
assert.equal(cursorManifest.logo, 'assets/icon.png')
for (const path of [cursorManifest.mcpServers, cursorManifest.logo]) {
  const base = resolve(root, 'packages/cursor-plugin')
  const target = resolve(base, path)
  assert.ok(target.startsWith(`${base}${sep}`), 'Cursor path escapes plugin directory')
  await access(target)
}
const cursorConfig = await readJson('packages/cursor-plugin/mcp.json')
assert.deepEqual(Object.keys(cursorConfig.mcpServers), ['lunchmoney'])
const cursorServer = cursorConfig.mcpServers.lunchmoney
assert.equal(cursorServer.url, endpoint)
assert.deepEqual(Object.keys(cursorServer).sort(), ['auth', 'url'])
assert.deepEqual(Object.keys(cursorServer.auth).sort(), ['CLIENT_ID', 'scopes'])
assert.match(cursorServer.auth.CLIENT_ID, /^[A-Za-z0-9_-]{8,}$/)
assert.deepEqual(cursorServer.auth.scopes, ['openid', 'offline_access', 'lunchmoney:read'])
const cursorMarketplace = await readJson('.cursor-plugin/marketplace.json')
assert.equal(cursorMarketplace.name, 'lunchmoney-mcp')
assert.deepEqual(cursorMarketplace.plugins.map(({ name, source }) => ({ name, source })), [
  { name: cursorManifest.name, source: 'packages/cursor-plugin' }
])
console.log('cursor-plugin: static OAuth and package paths passed')

// These JSONC files deliberately use strict JSON syntax, so invalid edits fail here.
const staging = await readJson('packages/server/wrangler.jsonc')
const production = await readJson('packages/server/wrangler.production.jsonc')
assert.equal(production.name, 'lunchmoney-mcp-production')
assert.notEqual(production.name, staging.name)
assert.equal(production.vars.LM_ENV, 'production')
assert.equal(production.vars.NANGO_ENVIRONMENT, 'prod')
assert.equal(production.vars.LM_AUTH_RESOURCE, endpoint)
assert.equal(production.vars.LM_AUTH_ISSUER, 'https://auth.n3wth.com/')
assert.equal(production.vars.LM_AUTH_JWKS_URI, 'https://auth.n3wth.com/.well-known/jwks.json')
assert.equal(production.vars.LM_METADATA_URL, 'https://mcp.lunchmoney.sh/.well-known/oauth-protected-resource')
for (const key of ['NANGO_SECRET_KEY', 'NANGO_WEBHOOK_SIGNING_KEY']) {
  assert.ok(!(key in production.vars), `${key} must be provisioned as a secret`)
}
const db = production.d1_databases.find((binding) => binding.binding === 'IDENTITY_DB')
assert.ok(db, 'production IDENTITY_DB required')
assert.match(db.database_id, /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i)
assert.ok(staging.d1_databases.every((binding) => binding.database_id !== db.database_id), 'production must not use staging identity database')
const telemetry = production.analytics_engine_datasets.find((binding) => binding.binding === 'TELEMETRY')
assert.ok(telemetry, 'production telemetry required')
assert.ok(staging.analytics_engine_datasets.every((binding) => binding.dataset !== telemetry.dataset), 'production must not use staging telemetry')
console.log('production: configuration isolation checks passed')

const canonicalIcon = await readFile(resolve(root, 'site/icon.png'))
for (const directory of ['codex-plugin', 'claude-plugin', 'cursor-plugin']) {
  const icon = await readFile(resolve(root, `packages/${directory}/assets/icon.png`))
  assert.ok(icon.equals(canonicalIcon), `${directory}: icon must match the website`)
}
const registry = await readJson('server.json')
assert.equal(registry.remotes[0].url, endpoint)
assert.equal(registry.icons[0].src, 'https://lunchmoney.sh/icon.png')
console.log('branding: canonical plugin icons and registry references match')
