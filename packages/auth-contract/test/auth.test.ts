import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair, generateSecret, createLocalJWKSet, SignJWT, exportJWK, type JWTVerifyGetKey } from 'jose'
import {
  READ_SCOPE,
  AuthorizationError,
  createAccessTokenVerifier,
  protectedResourceMetadata,
  bearerChallenge
} from '../src/index.js'

const ISSUER = 'https://issuer.example.com/'
const RESOURCE = 'https://mcp.example.com/mcp'
const JWKS_URI = 'https://issuer.example.com/.well-known/jwks.json'
const METADATA_URL = 'https://mcp.example.com/.well-known/oauth-protected-resource'
const SENTINEL = 's3ntinel-SECRET-value-0192'

const config = { issuer: ISSUER, resource: RESOURCE, jwksUri: JWKS_URI }

type SigningKey = Parameters<SignJWT['sign']>[0]

interface Fixture {
  resolver: JWTVerifyGetKey
  sign: (claims: Record<string, unknown>, opts?: { kid?: string; alg?: string }) => Promise<string>
  signWith: (key: SigningKey, claims: Record<string, unknown>, opts?: { kid?: string; alg?: string }) => Promise<string>
  privateKey: SigningKey
}

async function makeFixture(extraKeys: { key: CryptoKey; kid: string }[] = []): Promise<Fixture> {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwks: { keys: object[] } = { keys: [{ ...(await exportJWK(publicKey)), kid: 'base', alg: 'RS256' }] }
  for (const { key, kid } of extraKeys) jwks.keys.push({ ...(await exportJWK(key)), kid, alg: 'RS256' })
  const resolver = createLocalJWKSet(jwks as Parameters<typeof createLocalJWKSet>[0])
  const signWith = async (key: SigningKey, claims: Record<string, unknown>, opts?: { kid?: string; alg?: string }) => {
    const now = Math.floor(Date.now() / 1000)
    const jwt = new SignJWT({ iss: ISSUER, aud: RESOURCE, sub: 'user-1', scope: READ_SCOPE, ...claims })
      .setProtectedHeader({ alg: opts?.alg ?? 'RS256', ...(opts?.kid ? { kid: opts.kid } : {}) })
      .setIssuedAt(claims.iat === undefined ? now : (claims.iat as number))
      .setExpirationTime(claims.exp === undefined ? now + 300 : (claims.exp as number))
    return jwt.sign(key)
  }
  const sign = (claims: Record<string, unknown>, opts?: { kid?: string; alg?: string }) => signWith(privateKey, claims, opts)
  return { resolver, sign, signWith, privateKey }
}

function verifier(fixture: Fixture) {
  return createAccessTokenVerifier(config, fixture.resolver)
}

async function expectAuthError(promise: Promise<unknown>, status: 401 | 403) {
  await assert.rejects(promise, (err: unknown) => {
    assert.ok(err instanceof AuthorizationError)
    assert.equal(err.status, status)
    return true
  })
}

test('two users yield distinct iss/sub even with same email claim', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  const a = await verify(`Bearer ${await f.sign({ sub: 'auth0|aaa', email: 'same@example.com' })}`)
  const b = await verify(`Bearer ${await f.sign({ sub: 'auth0|bbb', email: 'same@example.com' })}`)
  assert.equal(a.issuer, ISSUER)
  assert.equal(b.issuer, ISSUER)
  assert.notEqual(a.subject, b.subject)
  assert.deepEqual(a.scopes, [READ_SCOPE])
})

test('principal is frozen and never contains email', async () => {
  const f = await makeFixture()
  const p = await verifier(f)(`Bearer ${await f.sign({ sub: 'auth0|aaa', email: SENTINEL, session: SENTINEL })}`)
  assert.ok(Object.isFrozen(p))
  assert.ok(Object.isFrozen(p.scopes))
  assert.equal(JSON.stringify(p).includes(SENTINEL), false)
})

test('rejects missing, empty, malformed and oversized authorization headers', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  await expectAuthError(verify(null), 401)
  await expectAuthError(verify(''), 401)
  await expectAuthError(verify('Bearer'), 401)
  await expectAuthError(verify('Basic abc.def.ghi'), 401)
  await expectAuthError(verify('Bearer  a.b.c'), 401)
  await expectAuthError(verify(`Bearer ${'a'.repeat(9000)}`), 401)
  await expectAuthError(verify('Bearer a.b.c, Bearer d.e.f'), 401)
  await expectAuthError(verify('Bearer not-a-jwt'), 401)
  await expectAuthError(verify('Bearer a.b.c\u0007'), 401)
})

