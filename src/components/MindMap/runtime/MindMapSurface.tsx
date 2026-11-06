import type { MindMapRemoteImagePolicy } from '../core/url'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type { MindMapDocument, MindMapLayout, MindMapLayoutNode, MindMapThemeTokens } from '../core/types'
import { MindMapScene } from './MindMapScene'
import { DARK_RUNTIME_THEME, themeVariables } from './theme'
import type { MindMapMessages } from './messages'
import { cullMindMapLayout } from './culling'

export interface MindMapViewport {
  x: number
  y: number
  zoom: number
}

export type MindMapAutoFitPolicy = 'initial' | 'always' | 'never'
export interface MindMapCullingOptions { enabled?: boolean; threshold?: number; overscan?: number }

export interface MindMapSurfaceRef {
  fitView(animated?: boolean): void
  getViewport(): MindMapViewport
  setViewport(viewport: MindMapViewport): void
  focusNode(nodeId: string): void
  toggleFullscreen(): Promise<boolean>
}

export interface MindMapSurfaceProps {
  remoteImagePolicy?: MindMapRemoteImagePolicy
  layout: MindMapLayout
  document?: MindMapDocument
  theme: MindMapThemeTokens
  className?: string
  ariaLabel?: string
  selectedNodeId?: string | null
  selectable?: boolean
  toolbar?: boolean
  autoFit?: MindMapAutoFitPolicy
  onNodeSelect?: (nodeId: string | null) => void
  onNodeDoubleClick?: (nodeId: string) => void
  onFoldToggle?: (nodeId: string) => void
  onNodeMove?: (nodeId: string, targetId: string, placement: 'before' | 'after' | 'child') => void
  editingNodeId?: string | null
  culling?: MindMapCullingOptions
  matchingNodeIds?: ReadonlySet<string> | null
  messages?: MindMapMessages
  fullscreen?: boolean
  onFullscreenChange?: (fullscreen: boolean) => void
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
  onViewportChange?: (viewport: MindMapViewport) => void
  renderNodeOverlay?: (node: MindMapLayoutNode) => ReactNode
  children?: ReactNode
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const MindMapSurface = forwardRef<MindMapSurfaceRef, MindMapSurfaceProps>(function MindMapSurface({
  layout,
  theme,
  remoteImagePolicy,
  className = '',
  ariaLabel = 'Mind map',
  selectedNodeId,
  selectable = false,
  toolbar = true,
  autoFit = 'initial',
  onNodeSelect,
  onNodeDoubleClick,
  onFoldToggle,
  onNodeMove,
  editingNodeId,
  culling,
  matchingNodeIds,
  messages,
  fullscreen = true,
  onFullscreenChange,
  onContextMenu,
  onKeyDown,
  onViewportChange,
  renderNodeOverlay,
  children,
}, forwardedRef) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportElementRef = useRef<SVGSVGElement>(null)
  const [viewport, setViewportState] = useState<MindMapViewport>({ x: 0, y: 0, zoom: 1 })
  const viewportRef = useRef(viewport)
  const viewportListener = useRef(onViewportChange)
  useEffect(() => { viewportListener.current = onViewportChange }, [onViewportChange])
  const initialFitRef = useRef(false)
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const draggedRef = useRef(false)
  const nodeDrag = useRef<{ id: string; x: number; y: number; captureTarget: Element } | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewportError, setViewportError] = useState('')

  const setViewport = useCallback((next: MindMapViewport) => {
    const normalized = { ...next, zoom: clamp(next.zoom, .12, 5) }
    viewportRef.current = normalized
    setViewportState(normalized)
    viewportListener.current?.(normalized)
  }, [])

  const calculateFit = useCallback((): MindMapViewport | null => {
    const container = containerRef.current
    if (!container || layout.nodes.length === 0) return null
    const width = container.clientWidth
    const height = container.clientHeight
    if (!width || !height) return null
    const padding = Math.min(72, Math.max(28, Math.min(width, height) * .08))
    const contentWidth = Math.max(layout.bounds.width, 1)
    const contentHeight = Math.max(layout.bounds.height, 1)
    const zoom = clamp(Math.min((width - padding * 2) / contentWidth, (height - padding * 2) / contentHeight, 1.5), .12, 5)
    const centerX = (layout.bounds.minX + layout.bounds.maxX) / 2
    const centerY = (layout.bounds.minY + layout.bounds.maxY) / 2
    return { x: width / 2 - centerX * zoom, y: height / 2 - centerY * zoom, zoom }
  }, [layout])

