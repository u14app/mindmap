import { describe, expect, it } from 'vitest'
import type { MindMapData } from '../types'
import {
  addChildMulti,
  addSibling,
  addSiblingMulti,
  removeNodeMulti,
  findSubtreeMulti,
  regenerateIds,
} from './tree-ops'

function sampleRoots(): MindMapData[] {
  return [
    {
      id: 'r1',
      text: 'Root 1',
      children: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B', children: [{ id: 'b1', text: 'B1' }] },
      ],
    },
    { id: 'r2', text: 'Root 2' },
  ]
}

describe('tree-ops immutability', () => {
  it('addChildMulti does not mutate the input roots', () => {
    const roots = sampleRoots()
    const snapshot = structuredClone(roots)
    const next = addChildMulti(roots, 'a', { id: 'a1', text: 'A1' })

    expect(roots).toEqual(snapshot)
    expect(next).not.toBe(roots)
    const a = next[0].children?.find((c) => c.id === 'a')
    expect(a?.children?.[0]).toEqual({ id: 'a1', text: 'A1' })
  })

  it('removeNodeMulti does not mutate the input roots', () => {
    const roots = sampleRoots()
    const snapshot = structuredClone(roots)
    const next = removeNodeMulti(roots, 'b1')

    expect(roots).toEqual(snapshot)
    const b = next[0].children?.find((c) => c.id === 'b')
    expect(b?.children).toBeUndefined()
  })

  it('removeNodeMulti drops a whole root when targeted', () => {
    const roots = sampleRoots()
    const next = removeNodeMulti(roots, 'r2')
    expect(next.map((r) => r.id)).toEqual(['r1'])
  })
})

describe('addSibling / addSiblingMulti', () => {
  it('inserts a sibling immediately after the target child', () => {
    const root = sampleRoots()[0]
    const next = addSibling(root, 'a', { id: 'a2', text: 'A2' })
    expect(next.children?.map((c) => c.id)).toEqual(['a', 'a2', 'b'])
  })

  it('returns the node unchanged when the target is absent', () => {
    const root = sampleRoots()[0]
    const next = addSibling(root, 'missing', { id: 'x', text: 'X' })
    expect(next.children?.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('does not mutate the input', () => {
    const roots = sampleRoots()
    const snapshot = structuredClone(roots)
    addSiblingMulti(roots, 'a', { id: 'a2', text: 'A2' })
    expect(roots).toEqual(snapshot)
  })

  it('inserts a new root after a targeted root node', () => {
    const roots = sampleRoots()
    const next = addSiblingMulti(roots, 'r1', { id: 'r1b', text: 'Between' })
    expect(next.map((r) => r.id)).toEqual(['r1', 'r1b', 'r2'])
  })

  it('inserts a nested sibling within a tree', () => {
    const roots = sampleRoots()
    const next = addSiblingMulti(roots, 'b1', { id: 'b2', text: 'B2' })
    const b = next[0].children?.find((c) => c.id === 'b')
    expect(b?.children?.map((c) => c.id)).toEqual(['b1', 'b2'])
  })
})

describe('regenerateIds', () => {
  it('assigns fresh unique ids across the whole subtree', () => {
    const subtree = sampleRoots()[0]
    const cloned = regenerateIds(subtree)

    const collect = (n: MindMapData): string[] => [
      n.id,
      ...(n.children?.flatMap(collect) ?? []),
    ]
    const oldIds = collect(subtree)
    const newIds = collect(cloned)

    // No id is shared with the original, and all new ids are unique.
    expect(newIds.some((id) => oldIds.includes(id))).toBe(false)
    expect(new Set(newIds).size).toBe(newIds.length)
    // Structure (text + shape) is preserved.
    expect(cloned.text).toBe(subtree.text)
    expect(cloned.children?.map((c) => c.text)).toEqual(['A', 'B'])
  })
})

describe('findSubtreeMulti', () => {
  it('returns a deep clone, not a reference into the source tree', () => {
    const roots = sampleRoots()
    const found = findSubtreeMulti(roots, 'b')
    expect(found?.text).toBe('B')
    expect(found).not.toBe(roots[0].children?.[1])
  })

  it('returns null when the id is not present', () => {
    expect(findSubtreeMulti(sampleRoots(), 'nope')).toBeNull()
  })
})
