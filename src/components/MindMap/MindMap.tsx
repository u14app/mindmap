import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import type {
  MindMapData,
  MindMapProps,
  MindMapRef,
  MindMapEvent,
  LayoutDirection,
  ThemeMode,
} from "./types";
import { layoutMultiRoot, computeEdgePath } from "./utils/layout";
import { buildExportSVG, buildExportSVGForPNG, exportToPNG } from "./utils/export";
import { parseMarkdownMultiRoot, parseMarkdownWithFrontMatter, toMarkdownMultiRoot } from "./utils/markdown";
import { resolveMessages, detectLocale } from "./utils/i18n";
import {
  generateId,
  normalizeData,
  addChildMulti,
  removeNodeMulti,
  findSubtreeMulti,
  regenerateIds,
  addChildToSide,
} from "./utils/tree-ops";
import { useTheme } from "./hooks/useTheme";
import { generateCSSVariables } from "./utils/theme";
import { usePanZoom } from "./hooks/usePanZoom";
import { useDrag } from "./hooks/useDrag";
import { useNodeEdit } from "./hooks/useNodeEdit";
import { useNewNodeAnimation } from "./hooks/useNewNodeAnimation";
import { MindMapNode } from "./components/MindMapNode";
import { MindMapControls } from "./components/MindMapControls";
import { MindMapContextMenu } from "./components/MindMapContextMenu";
import { runRenderOverlay } from "./plugins/runner";
import { MindMapAIInput } from "./components/MindMapAIInput";
import "./MindMap.css";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const MindMap = forwardRef<MindMapRef, MindMapProps>(function MindMap(
  {
    data,
    markdown,
    defaultDirection = "both",
    theme: themeProp = "auto",
    locale,
    messages: messageOverrides,
    readonly: readonlyProp = false,
    toolbar = true,
    ai,
    onDataChange,
    onEvent,
    plugins: pluginsProp,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const plugins = pluginsProp && pluginsProp.length > 0 ? pluginsProp : undefined;

  // --- Eagerly parse markdown on init to avoid first-frame flash ---
  const initParsed = useMemo(() => {
    if (data) return null; // data prop takes priority
    if (markdown === undefined) return null;
    if (plugins) {
      const result = parseMarkdownWithFrontMatter(markdown, plugins);
      const dir = result.frontMatter.direction as LayoutDirection | undefined;
      const thm = result.frontMatter.theme as ThemeMode | undefined;
      return {
        roots: result.roots,
        direction: (dir === 'left' || dir === 'right' || dir === 'both') ? dir : undefined,
        theme: (thm === 'light' || thm === 'dark' || thm === 'auto') ? thm : undefined,
      };
    }
    return { roots: parseMarkdownMultiRoot(markdown), direction: undefined, theme: undefined };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // --- Data state ---
  const [mapData, setMapData] = useState<MindMapData[]>(() => {
    if (data) return normalizeData(data);
    if (initParsed) return initParsed.roots;
    return [{ id: 'md-0', text: 'Root' }];
  });
  const [direction, setDirection] = useState<LayoutDirection>(() => initParsed?.direction ?? defaultDirection);
  const [splitIndices, setSplitIndices] = useState<Record<string, number>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const clipboardRef = useRef<MindMapData | null>(null);
  const [mode, setMode] = useState<'view' | 'text'>('view');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [remarkTooltip, setRemarkTooltip] = useState<{ nodeId: string; text: string; x: number; y: number } | null>(null);
  const [foldOverrides, setFoldOverrides] = useState<Record<string, boolean>>({});
  const [expandingFromId, setExpandingFromId] = useState<string | null>(null);
  const [fmTheme, setFmTheme] = useState<ThemeMode | undefined>(() => initParsed?.theme);

  // Sync external data / markdown
  useEffect(() => {
    if (data) setMapData(normalizeData(data));
  }, [data]);

  useEffect(() => {
    if (markdown !== undefined) {
      if (plugins) {
        const { roots, frontMatter } = parseMarkdownWithFrontMatter(markdown, plugins);
        setMapData(roots);
        // Apply frontmatter direction/theme if not explicitly set via props
        if (frontMatter.direction) {
          const dir = frontMatter.direction as LayoutDirection;
          if (dir === 'left' || dir === 'right' || dir === 'both') {
            setDirection(dir);
          }
        }
        if (frontMatter.theme) {
          const t = frontMatter.theme as ThemeMode;
          if (t === 'light' || t === 'dark' || t === 'auto') {
            setFmTheme(t);
          }
        }
      } else {
        setMapData(parseMarkdownMultiRoot(markdown));
      }
    }
  }, [markdown, plugins]);

  const updateData = useCallback(
    (updater: (prev: MindMapData[]) => MindMapData[]) => {
      setMapData((prev) => {
        const next = updater(prev);
        onDataChange?.(next);
        return next;
      });
    },
    [onDataChange],
  );

  // --- Event emission ---
  const emitRef = useRef(onEvent);
  emitRef.current = onEvent;
  const emit = useCallback((event: MindMapEvent) => {
    emitRef.current?.(event);
  }, []);

  // --- Theme ---
  const activeTheme = useTheme(fmTheme ?? themeProp);

  // --- i18n ---
  const t = useMemo(() => resolveMessages(locale ?? detectLocale(), messageOverrides), [locale, messageOverrides]);

  // --- Toolbar visibility ---
  const toolbarConfig = useMemo(() => {
    if (toolbar === false) return { zoom: false };
    if (toolbar === true || toolbar === undefined) return { zoom: true };
    return {
      zoom: toolbar.zoom ?? true,
    };
  }, [toolbar]);

  // --- Layout ---
  const { nodes, edges } = useMemo(
    () => layoutMultiRoot(mapData, direction, colorMap, splitIndices, plugins, readonlyProp, foldOverrides),
    [mapData, direction, colorMap, splitIndices, plugins, readonlyProp, foldOverrides],
  );

  // Persist colors for level-1 nodes (so they survive swaps)
  useEffect(() => {
    const updates: Record<string, string> = {};
    let hasNew = false;
    for (const node of nodes) {
      if (node.depth === 1 && !colorMap[node.id]) {
        updates[node.id] = node.color;
        hasNew = true;
      }
    }
    if (hasNew) {
      setColorMap((prev) => ({ ...prev, ...updates }));
    }
  }, [nodes, colorMap]);

  const nodeMap = useMemo(() => {
    const map: Record<string, (typeof nodes)[0]> = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  // --- Expand animation delays (BFS from expanded node) ---
  const expandDelays = useMemo(() => {
    if (!expandingFromId) return {};
    const delays: Record<string, number> = {};
    const queue: { id: string; depth: number }[] = [];
    // Find direct children of the expanding node
    for (const n of nodes) {
      if (n.parentId === expandingFromId) {
        queue.push({ id: n.id, depth: 1 });
      }
    }
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      delays[id] = depth * 100; // 100ms stagger per depth level
      for (const n of nodes) {
        if (n.parentId === id) {
          queue.push({ id: n.id, depth: depth + 1 });
        }
      }
    }
    return delays;
  }, [expandingFromId, nodes]);

  // --- Pan / Zoom ---
  const {
    pan, setPan, zoom, setZoom,
    animateTo, autoFit, zoomIn, zoomOut,
    contentCenter, panToNode,
  } = usePanZoom(svgRef, nodes);

  // --- Drag ---
  const {
    draggingCanvas,
    floatingNodeId,
    floatingPos,
    floatingSubtreeIds,
    didDragRef,
    handleCanvasMouseDown: startCanvasDrag,
    handleMouseMove,
    handleMouseUp,
    handleNodeMouseDown,
  } = useDrag({
    svgRef, zoom, pan, setPan, setZoom, nodeMap, nodes, updateData,
    direction, splitIndices, setSplitIndices, mapData, contentCenter,
  });

  // --- Node Edit ---
  const {
    editingId, editText, setEditText,
    pendingEditId, setPendingEditId,
    handleNodeDoubleClick, commitEdit, cancelEdit,
  } = useNodeEdit({ nodeMap, updateData, onTextChange: (nodeId, oldText, newText) => {
    emit({ type: 'nodeTextChange', nodeId, oldText, newText });
  } });

  // --- New Node Animation ---
  const newNodeIds = useNewNodeAnimation(nodes);

  // --- Initial entrance state ---
  const [initialReady, setInitialReady] = useState(false);

  // --- Auto-fit on data change (suppressed during drag and node creation) ---
  useEffect(() => {
    if (floatingNodeId) return;
    if (pendingEditId) return;
    const fit = autoFit();
    if (fit) {
      if (!initialReady) {
        // First fit: start slightly zoomed out, then animate in
        const entranceZoom = fit.zoom * 0.92;
        setZoom(entranceZoom);
        setPan({ x: fit.panX, y: fit.panY });
        requestAnimationFrame(() => {
          setInitialReady(true);
          animateTo(fit.zoom, fit.panX, fit.panY);
        });
      } else {
        setZoom(fit.zoom);
        setPan({ x: fit.panX, y: fit.panY });
      }
    } else if (!initialReady) {
      requestAnimationFrame(() => setInitialReady(true));
    }
  }, [nodes, autoFit, floatingNodeId, pendingEditId, setZoom, setPan, initialReady, animateTo]);

  // Pan to newly created node (keep zoom, only pan)
  useEffect(() => {
    if (pendingEditId && nodeMap[pendingEditId]) {
      panToNode(pendingEditId);
    }
  }, [pendingEditId, nodeMap, panToNode]);

  // --- Handlers ---

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setContextMenu(null);
      startCanvasDrag(e);
    },
    [startCanvasDrag],
  );

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (!didDragRef.current) {
        setSelectedNodeId(nodeId);
        emit({ type: 'nodeSelect', nodeId });
      }
    },
    [didDragRef, emit],
  );

  const handleCanvasClick = useCallback(() => {
    if (!didDragRef.current) {
      setSelectedNodeId(null);
      emit({ type: 'nodeSelect', nodeId: null });
    }
  }, [didDragRef, emit]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Remark tooltip handler
  const handleRemarkHover = useCallback((nodeId: string | null) => {
    if (!nodeId) {
      setRemarkTooltip(null);
      return;
    }
    const node = nodeMap[nodeId];
    if (!node || !node.remark) {
      setRemarkTooltip(null);
      return;
    }
    // Position tooltip near the node (in screen coordinates)
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const screenX = (node.x + node.width / 2) * zoom + pan.x;
    const screenY = (node.y - node.height / 2) * zoom + pan.y;
    setRemarkTooltip({
      nodeId,
      text: node.remark,
      x: Math.min(screenX, rect.width - 300),
      y: screenY - 8,
    });
  }, [nodeMap, zoom, pan]);

  // Add child (with optional side for root nodes)
  const handleAddChild = useCallback(
    (e: React.MouseEvent, parentId: string, side?: "left" | "right") => {
      e.stopPropagation();
      if (readonlyProp) return;
      const newId = generateId();
      const newChild: MindMapData = { id: newId, text: t.newNode };

      const isRoot = mapData.some((root) => root.id === parentId);
      if (isRoot && side && direction === "both") {
        updateData((prev) => {
          return prev.map((root) => {
            if (root.id !== parentId) return root;
            const children = root.children || [];
            const si =
              splitIndices[parentId] ?? Math.ceil(children.length / 2);
            const rightCount = si;
            const leftCount = children.length - si;

            let actualSide = side;
            if (side === "right" && rightCount >= 3 * Math.max(leftCount, 1)) {
              actualSide = "left";
            } else if (side === "left" && leftCount >= 3 * Math.max(rightCount, 1)) {
              actualSide = "right";
            }

            const result = addChildToSide(root, newChild, actualSide, si);
            setSplitIndices((prev) => ({
              ...prev,
              [parentId]: result.newSplitIndex,
            }));
            return result.data;
          });
        });
      } else {
        updateData((prev) => addChildMulti(prev, parentId, newChild));
      }

      emit({ type: 'nodeAdd', node: newChild, parentId });
      setPendingEditId(newId);
      setEditText("");
    },
    [updateData, mapData, direction, splitIndices, setPendingEditId, setEditText, t, readonlyProp, emit],
  );

  // Context menu: new root node
  const handleNewRootNode = useCallback(() => {
    if (readonlyProp) return;
    const newId = generateId();
    const newNode: MindMapData = { id: newId, text: t.newNode };
    updateData((prev) => [...prev, newNode]);
    emit({ type: 'nodeAdd', node: newNode, parentId: null });
    setPendingEditId(newId);
    setEditText("");
    closeContextMenu();
  }, [updateData, closeContextMenu, setPendingEditId, setEditText, t, readonlyProp, emit]);

  const handleExportSVG = useCallback(() => {
    const svg = buildExportSVG(
      nodes, edges, {}, activeTheme, plugins,
    );
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, "mindmap.svg");
    closeContextMenu();
  }, [nodes, edges, activeTheme, closeContextMenu, plugins]);

  const handleExportPNG = useCallback(async () => {
    const svg = buildExportSVGForPNG(
      nodes, edges, { pngSafe: true }, activeTheme, plugins,
    );
    const blob = await exportToPNG(svg);
    downloadBlob(blob, "mindmap.png");
    closeContextMenu();
  }, [nodes, edges, activeTheme, closeContextMenu, plugins]);

  const handleExportMarkdown = useCallback(() => {
    const md = toMarkdownMultiRoot(mapData, plugins);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, "mindmap.md");
    closeContextMenu();
  }, [mapData, closeContextMenu, plugins]);

  // Reset view
  const handleAutoFit = useCallback(() => {
    const fit = autoFit();
    if (fit) {
      animateTo(fit.zoom, fit.panX, fit.panY);
    }
  }, [autoFit, animateTo]);

  // Direction change
  const handleDirectionChange = useCallback((dir: LayoutDirection) => {
    setDirection(dir);
    setSplitIndices({});
    emit({ type: 'directionChange', direction: dir });
  }, [emit]);

  // Mode toggle
  const handleModeToggle = useCallback(() => {
    setMode((prev) => {
      if (prev === 'view') {
        // Entering text mode: serialize current data
        setTextContent(toMarkdownMultiRoot(mapData, plugins));
        emit({ type: 'modeChange', mode: 'text' });
        return 'text';
      } else {
        // Exiting text mode: parse text back to data
        const parsed = plugins
          ? parseMarkdownWithFrontMatter(textContent, plugins).roots
          : parseMarkdownMultiRoot(textContent);
        updateData(() => parsed);
        setSplitIndices({});
        emit({ type: 'modeChange', mode: 'view' });
        return 'view';
      }
    });
  }, [mapData, textContent, updateData, plugins, emit]);

  // Fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      emit({ type: 'fullscreenChange', fullscreen: fs });
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [emit]);

  // Emit zoom changes (skip initial render)
  const prevZoomRef = useRef(zoom);
  useEffect(() => {
    if (zoom !== prevZoomRef.current) {
      prevZoomRef.current = zoom;
      emit({ type: 'zoomChange', zoom });
    }
  }, [zoom, emit]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && contextMenu) {
        e.preventDefault();
        closeContextMenu();
        return;
      }

      if (editingId) return;
      const isMeta = e.metaKey || e.ctrlKey;

      // Shift shortcuts for zoom and layout
      if (e.shiftKey && !isMeta) {
        if (e.code === "Equal") {
          e.preventDefault();
          zoomIn();
          return;
        }
        if (e.code === "Minus") {
          e.preventDefault();
          zoomOut();
          return;
        }
        if (e.code === "Digit0") {
          e.preventDefault();
          handleAutoFit();
          return;
        }
        if (e.code === "KeyL") {
          e.preventDefault();
          handleDirectionChange("left");
          return;
        }
        if (e.code === "KeyR") {
          e.preventDefault();
          handleDirectionChange("right");
          return;
        }
        if (e.code === "KeyM") {
          e.preventDefault();
          handleDirectionChange("both");
          return;
        }
      }

      // Enter — create child node
      if (e.key === "Enter" && !isMeta && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        const newId = generateId();
        const newChild: MindMapData = { id: newId, text: t.newNode };

        const isRoot = mapData.some((root) => root.id === selectedNodeId);
        if (isRoot && direction === "both") {
          updateData((prev) => {
            return prev.map((root) => {
              if (root.id !== selectedNodeId) return root;
              const children = root.children || [];
              const si =
                splitIndices[selectedNodeId] ??
                Math.ceil(children.length / 2);
              const result = addChildToSide(root, newChild, "right", si);
              setSplitIndices((prev) => ({
                ...prev,
                [selectedNodeId]: result.newSplitIndex,
              }));
              return result.data;
            });
          });
        } else {
          updateData((prev) => addChildMulti(prev, selectedNodeId, newChild));
        }

        setPendingEditId(newId);
        setEditText("");
        emit({ type: 'nodeAdd', node: newChild, parentId: selectedNodeId });
        return;
      }

      // Delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        const isRoot = mapData.some((root) => root.id === selectedNodeId);
        if (isRoot && mapData.length <= 1) return;
        emit({ type: 'nodeDelete', nodeId: selectedNodeId });
        updateData((prev) => removeNodeMulti(prev, selectedNodeId));
        setSelectedNodeId(null);
        return;
      }

      // Copy
      if (isMeta && e.key === "c" && selectedNodeId) {
        e.preventDefault();
        clipboardRef.current = findSubtreeMulti(mapData, selectedNodeId);
        return;
      }

      // Cut
      if (isMeta && e.key === "x" && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        clipboardRef.current = findSubtreeMulti(mapData, selectedNodeId);
        const isRoot = mapData.some((root) => root.id === selectedNodeId);
        if (isRoot && mapData.length <= 1) return;
        emit({ type: 'nodeDelete', nodeId: selectedNodeId });
        updateData((prev) => removeNodeMulti(prev, selectedNodeId));
        setSelectedNodeId(null);
        return;
      }

      // Paste
      if (isMeta && e.key === "v" && selectedNodeId && clipboardRef.current && !readonlyProp) {
        e.preventDefault();
        const pastedSubtree = regenerateIds(clipboardRef.current);
        updateData((prev) => addChildMulti(prev, selectedNodeId, pastedSubtree));
        emit({ type: 'nodeAdd', node: pastedSubtree, parentId: selectedNodeId });
        return;
      }
    },
    [
      editingId, selectedNodeId, mapData, direction, splitIndices,
      updateData, contextMenu, closeContextMenu,
      setPendingEditId, setEditText, t,
      zoomIn, zoomOut, handleAutoFit, handleDirectionChange, readonlyProp, emit,
    ],
  );

  // --- Imperative Handle ---
  useImperativeHandle(
    ref,
    () => ({
      exportToSVG() {
        return buildExportSVG(
          nodes, edges, {}, activeTheme, plugins,
        );
      },
      async exportToPNG() {
        const svg = buildExportSVGForPNG(
          nodes, edges, {}, activeTheme, plugins,
        );
        return exportToPNG(svg);
      },
      exportToOutline() {
        return toMarkdownMultiRoot(mapData, plugins);
      },
      getData() {
        return mapData;
      },
      setData(d: MindMapData | MindMapData[]) {
        setMapData(normalizeData(d));
        setSplitIndices({});
      },
      setMarkdown(md: string) {
        if (plugins) {
          setMapData(parseMarkdownWithFrontMatter(md, plugins).roots);
        } else {
          setMapData(parseMarkdownMultiRoot(md));
        }
        setSplitIndices({});
      },
      fitView() {
        handleAutoFit();
      },
      setDirection(dir: LayoutDirection) {
        handleDirectionChange(dir);
      },
    }),
    [
      nodes, edges, mapData, plugins,
      handleAutoFit, handleDirectionChange, activeTheme,
    ],
  );

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => closeContextMenu();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu, closeContextMenu]);

  // --- AI generation callbacks ---
  const handleAIMarkdownStream = useCallback((md: string) => {
    if (plugins) {
      setMapData(parseMarkdownWithFrontMatter(md, plugins).roots);
    } else {
      setMapData(parseMarkdownMultiRoot(md));
    }
    setSplitIndices({});
  }, [plugins]);

  const handleAIComplete = useCallback(() => {
    setTimeout(() => handleAutoFit(), 100);
  }, [handleAutoFit]);

  const handleAIError = useCallback(() => {}, []);

  // --- Tab indent/dedent in text mode ---
  const handleTextKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const ta = e.currentTarget
    const { selectionStart, selectionEnd, value } = ta
    const indent = '  '

    if (e.shiftKey) {
      // Shift+Tab: dedent
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
      if (selectionStart === selectionEnd) {
        const lineText = value.slice(lineStart, selectionEnd)
        const match = lineText.match(/^ {1,2}/)
        if (!match) return
        const removed = match[0].length
        const newValue = value.slice(0, lineStart) + lineText.slice(removed) + value.slice(selectionEnd)
        setTextContent(newValue)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = Math.max(lineStart, selectionStart - removed)
        })
      } else {
        const block = value.slice(lineStart, selectionEnd)
        const lines = block.split('\n')
        let totalRemoved = 0
        let firstRemoved = 0
        const dedented = lines.map((line, i) => {
          const m = line.match(/^ {1,2}/)
          const r = m ? m[0].length : 0
          totalRemoved += r
          if (i === 0) firstRemoved = r
          return line.slice(r)
        }).join('\n')
        setTextContent(value.slice(0, lineStart) + dedented + value.slice(selectionEnd))
        requestAnimationFrame(() => {
          ta.selectionStart = selectionStart - firstRemoved
          ta.selectionEnd = selectionEnd - totalRemoved
        })
      }
    } else {
      // Tab: indent
      if (selectionStart === selectionEnd) {
        setTextContent(value.slice(0, selectionStart) + indent + value.slice(selectionEnd))
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + 2
        })
      } else {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
        const block = value.slice(lineStart, selectionEnd)
        const lines = block.split('\n')
        const indented = lines.map(line => indent + line).join('\n')
        setTextContent(value.slice(0, lineStart) + indented + value.slice(selectionEnd))
        requestAnimationFrame(() => {
          ta.selectionStart = selectionStart + 2
          ta.selectionEnd = selectionEnd + lines.length * 2
        })
      }
    }
  }, [])

  // --- Render ---
  return (
    <div ref={containerRef} className="mindmap-container" style={generateCSSVariables(activeTheme) as React.CSSProperties}>
      {mode === 'text' && (
        <textarea
          className="mindmap-text-editor"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          onKeyDown={handleTextKeyDown}
          readOnly={readonlyProp}
          style={readonlyProp ? { opacity: 0.7 } : undefined}
        />
      )}
      <svg
        ref={svgRef}
        className={`mindmap-svg ${draggingCanvas ? "dragging-canvas" : ""} ${floatingNodeId ? "dragging-node" : ""}`}
        style={mode === 'text' ? { display: 'none' } : undefined}
        tabIndex={0}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <g
          className={`mindmap-canvas${initialReady ? ' mindmap-canvas-ready' : ''}`}
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          opacity={initialReady ? 1 : 0}
        >
          {/* Edges */}
          <g className="mindmap-edges">
            {/* Arrow marker for cross-links */}
            {edges.some(e => e.isCrossLink) && (
              <defs>
                <marker id="mindmap-arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="none" stroke="currentColor" strokeWidth={1.5} />
                </marker>
              </defs>
            )}
            {edges.map((edge) => {
              const edgeExpandDelay = expandDelays[edge.toId];
              const isExpandingEdge = edgeExpandDelay !== undefined;
              return (
              <g key={edge.key}>
                <path
                  d={edge.path}
                  stroke={edge.color}
                  strokeWidth={activeTheme.connection.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={isExpandingEdge ? undefined : edge.strokeDasharray}
                  markerEnd={edge.isCrossLink ? 'url(#mindmap-arrowhead)' : undefined}
                  opacity={edge.isCrossLink ? 0.7 : 1}
                  fill="none"
                  data-branch-index={nodeMap[edge.toId]?.branchIndex}
                  className={[
                    "mindmap-edge",
                    edge.isCrossLink ? "mindmap-edge-cross-link" : "",
                    isExpandingEdge
                      ? "mindmap-edge-expanding"
                      : draggingCanvas ||
                        floatingSubtreeIds.has(edge.fromId) ||
                        floatingSubtreeIds.has(edge.toId)
                        ? ""
                        : "mindmap-edge-animated",
                  ].filter(Boolean).join(" ")}
                  style={isExpandingEdge ? { animationDelay: `${edgeExpandDelay}ms` } : undefined}
                />
                {/* Edge label */}
                {edge.label && (() => {
                  const fromNode = nodeMap[edge.fromId];
                  const toNode = nodeMap[edge.toId];
                  if (!fromNode || !toNode) return null;
                  const mx = (fromNode.x + toNode.x) / 2;
                  const my = (fromNode.y + toNode.y) / 2;
                  return (
                    <text
                      className="mindmap-edge-label"
                      x={mx} y={my - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fill={edge.color}
                      opacity={0.8}
                      fontFamily={activeTheme.node.fontFamily}
                    >
                      {edge.label}
                    </text>
                  );
                })()}
              </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="mindmap-nodes">
            {nodes.map((node) => {
              const isInFloatingSubtree = floatingSubtreeIds.has(node.id);
              const animClass =
                isInFloatingSubtree || draggingCanvas
                  ? ""
                  : "mindmap-node-animated";

              return (
                <MindMapNode
                  key={node.id}
                  node={node}
                  isEditing={editingId === node.id}
                  isPendingEdit={pendingEditId === node.id}
                  isSelected={selectedNodeId === node.id}
                  isNew={newNodeIds.has(node.id)}
                  isGhost={isInFloatingSubtree}
                  animClass={animClass}
                  editText={editText}
                  theme={activeTheme}
                  direction={direction}
                  onMouseDown={handleNodeMouseDown}
                  onClick={handleNodeClick}
                  onDoubleClick={readonlyProp ? () => {} : handleNodeDoubleClick}
                  onEditChange={setEditText}
                  onEditCommit={commitEdit}
                  onEditCancel={cancelEdit}
                  onAddChild={handleAddChild}
                  onRemarkHover={handleRemarkHover}
                  onFoldToggle={plugins ? (nodeId) => {
                    const isExpanding = !foldOverrides[nodeId];
                    if (isExpanding) {
                      setExpandingFromId(nodeId);
                      setTimeout(() => setExpandingFromId(null), 800);
                    }
                    setFoldOverrides(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
                  } : undefined}
                  expandDelay={expandDelays[node.id]}
                  readonly={readonlyProp}
                  plugins={plugins}
                />
              );
            })}
          </g>

          {/* Floating copy of dragged subtree */}
          {floatingNodeId && floatingPos && (() => {
            const rootNode = nodeMap[floatingNodeId];
            if (!rootNode) return null;
            const dx = floatingPos.x - rootNode.x;
            const dy = floatingPos.y - rootNode.y;
            // Compute edge from parent to floating root (rendered outside translated group)
            const parentNode = rootNode.parentId ? nodeMap[rootNode.parentId] : null;
            return (
              <>
                {/* Edge from parent to floating dragged node */}
                {parentNode && (
                  <path
                    className="mindmap-floating-edge"
                    d={computeEdgePath(
                      parentNode.x, parentNode.y, parentNode.width,
                      floatingPos.x, floatingPos.y, rootNode.width,
                      rootNode.side,
                    )}
                    stroke={rootNode.color}
                    strokeWidth={activeTheme.connection.strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
                <g className="mindmap-floating" transform={`translate(${dx}, ${dy})`}>
                {/* Floating edges within subtree */}
                {edges
                  .filter((e) => floatingSubtreeIds.has(e.fromId) && floatingSubtreeIds.has(e.toId))
                  .map((edge) => (
                    <path
                      className="mindmap-floating-edge"
                      key={`fl-${edge.key}`}
                      d={edge.path}
                      stroke={edge.color}
                      strokeWidth={activeTheme.connection.strokeWidth}
                      strokeLinecap="round"
                      fill="none"
                    />
                  ))}
                {/* Floating nodes */}
                {nodes
                  .filter((n) => floatingSubtreeIds.has(n.id))
                  .map((node) => (
                    <MindMapNode
                      key={`fl-${node.id}`}
                      node={node}
                      isEditing={false}
                      isPendingEdit={false}
                      isSelected={false}
                      isNew={false}
                      animClass=""
                      editText=""
                      theme={activeTheme}
                      direction={direction}
                      onMouseDown={() => {}}
                      onClick={() => {}}
                      onDoubleClick={() => {}}
                      onEditChange={() => {}}
                      onEditCommit={() => {}}
                      onEditCancel={() => {}}
                      onAddChild={() => {}}
                      readonly
                    />
                  ))}
              </g>
              </>
            );
          })()}

          {/* Plugin overlay layer (cross-link arrows, etc.) */}
          {plugins && runRenderOverlay(plugins, nodes, edges, activeTheme).map((el, i) => (
            <g className="mindmap-plugin-overlay" key={`plugin-overlay-${i}`}>{el}</g>
          ))}
        </g>
      </svg>

      <MindMapControls
        zoom={zoom}
        theme={activeTheme}
        messages={t}
        showZoom={toolbarConfig.zoom}
        mode={mode}
        isFullscreen={isFullscreen}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onAutoFit={handleAutoFit}
        onModeToggle={handleModeToggle}
        onFullscreenToggle={handleFullscreenToggle}
      />

      {ai && (
        <MindMapAIInput
          config={ai}
          theme={activeTheme}
          messages={t}
          currentMarkdown={toMarkdownMultiRoot(mapData, plugins)}
          onMarkdownStream={handleAIMarkdownStream}
          onComplete={handleAIComplete}
          onError={handleAIError}
        />
      )}

      {contextMenu && (
        <MindMapContextMenu
          position={contextMenu}
          theme={activeTheme}
          messages={t}
          direction={direction}
          readonly={readonlyProp}
          onNewRootNode={handleNewRootNode}
          onExportSVG={handleExportSVG}
          onExportPNG={handleExportPNG}
          onExportMarkdown={handleExportMarkdown}
          onDirectionChange={handleDirectionChange}
          onClose={closeContextMenu}
        />
      )}

      {remarkTooltip && (
        <div
          className="mindmap-remark-tooltip"
          style={{
            left: remarkTooltip.x,
            top: remarkTooltip.y,
            transform: 'translateY(-100%)',
          }}
        >
          {remarkTooltip.text}
        </div>
      )}

    </div>
  );
});
