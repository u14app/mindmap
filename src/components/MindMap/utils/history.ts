import type { LayoutDirection, MindMapData } from '../types'

export interface MindMapHistorySnapshot {
  mapData: MindMapData[]
  direction: LayoutDirection
  splitIndices: Record<string, number>
  foldOverrides: Record<string, boolean>
  selectedNodeId: string | null
}

const MAX_HISTORY = 100

export function cloneMindMapData(data: MindMapData[]): MindMapData[] {
  if (typeof structuredClone === 'function') {
    return structuredClone(data) as MindMapData[]
  }
  return JSON.parse(JSON.stringify(data)) as MindMapData[]
}

export function cloneHistorySnapshot(
  snapshot: MindMapHistorySnapshot,
): MindMapHistorySnapshot {
  return {
    mapData: cloneMindMapData(snapshot.mapData),
    direction: snapshot.direction,
    splitIndices: { ...snapshot.splitIndices },
    foldOverrides: { ...snapshot.foldOverrides },
    selectedNodeId: snapshot.selectedNodeId,
  }
}

export function areHistorySnapshotsEqual(
  a: MindMapHistorySnapshot,
  b: MindMapHistorySnapshot,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function pushHistorySnapshot(
  stack: MindMapHistorySnapshot[],
  snapshot: MindMapHistorySnapshot,
): MindMapHistorySnapshot[] {
  const last = stack[stack.length - 1]
  if (last && areHistorySnapshotsEqual(last, snapshot)) {
    return stack
  }
  const next = [...stack, cloneHistorySnapshot(snapshot)]
  if (next.length > MAX_HISTORY) next.shift()
  return next
}
