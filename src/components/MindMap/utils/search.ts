import type { MindMapData } from '../types'
import { stripInlineMarkdown } from './inline-markdown'

export interface MindMapSearchState {
  availableTags: string[]
  searchMatches: Set<string>
  tagMatches: Set<string>
  tagContext: Set<string>
  dimmedNodes: Set<string>
  matchIds: string[]
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function nodeSearchText(node: MindMapData): string {
  return [
    node.text,
    node.remark,
    node.multiLineContent?.join(' '),
    node.tags?.join(' '),
  ]
    .filter(Boolean)
    .map((part) => stripInlineMarkdown(String(part)))
    .join(' ')
}

function walk(
  nodes: MindMapData[],
  visit: (node: MindMapData, ancestors: string[]) => void,
  ancestors: string[] = [],
) {
  for (const node of nodes) {
    visit(node, ancestors)
    if (node.children) {
      walk(node.children, visit, [...ancestors, node.id])
    }
  }
}

export function analyzeMindMapSearch(
  roots: MindMapData[],
  query: string,
  activeTags: string[],
): MindMapSearchState {
  const normalizedQuery = normalize(query)
  const normalizedTags = activeTags.map(normalize).filter(Boolean)
  const availableTags = new Set<string>()
  const searchMatches = new Set<string>()
  const tagMatches = new Set<string>()
  const tagContext = new Set<string>()
  const allNodeIds: string[] = []
  const matchIds: string[] = []

  walk(roots, (node, ancestors) => {
    allNodeIds.push(node.id)

    for (const tag of node.tags || []) {
      availableTags.add(tag)
    }

    if (
      normalizedQuery &&
      normalize(nodeSearchText(node)).includes(normalizedQuery)
    ) {
      searchMatches.add(node.id)
      matchIds.push(node.id)
    }

    if (normalizedTags.length > 0) {
      const nodeTags = (node.tags || []).map(normalize)
      const hasMatchingTag = normalizedTags.some((tag) =>
        nodeTags.includes(tag),
      )
      if (hasMatchingTag) {
        tagMatches.add(node.id)
        tagContext.add(node.id)
        for (const ancestorId of ancestors) {
          tagContext.add(ancestorId)
        }
      }
    }
  })

  const dimmedNodes = new Set<string>()
  if (normalizedTags.length > 0) {
    for (const id of allNodeIds) {
      if (!tagContext.has(id)) dimmedNodes.add(id)
    }
  }

  return {
    availableTags: Array.from(availableTags).sort((a, b) =>
      a.localeCompare(b),
    ),
    searchMatches,
    tagMatches,
    tagContext,
    dimmedNodes,
    matchIds,
  }
}
