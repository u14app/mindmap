import type { MindMapData, TaskStatus } from '../types'
import type { MindMapPlugin } from '../plugins/types'
import {
  runPreParseMarkdown,
  runParseLine,
  runCollectFollowLines,
  runTransformNodeData,
  runPostParseTree,
  runSerializePreamble,
  runSerializeListMarker,
  runSerializeNodeText,
  runSerializeFollowLines,
} from '../plugins/runner'

interface ParsedItem {
  indent: number
  text: string
  taskStatus?: TaskStatus
  remarkLines: string[]
  // Plugin extension fields from ParsedLineResult
  dottedLine?: boolean
  collapsed?: boolean
}

/**
 * Extract task status prefix from text.
 * Returns the task status and the remaining text.
 */
function extractTaskStatus(text: string): { taskStatus?: TaskStatus; text: string } {
  const match = text.match(/^\[([ x-])\]\s+(.*)/)
  if (!match) return { text }
  const flag = match[1]
  const rest = match[2]
  if (flag === ' ') return { taskStatus: 'todo', text: rest }
  if (flag === 'x') return { taskStatus: 'done', text: rest }
  if (flag === '-') return { taskStatus: 'doing', text: rest }
  return { text }
}

export function parseMarkdownList(md: string, plugins?: MindMapPlugin[]): MindMapData {
  const activePlugins = plugins && plugins.length > 0 ? plugins : undefined

  // Step 1: Pre-process (e.g. frontmatter extraction)
  const ctx = activePlugins ? { lines: [] as string[], frontMatter: {} as Record<string, string> } : undefined
  let processedMd = md
  if (activePlugins && ctx) {
    processedMd = runPreParseMarkdown(activePlugins, processedMd, ctx)
  }

  const lines = processedMd.split('\n')
  if (ctx) ctx.lines = lines
  const items: ParsedItem[] = []
  let bareRootText: string | null = null
  const bareRootRemarkLines: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Step 2: Try plugin line matchers first
    const pluginResult = activePlugins && ctx ? runParseLine(activePlugins, line, i, ctx) : null

    if (pluginResult) {
      const rawText = pluginResult.text.trim()
      const taskStatus = pluginResult.taskStatus
      const { taskStatus: extractedStatus, text: cleanText } = taskStatus ? { taskStatus, text: rawText } : extractTaskStatus(rawText)

      if (cleanText) {
        const item: ParsedItem = {
          indent: pluginResult.indent,
          text: cleanText,
          taskStatus: extractedStatus,
          remarkLines: [],
          dottedLine: pluginResult.dottedLine,
          collapsed: pluginResult.collapsed,
        }

        // Collect remark lines
        let j = i + 1
        while (j < lines.length) {
          const remarkMatch = lines[j].match(/^(\s*)>\s?(.*)$/)
          if (remarkMatch) {
            item.remarkLines.push(remarkMatch[2])
            j++
          } else {
            break
          }
        }

        // Step 3: Plugin follow-line collection (e.g. | text for multi-line)
        if (activePlugins && ctx) {
          // Create a temporary node to pass to plugins
          const tempNode: MindMapData = { id: 'temp', text: cleanText }
          const consumed = runCollectFollowLines(activePlugins, lines, j, tempNode, ctx)
          // Plugin may have modified tempNode (e.g. added multiLineContent)
          Object.assign(item, { _pluginNode: tempNode })
          j += consumed
        }

        items.push(item)
        i = j
        continue
      }
    }

    // Core line matching (standard - or * markers)
    const match = line.match(/^(\s*)[*-]\s+(.+)/)
    if (match) {
      const indent = match[1].replace(/\t/g, '  ').length
      const rawText = match[2].trim()
      const { taskStatus, text } = extractTaskStatus(rawText)
      if (text) {
        const item: ParsedItem = { indent, text, taskStatus, remarkLines: [] }

        // Collect remark lines (> ...) that follow this list item
        let j = i + 1
        while (j < lines.length) {
          const remarkMatch = lines[j].match(/^(\s*)>\s?(.*)$/)
          if (remarkMatch) {
            item.remarkLines.push(remarkMatch[2])
            j++
          } else {
            break
          }
        }

        // Plugin follow-line collection
        if (activePlugins && ctx) {
          const tempNode: MindMapData = { id: 'temp', text }
          const consumed = runCollectFollowLines(activePlugins, lines, j, tempNode, ctx)
          Object.assign(item, { _pluginNode: tempNode })
          j += consumed
        }

        items.push(item)
        i = j
        continue
      }
    }

    // Detect bare root: first non-empty line without a list marker, before any list items
    if (bareRootText === null && items.length === 0) {
      const trimmed = line.trim()
      if (trimmed) {
        bareRootText = trimmed
        // Collect remark lines after bare root
        let j = i + 1
        while (j < lines.length) {
          const remarkMatch = lines[j].match(/^(\s*)>\s?(.*)$/)
          if (remarkMatch) {
            bareRootRemarkLines.push(remarkMatch[2])
            j++
          } else {
            break
          }
        }
        i = j
        continue
      }
    }

    i++
  }

  if (items.length === 0 && bareRootText === null) {
    return { id: 'md-0', text: 'Root' }
  }

  // Helper to apply plugin transforms to a node
  const applyPluginTransforms = (node: MindMapData, item: ParsedItem): MindMapData => {
    // Copy plugin extension fields from ParsedLineResult
    if (item.dottedLine) node = { ...node, dottedLine: true }
    if (item.collapsed) node = { ...node, collapsed: true }

    // Copy fields from plugin follow-line collection
    const pluginNode = (item as any)._pluginNode as MindMapData | undefined
    if (pluginNode) {
      if (pluginNode.multiLineContent) node = { ...node, multiLineContent: pluginNode.multiLineContent }
    }

    // Step 4: Plugin text transforms (tags, decorators, anchors, cross-links)
    if (activePlugins && ctx) {
      node = runTransformNodeData(activePlugins, node, node.text, ctx)
    }

    return node
  }

  // Bare root text: use it as root, all list items become children
  if (bareRootText !== null) {
    let root: MindMapData = {
      id: 'md-0',
      text: bareRootText,
      children: [],
      ...(bareRootRemarkLines.length > 0 ? { remark: bareRootRemarkLines.join('\n') } : {}),
    }

    // Apply plugin transforms to bare root
    if (activePlugins && ctx) {
      root = runTransformNodeData(activePlugins, root, bareRootText, ctx)
    }

    if (items.length === 0) {
      delete root.children
      return root
    }

    // Detect indent unit (smallest non-zero indent)
    let indentUnit = 2
    for (const item of items) {
      if (item.indent > 0) {
        indentUnit = item.indent
        break
      }
    }

    const normalized = items.map((item) => ({
      level: item.indent > 0 ? Math.round(item.indent / indentUnit) : 0,
      text: item.text,
      taskStatus: item.taskStatus,
      remarkLines: item.remarkLines,
      _item: item,
    }))

    // All level-0 items are direct children of the bare root
    const stack: [MindMapData, number][] = [[root, -1]]

    for (let i = 0; i < normalized.length; i++) {
      const { level, text, taskStatus, remarkLines, _item } = normalized[i]
      let node: MindMapData = {
        id: 'md-tmp',
        text,
        ...(taskStatus ? { taskStatus } : {}),
        ...(remarkLines.length > 0 ? { remark: remarkLines.join('\n') } : {}),
      }

      while (stack.length > 1 && stack[stack.length - 1][1] >= level) {
        stack.pop()
      }

      const parent = stack[stack.length - 1][0]
      if (!parent.children) parent.children = []
      node.id = `${parent.id}-${parent.children.length}`

      // Apply plugin transforms
      node = applyPluginTransforms(node, _item)

      parent.children.push(node)
      stack.push([node, level])
    }

    cleanChildren(root)

    // Step 5: Post-process tree
    if (activePlugins && ctx) {
      const [processed] = runPostParseTree(activePlugins, [root], ctx)
      return processed
    }

    return root
  }

  // Original logic: first list item is root
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
    taskStatus: item.taskStatus,
    remarkLines: item.remarkLines,
    _item: item,
  }))

  // First top-level item is root; remaining top-level items are root's children
  let root: MindMapData = {
    id: 'md-0',
    text: normalized[0].text,
    children: [],
    ...(normalized[0].taskStatus ? { taskStatus: normalized[0].taskStatus } : {}),
    ...(normalized[0].remarkLines.length > 0 ? { remark: normalized[0].remarkLines.join('\n') } : {}),
  }

  // Apply plugin transforms to root
  root = applyPluginTransforms(root, normalized[0]._item)

  // Stack tracks parent chain: [node, level]
  const stack: [MindMapData, number][] = [[root, 0]]

  for (let i = 1; i < normalized.length; i++) {
    const { level, text, taskStatus, remarkLines, _item } = normalized[i]
    // Treat remaining top-level items (level 0) as root's direct children (level 1)
    const effectiveLevel = level === 0 ? 1 : level

    let node: MindMapData = {
      id: 'md-tmp',
      text,
      ...(taskStatus ? { taskStatus } : {}),
      ...(remarkLines.length > 0 ? { remark: remarkLines.join('\n') } : {}),
    }

    // Find parent: pop stack until we find a node at level < effectiveLevel
    while (stack.length > 1 && stack[stack.length - 1][1] >= effectiveLevel) {
      stack.pop()
    }

    const parent = stack[stack.length - 1][0]
    if (!parent.children) parent.children = []
    const childIndex = parent.children.length
    node.id = `${parent.id}-${childIndex}`

    // Apply plugin transforms
    node = applyPluginTransforms(node, _item)

    parent.children.push(node)
    stack.push([node, effectiveLevel])
  }

  // Clean up empty children arrays
  cleanChildren(root)

  // Step 5: Post-process tree
  if (activePlugins && ctx) {
    const [processed] = runPostParseTree(activePlugins, [root], ctx)
    return processed
  }

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

