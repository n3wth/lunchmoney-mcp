import type { Connection, IdentityStore, User } from './identity.js'

// Structural binding types keep the Node entrypoint independent of Workers.
export interface Statement {
  bind(...values: string[]): Statement
  first<T>(): Promise<T | null>
}
export interface IdentityDatabase {
  prepare(sql: string): Statement
  batch<T>(statements: Statement[]): Promise<{ results: T[] }[]>
}

export class D1IdentityStore implements IdentityStore {
  constructor(private readonly db: IdentityDatabase) {}

  async getOrCreateUser(issuer: string, subject: string): Promise<User> {
    // Insert only on first sighting. A conflict UPDATE would rewrite the row on
    // every authenticated request, including read-only tool calls.
    const inserted = await this.db.prepare(`INSERT INTO users VALUES (?, ?, ?, ?)
      ON CONFLICT(issuer, subject) DO NOTHING RETURNING *`)
      .bind(`usr_${crypto.randomUUID()}`, issuer, subject, new Date().toISOString()).first<User>()
    if (inserted) return inserted
    const existing = await this.db.prepare('SELECT * FROM users WHERE issuer = ? AND subject = ?')
      .bind(issuer, subject).first<User>()
    if (!existing) throw new Error('identity unavailable')
    return existing
  }

  async getUser(userId: string): Promise<User | undefined> {
    return await this.db.prepare('SELECT * FROM users WHERE userId = ?').bind(userId).first<User>() ?? undefined
  }

  async getActiveConnection(userId: string): Promise<Connection | undefined> {
    return await this.db.prepare("SELECT * FROM connections WHERE userId = ? AND state IN ('pending', 'active')")
      .bind(userId).first<Connection>() ?? undefined
  }

  private insert(userId: string, connectionId: string, environment: Connection['environment']): Statement {
    const now = new Date().toISOString()
    return this.db.prepare("INSERT INTO connections VALUES (?, ?, 'lunchmoney', ?, 'pending', ?, ?) RETURNING *")
      .bind(connectionId, userId, environment, now, now)
  }

  async claimPendingConnection(userId: string, connectionId: string): Promise<Connection | undefined> {
    return await this.db.prepare(`UPDATE connections SET connectionId = ?, updatedAt = ?
      WHERE userId = ? AND connectionId = ? AND state = 'pending'
      AND NOT EXISTS (SELECT 1 FROM connections WHERE connectionId = ?) RETURNING *`)
      .bind(connectionId, new Date().toISOString(), userId, `pending:${userId}`, connectionId)
      .first<Connection>() ?? undefined
  }

  async beginConnection(userId: string, connectionId: string, environment: Connection['environment']): Promise<Connection> {
    const conn = await this.insert(userId, connectionId, environment).first<Connection>()
    if (!conn) throw new Error('connection unavailable')
    return conn
  }

  async activateConnection(userId: string, connectionId: string): Promise<Connection> {
    const conn = await this.db.prepare("UPDATE connections SET state = 'active', updatedAt = ? WHERE userId = ? AND connectionId = ? AND state = 'pending' RETURNING *")
      .bind(new Date().toISOString(), userId, connectionId).first<Connection>()
    if (!conn) throw new Error('no pending connection for this user')
    return conn
  }

  async markConnection(userId: string, connectionId: string, state: 'invalid' | 'revoked' | 'deletion_pending' | 'deleted'): Promise<Connection | undefined> {
    return await this.db.prepare('UPDATE connections SET state = ?, updatedAt = ? WHERE userId = ? AND connectionId = ? RETURNING *')
      .bind(state, new Date().toISOString(), userId, connectionId).first<Connection>() ?? undefined
  }

  async replaceConnection(userId: string, connectionId: string, environment: Connection['environment']): Promise<Connection> {
    const now = new Date().toISOString()
    const results = await this.db.batch<Connection>([
      this.db.prepare("UPDATE connections SET state = 'revoked', updatedAt = ? WHERE userId = ? AND state IN ('pending', 'active')")
        .bind(now, userId),
      // Only reusable local placeholders may be overwritten. Real IDs remain
      // tombstones so another user cannot claim an existing Nango connection.
      this.db.prepare("DELETE FROM connections WHERE userId = ? AND connectionId = ? AND connectionId = 'pending:' || userId")
        .bind(userId, connectionId),
      this.insert(userId, connectionId, environment)
    ])
    const conn = results[2]?.results[0]
    if (!conn) throw new Error('connection unavailable')
    return conn
  }
}
