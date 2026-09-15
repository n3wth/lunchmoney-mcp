import test from 'node:test'
import assert from 'node:assert/strict'
import {toolCallEvent, createObserver} from '../src/observability.js'

test('usage telemetry only includes fixed tool names and never arguments', () => {
  const type = toolCallEvent({method: 'tools/call', params: {name: 'lunchmoney_list_accounts', arguments: {token: 'private', query: 'private'}}})
  assert.equal(type, 'tool_call:lunchmoney_list_accounts')
  const points: unknown[] = []
  createObserver({writeDataPoint: point => points.push(point)})({type: type!})
  assert.deepEqual(points, [{blobs: ['tool_call:lunchmoney_list_accounts'], doubles: [0]}])
  for (const body of [null, [], {method: 'tools/list'}, {method: 'tools/call', params: {name: 'private-token'}}, {method: 'tools/call', params: null}]) {
    assert.equal(toolCallEvent(body), undefined)
  }
})
