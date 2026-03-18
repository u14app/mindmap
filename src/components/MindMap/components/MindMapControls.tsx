import type { LayoutDirection } from '../types'
import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'
import {
  IconPlus,
  IconMinus,
  IconLayoutLeft,
  IconLayoutRight,
  IconLayoutBoth,
} from './icons'

export interface MindMapControlsProps {
  zoom: number
  direction: LayoutDirection
  theme: ThemeColors
  messages: MindMapMessages
  showZoom?: boolean
  showDirection?: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onAutoFit: () => void
  onDirectionChange: (dir: LayoutDirection) => void
}

export function MindMapControls({
  zoom,
  direction,
  theme,
  messages,
  showZoom = true,
  showDirection = true,
  onZoomIn,
  onZoomOut,
  onAutoFit,
  onDirectionChange,
}: MindMapControlsProps) {
  return (
    <>
      {/* Zoom controls - bottom left */}
      {showZoom && (
        <div
          className="mindmap-zoom-controls"
          style={{
            background: theme.controls.bgColor,
            color: theme.controls.textColor,
          }}
        >
          <button
            className="mindmap-ctrl-btn"
            onClick={onZoomOut}
            title={messages.zoomOut}
            style={{ color: theme.controls.textColor }}
          >
            <IconMinus size={16} />
          </button>
          <button
            className="mindmap-ctrl-pct"
            onClick={onAutoFit}
            title={messages.resetView}
            style={{ color: theme.controls.textColor }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="mindmap-ctrl-btn"
            onClick={onZoomIn}
            title={messages.zoomIn}
            style={{ color: theme.controls.textColor }}
          >
            <IconPlus size={16} />
          </button>
        </div>
      )}

      {/* Direction controls - bottom right */}
      {showDirection && (
        <div
          className="mindmap-direction-controls"
          style={{
            background: theme.controls.bgColor,
            color: theme.controls.textColor,
          }}
        >
          <button
            className={`mindmap-ctrl-btn ${direction === 'left' ? 'active' : ''}`}
            onClick={() => onDirectionChange('left')}
            title={messages.layoutLeft}
            style={{ color: theme.controls.textColor }}
          >
            <IconLayoutLeft size={16} />
          </button>
          <button
            className={`mindmap-ctrl-btn ${direction === 'both' ? 'active' : ''}`}
            onClick={() => onDirectionChange('both')}
            title={messages.layoutBoth}
            style={{ color: theme.controls.textColor }}
          >
            <IconLayoutBoth size={16} />
          </button>
          <button
            className={`mindmap-ctrl-btn ${direction === 'right' ? 'active' : ''}`}
            onClick={() => onDirectionChange('right')}
            title={messages.layoutRight}
            style={{ color: theme.controls.textColor }}
          >
            <IconLayoutRight size={16} />
          </button>
        </div>
      )}
    </>
  )
}
