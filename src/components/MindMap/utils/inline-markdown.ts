import type { MindMapPlugin } from '../plugins/types'

export type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'strikethrough'; content: string }
  | { type: 'code'; content: string }
  | { type: 'highlight'; content: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'image'; alt: string; url: string }
  | { type: 'latex-inline'; content: string }
  | { type: 'latex-block'; content: string }

// Base regex pattern
const BASE_PATTERN = '!\\[([^\\]]*)\\]\\(([^)]+)\\)|\\[([^\\]]+)\\]\\(([^)]+)\\)|`([^`]+)`|\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|~~(.+?)~~|==(.+?)=='

/**
 * Parse inline markdown text into tokens.
 * Priority: image > link > code > bold > italic > strikethrough > highlight
 * Plugins can inject additional patterns (e.g. LaTeX $...$).
 */
export function parseInlineMarkdown(text: string, plugins?: MindMapPlugin[]): InlineToken[] {
  const tokens: InlineToken[] = []

  // Build regex: plugin patterns (sorted by priority) + base pattern
  let fullPattern = BASE_PATTERN
  const pluginPatterns: { plugin: MindMapPlugin; groupOffset: number; pattern: string }[] = []

  if (plugins && plugins.length > 0) {
    // Collect plugin patterns sorted by priority (lower = higher priority = inserted first)
    const collected: { plugin: MindMapPlugin; pattern: string; priority: number }[] = []
    for (const p of plugins) {
      if (p.inlineTokenPattern) {
        const { pattern, priority } = p.inlineTokenPattern()
        collected.push({ plugin: p, pattern, priority })
      }
    }
    collected.sort((a, b) => a.priority - b.priority)

    // Prepend plugin patterns before base pattern
    let groupOffset = 0
    for (const entry of collected) {
      // Count capture groups in the plugin pattern
      const groupCount = countCaptureGroups(entry.pattern)
      pluginPatterns.push({ plugin: entry.plugin, groupOffset, pattern: entry.pattern })
      groupOffset += groupCount
    }

    if (pluginPatterns.length > 0) {
      const pluginPart = pluginPatterns.map(p => p.pattern).join('|')
      // Adjust base group offset
      const totalPluginGroups = groupOffset
      fullPattern = pluginPart + '|' + BASE_PATTERN
      // Update plugin group offsets are already 0-based from the start of the combined regex
      // Base groups start after all plugin groups
      // We need to track this for parsing
      void totalPluginGroups // used below
    }
  }

  const regex = new RegExp(fullPattern, 'g')
  const totalPluginGroups = pluginPatterns.reduce(
    (sum, p) => sum + countCaptureGroups(p.pattern), 0
  )

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    let handled = false

    // Try plugin patterns first
    if (pluginPatterns.length > 0) {
      for (const pp of pluginPatterns) {
        // Check if any of this plugin's groups matched
        const groupStart = pp.groupOffset + 1 // +1 because match[0] is full match
        const groupCount = countCaptureGroups(pp.pattern)
        let hasMatch = false
        for (let g = groupStart; g < groupStart + groupCount; g++) {
          if (match[g] !== undefined) {
            hasMatch = true
            break
          }
        }
        if (hasMatch && pp.plugin.createInlineToken) {
          const token = pp.plugin.createInlineToken(match, pp.groupOffset)
          if (token) {
            tokens.push(token)
            handled = true
            break
          }
        }
      }
    }

    // Fall back to base pattern matching
    if (!handled) {
      const baseOffset = totalPluginGroups
      const g = (i: number) => match![baseOffset + i]

      if (g(1) !== undefined || g(2) !== undefined) {
        tokens.push({ type: 'image', alt: g(1) ?? '', url: g(2) })
      } else if (g(3) !== undefined) {
        tokens.push({ type: 'link', text: g(3), url: g(4) })
      } else if (g(5) !== undefined) {
        tokens.push({ type: 'code', content: g(5) })
      } else if (g(6) !== undefined) {
        tokens.push({ type: 'bold', content: g(6) })
      } else if (g(7) !== undefined) {
        tokens.push({ type: 'italic', content: g(7) })
      } else if (g(8) !== undefined) {
        tokens.push({ type: 'strikethrough', content: g(8) })
      } else if (g(9) !== undefined) {
        tokens.push({ type: 'highlight', content: g(9) })
      }
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) })
  }

  if (tokens.length === 0) {
    tokens.push({ type: 'text', content: text })
  }

  return tokens
}

/** Count capture groups in a regex pattern string */
function countCaptureGroups(pattern: string): number {
  // Count unescaped opening parentheses that are not non-capturing (?:...)
  let count = 0
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '\\') { i++; continue }
    if (pattern[i] === '(' && pattern[i + 1] !== '?') count++
  }
  return count
}

