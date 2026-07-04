import type { LayoutDirection, LayoutNode, Edge, MindMapData, ThemeMode } from '../types'
import type { ThemeColors } from './theme'
import type { MindMapPlugin } from '../plugins/types'
import { THEME, generateExportStyles, getTheme } from './theme'
import { buildSvgNodeTextString } from './inline-markdown'
import { runExportNodeDecoration, runExportOverlay } from '../plugins/runner'
import { layoutMultiRoot } from './layout'
import { parseMindMapMarkdownInput } from './input'
import { normalizeData } from './tree-ops'

interface ExportOptions {
  padding?: number
  scale?: number
  background?: string
  /** When true, avoid foreignObject elements (for PNG canvas export) */
  pngSafe?: boolean
}

export interface ExportMindMapToSVGOptions {
  data?: MindMapData | MindMapData[]
  markdown?: string
  defaultDirection?: LayoutDirection
  theme?: ThemeMode
  plugins?: MindMapPlugin[]
  readonly?: boolean
  foldOverrides?: Record<string, boolean>
  padding?: number
  background?: string
}

function resolveExportTheme(mode: ThemeMode = 'auto'): ThemeColors {
  if (mode === 'dark') return getTheme('dark')
  if (mode === 'light') return getTheme('light')
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return getTheme(prefersDark ? 'dark' : 'light')
}

/**
 * Build SVG string for export. Embeds a <style> block with resolved values
 * and applies semantic CSS classes to elements for external customization.
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

  // Embedded style block with resolved values
  parts.push(`<defs>`)
  parts.push(`  <style>`)
  parts.push(`    ${generateExportStyles(theme)}`)
  parts.push(`  </style>`)

  // Arrow marker for cross-links
  if (edges.some(e => e.isCrossLink)) {
    parts.push(`<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">`)
    parts.push(`<path d="M0,0 L8,3 L0,6" fill="none" stroke="currentColor" stroke-width="1.5"/>`)
    parts.push(`</marker>`)
  }

  parts.push(`</defs>`)

  parts.push(`<rect width="100%" height="100%" fill="${background}"/>`)
  parts.push(`<g transform="translate(${offsetX}, ${offsetY})">`)

  // Edges
  for (const edge of edges) {
    const toNode = nodes.find(n => n.id === edge.toId)
    const branchAttr = toNode?.branchIndex !== undefined ? ` data-branch-index="${toNode.branchIndex}"` : ''
    let attrs = `class="mindmap-edge" d="${edge.path}" stroke="${edge.color}"${branchAttr}`
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
      if (fromNode && toNode) {
        const mx = (fromNode.x + toNode.x) / 2
        const my = (fromNode.y + toNode.y) / 2
        parts.push(`<text class="mindmap-edge-label" x="${mx}" y="${my - 6}" text-anchor="middle" font-size="11" fill="${edge.color}" opacity="0.8">${edge.label}</text>`)
      }
    }
  }

  // Nodes
  for (const node of nodes) {
    const nx = node.x
    const ny = node.y
    const branchAttr = node.branchIndex !== undefined ? ` data-branch-index="${node.branchIndex}"` : ''

    if (node.depth === 0) {
      const { fontSize, fontWeight, fontFamily, textColor } = theme.root
      const bgColor = theme.root.bgColor
      parts.push(`<g class="mindmap-node-g mindmap-node-root" transform="translate(${nx}, ${ny})"${branchAttr}>`)
      parts.push(`<rect class="mindmap-node-bg" x="${-node.width / 2}" y="${-node.height / 2}" width="${node.width}" height="${node.height}" rx="${node.height / 2}" ry="${node.height / 2}" fill="${bgColor}"/>`)
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

      parts.push(`<g class="mindmap-node-g mindmap-node-child" transform="translate(${nx}, ${ny})"${branchAttr}>`)
      parts.push(buildSvgNodeTextString(node.text, fontSize, fontWeight, theme.node.fontFamily, theme.node.textColor, node.taskStatus, node.remark, plugins, theme.highlight.textColor, theme.highlight.bgColor, pngSafe))
      parts.push(`<line class="mindmap-node-underline" x1="${-textW / 2}" y1="${underlineY}" x2="${textW / 2}" y2="${underlineY}" stroke="${node.color}"/>`)
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

export function exportMindMapToSVG({
  data,
  markdown,
  defaultDirection = 'both',
  theme: themeMode = 'auto',
  plugins: pluginsProp,
  readonly = false,
  foldOverrides,
  padding,
  background,
}: ExportMindMapToSVGOptions): string {
  const plugins = pluginsProp && pluginsProp.length > 0 ? pluginsProp : undefined
  const parsed = markdown !== undefined
    ? parseMindMapMarkdownInput(markdown, plugins)
    : null
  const roots = parsed
    ? parsed.roots
    : data
      ? normalizeData(data)
      : [{ id: 'md-0', text: 'Root' }]
  const direction = parsed?.direction ?? defaultDirection
  const activeTheme = resolveExportTheme(parsed?.theme ?? themeMode)
  const { nodes, edges } = layoutMultiRoot(
    roots,
    direction,
    {},
    {},
    plugins,
    readonly,
    foldOverrides ?? {},
  )

  return buildExportSVG(
    nodes,
    edges,
    { padding, background },
    activeTheme,
    plugins,
  )
}

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
