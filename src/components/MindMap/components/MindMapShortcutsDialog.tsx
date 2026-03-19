import { useCallback } from 'react'
import type { ThemeColors } from '../utils/theme'
import { IconClose } from './icons'

export interface MindMapShortcutsDialogProps {
  theme: ThemeColors
  onClose: () => void
}

export function MindMapShortcutsDialog({
  theme,
  onClose,
}: MindMapShortcutsDialogProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }, [onClose])

  const shortcuts = [
    ['Enter', 'Create child node'],
    ['Delete / Backspace', 'Delete selected node'],
    ['Double-click', 'Edit node text'],
    ['Cmd/Ctrl + C', 'Copy subtree'],
    ['Cmd/Ctrl + X', 'Cut subtree'],
    ['Cmd/Ctrl + V', 'Paste subtree'],
    ['Escape', 'Close menu'],
    ['Scroll wheel', 'Zoom in / out'],
    ['Click + drag canvas', 'Pan canvas'],
    ['Click + drag node', 'Reorder siblings'],
    ['Right-click', 'Context menu'],
    ['Shift + +', 'Zoom in'],
    ['Shift + -', 'Zoom out'],
    ['Shift + 0', 'Reset view'],
    ['Shift + L', 'Left layout'],
    ['Shift + R', 'Right layout'],
    ['Shift + M', 'Both layout'],
  ]

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
          <div className="mindmap-dialog-title" style={{ fontSize: 18, fontWeight: 700 }}>
            Keyboard Shortcuts
          </div>
          <button
            className="mindmap-dialog-close"
            onClick={onClose}
            title="Close"
          >
            <IconClose size={16} />
          </button>
        </div>
        <table className="mindmap-help-table">
          <thead>
            <tr>
              <th style={{ color: theme.contextMenu.textColor }}>Shortcut</th>
              <th style={{ color: theme.contextMenu.textColor }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map(([shortcut, action]) => (
              <tr key={shortcut}>
                <td>{shortcut}</td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