/**
 * Strip all inline markdown markers, returning plain text for measurement.
 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/==(.+?)==/g, '$1')
    .replace(/\$\$(.+?)\$\$/g, '$1')
    .replace(/\$([^$]+?)\$/g, '$1')
}

// --- Canvas text measurement for per-token layout ---

const MONO_FONT = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"

let _measureCtx: CanvasRenderingContext2D | null = null
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    const c = document.createElement('canvas')
    _measureCtx = c.getContext('2d')!
  }
  return _measureCtx
}

function measureTokenText(text: string, fontSize: number, fontWeight: number, fontFamily: string): number {
  const ctx = getMeasureCtx()
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  return ctx.measureText(text).width
}

export interface TokenLayout {
  token: InlineToken
  x: number
  width: number
}

/**
 * Compute per-token layout (x offset and width) for SVG rendering.
 */
export function computeTokenLayouts(
  tokens: InlineToken[],
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
): TokenLayout[] {
  const layouts: TokenLayout[] = []
  let x = 0

  for (const token of tokens) {
    let width: number

    switch (token.type) {
      case 'bold':
        width = measureTokenText(token.content, fontSize, 700, fontFamily)
        break
      case 'code':
        width = measureTokenText(token.content, fontSize * 0.88, 400, MONO_FONT)
        break
      case 'link':
        width = measureTokenText(token.text, fontSize, fontWeight, fontFamily)
        break
      case 'image':
        width = measureTokenText(`[${token.alt || 'image'}]`, fontSize, fontWeight, fontFamily)
        break
      case 'latex-inline':
      case 'latex-block':
        // Approximate measurement for formulas
        width = measureTokenText(token.content, fontSize * 0.9, fontWeight, MONO_FONT)
        break
      default:
        width = measureTokenText('content' in token ? token.content : '', fontSize, fontWeight, fontFamily)
        break
    }

    layouts.push({ token, x, width })
    x += width
  }

  return layouts
}

// --- SVG string builder for export ---

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export { escapeXml }

/**
 * Build SVG elements string for a node's formatted text content.
 * Returns background rects + text element + remark indicator as SVG string.
 * All styles are inline SVG attributes — no CSS dependencies.
 */
export function buildSvgNodeTextString(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
  textColor: string,
  taskStatus: string | undefined,
  remarkText: string | undefined,
  plugins?: MindMapPlugin[],
  highlightTextColor?: string,
  highlightBgColor?: string,
  pngSafe?: boolean,
): string {
  const tokens = parseInlineMarkdown(text, plugins)
  const layouts = computeTokenLayouts(tokens, fontSize, fontWeight, fontFamily)
  const textContentWidth = layouts.length > 0 ? layouts[layouts.length - 1].x + layouts[layouts.length - 1].width : 0

  const iconSize = fontSize * 0.85
  const iconGap = taskStatus ? 4 : 0
  const taskIconWidth = taskStatus ? iconSize + iconGap : 0

  const remarkFontSize = fontSize * 0.7
  const remarkGap = remarkText ? 4 : 0
  const remarkWidth = remarkText ? remarkFontSize + remarkGap : 0

  const totalWidth = taskIconWidth + textContentWidth + remarkWidth
  const startX = -totalWidth / 2
  const textStartX = startX + taskIconWidth

  const parts: string[] = []

  // Task status icon
  if (taskStatus) {
    parts.push(`<g transform="translate(${startX}, ${-iconSize / 2})">`)
    parts.push(taskStatusSvgIcon(taskStatus, iconSize))
    parts.push(`</g>`)
  }

  // Background rects for code/highlight
  const bgRectY = -fontSize / 2 - 2
  const bgRectH = fontSize + 4
  for (const layout of layouts) {
    if (layout.token.type === 'code') {
      parts.push(`<rect x="${textStartX + layout.x - 2}" y="${bgRectY}" width="${layout.width + 4}" height="${bgRectH}" rx="3" fill="rgba(128,128,128,0.12)"/>`)
    } else if (layout.token.type === 'highlight') {
      parts.push(`<rect x="${textStartX + layout.x - 1}" y="${bgRectY}" width="${layout.width + 2}" height="${bgRectH}" rx="2" fill="${highlightBgColor || 'rgba(255,213,79,0.3)'}"/>`)
    }
  }

  // Text element with tspan segments
  parts.push(`<text text-anchor="start" dominant-baseline="central" x="${textStartX}" fill="${textColor}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamily}">`)
  for (const layout of layouts) {
    parts.push(tokenToSvgTspan(layout.token, plugins, highlightTextColor, pngSafe))
  }
  parts.push(`</text>`)

  // Remark indicator
  if (remarkText) {
    parts.push(`<text x="${textStartX + textContentWidth + remarkGap}" text-anchor="start" dominant-baseline="central" font-size="${remarkFontSize}" opacity="0.5">💬</text>`)
  }

  return parts.join('')
}

