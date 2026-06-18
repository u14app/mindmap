import { describe, expect, it } from 'vitest'
import { frontMatterPlugin } from '../plugins/front-matter'
import { parseImportText, validateMindMapData } from './import'

describe('mind map import utilities', () => {
  it('validates a single MindMapData root', () => {
    const data = validateMindMapData({
      id: 'root',
      text: 'Root',
      children: [{ id: 'child', text: 'Child' }],
    })

    expect(data).toHaveLength(1)
    expect(data?.[0].children?.[0].text).toBe('Child')
  })

  it('rejects invalid JSON-shaped data', () => {
    expect(validateMindMapData({ id: 'root' })).toBeNull()
    expect(validateMindMapData([{ id: 'root', text: 42 }])).toBeNull()
  })

  it('imports JSON automatically when the text starts with JSON syntax', () => {
    const result = parseImportText(
      JSON.stringify([{ id: 'a', text: 'Imported' }]),
      'auto',
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.source).toBe('json')
      expect(result.data[0].text).toBe('Imported')
    }
  })

  it('imports markdown when the text is not JSON', () => {
    const result = parseImportText('Root\n- Child', 'auto')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.source).toBe('markdown')
      expect(result.data[0].children?.[0].text).toBe('Child')
    }
  })

  it('returns frontmatter view options for markdown imports', () => {
    const result = parseImportText(
      '---\ndirection: right\ntheme: dark\n---\n- Imported',
      'markdown',
      [frontMatterPlugin],
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.direction).toBe('right')
      expect(result.theme).toBe('dark')
    }
  })

  it('returns specific import errors', () => {
    expect(parseImportText('', 'auto')).toEqual({ ok: false, reason: 'empty' })
    expect(parseImportText('{', 'json')).toEqual({
      ok: false,
      reason: 'invalid-json',
    })
    expect(parseImportText('{"id":"x"}', 'json')).toEqual({
      ok: false,
      reason: 'invalid-data',
    })
  })
})