export function toMarkdownList(data: MindMapData, indent = 0, plugins?: MindMapPlugin[]): string {
  const activePlugins = plugins && plugins.length > 0 ? plugins : undefined
  let result: string

  if (indent === 0) {
    // Root node: no list prefix
    let text = data.text
    if (activePlugins) text = runSerializeNodeText(activePlugins, data, text)
    result = text + '\n'
  } else {
    // Build task status prefix
    let taskPrefix = ''
    if (data.taskStatus) {
      const statusMap: Record<TaskStatus, string> = { todo: '[ ]', doing: '[-]', done: '[x]' }
      taskPrefix = statusMap[data.taskStatus] + ' '
    }
    // Get list marker (plugins may override - with -. or +)
    let marker = '- '
    if (activePlugins) marker = runSerializeListMarker(activePlugins, data, marker)
    // Get text (plugins may append #tags, @color(), {#id}, etc.)
    let text = data.text
    if (activePlugins) text = runSerializeNodeText(activePlugins, data, text)

    result = '  '.repeat(indent - 1) + marker + taskPrefix + text + '\n'
  }

  // Write remark lines
  if (data.remark) {
    const remarkIndent = indent === 0 ? '  ' : '  '.repeat(indent)
    for (const line of data.remark.split('\n')) {
      result += remarkIndent + '> ' + line + '\n'
    }
  }

  // Plugin follow lines (e.g. | text for multi-line)
  if (activePlugins) {
    const followLines = runSerializeFollowLines(activePlugins, data, indent)
    const followIndent = indent === 0 ? '  ' : '  '.repeat(indent)
    for (const line of followLines) {
      result += followIndent + line + '\n'
    }
  }

  if (data.children) {
    for (const child of data.children) {
      result += toMarkdownList(child, indent + 1, plugins)
    }
  }
  return result
}

