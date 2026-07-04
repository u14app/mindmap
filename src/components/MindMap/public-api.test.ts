import { describe, expect, it } from 'vitest'
import { MindMap, MindMapViewer, exportMindMapToSVG, parseMarkdownMultiRoot } from '.'
import type {
  Edge,
  ExportMindMapToSVGOptions,
  LayoutNode,
  MindMapAIContentPart,
  MindMapAIRequestPayload,
} from '.'

function acceptsAIRequestPayloadSignal(
  signal: MindMapAIRequestPayload['signal'],
): AbortSignal {
  return signal
}

describe('public API exports', () => {
  it('exports runtime helpers and advanced public types from the main entry', () => {
    const node: LayoutNode = {
      id: 'root',
      text: 'Root',
      x: 0,
      y: 0,
      width: 120,
      height: 48,
      color: '#2563eb',
      depth: 0,
      side: 'root',
    }
    const edge: Edge = {
      key: 'root-child',
      path: 'M0 0 C10 0 10 10 20 10',
      color: '#2563eb',
      fromId: 'root',
      toId: 'child',
    }
    const content: MindMapAIContentPart = {
      type: 'text',
      text: 'Generate a mind map',
    }
    const exportOptions: ExportMindMapToSVGOptions = {
      data: { id: 'root', text: 'Root' },
    }

    expect(MindMap).toBeDefined()
    expect(MindMapViewer).toBeDefined()
    expect(exportMindMapToSVG(exportOptions)).toContain('Root')
    expect(parseMarkdownMultiRoot('Root')[0].text).toBe('Root')
    expect(node.side).toBe('root')
    expect(edge.toId).toBe('child')
    expect(content.type).toBe('text')
    expect(acceptsAIRequestPayloadSignal(new AbortController().signal)).toBeInstanceOf(
      AbortSignal,
    )
  })
})
