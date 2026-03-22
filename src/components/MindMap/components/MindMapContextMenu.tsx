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
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!readonlyProp && (
        <>
          <div
            className="mindmap-ctx-item mindmap-ctx-new-root"
            onClick={onNewRootNode}
          >
            {messages.newRootNode}
          </div>
          <div className="mindmap-ctx-divider" />
        </>
      )}
      <div
        className="mindmap-ctx-item mindmap-ctx-has-sub mindmap-ctx-layout"
        onMouseEnter={() => setLayoutSubmenuOpen(true)}
        onMouseLeave={() => setLayoutSubmenuOpen(false)}
      >
        {messages.layout}
        <span className="mindmap-ctx-arrow">&#9654;</span>
        {layoutSubmenuOpen && (
          <div className="mindmap-ctx-submenu">
            <div
              className="mindmap-ctx-item mindmap-ctx-layout-left"
              onClick={() => { onDirectionChange('left'); onClose() }}
            >
              {messages.layoutLeft}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-layout-both"
              onClick={() => { onDirectionChange('both'); onClose() }}
            >
              {messages.layoutBoth}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-layout-right"
              onClick={() => { onDirectionChange('right'); onClose() }}
            >
              {messages.layoutRight}
            </div>
          </div>
        )}
      </div>
      <div className="mindmap-ctx-divider" />
      <div
        className="mindmap-ctx-item mindmap-ctx-has-sub mindmap-ctx-export"
        onMouseEnter={() => setExportSubmenuOpen(true)}
        onMouseLeave={() => setExportSubmenuOpen(false)}
      >
        {messages.export}
        <span className="mindmap-ctx-arrow">&#9654;</span>
        {exportSubmenuOpen && (
          <div className="mindmap-ctx-submenu">
            <div
              className="mindmap-ctx-item mindmap-ctx-export-svg"
              onClick={onExportSVG}
            >
              {messages.exportSVG}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-export-png"
              onClick={onExportPNG}
            >
              {messages.exportPNG}
            </div>
            <div
              className="mindmap-ctx-item mindmap-ctx-export-md"
              onClick={onExportMarkdown}
            >
              {messages.exportMarkdown}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