test('accepts case-insensitive bearer scheme', async () => {
  const f = await makeFixture()
  const p = await verifier(f)(`bearer ${await f.sign({ sub: 'auth0|x' })}`)
  assert.equal(p.subject, 'auth0|x')
})

test('wrong issuer, audience, key, kid, alg are rejected', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  await expectAuthError(verify(`Bearer ${await f.sign({ iss: 'https://evil.example.com/' })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ aud: 'https://other.example.com/' })}`), 401)
  const other = await generateKeyPair('RS256')
  await expectAuthError(verify(`Bearer ${await f.signWith(other.privateKey, { sub: 'auth0|x' })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ sub: 'auth0|x' }, { kid: 'unknown-kid' })}`), 401)
  const hs = await generateSecret('HS256')
  await expectAuthError(verify(`Bearer ${await f.signWith(hs, { sub: 'auth0|x' }, { alg: 'HS256' })}`), 401)
  const noneJwt = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{}').toString('base64url')}.`
  await expectAuthError(verify(`Bearer ${noneJwt}`), 401)
})

test('expired, missing exp/iat, future iat, exp<=iat, future nbf rejected', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  const now = Math.floor(Date.now() / 1000)
  await expectAuthError(verify(`Bearer ${await f.sign({ exp: now - 10, iat: now - 400 })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ iat: now + 600 })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ exp: now + 300, iat: now + 300 })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ nbf: now + 600 })}`), 401)
  const noExp = await new SignJWT({ iss: ISSUER, aud: RESOURCE, sub: 'u', scope: READ_SCOPE })
    .setProtectedHeader({ alg: 'RS256' }).setIssuedAt(now).sign(f.privateKey)
  await expectAuthError(verify(`Bearer ${noExp}`), 401)
  const noIat = await new SignJWT({ iss: ISSUER, aud: RESOURCE, sub: 'u', scope: READ_SCOPE })
    .setProtectedHeader({ alg: 'RS256' }).setExpirationTime(now + 300).sign(f.privateKey)
  await expectAuthError(verify(`Bearer ${noIat}`), 401)
})

test('scope enforcement: exact match only, 403 for insufficient scope', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  await expectAuthError(verify(`Bearer ${await f.sign({ scope: 'lunchmoney:read-extra' })}`), 403)
  await expectAuthError(verify(`Bearer ${await f.sign({ scope: 'lunchmoney:write' })}`), 403)
  await expectAuthError(verify(`Bearer ${await f.sign({ scope: '' })}`), 403)
  await expectAuthError(verify(`Bearer ${await f.sign({ scope: [READ_SCOPE] })}`), 401)
  const noScope = await new SignJWT({ iss: ISSUER, aud: RESOURCE, sub: 'u' })
    .setProtectedHeader({ alg: 'RS256' }).setIssuedAt().setExpirationTime('5m').sign(f.privateKey)
  await expectAuthError(verify(`Bearer ${noScope}`), 401)
  const p = await verify(`Bearer ${await f.sign({ scope: `openid ${READ_SCOPE} profile` })}`)
  assert.deepEqual([...p.scopes].sort(), ['openid', 'profile', READ_SCOPE].sort())
})

test('key rotation: old and new keys both verify, unknown rejected', async () => {
  const oldPair = await generateKeyPair('RS256')
  const newPair = await generateKeyPair('RS256')
  const f = await makeFixture([
    { key: oldPair.publicKey, kid: 'old' },
    { key: newPair.publicKey, kid: 'new' }
  ])
  const verify = verifier(f)
  const p1 = await verify(`Bearer ${await f.signWith(oldPair.privateKey, { sub: 'auth0|old' }, { kid: 'old' })}`)
  const p2 = await verify(`Bearer ${await f.signWith(newPair.privateKey, { sub: 'auth0|new' }, { kid: 'new' })}`)
  assert.equal(p1.subject, 'auth0|old')
  assert.equal(p2.subject, 'auth0|new')
  const rogue = await generateKeyPair('RS256')
  await expectAuthError(verify(`Bearer ${await f.signWith(rogue.privateKey, { sub: 'auth0|x' })}`), 401)
})

