import { useState, useCallback, useRef, useEffect } from 'react'
import type { MindMapData } from '../types'
import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'
import { parseMarkdownMultiRoot } from '../utils/markdown'
import { IconClose } from './icons'

export interface MindMapImportDialogProps {
  theme: ThemeColors
  messages: MindMapMessages
  onImport: (data: MindMapData[]) => void
  onClose: () => void
}

function validateMindMapData(obj: unknown): obj is MindMapData {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.text !== 'string') return false
  if (o.children !== undefined) {
    if (!Array.isArray(o.children)) return false
    for (const child of o.children) {
      if (!validateMindMapData(child)) return false
    }
  }
  return true
}

function parseInput(input: string): MindMapData[] | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed)
    const arr = Array.isArray(parsed) ? parsed : [parsed]
    if (arr.length > 0 && arr.every(validateMindMapData)) {
      return arr
    }
  } catch { /* not JSON, try markdown */ }

  // Try markdown
  if (trimmed.match(/^\s*[*-]\s+/m)) {
    const result = parseMarkdownMultiRoot(trimmed)
    if (result.length > 0 && !(result.length === 1 && result[0].text === 'Root' && !result[0].children)) {
      return result
    }
  }

  return null
}

export function MindMapImportDialog({
  theme,
  messages,
  onImport,
  onClose,
}: MindMapImportDialogProps) {
  const [value, setValue] = useState('')
  const [hasError, setHasError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleConfirm = useCallback(() => {
    const data = parseInput(value)
    if (data) {
      onImport(data)
    } else {
      setHasError(true)
      const el = textareaRef.current
      if (el) {
        el.classList.remove('error')
        void el.offsetWidth
        el.classList.add('error')
      }
    }
  }, [value, onImport])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    if (hasError) setHasError(false)
  }, [hasError])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }, [onClose])

  return (
    <div
      className="mindmap-dialog-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="mindmap-dialog-modal"
        style={{
          background: theme.contextMenu.bgColor,
          color: theme.contextMenu.textColor,
          borderColor: theme.contextMenu.borderColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mindmap-dialog-header">
          <div className="mindmap-dialog-title">{messages.importTitle}</div>
          <button
            className="mindmap-dialog-close"
            onClick={onClose}
            title={messages.close}
          >
            <IconClose size={16} />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className={`mindmap-import-textarea${hasError ? ' error' : ''}`}
          value={value}
          onChange={handleChange}
          placeholder={messages.importPlaceholder}
          style={{
            color: theme.contextMenu.textColor,
            background: theme.canvas.bgColor,
            borderColor: hasError ? '#e74c3c' : theme.contextMenu.borderColor,
          }}
        />
        <div className="mindmap-import-buttons">
          <button
            className="mindmap-import-btn"
            onClick={onClose}
            style={{
              background: theme.controls.hoverBg,
              color: theme.contextMenu.textColor,
            }}
          >
            {messages.importCancel}
          </button>
          <button
            className="mindmap-import-btn"
            onClick={handleConfirm}
            style={{
              background: '#3b82f6',
              color: '#fff',
            }}
          >
            {messages.importConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
