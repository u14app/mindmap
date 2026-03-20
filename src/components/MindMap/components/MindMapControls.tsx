import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'
import {
  IconPlus,
  IconMinus,
} from './icons'

export interface MindMapControlsProps {
  zoom: number
  theme: ThemeColors
  messages: MindMapMessages
  showZoom?: boolean
  mode: 'view' | 'text'
  isFullscreen: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onAutoFit: () => void
  onModeToggle: () => void
  onFullscreenToggle: () => void
}

export function MindMapControls({
  zoom,
  theme,
  messages,
  showZoom = true,
  mode,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onAutoFit,
  onModeToggle,
  onFullscreenToggle,
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
            className="mindmap-ctrl-btn mindmap-ctrl-zoom-out"
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
            className="mindmap-ctrl-btn mindmap-ctrl-zoom-in"
            onClick={onZoomIn}
            title={messages.zoomIn}
            style={{ color: theme.controls.textColor }}
          >
            <IconPlus size={16} />
          </button>
        </div>
      )}

      {/* Extra controls - bottom right (mode & fullscreen) */}
      <div
        className="mindmap-extra-controls"
        style={{
          background: theme.controls.bgColor,
          color: theme.controls.textColor,
        }}
      >
        <button
          className="mindmap-ctrl-btn mindmap-ctrl-mode"
          onClick={onModeToggle}
          title={mode === 'view' ? messages.textMode : messages.viewMode}
          style={{ color: theme.controls.textColor }}
        >
          {mode === 'view' ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 5h12" />
              <path d="M4 12h10" />
              <path d="M12 19h8" />
            </svg>
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
        <button
          className="mindmap-ctrl-btn mindmap-ctrl-fullscreen"
          onClick={onFullscreenToggle}
          title={isFullscreen ? messages.exitFullscreen : messages.fullscreen}
          style={{ color: theme.controls.textColor }}
        >
          {isFullscreen ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
