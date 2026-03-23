import { useState, useCallback, useRef, useEffect } from 'react'

interface UseCanvasPanParams {
  svgRef: React.RefObject<SVGSVGElement | null>
  pan: { x: number; y: number }
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
}

export function useCanvasPan({ svgRef, pan, setPan }: UseCanvasPanParams) {
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

  // Touch support: single-finger pan + two-finger pinch handled by usePanZoom's wheel
  const panRef = useRef(pan)
  useEffect(() => { panRef.current = pan })

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return
      e.preventDefault()
      const touch = e.touches[0]
      didDragRef.current = false
      setDraggingCanvas(true)
      canvasDragStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return
      e.preventDefault()
      didDragRef.current = true
      const touch = e.touches[0]
      setPan({
        x: canvasDragStart.current.panX + (touch.clientX - canvasDragStart.current.x),
        y: canvasDragStart.current.panY + (touch.clientY - canvasDragStart.current.y),
      })
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
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
  }, [svgRef, setPan])

  return {
    draggingCanvas,
    didDragRef,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
