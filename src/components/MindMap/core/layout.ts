import { compileExtensions } from './extensions'
import { tokenizeMindMapInline } from './inline'
import { authorizeMindMapImageUrl, type MindMapRemoteImagePolicy } from './url'
import { validateMindMapDocument } from './utils'
import type {
  MindMapBounds,
  MindMapDocument,
  MindMapExtension,
  MindMapLayout,
  MindMapLayoutEdge,
  MindMapLayoutNode,
  MindMapLayoutOptions,
  MindMapNode,
  MindMapNodeAttributes,
  MindMapSide,
  MindMapThemeTokens,
} from './types'

export const DEFAULT_THEME: MindMapThemeTokens = {
  background: '#fafafa',
  text: '#333333',
  mutedText: '#555',
  rootFill: '#2C3E50',
  rootText: '#FFFFFF',
  selection: '#4A90D9',
  branches: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#F0B27A'],
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  rootFontSize: 20,
  levelOneFontSize: 16,
  nodeFontSize: 15,
  horizontalGap: 80,
  verticalGap: 16,
  rootPaddingX: 24,
  rootPaddingY: 12,
  nodePaddingX: 8,
  nodePaddingY: 6,
}

const TAG_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1']

interface InternalNode {
  source: MindMapNode
  id: string
  text: string
  attributes?: MindMapNodeAttributes
  children: InternalNode[]
  childCount: number
  depth: number
  side: MindMapSide
  parentId?: string
  rootIndex: number
  branchIndex: number
  color: string
  width: number
  height: number
  subtreeHeight: number
  x: number
  y: number
}

