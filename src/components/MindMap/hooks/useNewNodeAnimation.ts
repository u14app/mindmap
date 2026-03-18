import { useState, useEffect, useRef } from 'react'
import type { LayoutNode } from '../types'

export function useNewNodeAnimation(nodes: LayoutNode[]): Set<string> {
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set())
  const prevNodeIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const currentIds = new Set(nodes.map((n) => n.id))
    if (prevNodeIdsRef.current.size > 0) {
      const added = new Set<string>()
      for (const id of currentIds) {
        if (!prevNodeIdsRef.current.has(id)) {
          added.add(id)
        }
      }
      if (added.size > 0) {
        setNewNodeIds(added)
        const timer = setTimeout(() => setNewNodeIds(new Set()), 350)
        prevNodeIdsRef.current = currentIds
        return () => clearTimeout(timer)
      }
    }
    prevNodeIdsRef.current = currentIds
  }, [nodes])

  return newNodeIds
}
