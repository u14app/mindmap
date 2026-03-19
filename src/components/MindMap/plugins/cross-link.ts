import type { MindMapPlugin } from './types'
import type { MindMapData, LayoutNode, Edge, CrossLink } from '../types'

// Regex patterns
const ANCHOR_RE = /\{#([\w-]+)\}/
const CROSSLINK_RE = /(-?\.?)>\s*\{#([\w-]+)\}(?:\s+"([^"]*)")?/g

export const crossLinkPlugin: MindMapPlugin = {
  name: 'cross-link',

  transformNodeData(node) {
    let text = node.text
    let anchorId: string | undefined
    const crossLinks: CrossLink[] = []

    // Extract cross-links FIRST: -> {#target} "label" or -.> {#target} "label"
    // Must run before anchor extraction, since cross-link targets also contain {#id}
    const clRegex = new RegExp(CROSSLINK_RE.source, 'g')
    let m
    while ((m = clRegex.exec(text)) !== null) {
      const dotted = m[1] === '-.'
      crossLinks.push({
        targetAnchorId: m[2],
        label: m[3] || undefined,
        dotted,
      })
    }
    // Remove cross-link syntax from text
    text = text.replace(new RegExp(CROSSLINK_RE.source, 'g'), '').trim()

    // Extract standalone anchor {#id} (after cross-links are removed)
    const anchorMatch = text.match(ANCHOR_RE)
    if (anchorMatch) {
      anchorId = anchorMatch[1]
      text = text.replace(ANCHOR_RE, '').trim()
    }

    if (anchorId || crossLinks.length > 0) {
      return {
        ...node,
        text,
        ...(anchorId ? { anchorId } : {}),
        ...(crossLinks.length > 0 ? { crossLinks } : {}),
      }
    }
    return node
  },

  serializeNodeText(node, baseText) {
    let text = baseText
    if (node.anchorId) {
      text += ` {#${node.anchorId}}`
    }
    if (node.crossLinks) {
      for (const cl of node.crossLinks) {
        const arrow = cl.dotted ? '-.>' : '->'
        text += ` ${arrow} {#${cl.targetAnchorId}}`
        if (cl.label) text += ` "${cl.label}"`
      }
    }
    return text
  },

  generateExtraEdges(nodes, roots) {
    const edges: Edge[] = []

    // Build anchor map: anchorId -> LayoutNode
    const anchorMap = new Map<string, LayoutNode>()
    for (const n of nodes) {
      if (n.anchorId) {
        anchorMap.set(n.anchorId, n)
      }
    }

    // Find all cross-links in the data tree
    function walkTree(data: MindMapData) {
      if (data.crossLinks) {
        const sourceNode = nodes.find(n => n.id === data.id)
        if (sourceNode) {
          for (const cl of data.crossLinks) {
            const targetNode = anchorMap.get(cl.targetAnchorId)
            if (targetNode) {
              // Compute arc path between source and target
              const path = computeCrossLinkPath(sourceNode, targetNode)
              edges.push({
                key: `xlink-${sourceNode.id}-${targetNode.id}`,
                path,
                color: sourceNode.color,
                fromId: sourceNode.id,
                toId: targetNode.id,
                strokeDasharray: '6 4',
                isCrossLink: true,
                label: cl.label,
              })
            }
          }
        }
      }
      if (data.children) {
        for (const child of data.children) {
          walkTree(child)
        }
      }
    }

    for (const root of roots) {
      walkTree(root)
    }

    return edges
  },
}

/**
 * Compute a curved path between two nodes that arcs to avoid the tree layout.
 */
function computeCrossLinkPath(from: LayoutNode, to: LayoutNode): string {
  const x1 = from.x
  const y1 = from.y
  const x2 = to.x
  const y2 = to.y

  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Arc control point: perpendicular offset from midpoint
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const offset = Math.min(dist * 0.3, 60)

  // Perpendicular direction (rotate 90 degrees)
  const nx = -dy / dist
  const ny = dx / dist

  const cx = mx + nx * offset
  const cy = my + ny * offset

  return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`
}
