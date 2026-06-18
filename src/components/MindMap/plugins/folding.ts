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
    // A runtime fold override is authoritative when present: true = expanded,
    // false = collapsed — regardless of the node's persisted `collapsed` flag.
    const override = ctx.foldOverrides[node.id]
    if (override !== undefined) return override ? children : []
    // No override: fall back to the persisted (markdown `+`) collapsed flag.
    return node.collapsed ? [] : children
  },
}
