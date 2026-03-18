import type { LayoutNode, Edge } from '../types'
import type { ThemeColors } from './theme'
import { THEME } from './theme'

interface ExportOptions {
  padding?: number
  scale?: number
  background?: string
}

export function buildExportSVG(
  nodes: LayoutNode[],
  edges: Edge[],
  options: ExportOptions = {},
  theme: ThemeColors = THEME,
): string {
  const { padding = 40, background = theme.canvas.bgColor } = options

  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const n of nodes) {
    const nx = n.x
    const ny = n.y
    minX = Math.min(minX, nx - n.width / 2)
    maxX = Math.max(maxX, nx + n.width / 2)
    minY = Math.min(minY, ny - n.height / 2)
    maxY = Math.max(maxY, ny + n.height / 2)
  }

  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  // Build SVG string
  const parts: string[] = []
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`)
  parts.push(`<rect width="100%" height="100%" fill="${background}"/>`)
  parts.push(`<g transform="translate(${offsetX}, ${offsetY})">`)

  // Edges
  for (const edge of edges) {
    parts.push(`<path d="${edge.path}" stroke="${edge.color}" stroke-width="${theme.connection.strokeWidth}" stroke-linecap="round" fill="none"/>`)
  }

  // Nodes
  for (const node of nodes) {
    const nx = node.x
    const ny = node.y

    if (node.depth === 0) {
      parts.push(`<g transform="translate(${nx}, ${ny})">`)
      parts.push(`<rect x="${-node.width / 2}" y="${-node.height / 2}" width="${node.width}" height="${node.height}" rx="${node.height / 2}" ry="${node.height / 2}" fill="${theme.root.bgColor}"/>`)
      parts.push(`<text text-anchor="middle" dominant-baseline="central" fill="${theme.root.textColor}" font-size="${theme.root.fontSize}" font-weight="${theme.root.fontWeight}" font-family="${theme.root.fontFamily}">${escapeXml(node.text)}</text>`)
      parts.push(`</g>`)
    } else {
      const fontSize = node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize
      const fontWeight = node.depth === 1 ? theme.level1.fontWeight : theme.node.fontWeight
      const textW = node.width - theme.node.paddingH * 2
      const underlineY = fontSize / 2 + 4

      parts.push(`<g transform="translate(${nx}, ${ny})">`)
      parts.push(`<text text-anchor="middle" dominant-baseline="central" fill="${theme.node.textColor}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${theme.node.fontFamily}">${escapeXml(node.text)}</text>`)
      parts.push(`<line x1="${-textW / 2}" y1="${underlineY}" x2="${textW / 2}" y2="${underlineY}" stroke="${node.color}" stroke-width="2.5" stroke-linecap="round"/>`)
      parts.push(`</g>`)
    }
  }

  parts.push(`</g>`)
  parts.push(`</svg>`)
  return parts.join('\n')
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
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
