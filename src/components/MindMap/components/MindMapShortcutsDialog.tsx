import { useCallback } from 'react'
import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'
import { IconClose } from './icons'

export interface MindMapShortcutsDialogProps {
  theme: ThemeColors
  messages: MindMapMessages
  onClose: () => void
}

export function MindMapShortcutsDialog({
  theme,
  messages,
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
    ['Enter', messages.helpCreateChild],
    ['Delete / Backspace', messages.helpDeleteNode],
    ['Double-click', messages.helpEditNode],
    ['Cmd/Ctrl + C', messages.helpCopySubtree],
    ['Cmd/Ctrl + X', messages.helpCutSubtree],
    ['Cmd/Ctrl + V', messages.helpPasteSubtree],
    ['Escape', messages.helpCloseMenu],
    ['Scroll wheel', messages.helpZoomInOut],
    ['Click + drag canvas', messages.helpPan],
    ['Click + drag node', messages.helpReorderSiblings],
    ['Right-click', messages.helpContextMenu],
    ['Shift + +', messages.helpShortcutZoomIn],
    ['Shift + -', messages.helpShortcutZoomOut],
    ['Shift + 0', messages.helpShortcutResetView],
    ['Shift + L', messages.helpShortcutLayoutLeft],
    ['Shift + R', messages.helpShortcutLayoutRight],
    ['Shift + M', messages.helpShortcutLayoutBoth],
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
            {messages.shortcutsTitle}
          </div>
          <button
            className="mindmap-dialog-close"
            onClick={onClose}
            title={messages.close}
          >
            <IconClose size={16} />
          </button>
        </div>
        <table className="mindmap-help-table">
          <thead>
            <tr>
              <th style={{ color: theme.contextMenu.textColor }}>{messages.helpShortcut}</th>
              <th style={{ color: theme.contextMenu.textColor }}>{messages.helpAction}</th>
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