function tokenToSvgTspan(token: InlineToken, plugins?: MindMapPlugin[], highlightTextColor?: string, pngSafe?: boolean): string {
  switch (token.type) {
    case 'bold':
      return `<tspan font-weight="700">${escapeXml(token.content)}</tspan>`
    case 'italic':
      return `<tspan font-style="italic">${escapeXml(token.content)}</tspan>`
    case 'strikethrough':
      return `<tspan text-decoration="line-through" opacity="0.6">${escapeXml(token.content)}</tspan>`
    case 'code':
      return `<tspan font-family="${MONO_FONT}" font-size="0.88em">${escapeXml(token.content)}</tspan>`
    case 'highlight':
      return `<tspan fill="${highlightTextColor || '#B8860B'}">${escapeXml(token.content)}</tspan>`
    case 'link':
      return `<a href="${escapeXml(token.url)}" target="_blank"><tspan fill="#2563EB" text-decoration="underline">${escapeXml(token.text)}</tspan></a>`
    case 'image':
      return `<tspan font-style="italic">[${escapeXml(token.alt || 'image')}]</tspan>`
    case 'latex-inline':
    case 'latex-block': {
      // Try plugin exportInlineToken first
      if (plugins) {
        for (const p of plugins) {
          if (p.exportInlineToken) {
            const result = p.exportInlineToken({ token, x: 0, width: 0 }, pngSafe)
            if (result) return result
          }
        }
      }
      // Fallback: italic monospace
      return `<tspan font-family="${MONO_FONT}" font-style="italic" font-size="0.9em">${escapeXml(token.content)}</tspan>`
    }
    case 'text':
    default:
      return escapeXml(token.content)
  }
}

function taskStatusSvgIcon(status: string, size: number): string {
  if (status === 'done') {
    return `<rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.2}" fill="#22C55E"/><path d="M${size * 0.28} ${size * 0.5}L${size * 0.44} ${size * 0.66}L${size * 0.72} ${size * 0.34}" stroke="white" stroke-width="${size * 0.13}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  }
  if (status === 'doing') {
    return `<rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.2}" fill="none" stroke="#F59E0B" stroke-width="${size * 0.1}"/><rect x="${size * 0.25}" y="${size * 0.25}" width="${size * 0.5}" height="${size * 0.5}" rx="${size * 0.1}" fill="#F59E0B" opacity="0.6"/>`
  }
  return `<rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.2}" fill="none" stroke="#999" stroke-width="${size * 0.1}" opacity="0.4"/>`
}

/**
 * Build SVG string for a single line of inline-markdown-formatted text at a given y coordinate.
 * Used by plugins (e.g. multi-line) to render additional text lines during export.
 */
export function buildSvgTextLineString(
  text: string,
  fontSize: number,
  fontWeight: number,
  fontFamily: string,
  textColor: string,
  y: number,
  plugins?: MindMapPlugin[],
  highlightTextColor?: string,
  highlightBgColor?: string,
  opacity?: number,
): string {
  const tokens = parseInlineMarkdown(text, plugins)
  const layouts = computeTokenLayouts(tokens, fontSize, fontWeight, fontFamily)
  const textContentWidth = layouts.length > 0 ? layouts[layouts.length - 1].x + layouts[layouts.length - 1].width : 0
  const startX = -textContentWidth / 2

  const parts: string[] = []

  // Background rects for code/highlight
  const bgRectY = y - fontSize / 2 - 2
  const bgRectH = fontSize + 4
  for (const layout of layouts) {
    if (layout.token.type === 'code') {
      parts.push(`<rect x="${startX + layout.x - 2}" y="${bgRectY}" width="${layout.width + 4}" height="${bgRectH}" rx="3" fill="rgba(128,128,128,0.12)"/>`)
    } else if (layout.token.type === 'highlight') {
      parts.push(`<rect x="${startX + layout.x - 1}" y="${bgRectY}" width="${layout.width + 2}" height="${bgRectH}" rx="2" fill="${highlightBgColor || 'rgba(255,213,79,0.3)'}"/>`)
    }
  }

  // Text element with tspan segments
  const opacityAttr = opacity !== undefined ? ` opacity="${opacity}"` : ''
  parts.push(`<text x="${startX}" y="${y}" text-anchor="start" dominant-baseline="central" fill="${textColor}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamily}"${opacityAttr}>`)
  for (const layout of layouts) {
    parts.push(tokenToSvgTspan(layout.token, plugins, highlightTextColor))
  }
  parts.push(`</text>`)

  return parts.join('')
}
