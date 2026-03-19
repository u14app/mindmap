import type {
  MindMapPlugin,
  ParseContext,
  ParsedLineResult,
  LayoutContext,
} from './types'
import type { MindMapData, LayoutNode, Edge } from '../types'
import type { TokenLayout } from '../utils/inline-markdown'
import type { ThemeColors } from '../utils/theme'

// ── Parsing runners ──

export function runPreParseMarkdown(plugins: MindMapPlugin[], md: string, ctx: ParseContext): string {
  for (const p of plugins) {
    if (p.preParseMarkdown) md = p.preParseMarkdown(md, ctx)
  }
  return md
}

export function runParseLine(plugins: MindMapPlugin[], line: string, index: number, ctx: ParseContext): ParsedLineResult | null {
  for (const p of plugins) {
    if (p.parseLine) {
      const result = p.parseLine(line, index, ctx)
      if (result) return result
    }
  }
  return null
}

export function runCollectFollowLines(plugins: MindMapPlugin[], lines: string[], startIdx: number, node: MindMapData, ctx: ParseContext): number {
  let total = 0
  for (const p of plugins) {
    if (p.collectFollowLines) {
      const consumed = p.collectFollowLines(lines, startIdx + total, node, ctx)
      total += consumed
    }
  }
  return total
}

export function runTransformNodeData(plugins: MindMapPlugin[], node: MindMapData, rawText: string, ctx: ParseContext): MindMapData {
  for (const p of plugins) {
    if (p.transformNodeData) node = p.transformNodeData(node, rawText, ctx)
  }
  return node
}

export function runPostParseTree(plugins: MindMapPlugin[], roots: MindMapData[], ctx: ParseContext): MindMapData[] {
  for (const p of plugins) {
    if (p.postParseTree) roots = p.postParseTree(roots, ctx)
  }
  return roots
}

// ── Serialization runners ──

export function runSerializePreamble(plugins: MindMapPlugin[], roots: MindMapData[]): string {
  let preamble = ''
  for (const p of plugins) {
    if (p.serializePreamble) {
      const result = p.serializePreamble(roots)
      if (result) preamble += result
    }
  }
  return preamble
}

export function runSerializeListMarker(plugins: MindMapPlugin[], node: MindMapData, defaultMarker: string): string {
  let marker = defaultMarker
  for (const p of plugins) {
    if (p.serializeListMarker) {
      const result = p.serializeListMarker(node, marker)
      if (result !== marker) {
        marker = result
        break // first plugin that changes it wins
      }
    }
  }
  return marker
}

export function runSerializeNodeText(plugins: MindMapPlugin[], node: MindMapData, baseText: string): string {
  for (const p of plugins) {
    if (p.serializeNodeText) baseText = p.serializeNodeText(node, baseText)
  }
  return baseText
}

export function runSerializeFollowLines(plugins: MindMapPlugin[], node: MindMapData, indent: number): string[] {
  const lines: string[] = []
  for (const p of plugins) {
    if (p.serializeFollowLines) {
      const result = p.serializeFollowLines(node, indent)
      if (result) lines.push(...result)
    }
  }
  return lines
}

// ── Layout runners ──

export function runAdjustNodeSize(
  plugins: MindMapPlugin[],
  node: MindMapData,
  width: number,
  height: number,
  fontSize: number,
): { width: number; height: number } {
  for (const p of plugins) {
    if (p.adjustNodeSize) {
      const result = p.adjustNodeSize(node, width, height, fontSize)
      width = result.width
      height = result.height
    }
  }
  return { width, height }
}

export function runFilterChildren(
  plugins: MindMapPlugin[],
  node: MindMapData,
  children: MindMapData[],
  ctx: LayoutContext,
): MindMapData[] {
  for (const p of plugins) {
    if (p.filterChildren) children = p.filterChildren(node, children, ctx)
  }
  return children
}

export function runTransformEdge(
  plugins: MindMapPlugin[],
  edge: Edge,
  fromNode: LayoutNode,
  toNode: LayoutNode,
): Edge {
  for (const p of plugins) {
    if (p.transformEdge) edge = p.transformEdge(edge, fromNode, toNode)
  }
  return edge
}

export function runGenerateExtraEdges(
  plugins: MindMapPlugin[],
  nodes: LayoutNode[],
  roots: MindMapData[],
  ctx: LayoutContext,
): Edge[] {
  const extras: Edge[] = []
  for (const p of plugins) {
    if (p.generateExtraEdges) {
      extras.push(...p.generateExtraEdges(nodes, roots, ctx))
    }
  }
  return extras
}

export function runTransformNodeColor(
  plugins: MindMapPlugin[],
  node: LayoutNode,
  data: MindMapData,
  parentColor: string,
): { color?: string; bgColor?: string } {
  let result: { color?: string; bgColor?: string } = {}
  for (const p of plugins) {
    if (p.transformNodeColor) {
      const r = p.transformNodeColor(node, data, parentColor)
      result = { ...result, ...r }
    }
  }
  return result
}

// ── Rendering runners ──

export function runRenderNodeDecoration(
  plugins: MindMapPlugin[],
  node: LayoutNode,
  theme: ThemeColors,
): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  for (const p of plugins) {
    if (p.renderNodeDecoration) {
      const el = p.renderNodeDecoration(node, theme)
      if (el) elements.push(el)
    }
  }
  return elements
}

export function runRenderInlineToken(
  plugins: MindMapPlugin[],
  layout: TokenLayout,
  key: number,
): React.ReactNode | null {
  for (const p of plugins) {
    if (p.renderInlineToken) {
      const el = p.renderInlineToken(layout, key)
      if (el) return el
    }
  }
  return null
}

export function runRenderOverlay(
  plugins: MindMapPlugin[],
  nodes: LayoutNode[],
  edges: Edge[],
  theme: ThemeColors,
): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  for (const p of plugins) {
    if (p.renderOverlay) {
      const el = p.renderOverlay(nodes, edges, theme)
      if (el) elements.push(el)
    }
  }
  return elements
}

// ── Export runners ──

export function runExportNodeDecoration(
  plugins: MindMapPlugin[],
  node: LayoutNode,
  theme: ThemeColors,
  allPlugins?: MindMapPlugin[],
  pngSafe?: boolean,
): string {
  let result = ''
  for (const p of plugins) {
    if (p.exportNodeDecoration) result += p.exportNodeDecoration(node, theme, allPlugins, pngSafe)
  }
  return result
}

export function runExportInlineToken(
  plugins: MindMapPlugin[],
  layout: TokenLayout,
  pngSafe?: boolean,
): string | null {
  for (const p of plugins) {
    if (p.exportInlineToken) {
      const s = p.exportInlineToken(layout, pngSafe)
      if (s) return s
    }
  }
  return null
}

export function runExportOverlay(
  plugins: MindMapPlugin[],
  nodes: LayoutNode[],
  edges: Edge[],
  theme: ThemeColors,
): string {
  let result = ''
  for (const p of plugins) {
    if (p.exportOverlay) result += p.exportOverlay(nodes, edges, theme)
  }
  return result
}