function textWidth(text: string, size: number): number {
  let width = 0
  for (const char of text) {
    if (/\s/.test(char)) width += size * 0.33
    else if (/[\u2e80-\u9fff\uff00-\uffef]/.test(char)) width += size
    else if (/[MW@#%&]/.test(char)) width += size * 0.82
    else width += size * 0.57
  }
  return width
}

export interface MindMapNodeContentMetrics {
  readonly width: number
  readonly height: number
  readonly fontSize: number
  readonly labelY: number
  readonly labelTop: number
  readonly labelHeight: number
  readonly multiline: readonly { readonly text: string; readonly y: number; readonly top: number; readonly height: number; readonly fontSize: number }[]
  readonly tagY: number | null
  readonly tagFontSize: number
  readonly tags: readonly { readonly text: string; readonly x: number; readonly width: number; readonly color: string }[]
  readonly images: readonly { readonly url: string; readonly alt: string; readonly x: number; readonly y: number; readonly width: number; readonly height: number }[]
}

const dimensionCache = new Map<string, { metrics: MindMapNodeContentMetrics; weight: number }>()
const DIMENSION_CACHE_LIMIT = 1024
// Count all retained key/content strings in UTF-16 code units. Entry count alone
// does not bound large Markdown or embedded raster data retained by this cache.
const DIMENSION_CACHE_TOTAL_WEIGHT = 256 * 1024
const DIMENSION_CACHE_ENTRY_WEIGHT = 64 * 1024
let dimensionCacheWeight = 0

/** Shared local-coordinate content geometry for layout and portable rendering. */
export function measureMindMapNodeContent(node: Pick<MindMapNode, 'text' | 'attributes'>, depth: number, theme: MindMapThemeTokens = DEFAULT_THEME, remoteImagePolicy: MindMapRemoteImagePolicy = 'deny'): MindMapNodeContentMetrics {
  validateMindMapDocument({ roots: [{ id: 'metrics', text: node?.text, attributes: node?.attributes }] })
  const root = depth === 0
  const fontSize = root ? theme.rootFontSize : depth === 1 ? theme.levelOneFontSize : theme.nodeFontSize
  const paddingX = root ? theme.rootPaddingX : theme.nodePaddingX
  const paddingY = root ? theme.rootPaddingY : theme.nodePaddingY
  const task = node.attributes?.task ? fontSize * 0.9 + 4 : 0
  const remark = node.attributes?.remark ? fontSize * 0.8 : 0
  const tags = node.attributes?.tags?.values ?? []
  const lines = node.attributes?.multiline?.lines ?? []
  const tokens = tokenizeMindMapInline(node.text)
  const lineTokens = lines.map(tokenizeMindMapInline)
  const authorized = new Map<string, string | null>()
  for (const token of [...tokens, ...lineTokens.flat()]) {
    if (token.type === 'image' && !authorized.has(token.url)) authorized.set(token.url, authorizeMindMapImageUrl(token.url, remoteImagePolicy))
  }
  const key = JSON.stringify([node.text, root, fontSize, paddingX, paddingY, task, remark, tags, lines, [...authorized.values()]])
  const cached = dimensionCache.get(key)
  if (cached) {
    dimensionCache.delete(key)
    dimensionCache.set(key, cached)
    return cached.metrics
  }
  function visibleText(items: ReturnType<typeof tokenizeMindMapInline>): string {
    return items.filter((token) => token.type !== 'image' || !authorized.get(token.url)).map((token) => token.text).join('')
  }
  function lineHeight(items: ReturnType<typeof tokenizeMindMapInline>, size: number): number {
    if (items.some((token) => token.type === 'math' && token.display)) return size * 3
    if (items.some((token) => token.type === 'math')) return size * 2.2
    return size
  }
  const images = [...tokens, ...lineTokens.flat()].flatMap((token) => {
    if (token.type !== 'image') return []
    const url = authorized.get(token.url)
    return url ? [{ url, alt: token.text, x: -80, y: 0, width: 160, height: 96 }] : []
  })
  const labelHeight = lineHeight(tokens, fontSize)
  const lineFontSize = fontSize * 0.85
  const lineHeights = lineTokens.map((items) => Math.max(fontSize * 1.4, lineHeight(items, lineFontSize)))
  const tagFontSize = fontSize * 0.65
  const tagHeight = tags.length ? tagFontSize + 10 : 0
  const tagWidths = tags.map((tag) => Math.max(tag.length * tagFontSize * 0.65, textWidth(tag, tagFontSize)) + 10)
  const tagRowWidth = tagWidths.reduce((sum, value) => sum + value, 0) + Math.max(0, tags.length - 1) * 4
  const baseWidth = textWidth(visibleText(tokens) || (node.text ? ' ' : 'Untitled'), fontSize) + task + remark + paddingX * 2
  const lineWidth = lineTokens.reduce((max, items) => Math.max(max, textWidth(visibleText(items), lineFontSize) + paddingX * 2), 0)
  const tagWidth = tagRowWidth + paddingX * 2
  const width = Math.max(baseWidth, lineWidth, tagWidth, images.length ? 160 + paddingX * 2 : 0)
  const height = labelHeight + paddingY * 2 + lineHeights.reduce((sum, value) => sum + value, 0) + tagHeight + images.length * 104
  const labelTop = -height / 2 + paddingY
  let cursor = labelTop + labelHeight
  const multiline = lines.map((text, index) => {
    const lineHeight = lineHeights[index]
    const line = Object.freeze({ text, y: cursor + lineHeight / 2, top: cursor, height: lineHeight, fontSize: lineFontSize })
    cursor += lineHeight
    return line
  })
  const tagY = tagHeight ? cursor + tagHeight / 2 : null
  let tagX = -tagRowWidth / 2
  const tagMetrics = tags.map((text, index) => {
    const tag = Object.freeze({ text, x: tagX, width: tagWidths[index], color: TAG_COLORS[index % TAG_COLORS.length] })
    tagX += tag.width + 4
    return tag
  })
  cursor += tagHeight
  for (const image of images) {
    image.y = cursor + 8
    cursor += 104
    Object.freeze(image)
  }
  const dimensions: MindMapNodeContentMetrics = Object.freeze({
    width, height, fontSize, labelY: labelTop + labelHeight / 2, labelTop, labelHeight,
    multiline: Object.freeze(multiline), tagY, tagFontSize, tags: Object.freeze(tagMetrics), images: Object.freeze(images),
  })
  const weight = key.length + multiline.reduce((sum, line) => sum + line.text.length, 0) + tagMetrics.reduce((sum, tag) => sum + tag.text.length, 0) + images.reduce((sum, image) => sum + image.url.length + image.alt.length, 0)
  if (weight <= DIMENSION_CACHE_ENTRY_WEIGHT) {
    while (dimensionCache.size >= DIMENSION_CACHE_LIMIT || dimensionCacheWeight + weight > DIMENSION_CACHE_TOTAL_WEIGHT) {
      const oldestKey = dimensionCache.keys().next().value!
      dimensionCacheWeight -= dimensionCache.get(oldestKey)!.weight
      dimensionCache.delete(oldestKey)
    }
    dimensionCache.set(key, { metrics: dimensions, weight })
    dimensionCacheWeight += weight
  }
  return dimensions
}

function isCollapsed(node: MindMapNode, overrides: Record<string, boolean>): boolean {
  if (node.id in overrides) return overrides[node.id]
  return Boolean((node.attributes?.folding as { collapsed?: boolean } | undefined)?.collapsed)
}

function buildInternal(
  node: MindMapNode,
  depth: number,
  side: MindMapSide,
  parentId: string | undefined,
  rootIndex: number,
  branchIndex: number,
  color: string,
  theme: MindMapThemeTokens,
  options: MindMapLayoutOptions,
  extensions: readonly MindMapExtension[],
  descend = true,
): InternalNode {
  const dimensions = measureMindMapNodeContent(node, depth, theme, options.remoteImagePolicy)
  const collapsed = isCollapsed(node, options.foldOverrides ?? {})
  let visibleChildren: readonly MindMapNode[] = collapsed ? [] : (node.children ?? [])
  for (const extension of descend ? extensions : []) {
    visibleChildren = extension.filterChildren?.(node, visibleChildren, collapsed) ?? visibleChildren
  }
  const children = (descend ? visibleChildren : []).map((child, index) => buildInternal(
    child,
    depth + 1,
    side,
    node.id,
    rootIndex,
    branchIndex,
    depth === 0 ? theme.branches[index % theme.branches.length] : color,
    theme,
    options,
    extensions,
  ))
  return {
    source: node,
    id: node.id,
    text: node.text,
    attributes: node.attributes,
    children,
    childCount: node.children?.length ?? 0,
    depth,
    side,
    parentId,
    rootIndex,
    branchIndex,
    color,
    width: dimensions.width,
    height: dimensions.height,
    subtreeHeight: dimensions.height,
    x: 0,
    y: 0,
  }
}

function computeSubtreeHeight(node: InternalNode, gap: number): number {
  if (!node.children.length) return node.subtreeHeight = node.height
  const childrenHeight = node.children.reduce((sum, child) => sum + computeSubtreeHeight(child, gap), 0) + gap * (node.children.length - 1)
  return node.subtreeHeight = Math.max(node.height, childrenHeight)
}

function positionChildren(node: InternalNode, theme: MindMapThemeTokens): void {
  if (!node.children.length) return
  const total = node.children.reduce((sum, child) => sum + child.subtreeHeight, 0) + theme.verticalGap * (node.children.length - 1)
  let top = node.y - total / 2
  const direction = node.side === 'left' ? -1 : 1
  for (const child of node.children) {
    child.x = node.x + direction * (node.width / 2 + theme.horizontalGap + child.width / 2)
    child.y = top + child.subtreeHeight / 2
    top += child.subtreeHeight + theme.verticalGap
    positionChildren(child, theme)
  }
}

function edgePath(parent: InternalNode | MindMapLayoutNode, child: InternalNode | MindMapLayoutNode): string {
  const direction = child.side === 'left' ? -1 : 1
  const x1 = parent.x + direction * parent.width / 2
  const x2 = child.x - direction * child.width / 2
  const control = x1 + (x2 - x1) * 0.5
  return `M ${x1.toFixed(2)} ${parent.y.toFixed(2)} C ${control.toFixed(2)} ${parent.y.toFixed(2)}, ${control.toFixed(2)} ${child.y.toFixed(2)}, ${x2.toFixed(2)} ${child.y.toFixed(2)}`
}

function flattenTree(root: InternalNode, nodes: MindMapLayoutNode[], edges: MindMapLayoutEdge[], extensions: readonly MindMapExtension[]): void {
  const layoutNode: MindMapLayoutNode = {
    id: root.id,
    text: root.text,
    x: root.x,
    y: root.y,
    width: root.width,
    height: root.height,
    depth: root.depth,
    side: root.side,
    color: root.color,
    rootIndex: root.rootIndex,
    branchIndex: root.branchIndex,
    childCount: root.childCount,
    ...(root.parentId ? { parentId: root.parentId } : {}),
    ...(root.attributes ? { attributes: root.attributes } : {}),
  }
  nodes.push(layoutNode)
  for (const child of root.children) {
    let edge: MindMapLayoutEdge = {
      id: `${root.id}:${child.id}`,
      fromId: root.id,
      toId: child.id,
      path: edgePath(root, child),
      color: child.color,
      dotted: Boolean((child.attributes?.connection as { dotted?: boolean } | undefined)?.dotted),
      label: (child.attributes?.connection as { label?: string } | undefined)?.label,
    }
    const childLayout: MindMapLayoutNode = {
      id: child.id, text: child.text, x: child.x, y: child.y, width: child.width, height: child.height,
      depth: child.depth, side: child.side, color: child.color, rootIndex: child.rootIndex,
      branchIndex: child.branchIndex, childCount: child.childCount, parentId: root.id,
      ...(child.attributes ? { attributes: child.attributes } : {}),
    }
    for (const extension of extensions) edge = extension.transformEdge?.(edge, layoutNode, childLayout) ?? edge
    edges.push(edge)
    flattenTree(child, nodes, edges, extensions)
  }
}

function layoutSingleRoot(rootSource: MindMapNode, rootIndex: number, theme: MindMapThemeTokens, options: MindMapLayoutOptions, extensions: readonly MindMapExtension[]): { nodes: MindMapLayoutNode[]; edges: MindMapLayoutEdge[] } {
  const direction = options.direction ?? 'both'
  const root = buildInternal(rootSource, 0, 'root', undefined, rootIndex, 0, theme.rootFill, theme, options, extensions, false)
  const collapsed = isCollapsed(rootSource, options.foldOverrides ?? {})
  let sourceChildren: readonly MindMapNode[] = collapsed ? [] : rootSource.children ?? []
  for (const extension of extensions) {
    sourceChildren = extension.filterChildren?.(rootSource, sourceChildren, collapsed) ?? sourceChildren
  }
  const split = Math.min(sourceChildren.length, Math.max(0, options.splitByRoot?.[rootSource.id] ?? Math.ceil(sourceChildren.length / 2)))
  const rightSource = direction === 'left' ? [] : direction === 'right' ? sourceChildren : sourceChildren.slice(0, split)
  const leftSource = direction === 'right' ? [] : direction === 'left' ? sourceChildren : sourceChildren.slice(split)
  const buildBranch = (child: MindMapNode, side: 'left' | 'right', branchIndex: number) => buildInternal(
    child, 1, side, root.id, rootIndex, branchIndex,
    theme.branches[branchIndex % theme.branches.length], theme, options, extensions,
  )
  const right = rightSource.map((child, index) => buildBranch(child, 'right', index))
  const leftOffset = direction === 'left' ? 0 : split
  const left = leftSource.map((child, index) => buildBranch(child, 'left', leftOffset + index))
  root.children = [...right, ...left]
  root.childCount = rootSource.children?.length ?? 0
  root.x = 0
  root.y = 0
  right.forEach((node) => computeSubtreeHeight(node, theme.verticalGap))
  left.forEach((node) => computeSubtreeHeight(node, theme.verticalGap))

  const positionSide = (children: InternalNode[], side: 'left' | 'right') => {
    const total = children.reduce((sum, child) => sum + child.subtreeHeight, 0) + theme.verticalGap * Math.max(0, children.length - 1)
    let top = -total / 2
    const sign = side === 'left' ? -1 : 1
    for (const child of children) {
      child.x = sign * (root.width / 2 + theme.horizontalGap + child.width / 2)
      child.y = top + child.subtreeHeight / 2
      top += child.subtreeHeight + theme.verticalGap
      positionChildren(child, theme)
    }
  }
  positionSide(right, 'right')
  positionSide(left, 'left')

  const nodes: MindMapLayoutNode[] = []
  const edges: MindMapLayoutEdge[] = []
  flattenTree(root, nodes, edges, extensions)
  return { nodes, edges }
}

function createBounds(nodes: readonly MindMapLayoutNode[]): MindMapBounds {
  if (!nodes.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.width / 2)
    maxX = Math.max(maxX, node.x + node.width / 2)
    minY = Math.min(minY, node.y - node.height / 2)
    maxY = Math.max(maxY, node.y + node.height / 2)
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

export function layoutMindMap(
  input: MindMapDocument | MindMapNode | readonly MindMapNode[],
  options: MindMapLayoutOptions = {},
): MindMapLayout {
  if (!input || typeof input !== 'object') throw new Error('Mind map layout requires a document or nodes')
  const document: MindMapDocument = !Array.isArray(input) && 'roots' in input
    ? input as MindMapDocument
    : { roots: Array.isArray(input) ? input as MindMapNode[] : [input as MindMapNode] }
  validateMindMapDocument(document)
  const extensions = compileExtensions(options.extensions).list
  const theme: MindMapThemeTokens = { ...DEFAULT_THEME, ...(options.theme ?? {}) }
  const direction = options.direction ?? document.direction ?? 'both'
  const layouts = document.roots.map((root, index) => layoutSingleRoot(root, index, theme, { ...options, direction }, extensions))
  const nodes: MindMapLayoutNode[] = []
  const edges: MindMapLayoutEdge[] = []
  let currentBottom = 0
  const rootGap = 92
  layouts.forEach((layout, index) => {
    const bounds = createBounds(layout.nodes)
    const offsetY = index === 0 ? -(bounds.minY + bounds.maxY) / 2 : currentBottom + rootGap - bounds.minY
    for (const node of layout.nodes) nodes.push({ ...node, y: node.y + offsetY })
    const localMap = new Map(layout.nodes.map((node) => [node.id, { ...node, y: node.y + offsetY }]))
    for (const edge of layout.edges) {
      const from = localMap.get(edge.fromId)
      const to = localMap.get(edge.toId)
      edges.push(from && to ? { ...edge, path: edgePath(from, to) } : edge)
    }
    const shifted = createBounds([...localMap.values()])
    currentBottom = shifted.maxY
  })
  if (nodes.length > 0) {
    const all = createBounds(nodes)
    const centerY = (all.minY + all.maxY) / 2
    if (Math.abs(centerY) > 0.01) {
      for (const node of nodes) node.y -= centerY
      const map = new Map(nodes.map((node) => [node.id, node]))
      for (const edge of edges) {
        const from = map.get(edge.fromId), to = map.get(edge.toId)
        if (from && to) edge.path = edgePath(from, to)
      }
    }
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const childrenByParent = new Map<string, string[]>()
  for (const node of nodes) {
    if (!node.parentId) continue
    const children = childrenByParent.get(node.parentId) ?? []
    children.push(node.id)
    childrenByParent.set(node.parentId, children)
  }
  let layout: MindMapLayout = { nodes, edges, nodeById, childrenByParent, bounds: createBounds(nodes) }
  for (const extension of extensions) layout = extension.transformLayout?.(layout, document) ?? layout
  return layout
}