test('concurrent users never leak identity', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  const tokens = await Promise.all([
    f.sign({ sub: 'auth0|u1' }),
    f.sign({ sub: 'auth0|u2' }),
    f.sign({ sub: 'auth0|u3' })
  ])
  const results = await Promise.all(tokens.map((t) => verify(`Bearer ${t}`)))
  assert.deepEqual(results.map((r) => r.subject), ['auth0|u1', 'auth0|u2', 'auth0|u3'])
})

test('subject validation: empty, whitespace, oversized rejected', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  await expectAuthError(verify(`Bearer ${await f.sign({ sub: '   ' })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ sub: 'x'.repeat(300) })}`), 401)
  await expectAuthError(verify(`Bearer ${await f.sign({ sub: 42 })}`), 401)
})

test('protected resource metadata shape', () => {
  assert.deepEqual(protectedResourceMetadata(config), {
    resource: RESOURCE,
    authorization_servers: [ISSUER],
    scopes_supported: [READ_SCOPE],
    bearer_methods_supported: ['header']
  })
})

test('bearer challenge strings and injection rejection', () => {
  assert.equal(
    bearerChallenge(config, METADATA_URL),
    `Bearer resource_metadata="${METADATA_URL}"`
  )
  assert.equal(
    bearerChallenge(config, METADATA_URL, 'invalid_token'),
    `Bearer resource_metadata="${METADATA_URL}", error="invalid_token"`
  )
  assert.equal(
    bearerChallenge(config, METADATA_URL, 'insufficient_scope'),
    `Bearer resource_metadata="${METADATA_URL}", error="insufficient_scope", scope="${READ_SCOPE}"`
  )
  assert.throws(() => bearerChallenge(config, 'https://evil.example.com/x'), AuthorizationError)
  assert.throws(() => bearerChallenge(config, 'http://mcp.example.com/x'), AuthorizationError)
  assert.throws(() => bearerChallenge(config, `${METADATA_URL}?q=1`), AuthorizationError)
  assert.throws(
    () => bearerChallenge(config, METADATA_URL, 'invalid_token", scope="x' as 'invalid_token'),
    AuthorizationError
  )
})

test('config validation: scheme, userinfo, query, issuer path, mutation immunity', async () => {
  const bad = (c: Partial<typeof config>) =>
    assert.throws(() => createAccessTokenVerifier({ ...config, ...c }), AuthorizationError)
  bad({ issuer: 'http://issuer.example.com/' })
  bad({ issuer: 'https://issuer.example.com' })
  bad({ issuer: 'https://issuer.example.com/path/' })
  bad({ issuer: 'https://user@issuer.example.com/' })
  bad({ issuer: 'https://issuer.example.com/?q=1' })
  bad({ jwksUri: 'https://other.example.com/jwks.json' })
  bad({ resource: 'HTTPS://mcp.example.com/mcp' })
  bad({ resource: 'https://mcp.example.com/mcp#frag' })

  const mutable = { ...config }
  const f = await makeFixture()
  const verify = createAccessTokenVerifier(mutable, f.resolver)
  mutable.issuer = 'https://evil.example.com/'
  mutable.resource = 'https://evil.example.com/'
  mutable.jwksUri = 'https://evil.example.com/jwks.json'
  const token = await f.sign({ sub: 'auth0|mutation-check' })
  const p = await verify(`Bearer ${token}`)
  assert.equal(p.issuer, ISSUER)
  const evil = await f.sign({ iss: 'https://evil.example.com/', sub: 'auth0|x' })
  await expectAuthError(verify(`Bearer ${evil}`), 401)
})

test('errors never leak sentinel token or email', async () => {
  const f = await makeFixture()
  const verify = verifier(f)
  const token = await f.sign({ sub: 'auth0|x', email: SENTINEL })
  try {
    await verify(`Bearer ${token.slice(0, -2)}xx`)
    assert.fail('expected rejection')
  } catch (err) {
    const serialized = `${String(err)} ${JSON.stringify(err)} ${(err as Error).stack}`
    assert.equal(serialized.includes(SENTINEL), false)
    assert.equal(serialized.includes(token), false)
  }
})
