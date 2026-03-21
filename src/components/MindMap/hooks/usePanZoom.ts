import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { LayoutNode } from '../types'

export function usePanZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  nodes: LayoutNode[],
) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const animFrameRef = useRef<number>(0)

  // Keep refs in sync for stable callbacks
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)
  useEffect(() => {
    zoomRef.current = zoom
    panRef.current = pan
  })

  // Content center for pinch-to-zoom centering
  const contentCenter = useMemo(() => {
    if (nodes.length === 0) return { x: 0, y: 0 }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x - n.width / 2)
      maxX = Math.max(maxX, n.x + n.width / 2)
      minY = Math.min(minY, n.y - n.height / 2)
      maxY = Math.max(maxY, n.y + n.height / 2)
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  }, [nodes])

  const animateTo = useCallback(
    (targetZoom: number, targetPanX: number, targetPanY: number) => {
      cancelAnimationFrame(animFrameRef.current)

      const startZoom = zoomRef.current
      const startPanX = panRef.current.x
      const startPanY = panRef.current.y
      const duration = 200
      const startTime = performance.now()

      const step = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)

        setZoom(startZoom + (targetZoom - startZoom) * ease)
        setPan({
          x: startPanX + (targetPanX - startPanX) * ease,
          y: startPanY + (targetPanY - startPanY) * ease,
        })

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step)
        }
      }

      animFrameRef.current = requestAnimationFrame(step)
    },
    [],
  )

  const autoFit = useCallback(() => {
    const svg = svgRef.current
    if (!svg || nodes.length === 0) return
    const containerW = svg.clientWidth
    const containerH = svg.clientHeight

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x - n.width / 2)
      maxX = Math.max(maxX, n.x + n.width / 2)
      minY = Math.min(minY, n.y - n.height / 2)
      maxY = Math.max(maxY, n.y + n.height / 2)
    }

    const treeW = maxX - minX
    const treeH = maxY - minY
    const padding = 60
    const z = Math.min(
      (containerW - padding * 2) / treeW,
      (containerH - padding * 2) / treeH,
      1.5,
    )
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    return {
      zoom: z,
      panX: containerW / 2 - centerX * z,
      panY: containerH / 2 - centerY * z,
    }
  }, [svgRef, nodes])

  // Register wheel handler with { passive: false } to allow preventDefault
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(zoomRef.current * factor, 0.1), 5)

      setPan({
        x: mouseX - (mouseX - panRef.current.x) * (newZoom / zoomRef.current),
        y: mouseY - (mouseY - panRef.current.y) * (newZoom / zoomRef.current),
      })
      setZoom(newZoom)
    }
    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [svgRef])

  const zoomIn = useCallback(() => {
    const newZ = Math.min(zoomRef.current * 1.2, 5)
    const svg = svgRef.current!
    const cx = svg.clientWidth / 2
    const cy = svg.clientHeight / 2
    animateTo(
      newZ,
      cx - (cx - panRef.current.x) * (newZ / zoomRef.current),
      cy - (cy - panRef.current.y) * (newZ / zoomRef.current),
    )
  }, [svgRef, animateTo])

  const zoomOut = useCallback(() => {
    const newZ = Math.max(zoomRef.current * 0.8, 0.1)
    const svg = svgRef.current!
    const cx = svg.clientWidth / 2
    const cy = svg.clientHeight / 2
    animateTo(
      newZ,
      cx - (cx - panRef.current.x) * (newZ / zoomRef.current),
      cy - (cy - panRef.current.y) * (newZ / zoomRef.current),
    )
  }, [svgRef, animateTo])

  // Pan to center a specific node without changing zoom
  const panToNode = useCallback((nodeId: string) => {
    const svg = svgRef.current
    if (!svg) return
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    const cw = svg.clientWidth
    const ch = svg.clientHeight
    // Check if node is already visible with margin
    const screenX = node.x * zoomRef.current + panRef.current.x
    const screenY = node.y * zoomRef.current + panRef.current.y
    const margin = 100
    if (screenX > margin && screenX < cw - margin &&
        screenY > margin && screenY < ch - margin) return
    // Pan to center node, keep zoom unchanged
    animateTo(zoomRef.current, cw / 2 - node.x * zoomRef.current, ch / 2 - node.y * zoomRef.current)
  }, [svgRef, nodes, animateTo])

  return {
    pan, setPan, zoom, setZoom,
    animateTo, autoFit, zoomIn, zoomOut,
    contentCenter, panToNode,
  }
}
