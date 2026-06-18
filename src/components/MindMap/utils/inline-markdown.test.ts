import { describe, expect, it } from 'vitest'
import {
  buildSvgNodeTextString,
  computeTokenLayouts,
  hasInlineImage,
  parseInlineMarkdown,
} from './inline-markdown'

describe('inline markdown image support', () => {
  it('parses image tokens', () => {
    const tokens = parseInlineMarkdown('Logo ![Open MindMap](./logo.png)')

    expect(tokens.some((token) => token.type === 'image')).toBe(true)
  })

  it('uses stable image token layout width', () => {
    const tokens = parseInlineMarkdown('![diagram](./diagram.png)')
    const layouts = computeTokenLayouts(tokens, 14, 400, 'sans-serif')

    expect(layouts[0].width).toBeGreaterThanOrEqual(80)
  })

  it('detects inline images', () => {
    expect(hasInlineImage('![x](x.png)')).toBe(true)
    expect(hasInlineImage('[x](x.png)')).toBe(false)
  })

  it('exports image tokens as SVG image elements', () => {
    const svg = buildSvgNodeTextString(
      '![diagram](./diagram.png)',
      14,
      400,
      'sans-serif',
      '#111',
      undefined,
      undefined,
    )

    expect(svg).toContain('<image')
    expect(svg).toContain('href="./diagram.png"')
  })
})
