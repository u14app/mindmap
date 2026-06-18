import { describe, expect, it } from 'vitest'
import type { MindMapHistorySnapshot } from './history'
import {
  areHistorySnapshotsEqual,
  cloneHistorySnapshot,
  pushHistorySnapshot,
} from './history'

function snapshot(text: string): MindMapHistorySnapshot {
  return {
    mapData: [{ id: 'root', text }],
    direction: 'both',
    splitIndices: {},
    foldOverrides: {},
    selectedNodeId: null,
  }
}

describe('mind map history utilities', () => {
  it('clones snapshots so callers cannot mutate history entries', () => {
    const original = snapshot('Root')
    const cloned = cloneHistorySnapshot(original)

    original.mapData[0].text = 'Changed'

    expect(cloned.mapData[0].text).toBe('Root')
  })

  it('deduplicates identical consecutive snapshots', () => {
    const first = snapshot('Root')
    const stack = pushHistorySnapshot(pushHistorySnapshot([], first), first)

    expect(stack).toHaveLength(1)
  })

  it('detects changed snapshots', () => {
    expect(areHistorySnapshotsEqual(snapshot('A'), snapshot('A'))).toBe(true)
    expect(areHistorySnapshotsEqual(snapshot('A'), snapshot('B'))).toBe(false)
  })
})
