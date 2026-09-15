import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

export const READ_SCOPE = 'lunchmoney:read'

export interface AuthConfig {
  issuer: string
  resource: string
  jwksUri: string
}

export interface Principal {
  readonly issuer: string
  readonly subject: string
  readonly scopes: readonly string[]
}

export class AuthorizationError extends Error {
  readonly status: 401 | 403
  readonly code: 'invalid_token' | 'insufficient_scope'

  constructor(status: 401 | 403, code: 'invalid_token' | 'insufficient_scope', message: string) {
    super(message)
    this.name = 'AuthorizationError'
    this.status = status
    this.code = code
  }
}

const CONFIG_ERROR = 'Invalid authorization configuration'
const CONTROL_CHARS = /[\x00-\x1f\x7f]/

function parseUrl(raw: string): URL {
  if (typeof raw !== 'string' || CONTROL_CHARS.test(raw)) {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  return url
}

function copyConfig(config: AuthConfig): Readonly<AuthConfig> {
  if (config === null || typeof config !== 'object') {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  const issuer = parseUrl(config.issuer)
  const resource = parseUrl(config.resource)
  const jwksUri = parseUrl(config.jwksUri)

  if (issuer.pathname !== '/') {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  if (!config.issuer.endsWith('/')) {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  if (jwksUri.origin !== issuer.origin) {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  if (config.resource !== resource.href) {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  return Object.freeze({
    issuer: issuer.href,
    resource: resource.href,
    jwksUri: jwksUri.href
  })
}

function invalidToken(): AuthorizationError {
  return new AuthorizationError(401, 'invalid_token', 'Invalid access token')
}

function insufficientScope(): AuthorizationError {
  return new AuthorizationError(403, 'insufficient_scope', 'Insufficient scope')
}

function isSafeNonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function createAccessTokenVerifier(
  config: AuthConfig,
  keyResolver?: JWTVerifyGetKey
): (authorization: string | null) => Promise<Principal> {
  const copied = copyConfig(config)
  const keys: JWTVerifyGetKey = keyResolver ?? createRemoteJWKSet(new URL(copied.jwksUri), {
    timeoutDuration: 3000,
    cooldownDuration: 30000,
    cacheMaxAge: 600000
  })

  return async (authorization: string | null): Promise<Principal> => {
    if (typeof authorization !== 'string' || authorization.length === 0 || authorization.length > 8192) {
      throw invalidToken()
    }
    if (CONTROL_CHARS.test(authorization)) {
      throw invalidToken()
    }
    const match = /^Bearer ([^ ]+)$/i.exec(authorization)
    if (match === null || match[1].includes(',')) {
      throw invalidToken()
    }
    const token = match[1]
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      throw invalidToken()
    }

    let payload
    try {
      const result = await jwtVerify(token, keys, {
        issuer: copied.issuer,
        audience: copied.resource,
        algorithms: ['RS256'],
        requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat'],
        clockTolerance: 0
      })
      payload = result.payload
    } catch {
      throw invalidToken()
    }

    const subject = payload.sub
    if (typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 256) {
      throw invalidToken()
    }
    if (!isSafeNonnegativeInteger(payload.exp) || !isSafeNonnegativeInteger(payload.iat)) {
      throw invalidToken()
    }
    const now = Math.floor(Date.now() / 1000)
    if (payload.iat > now || payload.exp <= payload.iat) {
      throw invalidToken()
    }

    const scopeClaim = payload.scope
    if (typeof scopeClaim !== 'string') {
      throw invalidToken()
    }
    const scopes = scopeClaim.split(/\s+/).filter((part) => part.length > 0)
    if (!scopes.includes(READ_SCOPE)) {
      throw insufficientScope()
    }

    return Object.freeze({
      issuer: payload.iss as string,
      subject,
      scopes: Object.freeze([...new Set(scopes)])
    })
  }
}

export function protectedResourceMetadata(config: AuthConfig): {
  resource: string
  authorization_servers: string[]
  scopes_supported: string[]
  bearer_methods_supported: string[]
} {
  const copied = copyConfig(config)
  return {
    resource: copied.resource,
    authorization_servers: [copied.issuer],
    scopes_supported: [READ_SCOPE],
    bearer_methods_supported: ['header']
  }
}

export function bearerChallenge(
  config: AuthConfig,
  metadataUrl: string,
  error?: 'invalid_token' | 'insufficient_scope'
): string {
  const copied = copyConfig(config)
  if (error !== undefined && error !== 'invalid_token' && error !== 'insufficient_scope') {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  const url = parseUrl(metadataUrl)
  if (url.origin !== new URL(copied.resource).origin) {
    throw new AuthorizationError(401, 'invalid_token', CONFIG_ERROR)
  }
  let challenge = `Bearer resource_metadata="${url.href}"`
  if (error !== undefined) {
    challenge += `, error="${error}"`
    if (error === 'insufficient_scope') {
      challenge += `, scope="${READ_SCOPE}"`
    }
  }
  return challenge
}
