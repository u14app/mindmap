import { useState, useCallback, useEffect } from 'react'
import type { MindMapData, LayoutNode } from '../types'
import { updateNodeTextMulti } from '../utils/tree-ops'

interface UseNodeEditParams {
  nodeMap: Record<string, LayoutNode>
  updateData: (updater: (prev: MindMapData[]) => MindMapData[]) => void
}

export function useNodeEdit({
  nodeMap,
  updateData,
}: UseNodeEditParams) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)

  // Auto-edit newly created child
  useEffect(() => {
    if (pendingEditId && nodeMap[pendingEditId]) {
      setEditingId(pendingEditId)
      setEditText('')
      setPendingEditId(null)
    }
  }, [pendingEditId, nodeMap])

  const handleNodeDoubleClick = useCallback(
    (_e: React.MouseEvent, _nodeId: string, text: string) => {
      _e.stopPropagation()
      setEditingId(_nodeId)
      setEditText(text)
    },
    [],
  )

  const commitEdit = useCallback(() => {
    if (editingId) {
      const trimmed = editText.trim()
      if (trimmed) {
        updateData((prev) => updateNodeTextMulti(prev, editingId, trimmed))
      }
    }
    setEditingId(null)
  }, [editingId, editText, updateData])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  return {
    editingId,
    editText,
    setEditText,
    pendingEditId,
    setPendingEditId,
    handleNodeDoubleClick,
    commitEdit,
    cancelEdit,
  }
}
