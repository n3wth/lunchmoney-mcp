import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { D1IdentityStore, type IdentityDatabase } from '../src/d1-identity.js'

test('D1 persists identity across stores, serializes claims, isolates tenants and rolls back replacement', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default {fetch() {return new Response()}}', d1Databases: ['DB'] }))
  try {
    const db = await mf.getD1Database('DB')
    const sql = await readFile(new URL('../../migrations/0001_identity.sql', import.meta.url), 'utf8')
    await db.batch(sql.split(';').filter(s => s.trim()).map(s => db.prepare(s)))
    const a = new D1IdentityStore(db as unknown as IdentityDatabase)
    const b = new D1IdentityStore(db as unknown as IdentityDatabase)
    const users = await Promise.all(Array.from({ length: 8 }, () => a.getOrCreateUser('issuer', 'subject')))
    const user = users[0]
    assert.equal(new Set(users.map(u => u.userId)).size, 1)
    assert.deepEqual(await b.getUser(user.userId), user)
    assert.deepEqual(await b.getOrCreateUser('issuer', 'subject'), user)
    assert.notEqual((await b.getOrCreateUser('issue', 'rsubject')).userId, user.userId)
    const other = await a.getOrCreateUser('issuer', 'other')
    await a.beginConnection(user.userId, `pending:${user.userId}`, 'development')
    const claims = await Promise.all([a.claimPendingConnection(user.userId, 'real'), b.claimPendingConnection(user.userId, 'other-real')])
    assert.equal(claims.filter(Boolean).length, 1)
    const conn = (await b.getActiveConnection(user.userId))!
    await assert.rejects(a.activateConnection(other.userId, conn.connectionId))
    assert.equal(await a.markConnection(other.userId, conn.connectionId, 'deleted'), undefined)
    await b.activateConnection(user.userId, conn.connectionId)
    await a.beginConnection(other.userId, 'owned', 'development')
    await assert.rejects(a.replaceConnection(user.userId, 'owned', 'development'))
    assert.equal((await b.getActiveConnection(user.userId))?.state, 'active')
    await a.markConnection(user.userId, conn.connectionId, 'deleted')
    assert.equal(await b.getActiveConnection(user.userId), undefined)
    await assert.rejects(a.activateConnection(user.userId, conn.connectionId))
    assert.equal(await a.claimPendingConnection(user.userId, conn.connectionId), undefined)
    await a.replaceConnection(user.userId, `pending:${user.userId}`, 'development')
    await b.replaceConnection(user.userId, `pending:${user.userId}`, 'development')
    assert.equal((await a.getActiveConnection(user.userId))?.state, 'pending')
  } finally { await mf.dispose() }
})
