import type { MindMapData, LayoutNode, Edge, LayoutDirection } from '../types'
import { BRANCH_COLORS, THEME } from './theme'

interface InternalNode {
  id: string
  text: string
  children: InternalNode[]
  width: number
  height: number
  depth: number
  side: 'left' | 'right' | 'root'
  color: string
  x: number
  y: number
  subtreeHeight: number
  parentId?: string
}

let _ctx: CanvasRenderingContext2D | null = null
function getCtx(): CanvasRenderingContext2D {
  if (!_ctx) {
    const canvas = document.createElement('canvas')
    _ctx = canvas.getContext('2d')!
  }
  return _ctx
}

function measureText(text: string, fontSize: number, fontWeight: number): number {
  const ctx = getCtx()
  ctx.font = `${fontWeight} ${fontSize}px ${THEME.root.fontFamily}`
  return ctx.measureText(text).width
}

function buildInternal(
  data: MindMapData,
  depth: number,
  side: 'left' | 'right' | 'root',
  color: string,
  parentId?: string,
): InternalNode {
  const isRoot = depth === 0
  const isLevel1 = depth === 1
  const fontSize = isRoot ? THEME.root.fontSize : isLevel1 ? THEME.level1.fontSize : THEME.node.fontSize
  const fontWeight = isRoot ? THEME.root.fontWeight : isLevel1 ? THEME.level1.fontWeight : THEME.node.fontWeight
  const paddingH = isRoot ? THEME.root.paddingH : THEME.node.paddingH
  const paddingV = isRoot ? THEME.root.paddingV : THEME.node.paddingV

  const textWidth = measureText(data.text, fontSize, fontWeight)
  const width = textWidth + paddingH * 2
  const height = fontSize + paddingV * 2

  const children = (data.children || []).map((child, i) => {
    const childColor = isRoot
      ? BRANCH_COLORS[i % BRANCH_COLORS.length]
      : color
    return buildInternal(child, depth + 1, depth === 0 ? side : side, childColor, data.id)
  })

  return {
    id: data.id,
    text: data.text,
    children,
    width,
    height,
    depth,
    side,
    color,
    x: 0,
    y: 0,
    subtreeHeight: 0,
    parentId,
  }
}

function computeSubtreeHeight(node: InternalNode): number {
  if (node.children.length === 0) {
    node.subtreeHeight = node.height
    return node.height
  }
  const childrenTotal = node.children.reduce((sum, c) => sum + computeSubtreeHeight(c), 0)
    + (node.children.length - 1) * THEME.layout.verticalGap
  node.subtreeHeight = Math.max(node.height, childrenTotal)
  return node.subtreeHeight
}

function assignPositions(node: InternalNode, x: number, y: number): void {
  node.x = x
  node.y = y

  if (node.children.length === 0) return

  const direction = node.side === 'left' ? -1 : 1
  const totalChildrenHeight = node.children.reduce((s, c) => s + c.subtreeHeight, 0)
    + (node.children.length - 1) * THEME.layout.verticalGap

  let currentY = y - totalChildrenHeight / 2

  for (const child of node.children) {
    const childCenterY = currentY + child.subtreeHeight / 2
    const childX = x + direction * (node.width / 2 + THEME.layout.horizontalGap + child.width / 2)
    assignPositions(child, childX, childCenterY)
    currentY += child.subtreeHeight + THEME.layout.verticalGap
  }
}

function collectNodes(node: InternalNode, result: LayoutNode[]): void {
  result.push({
    id: node.id,
    text: node.text,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    color: node.color,
    depth: node.depth,
    side: node.side,
    parentId: node.parentId,
  })
  for (const child of node.children) {
    collectNodes(child, result)
  }
}

export function computeEdgePath(
  fromX: number, fromY: number, fromW: number,
  toX: number, toY: number, toW: number,
  side: 'left' | 'right' | 'root',
): string {
  const direction = side === 'left' ? -1 : 1
  const x1 = fromX + direction * (fromW / 2)
  const y1 = fromY
  const x2 = toX - direction * (toW / 2)
  const y2 = toY
  const cx = x1 + (x2 - x1) * 0.5
  return `M ${x1},${y1} C ${cx},${y1} ${cx},${y2} ${x2},${y2}`
}

function collectEdges(node: InternalNode, result: Edge[]): void {
  for (const child of node.children) {
    result.push({
      key: `${node.id}-${child.id}`,
      path: computeEdgePath(node.x, node.y, node.width, child.x, child.y, child.width, child.side),
      color: child.color,
      fromId: node.id,
      toId: child.id,
    })
    collectEdges(child, result)
  }
}

