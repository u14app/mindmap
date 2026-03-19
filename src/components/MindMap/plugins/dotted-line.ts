import type { MindMapPlugin } from './types'

export const dottedLinePlugin: MindMapPlugin = {
  name: 'dotted-line',

  parseLine(line) {
    const match = line.match(/^(\s*)-\.\s+(.+)/)
    if (!match) return null
    const indent = match[1].replace(/\t/g, '  ').length
    return { indent, text: match[2].trim(), dottedLine: true }
  },

  serializeListMarker(node, defaultMarker) {
    return node.dottedLine ? '-. ' : defaultMarker
  },

  transformEdge(edge, _fromNode, toNode) {
    if (toNode.dottedLine) {
      return { ...edge, strokeDasharray: '6 4' }
    }
    return edge
  },
}
