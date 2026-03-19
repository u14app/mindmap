export type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'strikethrough'; content: string }
  | { type: 'code'; content: string }
  | { type: 'highlight'; content: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'image'; alt: string; url: string }

/**
 * Parse inline markdown text into tokens.
 * Priority: image > link > code > bold > italic > strikethrough > highlight
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex =
    /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|==(.+?)==/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined || match[2] !== undefined) {
      tokens.push({ type: 'image', alt: match[1] ?? '', url: match[2] })
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'link', text: match[3], url: match[4] })
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'code', content: match[5] })
    } else if (match[6] !== undefined) {
      tokens.push({ type: 'bold', content: match[6] })
    } else if (match[7] !== undefined) {
      tokens.push({ type: 'italic', content: match[7] })
    } else if (match[8] !== undefined) {
      tokens.push({ type: 'strikethrough', content: match[8] })
    } else if (match[9] !== undefined) {
      tokens.push({ type: 'highlight', content: match[9] })
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
): string {
  const tokens = parseInlineMarkdown(text)
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
      parts.push(`<rect x="${textStartX + layout.x - 1}" y="${bgRectY}" width="${layout.width + 2}" height="${bgRectH}" rx="2" fill="rgba(255,213,79,0.3)"/>`)
    }
  }

  // Text element with tspan segments
  parts.push(`<text text-anchor="start" dominant-baseline="central" x="${textStartX}" fill="${textColor}" font-size="${fontSize}" font-weight="${fontWeight}" font-family="${fontFamily}">`)
  for (const layout of layouts) {
    parts.push(tokenToSvgTspan(layout.token))
  }
  parts.push(`</text>`)

  // Remark indicator
  if (remarkText) {
    parts.push(`<text x="${textStartX + textContentWidth + remarkGap}" text-anchor="start" dominant-baseline="central" font-size="${remarkFontSize}" opacity="0.5">💬</text>`)
  }

  return parts.join('')
}

function tokenToSvgTspan(token: InlineToken): string {
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
      return `<tspan fill="#B8860B">${escapeXml(token.content)}</tspan>`
    case 'link':
      return `<a href="${escapeXml(token.url)}" target="_blank"><tspan fill="#2563EB" text-decoration="underline">${escapeXml(token.text)}</tspan></a>`
    case 'image':
      return `<tspan font-style="italic">[${escapeXml(token.alt || 'image')}]</tspan>`
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
