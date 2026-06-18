import { describe, expect, it } from 'vitest'
import type { MindMapData } from '../types'
import { analyzeMindMapSearch } from './search'

const data: MindMapData[] = [
  {
    id: 'root',
    text: 'Project Plan',
    children: [
      {
        id: 'frontend',
        text: 'React UI',
        tags: ['frontend'],
        children: [{ id: 'search', text: 'Search Panel' }],
      },
      {
        id: 'backend',
        text: 'API Proxy',
        tags: ['backend'],
        remark: 'Protect API keys',
      },
    ],
  },
]

describe('mind map search utilities', () => {
  it('finds text matches across node text and remarks', () => {
    const result = analyzeMindMapSearch(data, 'api keys', [])

    expect(result.matchIds).toEqual(['backend'])
    expect(result.searchMatches.has('backend')).toBe(true)
  })

  it('collects available tags', () => {
    const result = analyzeMindMapSearch(data, '', [])

    expect(result.availableTags).toEqual(['backend', 'frontend'])
  })

  it('keeps ancestor context for tag filters and dims unrelated nodes', () => {
    const result = analyzeMindMapSearch(data, '', ['frontend'])

    expect(result.tagMatches.has('frontend')).toBe(true)
    expect(result.tagContext.has('root')).toBe(true)
    expect(result.dimmedNodes.has('backend')).toBe(true)
    expect(result.dimmedNodes.has('frontend')).toBe(false)
  })
})