  const fitView = useCallback(() => {
    const fit = calculateFit()
    if (fit) { setViewport(fit); initialFitRef.current = true }
  }, [calculateFit, setViewport])

  const focusNode = useCallback((nodeId: string) => {
    const container = containerRef.current
    const node = layout.nodeById.get(nodeId)
    if (!container || !node) { pendingFocus.current = nodeId; return }
    pendingFocus.current = null
    const current = viewportRef.current
    setViewport({ x: container.clientWidth / 2 - node.x * current.zoom, y: container.clientHeight / 2 - node.y * current.zoom, zoom: current.zoom })
  }, [layout.nodeById, setViewport])

  useEffect(() => {
    if (pendingFocus.current) focusNode(pendingFocus.current)
  }, [focusNode])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return false
    try {
      if (container.ownerDocument.fullscreenElement === container) await container.ownerDocument.exitFullscreen()
      else if (container.requestFullscreen) await container.requestFullscreen()
      else return false
      return true
    } catch { setViewportError(messages?.fullscreenUnavailable ?? 'Fullscreen unavailable'); return false }
  }, [messages?.fullscreenUnavailable])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => { const active = container.ownerDocument.fullscreenElement === container; setIsFullscreen(active); onFullscreenChange?.(active) }
    container.ownerDocument.addEventListener('fullscreenchange', update)
    return () => container.ownerDocument.removeEventListener('fullscreenchange', update)
  }, [onFullscreenChange])

  useImperativeHandle(forwardedRef, () => ({ fitView, getViewport: () => viewportRef.current, setViewport, focusNode, toggleFullscreen }), [fitView, focusNode, setViewport, toggleFullscreen])

  useEffect(() => {
    if (autoFit === 'never') return
    if (autoFit === 'initial' && initialFitRef.current) return
    const id = requestAnimationFrame(() => {
      fitView()
    })
    return () => cancelAnimationFrame(id)
  }, [autoFit, fitView, layout.nodes.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    let lastWidth = container.clientWidth
    let lastHeight = container.clientHeight
    setSize({ width: lastWidth, height: lastHeight })
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === lastWidth && height === lastHeight) return
      lastWidth = width
      lastHeight = height
      setSize({ width, height })
      if (autoFit !== 'never' && (autoFit === 'always' || !initialFitRef.current)) fitView()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [autoFit, fitView])

  useEffect(() => {
    const svg = viewportElementRef.current
    if (!svg) return
    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault()
      const rect = svg.getBoundingClientRect()
      const pointX = event.clientX - rect.left
      const pointY = event.clientY - rect.top
      const current = viewportRef.current
      const deltaScale = event.deltaMode === event.DOM_DELTA_LINE ? 16 : event.deltaMode === event.DOM_DELTA_PAGE ? svg.clientHeight : 1
      const factor = Math.exp(-event.deltaY * deltaScale * .0013)
      const zoom = clamp(current.zoom * factor, .12, 5)
      setViewport({
        x: pointX - (pointX - current.x) * (zoom / current.zoom),
        y: pointY - (pointY - current.y) * (zoom / current.zoom),
        zoom,
      })
    }
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [setViewport])

  const handlePointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    draggedRef.current = false
    const target = event.target as Element
    if (event.button !== 0 || target.closest('input, button, a, [role="button"]')) return
    const node = target.closest('[data-mm-node]')
    if (node) {
      if (onNodeMove) {
        const captureTarget = typeof node.setPointerCapture === 'function' ? node : event.currentTarget
        nodeDrag.current = { id: node.getAttribute('data-mm-node')!, x: event.clientX, y: event.clientY, captureTarget }
        captureTarget.setPointerCapture(event.pointerId)
      }
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    const current = viewportRef.current
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: current.x, originY: current.y }
    draggedRef.current = false
  }, [onNodeMove])

  const handlePointerMove = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (nodeDrag.current) { draggedRef.current = Math.hypot(event.clientX - nodeDrag.current.x, event.clientY - nodeDrag.current.y) > 6; return }
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId) return
    const dx = event.clientX - pan.startX
    const dy = event.clientY - pan.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) draggedRef.current = true
    setViewport({ ...viewportRef.current, x: pan.originX + dx, y: pan.originY + dy })
  }, [setViewport])

  const finishPointer = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = nodeDrag.current
    nodeDrag.current = null
    if (event.type === 'pointercancel') draggedRef.current = false
    if (drag && draggedRef.current && event.type !== 'pointercancel') {
      const target = event.currentTarget.ownerDocument.elementFromPoint(event.clientX, event.clientY)?.closest('[data-mm-node]')
      const targetId = target?.getAttribute('data-mm-node')
      if (target && targetId && targetId !== drag.id && containerRef.current?.contains(target)) {
        const bounds = target.getBoundingClientRect()
        const ratio = bounds.height ? (event.clientY - bounds.top) / bounds.height : .5
        const placement = ratio < .25 ? 'before' : ratio > .75 ? 'after' : 'child'
        onNodeMove?.(drag.id, targetId, placement)
      }
    }
    const captureTarget = drag?.captureTarget ?? event.currentTarget
    if (captureTarget.hasPointerCapture(event.pointerId)) captureTarget.releasePointerCapture(event.pointerId)
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null
  }, [onNodeMove])

  const visibleLayout = useMemo(() => cullMindMapLayout(layout, { viewport, width: size.width, height: size.height, options: culling, pinnedNodeIds: [selectedNodeId, editingNodeId, focusedNodeId] }), [layout, size, viewport, selectedNodeId, editingNodeId, focusedNodeId, culling])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !selectedNodeId || !container.contains(container.ownerDocument.activeElement) || !container.ownerDocument.activeElement?.closest('.mm-viewport')) return
    const element = Array.from(container.querySelectorAll<SVGGElement>('[data-mm-node]')).find((node) => node.getAttribute('data-mm-node') === selectedNodeId)
    element?.focus()
  }, [selectedNodeId, visibleLayout])

  const zoomAroundCenter = useCallback((factor: number) => {
    const container = containerRef.current
    if (!container) return
    const current = viewportRef.current
    const zoom = clamp(current.zoom * factor, .12, 5)
    const cx = container.clientWidth / 2, cy = container.clientHeight / 2
    setViewport({ x: cx - (cx - current.x) * (zoom / current.zoom), y: cy - (cy - current.y) * (zoom / current.zoom), zoom })
  }, [setViewport])

  return (
    <div
      ref={containerRef}
      className={`mm-surface ${className}`.trim()}
      style={themeVariables(theme)}
      data-mm-theme={theme.background === DARK_RUNTIME_THEME.background ? 'dark' : 'light'}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      onFocusCapture={(event) => setFocusedNodeId((event.target as Element).closest('[data-mm-node]')?.getAttribute('data-mm-node') ?? null)}
      tabIndex={-1}
    >
      <svg
        ref={viewportElementRef}
        className="mm-viewport"
        width="100%"
        height="100%"
        role={selectable ? 'tree' : 'img'}
        aria-label={ariaLabel}
        tabIndex={selectable ? layout.nodes.length ? -1 : 0 : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onClick={(event) => {
          if (event.target === event.currentTarget || !(event.target as Element).closest('[data-mm-node]')) {
            if (!draggedRef.current) onNodeSelect?.(null)
          }
        }}
      >
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}>
          <MindMapScene
            layout={visibleLayout}
            theme={theme} remoteImagePolicy={remoteImagePolicy}
            selectedNodeId={selectedNodeId}
            matchingNodeIds={matchingNodeIds}
            messages={messages}
            selectable={selectable}
            onNodeSelect={(nodeId) => { if (!draggedRef.current) onNodeSelect?.(nodeId); draggedRef.current = false }}
            onNodeDoubleClick={onNodeDoubleClick}
            onFoldToggle={selectable ? onFoldToggle : undefined}
            renderNodeOverlay={renderNodeOverlay}
          />
        </g>
      </svg>
      {toolbar && (
        <div className="mm-viewport-controls" aria-label={messages?.viewportControls ?? 'Viewport controls'}>
          <button type="button" onClick={() => zoomAroundCenter(.86)} aria-label={messages?.zoomOut ?? 'Zoom out'}>−</button>
          <button type="button" className="mm-viewport-percent" onClick={() => fitView()} aria-label={messages?.resetView ?? 'Fit view'}>{Math.round(viewport.zoom * 100)}%</button>
          <button type="button" onClick={() => zoomAroundCenter(1.16)} aria-label={messages?.zoomIn ?? 'Zoom in'}>+</button>
          {fullscreen && <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? messages?.exitFullscreen ?? 'Exit fullscreen' : messages?.fullscreen ?? 'Fullscreen'}>{isFullscreen ? '⤡' : '⤢'}</button>}
        </div>
      )}
      {viewportError && <p className="mm-viewport-error" role="alert">{viewportError}</p>}
      {children}
    </div>
  )
})