/**
 * Parse markdown with multiple root trees separated by blank lines.
 */
export function parseMarkdownMultiRoot(md: string, plugins?: MindMapPlugin[]): MindMapData[] {
  const activePlugins = plugins && plugins.length > 0 ? plugins : undefined

  // Pre-process for frontmatter before splitting
  let processedMd = md
  const ctx = activePlugins ? { lines: [] as string[], frontMatter: {} as Record<string, string> } : undefined
  if (activePlugins && ctx) {
    processedMd = runPreParseMarkdown(activePlugins, processedMd, ctx)
  }

  // Remove empty lines — the mindmap syntax has no blank-line semantics
  processedMd = processedMd.split('\n').filter(line => line.trim().length > 0).join('\n')

  // Split on blank lines (one or more empty lines)
  const blocks = processedMd.split(/\n[ \t]*\n/).filter((block) => block.trim())
  if (blocks.length === 0) {
    return [{ id: 'md-0', text: 'Root' }]
  }

  // For multi-root, create plugins that skip preParseMarkdown (already done above)
  // by passing the already-processed blocks
  const blockPlugins = activePlugins ? activePlugins.map(p => ({
    ...p,
    preParseMarkdown: undefined, // skip re-processing
  })) as MindMapPlugin[] : undefined

  if (blocks.length === 1) {
    const roots = [parseMarkdownList(processedMd, blockPlugins)]
    if (activePlugins && ctx) {
      return runPostParseTree(activePlugins, roots, ctx)
    }
    return roots
  }

  const roots = blocks.map((block, i) => {
    const tree = parseMarkdownList(block, blockPlugins)
    // Reassign IDs with root index prefix for uniqueness across trees
    reassignIds(tree, `md-${i}`)
    return tree
  })

  // Post-process across all roots
  if (activePlugins && ctx) {
    return runPostParseTree(activePlugins, roots, ctx)
  }

  return roots
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
export function toMarkdownMultiRoot(roots: MindMapData[], plugins?: MindMapPlugin[]): string {
  const activePlugins = plugins && plugins.length > 0 ? plugins : undefined

  let preamble = ''
  if (activePlugins) {
    preamble = runSerializePreamble(activePlugins, roots)
  }

  const body = roots.map((root) => toMarkdownList(root, 0, plugins)).join('\n')
  return preamble + body
}

/**
 * Get frontMatter from a parsed markdown context.
 * Call this after parseMarkdownMultiRoot to retrieve frontmatter config.
 */
export function parseMarkdownWithFrontMatter(
  md: string,
  plugins: MindMapPlugin[],
): { roots: MindMapData[]; frontMatter: Record<string, string> } {
  const ctx = { lines: [] as string[], frontMatter: {} as Record<string, string> }
  let processedMd = runPreParseMarkdown(plugins, md, ctx)

  // Remove empty lines — the mindmap syntax has no blank-line semantics
  processedMd = processedMd.split('\n').filter(line => line.trim().length > 0).join('\n')

  const blockPlugins = plugins.map(p => ({
    ...p,
    preParseMarkdown: undefined,
  })) as MindMapPlugin[]

  const blocks = processedMd.split(/\n[ \t]*\n/).filter((block) => block.trim())
  if (blocks.length === 0) {
    return { roots: [{ id: 'md-0', text: 'Root' }], frontMatter: ctx.frontMatter }
  }

  let roots: MindMapData[]
  if (blocks.length === 1) {
    roots = [parseMarkdownList(processedMd, blockPlugins)]
  } else {
    roots = blocks.map((block, i) => {
      const tree = parseMarkdownList(block, blockPlugins)
      reassignIds(tree, `md-${i}`)
      return tree
    })
  }

  roots = runPostParseTree(plugins, roots, ctx)
  return { roots, frontMatter: ctx.frontMatter }
}
