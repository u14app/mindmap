import type { LayoutNode, Edge } from '../types'
import type { ThemeColors } from './theme'
import type { MindMapPlugin } from '../plugins/types'
import { THEME } from './theme'
import { buildSvgNodeTextString } from './inline-markdown'
import { runExportNodeDecoration, runExportOverlay } from '../plugins/runner'

interface ExportOptions {
  padding?: number
  scale?: number
  background?: string
  /** When true, avoid foreignObject elements (for PNG canvas export) */
  pngSafe?: boolean
}

/**
 * Build SVG string for export. Uses pure SVG elements with inline styles.
 * Works for both SVG file export and PNG conversion.
 */
export function buildExportSVG(
  nodes: LayoutNode[],
  edges: Edge[],
  options: ExportOptions = {},
  theme: ThemeColors = THEME,
  plugins?: MindMapPlugin[],
): string {
  const { padding = 40, background = theme.canvas.bgColor, pngSafe = false } = options

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.width / 2)
    maxX = Math.max(maxX, n.x + n.width / 2)
    minY = Math.min(minY, n.y - n.height / 2)
    maxY = Math.max(maxY, n.y + n.height / 2)
  }

  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  const parts: string[] = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`)

  // Arrow marker for cross-links
  if (edges.some(e => e.isCrossLink)) {
    parts.push(`<defs>`)
    parts.push(`<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">`)
    parts.push(`<path d="M0,0 L8,3 L0,6" fill="none" stroke="currentColor" stroke-width="1.5"/>`)
    parts.push(`</marker>`)
    parts.push(`</defs>`)
  }

  parts.push(`<rect width="100%" height="100%" fill="${background}"/>`)
  parts.push(`<g transform="translate(${offsetX}, ${offsetY})">`)

  // Edges
  for (const edge of edges) {
    let attrs = `d="${edge.path}" stroke="${edge.color}" stroke-width="${theme.connection.strokeWidth}" stroke-linecap="round" fill="none"`
    if (edge.strokeDasharray) {
      attrs += ` stroke-dasharray="${edge.strokeDasharray}"`
    }
    if (edge.isCrossLink) {
      attrs += ` marker-end="url(#arrowhead)" opacity="0.7"`
    }
    parts.push(`<path ${attrs}/>`)

    // Edge label
    if (edge.label) {
      // Approximate midpoint of the path
      const fromNode = nodes.find(n => n.id === edge.fromId)
      const toNode = nodes.find(n => n.id === edge.toId)
      if (fromNode && toNode) {
        const mx = (fromNode.x + toNode.x) / 2
        const my = (fromNode.y + toNode.y) / 2
        parts.push(`<text x="${mx}" y="${my - 6}" text-anchor="middle" font-size="11" fill="${edge.color}" opacity="0.8" font-family="${theme.node.fontFamily}">${edge.label}</text>`)
      }
    }
  }

  // Nodes
  for (const node of nodes) {
    const nx = node.x
    const ny = node.y

    if (node.depth === 0) {
      const { fontSize, fontWeight, fontFamily, textColor } = theme.root
      const bgColor = theme.root.bgColor
      parts.push(`<g transform="translate(${nx}, ${ny})">`)
      parts.push(`<rect x="${-node.width / 2}" y="${-node.height / 2}" width="${node.width}" height="${node.height}" rx="${node.height / 2}" ry="${node.height / 2}" fill="${bgColor}"/>`)
      parts.push(buildSvgNodeTextString(node.text, fontSize, fontWeight, fontFamily, textColor, node.taskStatus, node.remark, plugins, theme.highlight.textColor, theme.highlight.bgColor, pngSafe))
      // Plugin: export node decorations
      if (plugins && plugins.length > 0) {
        parts.push(runExportNodeDecoration(plugins, node, theme, plugins, pngSafe))
      }
      parts.push(`</g>`)
    } else {
      const fontSize = node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize
      const fontWeight = node.depth === 1 ? theme.level1.fontWeight : theme.node.fontWeight
      const textW = node.width - theme.node.paddingH * 2
      const underlineY = fontSize / 2 + 4

      parts.push(`<g transform="translate(${nx}, ${ny})">`)
      parts.push(buildSvgNodeTextString(node.text, fontSize, fontWeight, theme.node.fontFamily, theme.node.textColor, node.taskStatus, node.remark, plugins, theme.highlight.textColor, theme.highlight.bgColor, pngSafe))
      parts.push(`<line x1="${-textW / 2}" y1="${underlineY}" x2="${textW / 2}" y2="${underlineY}" stroke="${node.color}" stroke-width="2.5" stroke-linecap="round"/>`)
      // Plugin: export node decorations
      if (plugins && plugins.length > 0) {
        parts.push(runExportNodeDecoration(plugins, node, theme, plugins, pngSafe))
      }
      parts.push(`</g>`)
    }
  }

  // Plugin: export overlay (cross-link arrows, etc.)
  if (plugins && plugins.length > 0) {
    parts.push(runExportOverlay(plugins, nodes, edges, theme))
  }

  parts.push(`</g>`)
  parts.push(`</svg>`)
  return parts.join('\n')
}

// Backward-compatible alias
export const buildExportSVGForPNG = buildExportSVG

export function exportToPNG(
  svgString: string,
  options: ExportOptions = {},
): Promise<Blob> {
  const defaultScale = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio ?? 1, 2) : 2
  const { scale = defaultScale } = options
  return new Promise((resolve, reject) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgEl = doc.documentElement
    const width = parseFloat(svgEl.getAttribute('width') || '800')
    const height = parseFloat(svgEl.getAttribute('height') || '600')

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to create PNG blob'))
      }, 'image/png')
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}
