import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { MindMapData, LayoutNode, LayoutDirection } from '../types'
import { getDescendantIds, swapSiblingsMulti, moveChildToSide } from '../utils/tree-ops'

interface UseDragParams {
  svgRef: React.RefObject<SVGSVGElement | null>
  zoom: number
  pan: { x: number; y: number }
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  setZoom: React.Dispatch<React.SetStateAction<number>>
  nodeMap: Record<string, LayoutNode>
  nodes: LayoutNode[]
  updateData: (updater: (prev: MindMapData[]) => MindMapData[]) => void
  direction: LayoutDirection
  splitIndices: Record<string, number>
  setSplitIndices: React.Dispatch<React.SetStateAction<Record<string, number>>>
  mapData: MindMapData[]
  contentCenter: { x: number; y: number }
}

export function useDrag({
  svgRef,
  zoom,
  pan,
  setPan,
  setZoom,
  nodeMap,
  nodes,
  updateData,
  direction,
  splitIndices,
  setSplitIndices,
  mapData,
  contentCenter,
}: UseDragParams) {
  const [draggingCanvas, setDraggingCanvas] = useState(false)
  const [floatingNodeId, setFloatingNodeId] = useState<string | null>(null)
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null)

  const canvasDragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const grabOffsetRef = useRef({ x: 0, y: 0 })
  const didDragRef = useRef(false)
  const lastSwapTimeRef = useRef(0)

  // Touch state refs
  const touchStateRef = useRef<{
    type: 'none' | 'canvas-pan' | 'node-drag' | 'pinch'
    startPan: { x: number; y: number }
    startZoom: number
    startTouches: Array<{ id: number; x: number; y: number }>
    pinchDistance: number
    contentCenter: { x: number; y: number }
    touchNodeId: string | null
  }>({
    type: 'none',
    startPan: { x: 0, y: 0 },
    startZoom: 1,
    startTouches: [],
    pinchDistance: 0,
    contentCenter: { x: 0, y: 0 },
    touchNodeId: null,
  })

  const floatingSubtreeIds = useMemo(() => {
    if (!floatingNodeId) return new Set<string>()
    const ids = new Set([floatingNodeId])
    for (const did of getDescendantIds(floatingNodeId, nodes)) {
      ids.add(did)
    }
    return ids
  }, [floatingNodeId, nodes])

  // Convert client coordinates to SVG-space coordinates
  const clientToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svgRect = svgRef.current!.getBoundingClientRect()
      return {
        x: (clientX - svgRect.left - pan.x) / zoom,
        y: (clientY - svgRect.top - pan.y) / zoom,
      }
    },
    [svgRef, pan, zoom],
  )

  // Shared logic for updating floating position and checking swaps
  const updateFloatingAndSwap = useCallback(
    (clientX: number, clientY: number, currentFloatingId: string) => {
      const svgPos = clientToSvg(clientX, clientY)
      const newFloatingPos = {
        x: svgPos.x + grabOffsetRef.current.x,
        y: svgPos.y + grabOffsetRef.current.y,
      }
      setFloatingPos(newFloatingPos)

      const now = Date.now()
      if (now - lastSwapTimeRef.current > 500) {
        const draggedNode = nodeMap[currentFloatingId]
        if (draggedNode && draggedNode.parentId) {
          // Cross-side detection for depth-1 nodes in "both" layout
          if (draggedNode.depth === 1 && direction === 'both') {
            const currentSide = draggedNode.side
            const crossedToLeft = currentSide === 'right' && newFloatingPos.x < 0
            const crossedToRight = currentSide === 'left' && newFloatingPos.x > 0

            if (crossedToLeft || crossedToRight) {
              const targetSide = crossedToLeft ? 'left' : 'right'
              const rootId = draggedNode.parentId
              const root = mapData.find((r) => r.id === rootId)
              if (root) {
                const si =
                  splitIndices[rootId] ??
                  Math.ceil((root.children?.length ?? 0) / 2)
                const result = moveChildToSide(root, currentFloatingId, targetSide, si)
                if (result) {
                  lastSwapTimeRef.current = now
                  setSplitIndices((prev) => ({
                    ...prev,
                    [rootId]: result.newSplitIndex,
                  }))
                  updateData((prev) =>
                    prev.map((r) => (r.id === rootId ? result.data : r)),
                  )
                  return
                }
              }
            }
          }

          // Collision detection for sibling swap
          const siblings = nodes.filter(
            (n) =>
              n.parentId === draggedNode.parentId &&
              n.id !== currentFloatingId &&
              n.side === draggedNode.side,
          )

          for (const sibling of siblings) {
            const threshold =
              Math.max(draggedNode.height, sibling.height) * 0.6

            if (Math.abs(newFloatingPos.y - sibling.y) < threshold) {
              lastSwapTimeRef.current = now
              updateData((prev) =>
                swapSiblingsMulti(prev, currentFloatingId, sibling.id),
              )
              break
            }
          }
        }
      }
    },
    [clientToSvg, nodeMap, nodes, updateData, direction, splitIndices, setSplitIndices, mapData],
  )

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
      if (draggingCanvas) {
        didDragRef.current = true
        setPan({
          x: canvasDragStart.current.panX + (e.clientX - canvasDragStart.current.x),
          y: canvasDragStart.current.panY + (e.clientY - canvasDragStart.current.y),
        })
      } else if (floatingNodeId) {
        didDragRef.current = true
        updateFloatingAndSwap(e.clientX, e.clientY, floatingNodeId)
      }
    },
    [draggingCanvas, floatingNodeId, setPan, updateFloatingAndSwap],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingCanvas(false)
    setFloatingNodeId(null)
    setFloatingPos(null)
  }, [])

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      if (e.button !== 0) return
      didDragRef.current = false
      const node = nodeMap[nodeId]
      if (!node) return
      setFloatingNodeId(nodeId)
      setFloatingPos({ x: node.x, y: node.y })
      const svgPos = clientToSvg(e.clientX, e.clientY)
      grabOffsetRef.current = {
        x: node.x - svgPos.x,
        y: node.y - svgPos.y,
      }
    },
    [nodeMap, clientToSvg],
  )

  // --- Touch event handlers (native, registered with { passive: false }) ---

  // Store latest refs for values needed in touch handlers
  const panRef = useRef(pan)
  const zoomRef = useRef(zoom)
  const nodeMapRef = useRef(nodeMap)
  const contentCenterRef = useRef(contentCenter)
  const floatingNodeIdRef = useRef(floatingNodeId)
  useEffect(() => {
    panRef.current = pan
    zoomRef.current = zoom
    nodeMapRef.current = nodeMap
    contentCenterRef.current = contentCenter
    floatingNodeIdRef.current = floatingNodeId
  })

  // Find the closest mindmap node <g> element from a touch target
  const findNodeIdFromTarget = useCallback((target: EventTarget | null): string | null => {
    let el = target as Element | null
    while (el && el !== svgRef.current) {
      if (el.classList?.contains('mindmap-node-g')) {
        // Find the MindMapNode's key from the nodes list by matching transform
        const transform = el.getAttribute('transform')
        if (transform) {
          // Match nodes by finding which node's rendered position matches
          for (const n of nodes) {
            const nx = n.x
            const ny = n.y
            if (transform.includes(`translate(${nx}`) && transform.includes(`${ny})`)) {
              return n.id
            }
          }
        }
      }
      el = el.parentElement
    }
    return null
  }, [svgRef, nodes])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const svgEl = svg as SVGSVGElement // non-null from guard above

    function getTouchDistance(t0: Touch, t1: Touch): number {
      return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
    }

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault()
      const touches = e.touches

      if (touches.length === 2) {
        // Start pinch — override any existing single-touch state
        const dist = getTouchDistance(touches[0], touches[1])
        touchStateRef.current = {
          type: 'pinch',
          startPan: { ...panRef.current },
          startZoom: zoomRef.current,
          startTouches: [
            { id: touches[0].identifier, x: touches[0].clientX, y: touches[0].clientY },
            { id: touches[1].identifier, x: touches[1].clientX, y: touches[1].clientY },
          ],
          pinchDistance: dist,
          contentCenter: { ...contentCenterRef.current },
          touchNodeId: null,
        }
        // Clear any floating state from single-touch node drag
        if (floatingNodeIdRef.current) {
          setFloatingNodeId(null)
          setFloatingPos(null)
        }
        setDraggingCanvas(false)
        return
      }

      if (touches.length === 1) {
        const touch = touches[0]
        // Check if touch started on a node
        const nodeId = findNodeIdFromTarget(e.target)
        if (nodeId) {
          // Skip drag if touch started on an add button
          let el = e.target as Element | null
          while (el && el !== svgEl) {
            if (el.classList?.contains('mindmap-add-btn')) return
            el = el.parentElement
          }
          // Start node drag
          didDragRef.current = false
          const node = nodeMapRef.current[nodeId]
          if (node) {
            setFloatingNodeId(nodeId)
            setFloatingPos({ x: node.x, y: node.y })
            const svgRect = svgEl.getBoundingClientRect()
            const svgX = (touch.clientX - svgRect.left - panRef.current.x) / zoomRef.current
            const svgY = (touch.clientY - svgRect.top - panRef.current.y) / zoomRef.current
            grabOffsetRef.current = {
              x: node.x - svgX,
              y: node.y - svgY,
            }
            touchStateRef.current = {
              type: 'node-drag',
              startPan: { ...panRef.current },
              startZoom: zoomRef.current,
              startTouches: [{ id: touch.identifier, x: touch.clientX, y: touch.clientY }],
              pinchDistance: 0,
              contentCenter: { ...contentCenterRef.current },
              touchNodeId: nodeId,
            }
          }
        } else {
          // Start canvas pan
          didDragRef.current = false
          setDraggingCanvas(true)
          canvasDragStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            panX: panRef.current.x,
            panY: panRef.current.y,
          }
          touchStateRef.current = {
            type: 'canvas-pan',
            startPan: { ...panRef.current },
            startZoom: zoomRef.current,
            startTouches: [{ id: touch.identifier, x: touch.clientX, y: touch.clientY }],
            pinchDistance: 0,
            contentCenter: { ...contentCenterRef.current },
            touchNodeId: null,
          }
        }
      }
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault()
      const state = touchStateRef.current
      const touches = e.touches

      if (state.type === 'pinch' && touches.length >= 2) {
        const newDist = getTouchDistance(touches[0], touches[1])
        const ratio = newDist / state.pinchDistance
        const newZoom = Math.min(Math.max(state.startZoom * ratio, 0.1), 5)

        // Keep content centered
        const cx = svgEl.clientWidth / 2
        const cy = svgEl.clientHeight / 2
        const cc = state.contentCenter

        setZoom(newZoom)
        setPan({
          x: cx - cc.x * newZoom,
          y: cy - cc.y * newZoom,
        })
        return
      }

      if (state.type === 'canvas-pan' && touches.length === 1) {
        didDragRef.current = true
        const touch = touches[0]
        setPan({
          x: canvasDragStart.current.panX + (touch.clientX - canvasDragStart.current.x),
          y: canvasDragStart.current.panY + (touch.clientY - canvasDragStart.current.y),
        })
        return
      }

      if (state.type === 'node-drag' && touches.length === 1 && state.touchNodeId) {
        didDragRef.current = true
        const touch = touches[0]
        const svgRect = svgEl.getBoundingClientRect()
        const svgX = (touch.clientX - svgRect.left - panRef.current.x) / zoomRef.current
        const svgY = (touch.clientY - svgRect.top - panRef.current.y) / zoomRef.current
        const newPos = {
          x: svgX + grabOffsetRef.current.x,
          y: svgY + grabOffsetRef.current.y,
        }
        setFloatingPos(newPos)

        // Swap/cross-side detection
        const now = Date.now()
        if (now - lastSwapTimeRef.current > 500) {
          const draggedNode = nodeMapRef.current[state.touchNodeId]
          if (draggedNode && draggedNode.parentId) {
            // Cross-side detection
            if (draggedNode.depth === 1 && direction === 'both') {
              const currentSide = draggedNode.side
              const crossedToLeft = currentSide === 'right' && newPos.x < 0
              const crossedToRight = currentSide === 'left' && newPos.x > 0

              if (crossedToLeft || crossedToRight) {
                const targetSide = crossedToLeft ? 'left' : 'right'
                const rootId = draggedNode.parentId
                const root = mapData.find((r) => r.id === rootId)
                if (root) {
                  const si = splitIndices[rootId] ?? Math.ceil((root.children?.length ?? 0) / 2)
                  const result = moveChildToSide(root, state.touchNodeId, targetSide, si)
                  if (result) {
                    lastSwapTimeRef.current = now
                    setSplitIndices((prev) => ({ ...prev, [rootId]: result.newSplitIndex }))
                    updateData((prev) => prev.map((r) => (r.id === rootId ? result.data : r)))
                    return
                  }
                }
              }
            }

            // Sibling swap
            const siblings = nodes.filter(
              (n) =>
                n.parentId === draggedNode.parentId &&
                n.id !== state.touchNodeId &&
                n.side === draggedNode.side,
            )
            for (const sibling of siblings) {
              const threshold = Math.max(draggedNode.height, sibling.height) * 0.6
              if (Math.abs(newPos.y - sibling.y) < threshold) {
                lastSwapTimeRef.current = now
                updateData((prev) => swapSiblingsMulti(prev, state.touchNodeId!, sibling.id))
                break
              }
            }
          }
        }
        return
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault()
      const state = touchStateRef.current
      const touches = e.touches

      if (state.type === 'pinch' && touches.length === 1) {
        // Transition from pinch to single-finger canvas pan
        const touch = touches[0]
        canvasDragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        }
        setDraggingCanvas(true)
        touchStateRef.current = {
          ...state,
          type: 'canvas-pan',
          startTouches: [{ id: touch.identifier, x: touch.clientX, y: touch.clientY }],
        }
        return
      }

      if (touches.length === 0) {
        // All fingers lifted
        setDraggingCanvas(false)
        setFloatingNodeId(null)
        setFloatingPos(null)
        touchStateRef.current = {
          type: 'none',
          startPan: { x: 0, y: 0 },
          startZoom: 1,
          startTouches: [],
          pinchDistance: 0,
          contentCenter: { x: 0, y: 0 },
          touchNodeId: null,
        }
      }
    }

    svgEl.addEventListener('touchstart', handleTouchStart, { passive: false })
    svgEl.addEventListener('touchmove', handleTouchMove, { passive: false })
    svgEl.addEventListener('touchend', handleTouchEnd, { passive: false })
    svgEl.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      svgEl.removeEventListener('touchstart', handleTouchStart)
      svgEl.removeEventListener('touchmove', handleTouchMove)
      svgEl.removeEventListener('touchend', handleTouchEnd)
      svgEl.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [svgRef, setPan, setZoom, findNodeIdFromTarget, direction, mapData, splitIndices, setSplitIndices, updateData, nodes])

  return {
    draggingCanvas,
    floatingNodeId,
    floatingPos,
    floatingSubtreeIds,
    didDragRef,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeMouseDown,
  }
}