export function layoutMindMap(
  data: MindMapData,
  direction: LayoutDirection = 'both',
  colorMap?: Record<string, string>,
  splitIndex?: number,
): { nodes: LayoutNode[]; edges: Edge[] } {
  const rootChildren = data.children || []

  let rightChildren: MindMapData[]
  let leftChildren: MindMapData[]
  let midpoint: number

  if (direction === 'right') {
    rightChildren = rootChildren
    leftChildren = []
    midpoint = rootChildren.length
  } else if (direction === 'left') {
    rightChildren = []
    leftChildren = rootChildren
    midpoint = 0
  } else {
    midpoint = splitIndex ?? Math.ceil(rootChildren.length / 2)
    midpoint = Math.min(Math.max(midpoint, 0), rootChildren.length)
    rightChildren = rootChildren.slice(0, midpoint)
    leftChildren = rootChildren.slice(midpoint)
  }

  const rootNode = buildInternal(
    { ...data, children: [] },
    0,
    'root',
    THEME.root.bgColor,
  )

  const rightNodes = rightChildren.map((child, i) => {
    const color = colorMap?.[child.id] ?? BRANCH_COLORS[i % BRANCH_COLORS.length]
    return buildInternal(child, 1, 'right', color, data.id)
  })
  const leftNodes = leftChildren.map((child, i) => {
    const color = colorMap?.[child.id] ?? BRANCH_COLORS[((direction === 'left' ? 0 : midpoint) + i) % BRANCH_COLORS.length]
    return buildInternal(child, 1, 'left', color, data.id)
  })

  rootNode.children = [...rightNodes, ...leftNodes]

  for (const child of rootNode.children) {
    computeSubtreeHeight(child)
  }

  rootNode.x = 0
  rootNode.y = 0

  const rightSubs = rootNode.children.filter(c => c.side === 'right')
  const leftSubs = rootNode.children.filter(c => c.side === 'left')

  const positionSide = (nodes: InternalNode[], dir: number) => {
    const totalH = nodes.reduce((s, c) => s + c.subtreeHeight, 0)
      + Math.max(0, nodes.length - 1) * THEME.layout.verticalGap
    let currentY = -totalH / 2
    for (const child of nodes) {
      const childCenterY = currentY + child.subtreeHeight / 2
      const childX = dir * (rootNode.width / 2 + THEME.layout.horizontalGap + child.width / 2)
      assignPositions(child, childX, childCenterY)
      currentY += child.subtreeHeight + THEME.layout.verticalGap
    }
  }

  positionSide(rightSubs, 1)
  positionSide(leftSubs, -1)

  const nodes: LayoutNode[] = []
  const edges: Edge[] = []

  collectNodes(rootNode, nodes)
  collectEdges(rootNode, edges)

  return { nodes, edges }
}

/**
 * Layout multiple independent root trees, stacked vertically.
 */
export function layoutMultiRoot(
  roots: MindMapData[],
  direction: LayoutDirection = 'both',
  colorMap?: Record<string, string>,
  splitIndices?: Record<string, number>,
): { nodes: LayoutNode[]; edges: Edge[] } {
  if (roots.length === 0) return { nodes: [], edges: [] }
  if (roots.length === 1) {
    return layoutMindMap(roots[0], direction, colorMap, splitIndices?.[roots[0].id])
  }

  // Layout each tree independently
  const treeLayouts = roots.map((root) =>
    layoutMindMap(root, direction, colorMap, splitIndices?.[root.id])
  )

  // Compute bounding box of each tree
  const treeBounds = treeLayouts.map((layout) => {
    let minY = Infinity, maxY = -Infinity
    for (const n of layout.nodes) {
      minY = Math.min(minY, n.y - n.height / 2)
      maxY = Math.max(maxY, n.y + n.height / 2)
    }
    return { minY, maxY }
  })

  // Stack vertically with gaps
  const GAP = 80
  const combinedNodes: LayoutNode[] = []
  const combinedEdges: Edge[] = []
  let currentBottom = treeBounds[0].maxY

  // First tree: no offset
  for (const node of treeLayouts[0].nodes) {
    combinedNodes.push(node)
  }
  for (const edge of treeLayouts[0].edges) {
    combinedEdges.push(edge)
  }

  // Subsequent trees: offset vertically
  for (let i = 1; i < treeLayouts.length; i++) {
    const offsetY = currentBottom + GAP - treeBounds[i].minY
    const nodeIndexStart = combinedNodes.length

    for (const node of treeLayouts[i].nodes) {
      combinedNodes.push({ ...node, y: node.y + offsetY })
    }

    // Recompute edge paths with offset positions
    for (const edge of treeLayouts[i].edges) {
      const fromNode = combinedNodes.slice(nodeIndexStart).find(n => n.id === edge.fromId)
      const toNode = combinedNodes.slice(nodeIndexStart).find(n => n.id === edge.toId)
      if (fromNode && toNode) {
        combinedEdges.push({
          ...edge,
          path: computeEdgePath(
            fromNode.x, fromNode.y, fromNode.width,
            toNode.x, toNode.y, toNode.width,
            toNode.side,
          ),
        })
      } else {
        combinedEdges.push(edge)
      }
    }

    currentBottom = currentBottom + GAP + (treeBounds[i].maxY - treeBounds[i].minY)
  }

  // Center everything around y=0
  const totalMinY = Math.min(...combinedNodes.map(n => n.y - n.height / 2))
  const totalMaxY = Math.max(...combinedNodes.map(n => n.y + n.height / 2))
  const centerOffset = -(totalMinY + totalMaxY) / 2

  if (Math.abs(centerOffset) > 0.1) {
    for (const node of combinedNodes) {
      node.y += centerOffset
    }
    // Recompute all edges after centering
    for (let i = 0; i < combinedEdges.length; i++) {
      const edge = combinedEdges[i]
      const fromNode = combinedNodes.find(n => n.id === edge.fromId)
      const toNode = combinedNodes.find(n => n.id === edge.toId)
      if (fromNode && toNode) {
        combinedEdges[i] = {
          ...edge,
          path: computeEdgePath(
            fromNode.x, fromNode.y, fromNode.width,
            toNode.x, toNode.y, toNode.width,
            toNode.side,
          ),
        }
      }
    }
  }

  return { nodes: combinedNodes, edges: combinedEdges }
}
