import { useState, useCallback, useRef, useEffect } from 'react'

interface UseCanvasPanParams {
  svgRef: React.RefObject<SVGSVGElement | null>
  pan: { x: number; y: number }
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
}

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export function useCanvasPan({ svgRef, pan, setPan, zoom, setZoom }: UseCanvasPanParams) {
  const [draggingCanvas, setDraggingCanvas] = useState(false)
  const canvasDragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const didDragRef = useRef(false)

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      didDragRef.current = false
      setDraggingCanvas(true)
      canvasDragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingCanvas) return
      didDragRef.current = true
      setPan({
        x: canvasDragStart.current.panX + (e.clientX - canvasDragStart.current.x),
        y: canvasDragStart.current.panY + (e.clientY - canvasDragStart.current.y),
      })
    },
    [draggingCanvas, setPan],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingCanvas(false)
  }, [])

  // --- Touch support: single-finger pan + two-finger pinch-to-zoom ---
  // Keep latest pan/zoom in refs so the native listeners (registered once) read
  // current values without re-binding on every render.
  const panRef = useRef(pan)
  const zoomRef = useRef(zoom)
  useEffect(() => {
    panRef.current = pan
    zoomRef.current = zoom
  })

  // Gesture state lives in a ref to avoid stale closures inside native handlers.
  const gestureRef = useRef<{
    type: 'none' | 'pan' | 'pinch'
    startDist: number
    startZoom: number
    startPan: { x: number; y: number }
    startMid: { x: number; y: number }
  }>({
    type: 'none',
    startDist: 0,
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    startMid: { x: 0, y: 0 },
  })

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const touchDistance = (t0: Touch, t1: Touch) =>
      Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)

    // Midpoint of two touches in svg-local coordinates
    const touchMidpoint = (t0: Touch, t1: Touch, rect: DOMRect) => ({
      x: (t0.clientX + t1.clientX) / 2 - rect.left,
      y: (t0.clientY + t1.clientY) / 2 - rect.top,
    })

    function handleTouchStart(e: TouchEvent) {
      const touches = e.touches
      if (touches.length === 2) {
        // Begin pinch — overrides any in-progress single-finger pan
        e.preventDefault()
        const rect = svg!.getBoundingClientRect()
        gestureRef.current = {
          type: 'pinch',
          startDist: touchDistance(touches[0], touches[1]),
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          startMid: touchMidpoint(touches[0], touches[1], rect),
        }
        setDraggingCanvas(false)
        return
      }
      if (touches.length === 1) {
        e.preventDefault()
        const touch = touches[0]
        didDragRef.current = false
        setDraggingCanvas(true)
        canvasDragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        }
        gestureRef.current.type = 'pan'
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const gesture = gestureRef.current
      const touches = e.touches

      if (gesture.type === 'pinch' && touches.length >= 2) {
        e.preventDefault()
        if (gesture.startDist <= 0) return
        const rect = svg!.getBoundingClientRect()
        const ratio = touchDistance(touches[0], touches[1]) / gesture.startDist
        const newZoom = Math.min(
          Math.max(gesture.startZoom * ratio, MIN_ZOOM),
          MAX_ZOOM,
        )
        // Keep the content point under the initial pinch midpoint anchored to
        // the moving midpoint — this folds the two-finger drag into the zoom.
        const newMid = touchMidpoint(touches[0], touches[1], rect)
        const contentX = (gesture.startMid.x - gesture.startPan.x) / gesture.startZoom
        const contentY = (gesture.startMid.y - gesture.startPan.y) / gesture.startZoom
        setZoom(newZoom)
        setPan({
          x: newMid.x - contentX * newZoom,
          y: newMid.y - contentY * newZoom,
        })
        return
      }

      if (gesture.type === 'pan' && touches.length === 1) {
        e.preventDefault()
        didDragRef.current = true
        const touch = touches[0]
        setPan({
          x: canvasDragStart.current.panX + (touch.clientX - canvasDragStart.current.x),
          y: canvasDragStart.current.panY + (touch.clientY - canvasDragStart.current.y),
        })
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const touches = e.touches
      if (gestureRef.current.type === 'pinch' && touches.length === 1) {
        // One finger lifted mid-pinch — resume single-finger pan
        e.preventDefault()
        const touch = touches[0]
        canvasDragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        }
        gestureRef.current.type = 'pan'
        setDraggingCanvas(true)
        return
      }
      if (touches.length === 0) {
        gestureRef.current.type = 'none'
        setDraggingCanvas(false)
      }
    }

    svg.addEventListener('touchstart', handleTouchStart, { passive: false })
    svg.addEventListener('touchmove', handleTouchMove, { passive: false })
    svg.addEventListener('touchend', handleTouchEnd, { passive: false })
    svg.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      svg.removeEventListener('touchstart', handleTouchStart)
      svg.removeEventListener('touchmove', handleTouchMove)
      svg.removeEventListener('touchend', handleTouchEnd)
      svg.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [svgRef, setPan, setZoom])

  return {
    draggingCanvas,
    didDragRef,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
