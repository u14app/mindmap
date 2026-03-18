import { useCallback } from 'react'
import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'
import { IconClose } from './icons'

export interface MindMapHelpDialogProps {
  theme: ThemeColors
  messages: MindMapMessages
  onClose: () => void
}

const REPO_URL = 'https://github.com/u14app/mindmap'

export function MindMapHelpDialog({
  theme,
  messages,
  onClose,
}: MindMapHelpDialogProps) {
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
          <div className="mindmap-dialog-title" style={{ fontSize: 20, fontWeight: 700 }}>
            {messages.helpTitle}
          </div>
          <button
            className="mindmap-dialog-close"
            onClick={onClose}
            title={messages.close}
          >
            <IconClose size={16} />
          </button>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.85, marginBottom: 16 }}>
          {messages.helpDescription}
        </div>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{messages.helpOpenSource}: </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}
          >
            {REPO_URL}
          </a>
        </div>
      </div>
    </div>
  )
}
