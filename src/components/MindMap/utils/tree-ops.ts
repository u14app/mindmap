import type { MindMapData } from '../types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function normalizeData(data: MindMapData | MindMapData[]): MindMapData[] {
  return Array.isArray(data) ? data : [data]
}

// --- Single-tree operations ---

export function updateNodeText(
  node: MindMapData,
  id: string,
  text: string,
): MindMapData {
  if (node.id === id) return { ...node, text }
  if (!node.children) return node
  return {
    ...node,
    children: node.children.map((c) => updateNodeText(c, id, text)),
  }
}

export function addChild(
  node: MindMapData,
  parentId: string,
  child: MindMapData,
): MindMapData {
  if (node.id === parentId) {
    return { ...node, children: [...(node.children || []), child] }
  }
  if (!node.children) return node
  return {
    ...node,
    children: node.children.map((c) => addChild(c, parentId, child)),
  }
}

export function removeNode(node: MindMapData, targetId: string): MindMapData {
  if (!node.children) return node
  const newChildren = node.children
    .filter((c) => c.id !== targetId)
    .map((c) => removeNode(c, targetId))
  return {
    ...node,
    children: newChildren.length > 0 ? newChildren : undefined,
  }
}

export function swapSiblings(
  node: MindMapData,
  id1: string,
  id2: string,
): MindMapData {
  if (!node.children) return node
  const idx1 = node.children.findIndex((c) => c.id === id1)
  const idx2 = node.children.findIndex((c) => c.id === id2)
  if (idx1 !== -1 && idx2 !== -1) {
    const newChildren = [...node.children];
    [newChildren[idx1], newChildren[idx2]] = [
      newChildren[idx2],
      newChildren[idx1],
    ]
    return { ...node, children: newChildren }
  }
  return {
    ...node,
    children: node.children.map((c) => swapSiblings(c, id1, id2)),
  }
}

export function findSubtree(node: MindMapData, targetId: string): MindMapData | null {
  if (node.id === targetId) return structuredClone(node)
  if (!node.children) return null
  for (const child of node.children) {
    const found = findSubtree(child, targetId)
    if (found) return found
  }
  return null
}

export function regenerateIds(node: MindMapData): MindMapData {
  return {
    ...node,
    id: generateId(),
    children: node.children?.map((c) => regenerateIds(c)),
  }
}

export function getDescendantIds(
  nodeId: string,
  nodes: { id: string; parentId?: string }[],
): string[] {
  const childrenMap: Record<string, string[]> = {}
  for (const n of nodes) {
    if (n.parentId) {
      if (!childrenMap[n.parentId]) childrenMap[n.parentId] = []
      childrenMap[n.parentId].push(n.id)
    }
  }
  const result: string[] = []
  const queue = [nodeId]
  while (queue.length > 0) {
    const current = queue.pop()!
    const children = childrenMap[current]
    if (children) {
      for (const childId of children) {
        result.push(childId)
        queue.push(childId)
      }
    }
  }
  return result
}

// --- Multi-root operations ---

export function updateNodeTextMulti(
  roots: MindMapData[],
  id: string,
  text: string,
): MindMapData[] {
  return roots.map((root) => updateNodeText(root, id, text))
}

export function addChildMulti(
  roots: MindMapData[],
  parentId: string,
  child: MindMapData,
): MindMapData[] {
  return roots.map((root) => addChild(root, parentId, child))
}

export function removeNodeMulti(
  roots: MindMapData[],
  targetId: string,
): MindMapData[] {
  // If targetId is a root, filter it out
  const filtered = roots.filter((root) => root.id !== targetId)
  if (filtered.length < roots.length) return filtered
  // Otherwise remove from within trees
  return roots.map((root) => removeNode(root, targetId))
}

export function swapSiblingsMulti(
  roots: MindMapData[],
  id1: string,
  id2: string,
): MindMapData[] {
  return roots.map((root) => swapSiblings(root, id1, id2))
}

export function findSubtreeMulti(
  roots: MindMapData[],
  targetId: string,
): MindMapData | null {
  for (const root of roots) {
    const found = findSubtree(root, targetId)
    if (found) return found
  }
  return null
}

/**
 * Add a child to a specific side of a root node's children.
 * Returns the updated root and the new splitIndex.
 */
export function addChildToSide(
  root: MindMapData,
  child: MindMapData,
  side: 'left' | 'right',
  splitIndex: number,
): { data: MindMapData; newSplitIndex: number } {
  const children = [...(root.children || [])]
  const clampedSi = Math.min(splitIndex, children.length)

  if (side === 'right') {
    children.splice(clampedSi, 0, child)
    return {
      data: { ...root, children },
      newSplitIndex: clampedSi + 1,
    }
  } else {
    children.push(child)
    return {
      data: { ...root, children },
      newSplitIndex: clampedSi,
    }
  }
}

/**
 * Move a direct child of root from one side to the other.
 * Returns the updated root and new splitIndex, or null if already on target side.
 */
export function moveChildToSide(
  root: MindMapData,
  childId: string,
  toSide: 'left' | 'right',
  splitIndex: number,
): { data: MindMapData; newSplitIndex: number } | null {
  const children = root.children || []
  const idx = children.findIndex((c) => c.id === childId)
  if (idx === -1) return null

  const clampedSi = Math.min(Math.max(splitIndex, 0), children.length)
  const isCurrentlyRight = idx < clampedSi
  const isCurrentlyLeft = idx >= clampedSi

  if ((toSide === 'right' && isCurrentlyRight) || (toSide === 'left' && isCurrentlyLeft)) {
    return null // already on target side
  }

  const newChildren = [...children]
  const [child] = newChildren.splice(idx, 1)

  if (toSide === 'left') {
    // Moving from right to left: child was at idx < clampedSi
    // After removal, splitIndex decreases by 1
    // Append to end (left side)
    newChildren.push(child)
    return {
      data: { ...root, children: newChildren },
      newSplitIndex: clampedSi - 1,
    }
  } else {
    // Moving from left to right: child was at idx >= clampedSi
    // Insert at splitIndex position (end of right side)
    // splitIndex increases by 1
    newChildren.splice(clampedSi, 0, child)
    return {
      data: { ...root, children: newChildren },
      newSplitIndex: clampedSi + 1,
    }
  }
}
