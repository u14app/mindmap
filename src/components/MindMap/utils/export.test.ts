import { describe, expect, it } from 'vitest'
import { layoutMultiRoot } from './layout'
import { buildExportSVG, exportMindMapToSVG } from './export'
import { escapeXml } from './inline-markdown'
import { frontMatterPlugin } from '../plugins/front-matter'
import { foldingPlugin } from '../plugins/folding'

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

describe('exportMindMapToSVG', () => {
  it('exports SVG directly from mind map data', () => {
    const svg = exportMindMapToSVG({
      data: {
        id: 'root',
        text: 'Root',
        children: [{ id: 'child', text: 'Child' }],
      },
      defaultDirection: 'right',
    })

    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('Root')
    expect(svg).toContain('Child')
  })

  it('exports SVG directly from markdown and applies parsed frontmatter options', () => {
    const svg = exportMindMapToSVG({
      markdown: `---
direction: left
theme: dark
---
- Root
  - Child`,
      plugins: [frontMatterPlugin],
    })

    expect(svg).toContain('Root')
    expect(svg).toContain('Child')
    expect(svg).toContain('fill="#1a1a2e"')
  })

  it('exports the full tree by default even when nodes are collapsed', () => {
    const svg = exportMindMapToSVG({
      data: {
        id: 'root',
        text: 'Root',
        children: [
          {
            id: 'collapsed',
            text: 'Collapsed',
            collapsed: true,
            children: [{ id: 'grandchild', text: 'Grandchild' }],
          },
        ],
      },
      plugins: [foldingPlugin],
    })

    expect(svg).toContain('Grandchild')
  })

  it('can export the readonly folded view and apply fold overrides', () => {
    const data = {
      id: 'root',
      text: 'Root',
      children: [
        {
          id: 'collapsed',
          text: 'Collapsed',
          collapsed: true,
          children: [{ id: 'grandchild', text: 'Grandchild' }],
        },
      ],
    }

    const foldedSvg = exportMindMapToSVG({
      data,
      plugins: [foldingPlugin],
      readonly: true,
    })
    const expandedSvg = exportMindMapToSVG({
      data,
      plugins: [foldingPlugin],
      readonly: true,
      foldOverrides: { collapsed: true },
    })

    expect(foldedSvg).not.toContain('Grandchild')
    expect(expandedSvg).toContain('Grandchild')
  })
})
