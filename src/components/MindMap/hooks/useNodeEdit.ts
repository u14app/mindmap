import { useState, useCallback, useEffect } from 'react'
import type { MindMapData, LayoutNode, TaskStatus } from '../types'
import { updateNodeFieldsMulti } from '../utils/tree-ops'

interface UseNodeEditParams {
  nodeMap: Record<string, LayoutNode>
  updateData: (updater: (prev: MindMapData[]) => MindMapData[]) => void
  onTextChange?: (nodeId: string, oldText: string, newText: string) => void
}

/**
 * Extract task status prefix from text.
 * Returns the task status and remaining text.
 */
function extractTaskStatus(text: string): { taskStatus?: TaskStatus; text: string } {
  const match = text.match(/^\[([ x\-])\]\s+(.*)/)
  if (!match) return { text }
  const flag = match[1]
  const rest = match[2]
  if (flag === ' ') return { taskStatus: 'todo', text: rest }
  if (flag === 'x') return { taskStatus: 'done', text: rest }
  if (flag === '-') return { taskStatus: 'doing', text: rest }
  return { text }
}

export function useNodeEdit({
  nodeMap,
  updateData,
  onTextChange,
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
        const oldNode = nodeMap[editingId]
        const oldText = oldNode?.text ?? ''
        // Parse task status prefix from the edited text
        const { taskStatus, text: cleanText } = extractTaskStatus(trimmed)
        updateData((prev) =>
          updateNodeFieldsMulti(prev, editingId, {
            text: cleanText,
            taskStatus,
          }),
        )
        if (cleanText !== oldText) {
          onTextChange?.(editingId, oldText, cleanText)
        }
      }
    }
    setEditingId(null)
  }, [editingId, editText, updateData, nodeMap, onTextChange])

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
