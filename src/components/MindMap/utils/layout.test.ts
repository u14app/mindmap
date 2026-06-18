import { describe, expect, it } from 'vitest'
import type { MindMapData } from '../types'
import { layoutMultiRoot } from './layout'
import { foldingPlugin } from '../plugins/folding'

const ids = (nodes: { id: string }[]) => nodes.map((n) => n.id)

describe('layoutMultiRoot basics', () => {
  it('returns nothing for an empty forest', () => {
    const { nodes, edges } = layoutMultiRoot([])
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('lays out a single node with no children', () => {
    const { nodes, edges } = layoutMultiRoot([{ id: 'root', text: 'Solo' }])
    expect(nodes).toHaveLength(1)
    expect(nodes[0].depth).toBe(0)
    expect(nodes[0].text).toBe('Solo')
    expect(edges).toEqual([])
  })

  it('places every root at depth 0 for a multi-root forest', () => {
    const roots: MindMapData[] = [
      { id: 'r1', text: 'Root 1' },
      { id: 'r2', text: 'Root 2' },
    ]
    const { nodes } = layoutMultiRoot(roots)
    const rootNodes = nodes.filter((n) => n.depth === 0)
    expect(ids(rootNodes).sort()).toEqual(['r1', 'r2'])
  })

  it('splits children to both sides in "both" direction', () => {
    const root: MindMapData = {
      id: 'root',
      text: 'Root',
      children: [
        { id: 'c1', text: 'C1' },
        { id: 'c2', text: 'C2' },
        { id: 'c3', text: 'C3' },
        { id: 'c4', text: 'C4' },
      ],
    }
    const { nodes } = layoutMultiRoot([root], 'both')
    const right = nodes.filter((n) => n.depth === 1 && n.side === 'right')
    const left = nodes.filter((n) => n.depth === 1 && n.side === 'left')
    expect(right).toHaveLength(2)
    expect(left).toHaveLength(2)
  })
})

describe('folding plugin fold-override precedence (B2-6)', () => {
  const collapsedTree: MindMapData = {
    id: 'root',
    text: 'Root',
    children: [
      { id: 'c1', text: 'C1', collapsed: true, children: [{ id: 'gc1', text: 'GC1' }] },
    ],
  }

  const openTree: MindMapData = {
    id: 'root',
    text: 'Root',
    children: [
      { id: 'c1', text: 'C1', children: [{ id: 'gc1', text: 'GC1' }] },
    ],
  }

  it('hides children of a collapsed node by default in readonly mode', () => {
    const { nodes } = layoutMultiRoot([collapsedTree], 'both', {}, {}, [foldingPlugin], true, {})
    expect(ids(nodes)).not.toContain('gc1')
  })

  it('shows children when a fold override expands a collapsed node', () => {
    const { nodes } = layoutMultiRoot([collapsedTree], 'both', {}, {}, [foldingPlugin], true, { c1: true })
    expect(ids(nodes)).toContain('gc1')
  })

  it('collapses an otherwise-open node when its override is false', () => {
    const { nodes } = layoutMultiRoot([openTree], 'both', {}, {}, [foldingPlugin], true, { c1: false })
    expect(ids(nodes)).not.toContain('gc1')
  })

  it('ignores folding entirely when not readonly', () => {
    const { nodes } = layoutMultiRoot([collapsedTree], 'both', {}, {}, [foldingPlugin], false, {})
    expect(ids(nodes)).toContain('gc1')
  })
})
