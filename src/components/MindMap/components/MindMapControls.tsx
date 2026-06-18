import type { ThemeColors } from '../utils/theme'
import type { MindMapMessages } from '../utils/i18n'
import {
  IconPlus,
  IconMinus,
  IconUndo,
  IconRedo,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
} from './icons'

export interface MindMapControlsProps {
  zoom: number
  theme: ThemeColors
  messages: MindMapMessages
  showZoom?: boolean
  showHistory?: boolean
  showSearch?: boolean
  showTags?: boolean
  showModeToggle?: boolean
  mode: 'view' | 'text'
  isFullscreen: boolean
  canUndo?: boolean
  canRedo?: boolean
  searchQuery?: string
  searchMatchCount?: number
  activeSearchIndex?: number
  availableTags?: string[]
  activeTags?: string[]
  onZoomIn: () => void
  onZoomOut: () => void
  onAutoFit: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSearchChange?: (query: string) => void
  onSearchPrevious?: () => void
  onSearchNext?: () => void
  onTagToggle?: (tag: string) => void
  onClearTags?: () => void
  onModeToggle: () => void
  onFullscreenToggle: () => void
}

export function MindMapControls({
  zoom,
  messages,
  showZoom = true,
  showHistory = false,
  showSearch = false,
  showTags = false,
  showModeToggle = true,
  mode,
  isFullscreen,
  canUndo = false,
  canRedo = false,
  searchQuery = '',
  searchMatchCount = 0,
  activeSearchIndex = -1,
  availableTags = [],
  activeTags = [],
  onZoomIn,
  onZoomOut,
  onAutoFit,
  onUndo,
  onRedo,
  onSearchChange,
  onSearchPrevious,
  onSearchNext,
  onTagToggle,
  onClearTags,
  onModeToggle,
  onFullscreenToggle,
}: MindMapControlsProps) {
  const hasTagFilters = activeTags.length > 0

  return (
    <>
      {/* Zoom controls - bottom left */}
      {(showZoom || showHistory) && (
        <div className="mindmap-zoom-controls">
          {showHistory && (
            <>
              <button
                className="mindmap-ctrl-btn mindmap-ctrl-undo"
                onClick={onUndo}
                title={messages.undo}
                aria-label={messages.undo}
                disabled={!canUndo}
              >
                <IconUndo size={16} />
              </button>
              <button
                className="mindmap-ctrl-btn mindmap-ctrl-redo"
                onClick={onRedo}
                title={messages.redo}
                aria-label={messages.redo}
                disabled={!canRedo}
              >
                <IconRedo size={16} />
              </button>
            </>
          )}
          {showZoom && (
            <>
              <button
                className="mindmap-ctrl-btn mindmap-ctrl-zoom-out"
                onClick={onZoomOut}
                title={messages.zoomOut}
                aria-label={messages.zoomOut}
              >
                <IconMinus size={16} />
              </button>
              <button
                className="mindmap-ctrl-pct"
                onClick={onAutoFit}
                title={messages.resetView}
                aria-label={messages.resetView}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                className="mindmap-ctrl-btn mindmap-ctrl-zoom-in"
                onClick={onZoomIn}
                title={messages.zoomIn}
                aria-label={messages.zoomIn}
              >
                <IconPlus size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {showSearch && (
        <div className="mindmap-search-controls" role="search">
          <IconSearch size={15} />
          <input
            className="mindmap-search-input"
            value={searchQuery}
            placeholder={messages.searchPlaceholder}
            aria-label={messages.search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (searchMatchCount === 0) return
                if (e.shiftKey) onSearchPrevious?.()
                else onSearchNext?.()
              } else if (e.key === 'Escape' && searchQuery) {
                e.preventDefault()
                onSearchChange?.('')
              }
            }}
          />
          <span className="mindmap-search-count" aria-live="polite">
            {searchQuery
              ? searchMatchCount > 0
                ? `${activeSearchIndex + 1}/${searchMatchCount}`
                : messages.searchNoResults
              : ''}
          </span>
          <button
            className="mindmap-ctrl-btn mindmap-search-step"
            type="button"
            title={messages.searchPrevious}
            aria-label={messages.searchPrevious}
            disabled={searchMatchCount === 0}
            onClick={onSearchPrevious}
          >
            <IconChevronLeft size={15} />
          </button>
          <button
            className="mindmap-ctrl-btn mindmap-search-step"
            type="button"
            title={messages.searchNext}
            aria-label={messages.searchNext}
            disabled={searchMatchCount === 0}
            onClick={onSearchNext}
          >
            <IconChevronRight size={15} />
          </button>
        </div>
      )}

      {showTags && availableTags.length > 0 && (
        <div className="mindmap-tag-controls" aria-label={messages.tagFilter}>
          {availableTags.map((tag) => {
            const active = activeTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                className={`mindmap-tag-filter${active ? ' is-active' : ''}`}
                onClick={() => onTagToggle?.(tag)}
                aria-pressed={active}
              >
                #{tag}
              </button>
            )
          })}
          {hasTagFilters && (
            <button
              type="button"
              className="mindmap-tag-filter mindmap-tag-filter-clear"
              onClick={onClearTags}
            >
              {messages.clearFilters}
            </button>
          )}
        </div>
      )}

      {/* Extra controls - bottom right (mode & fullscreen) */}
      <div className="mindmap-extra-controls">
        {showModeToggle && (
          <button
            className="mindmap-ctrl-btn mindmap-ctrl-mode"
            onClick={onModeToggle}
            title={mode === 'view' ? messages.textMode : messages.viewMode}
            aria-label={mode === 'view' ? messages.textMode : messages.viewMode}
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
        )}
        <button
          className="mindmap-ctrl-btn mindmap-ctrl-fullscreen"
          onClick={onFullscreenToggle}
          title={isFullscreen ? messages.exitFullscreen : messages.fullscreen}
          aria-label={isFullscreen ? messages.exitFullscreen : messages.fullscreen}
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
