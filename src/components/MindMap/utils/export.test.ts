import { describe, expect, it } from 'vitest'
import { layoutMultiRoot } from './layout'
import { buildExportSVG } from './export'
import { escapeXml } from './inline-markdown'

describe('escapeXml', () => {
  it('escapes XML metacharacters (& first, so no double-escaping)', () => {
    expect(escapeXml('a < b & c > d "e"')).toBe(
      'a &lt; b &amp; c &gt; d &quot;e&quot;',
    )
  })

  it('leaves plain text untouched', () => {
    expect(escapeXml('hello world')).toBe('hello world')
  })
})

describe('buildExportSVG escaping', () => {
  it('escapes node text so markup cannot be injected', () => {
    const { nodes, edges } = layoutMultiRoot([
      { id: 'r', text: 'a < b & <script>x</script>' },
    ])
    const svg = buildExportSVG(nodes, edges)

    // The raw injected tag must not survive into the output.
    expect(svg).not.toContain('<script>')
    // Escaped entities from the node text are present.
    expect(svg).toContain('&lt;')
    expect(svg).toContain('&amp;')
  })

  it('produces a valid standalone <svg> root element', () => {
    const { nodes, edges } = layoutMultiRoot([
      { id: 'r', text: 'Root', children: [{ id: 'c', text: 'Child' }] },
    ])
    const svg = buildExportSVG(nodes, edges)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
  })
})
