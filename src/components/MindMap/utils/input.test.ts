import { describe, expect, it } from 'vitest'
import { frontMatterPlugin } from '../plugins/front-matter'
import {
  parseInitialMindMapInput,
  parseMindMapMarkdownInput,
} from './input'

describe('mind map input parsing', () => {
  it('parses plain markdown into roots', () => {
    const result = parseMindMapMarkdownInput('Root\n- Child')

    expect(result.roots[0].text).toBe('Root')
    expect(result.roots[0].children?.[0].text).toBe('Child')
    expect(result.direction).toBeUndefined()
    expect(result.theme).toBeUndefined()
  })

  it('extracts supported frontmatter options when plugins are enabled', () => {
    const result = parseMindMapMarkdownInput(
      '---\ndirection: left\ntheme: dark\n---\n- Root',
      [frontMatterPlugin],
    )

    expect(result.roots[0].text).toBe('Root')
    expect(result.direction).toBe('left')
    expect(result.theme).toBe('dark')
  })

  it('ignores unsupported frontmatter option values', () => {
    const result = parseMindMapMarkdownInput(
      '---\ndirection: diagonal\ntheme: neon\n---\n- Root',
      [frontMatterPlugin],
    )

    expect(result.direction).toBeUndefined()
    expect(result.theme).toBeUndefined()
  })

  it('lets controlled data take priority over initial markdown parsing', () => {
    const result = parseInitialMindMapInput(
      [{ id: 'root', text: 'Controlled' }],
      '- Markdown',
      [frontMatterPlugin],
    )

    expect(result).toBeNull()
  })
})
