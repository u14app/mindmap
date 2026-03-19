import type { MindMapPlugin } from './types'

export const foldingPlugin: MindMapPlugin = {
  name: 'folding',

  parseLine(line) {
    const match = line.match(/^(\s*)\+\s+(.+)/)
    if (!match) return null
    const indent = match[1].replace(/\t/g, '  ').length
    return { indent, text: match[2].trim(), collapsed: true }
  },

  serializeListMarker(node, defaultMarker) {
    return node.collapsed ? '+ ' : defaultMarker
  },

  filterChildren(node, children, ctx) {
    if (!ctx.readonly) return children
    if (!node.collapsed) return children
    // Check fold overrides: if user has toggled this node open, show children
    const overridden = ctx.foldOverrides[node.id]
    if (overridden) return children
    // Collapsed and not overridden: hide children
    return []
  },
}
