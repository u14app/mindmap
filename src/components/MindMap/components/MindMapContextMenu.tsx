import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import type { LayoutDirection } from '../types'
import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'

export interface MindMapContextMenuProps {
  position: { x: number; y: number }
  theme: ThemeColors
  messages: MindMapMessages
  direction: LayoutDirection
  readonly?: boolean
  /** When set, the menu targets a specific node and shows node actions. */
  nodeId?: string | null
  /** Whether the clipboard has a subtree available to paste. */
  canPaste?: boolean
  onNewRootNode: () => void
  onImport: () => void
  onExportSVG: () => void
  onExportPNG: () => void
  onExportMarkdown: () => void
  onDirectionChange: (dir: LayoutDirection) => void
  onAddChildNode?: (e: ReactMouseEvent) => void
  onEditNode?: () => void
  onDeleteNode?: () => void
  onCopyNode?: () => void
  onCutNode?: () => void
  onPasteNode?: () => void
  onClose: () => void
}

export function MindMapContextMenu({
  position,
  messages,
  readonly: readonlyProp,
  nodeId,
  canPaste,
  onNewRootNode,
  onImport,
  onExportSVG,
  onExportPNG,
  onExportMarkdown,
  onDirectionChange,
  onAddChildNode,
  onEditNode,
  onDeleteNode,
  onCopyNode,
  onCutNode,
  onPasteNode,
  onClose,
}: MindMapContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [exportSubmenuOpen, setExportSubmenuOpen] = useState(false)
  const [layoutSubmenuOpen, setLayoutSubmenuOpen] = useState(false)

  function handleSubmenuKeyDown(
    e: KeyboardEvent<HTMLButtonElement>,
    setOpen: (open: boolean) => void,
  ) {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  function getMenuItems() {
    return Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    ).filter((item) => !item.hasAttribute('disabled'))
  }

  function handleMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

    const items = getMenuItems()
    if (items.length === 0) return

    e.preventDefault()
    const activeIndex = items.indexOf(document.activeElement as HTMLElement)
    const offset = e.key === 'ArrowDown' ? 1 : -1
    const nextIndex =
      activeIndex < 0
        ? 0
        : (activeIndex + offset + items.length) % items.length
    items[nextIndex].focus()
  }

  useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    firstItem?.focus()
  }, [])

  return (
    <div
      ref={menuRef}
      className="mindmap-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleMenuKeyDown}
    >
      {nodeId ? (
        <>
          {!readonlyProp && (
            <>
              <button
                type="button"
                className="mindmap-ctx-item mindmap-ctx-add-child"
                role="menuitem"
                onClick={(e) => { onAddChildNode?.(e); onClose() }}
              >
                {messages.addChild}
              </button>
              <button
                type="button"
                className="mindmap-ctx-item mindmap-ctx-edit"
                role="menuitem"
                onClick={() => { onEditNode?.(); onClose() }}
              >
                {messages.editNode}
              </button>
              <div className="mindmap-ctx-divider" role="separator" />
            </>
          )}
          <button
            type="button"
            className="mindmap-ctx-item mindmap-ctx-copy"
            role="menuitem"
            onClick={() => { onCopyNode?.(); onClose() }}
          >
            {messages.copy}
          </button>
          {!readonlyProp && (
            <>
              <button
                type="button"
                className="mindmap-ctx-item mindmap-ctx-cut"
                role="menuitem"
                onClick={() => { onCutNode?.(); onClose() }}
              >
                {messages.cut}
              </button>
              <button
                type="button"
                className="mindmap-ctx-item mindmap-ctx-paste"
                role="menuitem"
                disabled={!canPaste}
                onClick={() => { onPasteNode?.(); onClose() }}
              >
                {messages.paste}
              </button>
              <div className="mindmap-ctx-divider" role="separator" />
              <button
                type="button"
                className="mindmap-ctx-item mindmap-ctx-delete"
                role="menuitem"
                onClick={() => { onDeleteNode?.(); onClose() }}
              >
                {messages.deleteNode}
              </button>
            </>
          )}
          <div className="mindmap-ctx-divider" role="separator" />
        </>
      ) : (
        !readonlyProp && (
          <>
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-new-root"
              role="menuitem"
              onClick={onNewRootNode}
            >
              {messages.newRootNode}
            </button>
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-import"
              role="menuitem"
              onClick={onImport}
            >
              {messages.import}
            </button>
            <div className="mindmap-ctx-divider" role="separator" />
          </>
        )
      )}
      <div
        className="mindmap-ctx-submenu-host"
        onMouseEnter={() => setLayoutSubmenuOpen(true)}
        onMouseLeave={() => setLayoutSubmenuOpen(false)}
      >
        <button
          type="button"
          className="mindmap-ctx-item mindmap-ctx-has-sub mindmap-ctx-layout"
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={layoutSubmenuOpen}
          onClick={() => setLayoutSubmenuOpen((open) => !open)}
          onKeyDown={(e) => handleSubmenuKeyDown(e, setLayoutSubmenuOpen)}
        >
          {messages.layout}
          <span className="mindmap-ctx-arrow">&#9654;</span>
        </button>
        {layoutSubmenuOpen && (
          <div className="mindmap-ctx-submenu" role="menu">
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-layout-left"
              role="menuitem"
              onClick={() => { onDirectionChange('left'); onClose() }}
            >
              {messages.layoutLeft}
            </button>
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-layout-both"
              role="menuitem"
              onClick={() => { onDirectionChange('both'); onClose() }}
            >
              {messages.layoutBoth}
            </button>
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-layout-right"
              role="menuitem"
              onClick={() => { onDirectionChange('right'); onClose() }}
            >
              {messages.layoutRight}
            </button>
          </div>
        )}
      </div>
      <div className="mindmap-ctx-divider" role="separator" />
      <div
        className="mindmap-ctx-submenu-host"
        onMouseEnter={() => setExportSubmenuOpen(true)}
        onMouseLeave={() => setExportSubmenuOpen(false)}
      >
        <button
          type="button"
          className="mindmap-ctx-item mindmap-ctx-has-sub mindmap-ctx-export"
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={exportSubmenuOpen}
          onClick={() => setExportSubmenuOpen((open) => !open)}
          onKeyDown={(e) => handleSubmenuKeyDown(e, setExportSubmenuOpen)}
        >
          {messages.export}
          <span className="mindmap-ctx-arrow">&#9654;</span>
        </button>
        {exportSubmenuOpen && (
          <div className="mindmap-ctx-submenu" role="menu">
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-export-svg"
              role="menuitem"
              onClick={onExportSVG}
            >
              {messages.exportSVG}
            </button>
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-export-png"
              role="menuitem"
              onClick={onExportPNG}
            >
              {messages.exportPNG}
            </button>
            <button
              type="button"
              className="mindmap-ctx-item mindmap-ctx-export-md"
              role="menuitem"
              onClick={onExportMarkdown}
            >
              {messages.exportMarkdown}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
