import { useState } from 'react'
import type { LayoutDirection } from '../types'
import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'

export interface MindMapContextMenuProps {
  position: { x: number; y: number }
  theme: ThemeColors
  messages: MindMapMessages
  direction: LayoutDirection
  readonly?: boolean
  onNewRootNode: () => void
  onExportSVG: () => void
  onExportPNG: () => void
  onExportMarkdown: () => void
  onDirectionChange: (dir: LayoutDirection) => void
  onClose: () => void
}

export function MindMapContextMenu({
  position,
  theme,
  messages,
  readonly: readonlyProp,
  onNewRootNode,
  onExportSVG,
  onExportPNG,
  onExportMarkdown,
  onDirectionChange,
  onClose,
}: MindMapContextMenuProps) {
  const [exportSubmenuOpen, setExportSubmenuOpen] = useState(false)
  const [layoutSubmenuOpen, setLayoutSubmenuOpen] = useState(false)

  return (
    <div
      className="mindmap-context-menu"
      style={{
        left: position.x,
        top: position.y,
        background: theme.contextMenu.bgColor,
        color: theme.contextMenu.textColor,
        boxShadow: `0 4px 16px ${theme.contextMenu.shadowColor}`,
        borderColor: theme.contextMenu.borderColor,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!readonlyProp && (
        <>
          <div
            className="mindmap-ctx-item mindmap-ctx-new-root"
            onClick={onNewRootNode}
            style={{ color: theme.contextMenu.textColor }}
          >
            {messages.newRootNode}
          </div>
          <div
            className="mindmap-ctx-divider"
            style={{ borderColor: theme.contextMenu.borderColor }}
          />
        </>
      )}
      <div
        className="mindmap-ctx-item mindmap-ctx-has-sub mindmap-ctx-layout"
        onMouseEnter={() => setLayoutSubmenuOpen(true)}
        onMouseLeave={() => setLayoutSubmenuOpen(false)}
        style={{ color: theme.contextMenu.textColor }}
      >
        {messages.layout}
        <span className="mindmap-ctx-arrow">&#9654;</span>
        {layoutSubmenuOpen && (
          <div
            className="mindmap-ctx-submenu"
            style={{
              background: theme.contextMenu.bgColor,
              boxShadow: `0 4px 16px ${theme.contextMenu.shadowColor}`,
              borderColor: theme.contextMenu.borderColor,
            }}
          >
            <div
              className="mindmap-ctx-item mindmap-ctx-layout-left"
              onClick={() => { onDirectionChange('left'); onClose() }}
              style={{ color: theme.contextMenu.textColor }}
            >
              {messages.layoutLeft}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-layout-both"
              onClick={() => { onDirectionChange('both'); onClose() }}
              style={{ color: theme.contextMenu.textColor }}
            >
              {messages.layoutBoth}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-layout-right"
              onClick={() => { onDirectionChange('right'); onClose() }}
              style={{ color: theme.contextMenu.textColor }}
            >
              {messages.layoutRight}
            </div>
          </div>
        )}
      </div>
      <div
        className="mindmap-ctx-divider"
        style={{ borderColor: theme.contextMenu.borderColor }}
      />
      <div
        className="mindmap-ctx-item mindmap-ctx-has-sub mindmap-ctx-export"
        onMouseEnter={() => setExportSubmenuOpen(true)}
        onMouseLeave={() => setExportSubmenuOpen(false)}
        style={{ color: theme.contextMenu.textColor }}
      >
        {messages.export}
        <span className="mindmap-ctx-arrow">&#9654;</span>
        {exportSubmenuOpen && (
          <div
            className="mindmap-ctx-submenu"
            style={{
              background: theme.contextMenu.bgColor,
              boxShadow: `0 4px 16px ${theme.contextMenu.shadowColor}`,
              borderColor: theme.contextMenu.borderColor,
            }}
          >
            <div
              className="mindmap-ctx-item mindmap-ctx-export-svg"
              onClick={onExportSVG}
              style={{ color: theme.contextMenu.textColor }}
            >
              {messages.exportSVG}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-export-png"
              onClick={onExportPNG}
              style={{ color: theme.contextMenu.textColor }}
            >
              {messages.exportPNG}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-export-md"
              onClick={onExportMarkdown}
              style={{ color: theme.contextMenu.textColor }}
            >
              {messages.exportMarkdown}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
