export type ConnectionState =
  | 'unconnected'
  | 'pending'
  | 'active'
  | 'invalid'
  | 'revoked'
  | 'deletion_pending'
  | 'deleted'

export interface User {
  readonly userId: string
  readonly issuer: string
  readonly subject: string
  readonly createdAt: string
}

export interface Connection {
  readonly connectionId: string
  readonly userId: string
  readonly provider: 'lunchmoney'
  readonly environment: 'development' | 'production'
  readonly state: ConnectionState
  readonly createdAt: string
  readonly updatedAt: string
}

export interface IdentityStore {
  getOrCreateUser(issuer: string, subject: string): Promise<User>
  getUser(userId: string): Promise<User | undefined>
  getActiveConnection(userId: string): Promise<Connection | undefined>
  claimPendingConnection(userId: string, connectionId: string): Promise<Connection | undefined>
  beginConnection(userId: string, connectionId: string, environment: Connection['environment']): Promise<Connection>
  activateConnection(userId: string, connectionId: string): Promise<Connection>
  markConnection(userId: string, connectionId: string, state: 'invalid' | 'revoked' | 'deletion_pending' | 'deleted'): Promise<Connection | undefined>
  replaceConnection(userId: string, newConnectionId: string, environment: Connection['environment']): Promise<Connection>
}

interface StoredConnection extends Omit<Connection, 'state' | 'updatedAt'> {
  state: ConnectionState
  updatedAt: string
}

function now(): string {
  return new Date().toISOString()
}

function userKey(issuer: string, subject: string): string {
  return JSON.stringify([issuer, subject])
}

export class InMemoryIdentityStore implements IdentityStore {
  private readonly usersByKey = new Map<string, User>()
  private readonly usersById = new Map<string, User>()
  private readonly connections = new Map<string, StoredConnection>()
  private nextUser = 1

  async getOrCreateUser(issuer: string, subject: string): Promise<User> {
    const key = userKey(issuer, subject)
    const existing = this.usersByKey.get(key)
    if (existing !== undefined) return existing
    const user: User = {
      userId: `usr_${this.nextUser++}`,
      issuer,
      subject,
      createdAt: now()
    }
    this.usersByKey.set(key, user)
    this.usersById.set(user.userId, user)
    return user
  }

  async getUser(userId: string): Promise<User | undefined> {
    return this.usersById.get(userId)
  }

  private activeConnectionFor(userId: string): StoredConnection | undefined {
    for (const c of this.connections.values()) {
      if (c.userId === userId && (c.state === 'pending' || c.state === 'active')) return c
    }
    return undefined
  }

  async claimPendingConnection(userId: string, connectionId: string): Promise<Connection | undefined> {
    const conn = this.activeConnectionFor(userId)
    if (!conn || conn.state !== 'pending' || conn.connectionId !== `pending:${userId}` || this.connections.has(connectionId)) return undefined
    this.connections.delete(conn.connectionId)
    const claimed = { ...conn, connectionId, updatedAt: now() }
    this.connections.set(connectionId, claimed)
    return { ...claimed }
  }

  async beginConnection(userId: string, connectionId: string, environment: Connection['environment']): Promise<Connection> {
    const existing = this.activeConnectionFor(userId)
    if (existing !== undefined) throw new Error('connection already in progress or active')
    const conn: StoredConnection = {
      connectionId,
      userId,
      provider: 'lunchmoney',
      environment,
      state: 'pending',
      createdAt: now(),
      updatedAt: now()
    }
    this.connections.set(connectionId, conn)
    return { ...conn }
  }

  async activateConnection(userId: string, connectionId: string): Promise<Connection> {
    const conn = this.connections.get(connectionId)
    if (conn === undefined || conn.userId !== userId || conn.state !== 'pending') {
      throw new Error('no pending connection for this user')
    }
    conn.state = 'active'
    conn.updatedAt = now()
    return { ...conn }
  }

  async markConnection(
    userId: string,
    connectionId: string,
    state: 'invalid' | 'revoked' | 'deletion_pending' | 'deleted'
  ): Promise<Connection | undefined> {
    const conn = this.connections.get(connectionId)
    if (conn === undefined || conn.userId !== userId) return undefined
    conn.state = state
    conn.updatedAt = now()
    return { ...conn }
  }

  async replaceConnection(userId: string, newConnectionId: string, environment: Connection['environment']): Promise<Connection> {
    const existing = this.activeConnectionFor(userId)
    if (existing !== undefined) {
      existing.state = 'revoked'
      existing.updatedAt = now()
    }
    const conn: StoredConnection = {
      connectionId: newConnectionId,
      userId,
      provider: 'lunchmoney',
      environment,
      state: 'pending',
      createdAt: now(),
      updatedAt: now()
    }
    this.connections.set(newConnectionId, conn)
    return { ...conn }
  }

  async getActiveConnection(userId: string): Promise<Connection | undefined> {
    const conn = this.activeConnectionFor(userId)
    return conn === undefined ? undefined : { ...conn }
  }
}
