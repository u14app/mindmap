import type { MindMapData } from '../types'

export function parseMarkdownList(md: string): MindMapData {
  const lines = md.split('\n')
  const items: { indent: number; text: string }[] = []

  for (const line of lines) {
    // Match lines starting with optional whitespace then - or * followed by space
    const match = line.match(/^(\s*)[*-]\s+(.+)/)
    if (!match) continue
    const indent = match[1].replace(/\t/g, '  ').length
    const text = match[2].trim()
    if (text) items.push({ indent, text })
  }

  if (items.length === 0) {
    return { id: 'md-0', text: 'Root' }
  }

  // Detect indent unit (smallest non-zero indent)
  let indentUnit = 2
  for (const item of items) {
    if (item.indent > 0) {
      indentUnit = item.indent
      break
    }
  }

  // Normalize indent levels
  const normalized = items.map((item) => ({
    level: item.indent > 0 ? Math.round(item.indent / indentUnit) : 0,
    text: item.text,
  }))

  // First top-level item is root; remaining top-level items are root's children
  const root: MindMapData = {
    id: 'md-0',
    text: normalized[0].text,
    children: [],
  }

  // Stack tracks parent chain: [node, level]
  const stack: [MindMapData, number][] = [[root, 0]]
  let childIndex = 0

  for (let i = 1; i < normalized.length; i++) {
    const { level, text } = normalized[i]
    // Treat remaining top-level items (level 0) as root's direct children (level 1)
    const effectiveLevel = level === 0 ? 1 : level

    const node: MindMapData = {
      id: 'md-tmp',
      text,
    }

    // Find parent: pop stack until we find a node at level < effectiveLevel
    while (stack.length > 1 && stack[stack.length - 1][1] >= effectiveLevel) {
      stack.pop()
    }

    const parent = stack[stack.length - 1][0]
    if (!parent.children) parent.children = []
    childIndex = parent.children.length
    node.id = `${parent.id}-${childIndex}`
    parent.children.push(node)
    stack.push([node, effectiveLevel])
  }

  // Clean up empty children arrays
  cleanChildren(root)
  return root
}

function cleanChildren(node: MindMapData): void {
  if (node.children && node.children.length === 0) {
    delete node.children
  } else if (node.children) {
    for (const child of node.children) {
      cleanChildren(child)
    }
  }
}

export function toMarkdownList(data: MindMapData, indent = 0): string {
  const prefix = '  '.repeat(indent) + '- '
  let result = prefix + data.text + '\n'
  if (data.children) {
    for (const child of data.children) {
      result += toMarkdownList(child, indent + 1)
    }
  }
  return result
}

/**
 * Parse markdown with multiple root trees separated by blank lines.
 */
export function parseMarkdownMultiRoot(md: string): MindMapData[] {
  // Split on blank lines (one or more empty lines)
  const blocks = md.split(/\n[ \t]*\n/).filter((block) => block.trim())
  if (blocks.length === 0) {
    return [{ id: 'md-0', text: 'Root' }]
  }
  if (blocks.length === 1) {
    return [parseMarkdownList(md)]
  }
  return blocks.map((block, i) => {
    const tree = parseMarkdownList(block)
    // Reassign IDs with root index prefix for uniqueness across trees
    reassignIds(tree, `md-${i}`)
    return tree
  })
}

function reassignIds(node: MindMapData, prefix: string): void {
  node.id = prefix
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      reassignIds(node.children[i], `${prefix}-${i}`)
    }
  }
}

/**
 * Convert multiple root trees to markdown, separated by blank lines.
 */
export function toMarkdownMultiRoot(roots: MindMapData[]): string {
  return roots.map((root) => toMarkdownList(root)).join('\n')
}
