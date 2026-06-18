import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  lazy,
  Suspense,
} from "react";
import type {
  MindMapData,
  MindMapProps,
  MindMapRef,
  MindMapEvent,
  LayoutDirection,
  ThemeMode,
} from "./types";
import { computeEdgePath } from "./utils/layout";
import { buildExportSVG, buildExportSVGForPNG, exportToPNG } from "./utils/export";
import { toMarkdownMultiRoot } from "./utils/markdown";
import { parseInitialMindMapInput, parseMindMapMarkdownInput } from "./utils/input";
import type { ParsedMindMapInput } from "./utils/input";
import { resolveMessages, detectLocale } from "./utils/i18n";
import {
  generateId,
  normalizeData,
  addChildMulti,
  addSiblingMulti,
  removeNodeMulti,
  findSubtreeMulti,
  regenerateIds,
  addChildToSide,
} from "./utils/tree-ops";
import type { MindMapHistorySnapshot } from "./utils/history";
import {
  cloneHistorySnapshot,
  pushHistorySnapshot,
} from "./utils/history";
import { useTheme } from "./hooks/useTheme";
import { generateCSSVariables } from "./utils/theme";
import { useMindMapView } from "./hooks/useMindMapView";
import { useDrag } from "./hooks/useDrag";
import { useNodeEdit } from "./hooks/useNodeEdit";
import { MindMapNode } from "./components/MindMapNode";
import type { LatexRenderer } from "./components/MindMapNode";
import { MindMapCanvas } from "./components/MindMapCanvas";
import { MindMapControls } from "./components/MindMapControls";
import type { MindMapImportOptions } from "./utils/import";
import "./MindMap.css";

// Edit-mode-only UI is code-split: each chunk loads on first use so consumers
// that never open the context menu / import dialog / AI input don't pay for it.
const MindMapContextMenu = lazy(() =>
  import("./components/MindMapContextMenu").then((m) => ({
    default: m.MindMapContextMenu,
  })),
);
const MindMapImportDialog = lazy(() =>
  import("./components/MindMapImportDialog").then((m) => ({
    default: m.MindMapImportDialog,
  })),
);
const MindMapAIInput = lazy(() =>
  import("./components/MindMapAIInput").then((m) => ({
    default: m.MindMapAIInput,
  })),
);

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
    selectedNodeId: selectedNodeIdProp,
    onSelectedNodeChange,
    searchQuery: searchQueryProp,
    activeTags: activeTagsProp,
    onSearchChange,
    onActiveTagsChange,
    onDataChange,
    onEvent,
    plugins: pluginsProp,
    textEditor,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const plugins = pluginsProp && pluginsProp.length > 0 ? pluginsProp : undefined;

  // --- Eagerly parse markdown on init to avoid first-frame flash ---
  const [initParsed] = useState(() =>
    parseInitialMindMapInput(data, markdown, plugins),
  );

  // --- Data state ---
  const [mapData, setMapData] = useState<MindMapData[]>(() => {
    if (data) return normalizeData(data);
    if (initParsed) return initParsed.roots;
    return [{ id: 'md-0', text: 'Root' }];
  });
  const [direction, setDirection] = useState<LayoutDirection>(() => initParsed?.direction ?? defaultDirection);
  const [splitIndices, setSplitIndices] = useState<Record<string, number>>({});
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);
  const selectedNodeId = selectedNodeIdProp !== undefined ? selectedNodeIdProp : internalSelectedNodeId;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string | null;
    canPaste?: boolean;
  } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const clipboardRef = useRef<MindMapData | null>(null);
  const [mode, setMode] = useState<'view' | 'text'>('view');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [foldOverrides, setFoldOverrides] = useState<Record<string, boolean>>({});
  const [fmTheme, setFmTheme] = useState<ThemeMode | undefined>(() => initParsed?.theme);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalActiveTags, setInternalActiveTags] = useState<string[]>([]);
  const searchQuery = searchQueryProp !== undefined ? searchQueryProp : internalSearchQuery;
  const activeTags = activeTagsProp !== undefined ? activeTagsProp : internalActiveTags;
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const historyPastRef = useRef<MindMapHistorySnapshot[]>([]);
  const historyFutureRef = useRef<MindMapHistorySnapshot[]>([]);
  const [historyAvailability, setHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });

  // --- Event emission ---
  const emit = useCallback((event: MindMapEvent) => {
    onEvent?.(event);
  }, [onEvent]);

  const mapDataRef = useRef(mapData);
  const directionRef = useRef(direction);
  const splitIndicesRef = useRef(splitIndices);
  const foldOverridesRef = useRef(foldOverrides);
  const selectedNodeIdRef = useRef(selectedNodeId);
  useEffect(() => {
    mapDataRef.current = mapData;
    directionRef.current = direction;
    splitIndicesRef.current = splitIndices;
    foldOverridesRef.current = foldOverrides;
    selectedNodeIdRef.current = selectedNodeId;
  }, [mapData, direction, splitIndices, foldOverrides, selectedNodeId]);

  const canUndo = historyAvailability.canUndo;
  const canRedo = historyAvailability.canRedo;

  const emitHistoryChange = useCallback(() => {
    const next = {
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    };
    setHistoryAvailability(next);
    emit({ type: 'historyChange', ...next });
  }, [emit]);

  const makeHistorySnapshot = useCallback((): MindMapHistorySnapshot => ({
    mapData: mapDataRef.current,
    direction: directionRef.current,
    splitIndices: splitIndicesRef.current,
    foldOverrides: foldOverridesRef.current,
    selectedNodeId: selectedNodeIdRef.current,
  }), []);

  const applyParsedViewOptions = useCallback((
    parsed: Pick<ParsedMindMapInput, 'direction' | 'theme'>,
    resetSplits = false,
  ) => {
    if (parsed.direction) {
      setDirection(parsed.direction);
      directionRef.current = parsed.direction;
      if (resetSplits) {
        setSplitIndices({});
        splitIndicesRef.current = {};
      }
    }
    if (parsed.theme) {
      setFmTheme(parsed.theme);
    }
  }, []);

  const pushCurrentHistory = useCallback(() => {
    historyPastRef.current = pushHistorySnapshot(
      historyPastRef.current,
      makeHistorySnapshot(),
    );
    historyFutureRef.current = [];
    emitHistoryChange();
  }, [emitHistoryChange, makeHistorySnapshot]);

  const setSelectedNodeIdControlled = useCallback((nodeId: string | null) => {
    if (selectedNodeIdProp === undefined) {
      setInternalSelectedNodeId(nodeId);
    }
    selectedNodeIdRef.current = nodeId;
    onSelectedNodeChange?.(nodeId);
  }, [onSelectedNodeChange, selectedNodeIdProp]);

  const setSearchQueryControlled = useCallback((query: string) => {
    if (searchQueryProp === undefined) {
      setInternalSearchQuery(query);
    }
    onSearchChange?.(query);
  }, [onSearchChange, searchQueryProp]);

  const setActiveTagsControlled = useCallback((tags: string[]) => {
    if (activeTagsProp === undefined) {
      setInternalActiveTags(tags);
    }
    onActiveTagsChange?.(tags);
  }, [activeTagsProp, onActiveTagsChange]);

  const replaceMapData = useCallback((
    nextData: MindMapData[],
    viewOptions?: Pick<ParsedMindMapInput, 'direction' | 'theme'>,
  ) => {
    setMapData(nextData);
    mapDataRef.current = nextData;
    setSplitIndices({});
    splitIndicesRef.current = {};
    setFoldOverrides({});
    foldOverridesRef.current = {};
    setSelectedNodeIdControlled(null);
    if (viewOptions) {
      applyParsedViewOptions(viewOptions);
    }
    onDataChange?.(nextData);
  }, [applyParsedViewOptions, onDataChange, setSelectedNodeIdControlled]);

  // Sync external data / markdown
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled data prop must replace the editable internal tree
    if (data) setMapData(normalizeData(data));
  }, [data]);

  useEffect(() => {
    if (markdown !== undefined) {
      const parsed = parseMindMapMarkdownInput(markdown, plugins);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled markdown prop must replace the editable internal tree
      setMapData(parsed.roots);
      applyParsedViewOptions(parsed, true);
    }
  }, [applyParsedViewOptions, markdown, plugins]);

  const updateData = useCallback(
    (updater: (prev: MindMapData[]) => MindMapData[], recordHistory = true) => {
      if (recordHistory) pushCurrentHistory();
      setMapData((prev) => {
        const next = updater(prev);
        mapDataRef.current = next;
        onDataChange?.(next);
        return next;
      });
    },
    [onDataChange, pushCurrentHistory],
  );

  // --- LaTeX renderer (loaded on demand only when the latex plugin is used) ---
  const [latexRenderer, setLatexRenderer] = useState<LatexRenderer | undefined>(undefined);
  useEffect(() => {
    if (!plugins?.some((p) => p.name === "latex")) return;
    let cancelled = false;
    import("./plugins/latex").then((m) => {
      if (cancelled) return;
      m.initKatex(); // begin loading KaTeX now that the plugin is in use
      setLatexRenderer({
        getKatexSync: m.getKatexSync,
        onKatexReady: m.onKatexReady,
        renderLatexToHtml: m.renderLatexToHtml,
        loadKatexStyle: m.loadKatexStyle,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [plugins]);

  // --- Theme ---
  const activeTheme = useTheme(fmTheme ?? themeProp);

  // --- i18n ---
  const t = useMemo(() => resolveMessages(locale ?? detectLocale(), messageOverrides), [locale, messageOverrides]);

  // --- Toolbar visibility ---
  const toolbarConfig = useMemo(() => {
    if (toolbar === false) return { zoom: false, history: false, search: false, tags: false };
    if (toolbar === true || toolbar === undefined) {
      return { zoom: true, history: true, search: true, tags: true };
    }
    return {
      zoom: toolbar.zoom ?? true,
      history: toolbar.history ?? true,
      search: toolbar.search ?? true,
      tags: toolbar.tags ?? true,
    };
  }, [toolbar]);

  // --- Shared view layer (layout, pan/zoom, search, expand animation, remark) ---
  const {
    nodes, edges, nodeMap, searchState, expandDelays,
    pan, setPan, zoom, setZoom,
    animateTo, autoFit, zoomIn, zoomOut,
    contentCenter, panToNode,
    newNodeIds, remarkTooltip, handleRemarkHover,
    handleAutoFit, triggerExpandAnimation,
  } = useMindMapView({
    svgRef, mapData, direction, colorMap, setColorMap, foldOverrides,
    splitIndices, plugins, readonly: readonlyProp, searchQuery, activeTags,
    onZoomChange: (z) => emit({ type: 'zoomChange', zoom: z }),
  });

  const activeSearchIndexForMatches = useMemo(() => {
    const total = searchState.matchIds.length;
    if (total === 0) return -1;
    return activeSearchIndex < 0 || activeSearchIndex >= total
      ? 0
      : activeSearchIndex;
  }, [activeSearchIndex, searchState.matchIds.length]);

  useEffect(() => {
    emit({
      type: 'searchChange',
      query: searchQuery,
      matchCount: searchState.matchIds.length,
    });
  }, [emit, searchQuery, searchState.matchIds.length]);

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
    handleNodeDoubleClick, beginEdit, commitEdit, cancelEdit,
  } = useNodeEdit({ nodeMap, updateData, onTextChange: (nodeId, oldText, newText) => {
    emit({ type: 'nodeTextChange', nodeId, oldText, newText });
  } });

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
        setSelectedNodeIdControlled(nodeId);
        emit({ type: 'nodeSelect', nodeId });
      }
    },
    [didDragRef, emit, setSelectedNodeIdControlled],
  );

  const handleCanvasClick = useCallback(() => {
    if (!didDragRef.current) {
      setSelectedNodeIdControlled(null);
      emit({ type: 'nodeSelect', nodeId: null });
    }
  }, [didDragRef, emit, setSelectedNodeIdControlled]);

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

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setSelectedNodeIdControlled(nodeId);
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        nodeId,
        canPaste: !!clipboardRef.current,
      });
    },
    [setSelectedNodeIdControlled],
  );

  // --- Reusable node operations (shared by keyboard shortcuts + context menu) ---
  const handleCopyNode = useCallback((nodeId: string) => {
    clipboardRef.current = findSubtreeMulti(mapData, nodeId);
  }, [mapData]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (readonlyProp) return;
    const isRoot = mapData.some((root) => root.id === nodeId);
    if (isRoot && mapData.length <= 1) return;
    emit({ type: 'nodeDelete', nodeId });
    updateData((prev) => removeNodeMulti(prev, nodeId));
    setSelectedNodeIdControlled(null);
  }, [mapData, readonlyProp, emit, updateData, setSelectedNodeIdControlled]);

  const handleCutNode = useCallback((nodeId: string) => {
    if (readonlyProp) return;
    clipboardRef.current = findSubtreeMulti(mapData, nodeId);
    handleDeleteNode(nodeId);
  }, [mapData, readonlyProp, handleDeleteNode]);

  const handlePasteNode = useCallback((nodeId: string) => {
    if (readonlyProp || !clipboardRef.current) return;
    const pastedSubtree = regenerateIds(clipboardRef.current);
    updateData((prev) => addChildMulti(prev, nodeId, pastedSubtree));
    emit({ type: 'nodeAdd', node: pastedSubtree, parentId: nodeId });
  }, [readonlyProp, updateData, emit]);

  const handleEditNode = useCallback((nodeId: string) => {
    if (readonlyProp) return;
    beginEdit(nodeId);
  }, [readonlyProp, beginEdit]);

  // Create a child under the given node (keyboard Tab + Enter-on-new flows).
  const handleCreateChild = useCallback((parentId: string) => {
    if (readonlyProp) return;
    const newId = generateId();
    const newChild: MindMapData = { id: newId, text: t.newNode };
    const isRoot = mapData.some((root) => root.id === parentId);
    if (isRoot && direction === "both") {
      updateData((prev) =>
        prev.map((root) => {
          if (root.id !== parentId) return root;
          const children = root.children || [];
          const si = splitIndices[parentId] ?? Math.ceil(children.length / 2);
          const result = addChildToSide(root, newChild, "right", si);
          setSplitIndices((prevSplit) => ({ ...prevSplit, [parentId]: result.newSplitIndex }));
          return result.data;
        }),
      );
    } else {
      updateData((prev) => addChildMulti(prev, parentId, newChild));
    }
    setPendingEditId(newId);
    setEditText("");
    emit({ type: 'nodeAdd', node: newChild, parentId });
  }, [readonlyProp, mapData, direction, splitIndices, updateData, setPendingEditId, setEditText, t, emit]);

  // Create a sibling after the given node (keyboard Shift+Enter).
  const handleCreateSibling = useCallback((targetId: string) => {
    if (readonlyProp) return;
    const newId = generateId();
    const newNode: MindMapData = { id: newId, text: t.newNode };
    updateData((prev) => addSiblingMulti(prev, targetId, newNode));
    setPendingEditId(newId);
    setEditText("");
    emit({ type: 'nodeAdd', node: newNode, parentId: nodeMap[targetId]?.parentId ?? null });
  }, [readonlyProp, updateData, setPendingEditId, setEditText, t, emit, nodeMap]);

  // Move selection to the spatially-nearest node in a direction (arrow keys).
  const selectInDirection = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const currentId = selectedNodeIdRef.current;
    if (!currentId) {
      if (nodes.length > 0) {
        setSelectedNodeIdControlled(nodes[0].id);
        emit({ type: 'nodeSelect', nodeId: nodes[0].id });
      }
      return;
    }
    const current = nodeMap[currentId];
    if (!current) return;
    let best: (typeof nodes)[number] | null = null;
    let bestScore = Infinity;
    for (const n of nodes) {
      if (n.id === currentId) continue;
      const dx = n.x - current.x;
      const dy = n.y - current.y;
      let primary: number;
      let secondary: number;
      if (dir === 'right') { if (dx <= 0) continue; primary = dx; secondary = Math.abs(dy); }
      else if (dir === 'left') { if (dx >= 0) continue; primary = -dx; secondary = Math.abs(dy); }
      else if (dir === 'down') { if (dy <= 0) continue; primary = dy; secondary = Math.abs(dx); }
      else { if (dy >= 0) continue; primary = -dy; secondary = Math.abs(dx); }
      // Keep movement within a ~45° cone of the requested axis.
      if (secondary > primary) continue;
      const score = primary + secondary * 2;
      if (score < bestScore) { bestScore = score; best = n; }
    }
    if (best) {
      setSelectedNodeIdControlled(best.id);
      emit({ type: 'nodeSelect', nodeId: best.id });
    }
  }, [nodes, nodeMap, setSelectedNodeIdControlled, emit]);

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

  const handleOpenImport = useCallback(() => {
    if (readonlyProp) return;
    closeContextMenu();
    setImportDialogOpen(true);
  }, [closeContextMenu, readonlyProp]);

  const applyHistorySnapshot = useCallback((snapshot: MindMapHistorySnapshot) => {
    const cloned = cloneHistorySnapshot(snapshot);
    setMapData(cloned.mapData);
    mapDataRef.current = cloned.mapData;
    setDirection(cloned.direction);
    directionRef.current = cloned.direction;
    setSplitIndices(cloned.splitIndices);
    splitIndicesRef.current = cloned.splitIndices;
    setFoldOverrides(cloned.foldOverrides);
    foldOverridesRef.current = cloned.foldOverrides;
    setSelectedNodeIdControlled(cloned.selectedNodeId);
    onDataChange?.(cloned.mapData);
  }, [onDataChange, setSelectedNodeIdControlled]);

  const handleImportData = useCallback((
    nextData: MindMapData[],
    source: 'markdown' | 'json',
    options?: MindMapImportOptions,
  ) => {
    pushCurrentHistory();
    replaceMapData(nextData, options);
    emit({ type: 'import', source, data: nextData });
    setImportDialogOpen(false);
    setTimeout(() => {
      const fit = autoFit();
      if (fit) animateTo(fit.zoom, fit.panX, fit.panY);
    }, 50);
  }, [
    animateTo,
    autoFit,
    emit,
    pushCurrentHistory,
    replaceMapData,
  ]);

  const handleUndo = useCallback(() => {
    const previous = historyPastRef.current.pop();
    if (!previous) return;
    historyFutureRef.current = pushHistorySnapshot(
      historyFutureRef.current,
      makeHistorySnapshot(),
    );
    applyHistorySnapshot(previous);
    emit({
      type: 'undo',
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    });
    emitHistoryChange();
  }, [applyHistorySnapshot, emit, emitHistoryChange, makeHistorySnapshot]);

  const handleRedo = useCallback(() => {
    const next = historyFutureRef.current.pop();
    if (!next) return;
    historyPastRef.current = pushHistorySnapshot(
      historyPastRef.current,
      makeHistorySnapshot(),
    );
    applyHistorySnapshot(next);
    emit({
      type: 'redo',
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    });
    emitHistoryChange();
  }, [applyHistorySnapshot, emit, emitHistoryChange, makeHistorySnapshot]);

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

  // Direction change
  const handleDirectionChange = useCallback((dir: LayoutDirection) => {
    pushCurrentHistory();
    setDirection(dir);
    directionRef.current = dir;
    setSplitIndices({});
    splitIndicesRef.current = {};
    emit({ type: 'directionChange', direction: dir });
  }, [emit, pushCurrentHistory]);

  const handleFocusNode = useCallback((nodeId: string) => {
    if (!nodeMap[nodeId]) return;
    setSelectedNodeIdControlled(nodeId);
    panToNode(nodeId);
    emit({ type: 'nodeFocus', nodeId });
  }, [emit, nodeMap, panToNode, setSelectedNodeIdControlled]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQueryControlled(query);
    setActiveSearchIndex(query.trim() ? 0 : -1);
  }, [setSearchQueryControlled]);

  const handleSearchStep = useCallback((delta: number) => {
    const total = searchState.matchIds.length;
    if (total === 0) return;
    const baseIndex = activeSearchIndexForMatches < 0 ? 0 : activeSearchIndexForMatches;
    const nextIndex = (baseIndex + delta + total) % total;
    setActiveSearchIndex(nextIndex);
    const nodeId = searchState.matchIds[nextIndex];
    if (nodeId) handleFocusNode(nodeId);
  }, [activeSearchIndexForMatches, handleFocusNode, searchState.matchIds]);

  const handleTagToggle = useCallback((tag: string) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];
    setActiveTagsControlled(next);
    emit({ type: 'tagFilterChange', tags: next });
  }, [activeTags, emit, setActiveTagsControlled]);

  const handleClearTags = useCallback(() => {
    setActiveTagsControlled([]);
    emit({ type: 'tagFilterChange', tags: [] });
  }, [emit, setActiveTagsControlled]);

  const handleFoldToggle = useCallback((nodeId: string) => {
    pushCurrentHistory();
    const isExpanding = !foldOverridesRef.current[nodeId];
    if (isExpanding) {
      triggerExpandAnimation(nodeId);
      emit({ type: 'nodeExpand', nodeId });
    } else {
      emit({ type: 'nodeCollapse', nodeId });
    }
    setFoldOverrides((prev) => {
      const next = { ...prev, [nodeId]: !prev[nodeId] };
      foldOverridesRef.current = next;
      return next;
    });
  }, [emit, pushCurrentHistory, triggerExpandAnimation]);

  const handleExpandNode = useCallback((nodeId: string) => {
    pushCurrentHistory();
    setFoldOverrides((prev) => {
      const next = { ...prev, [nodeId]: true };
      foldOverridesRef.current = next;
      return next;
    });
    triggerExpandAnimation(nodeId);
    emit({ type: 'nodeExpand', nodeId });
  }, [emit, pushCurrentHistory, triggerExpandAnimation]);

  const handleCollapseNode = useCallback((nodeId: string) => {
    pushCurrentHistory();
    setFoldOverrides((prev) => {
      const next = { ...prev, [nodeId]: false };
      foldOverridesRef.current = next;
      return next;
    });
    emit({ type: 'nodeCollapse', nodeId });
  }, [emit, pushCurrentHistory]);

  // Mode toggle
  const handleModeToggle = useCallback(() => {
    if (!textEditor) return;
    setMode((prev) => {
      if (prev === 'view') {
        // Entering text mode: serialize current data
        setTextContent(toMarkdownMultiRoot(mapData, plugins));
        emit({ type: 'modeChange', mode: 'text' });
        return 'text';
      } else {
        // Exiting text mode: parse text back to data
        const parsed = parseMindMapMarkdownInput(textContent, plugins);
        updateData(() => parsed.roots);
        setSplitIndices({});
        splitIndicesRef.current = {};
        applyParsedViewOptions(parsed);
        emit({ type: 'modeChange', mode: 'view' });
        return 'view';
      }
    });
  }, [textEditor, mapData, textContent, updateData, plugins, applyParsedViewOptions, emit]);

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

      if (isMeta && e.key.toLowerCase() === 'z' && !readonlyProp) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

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

      // Arrow keys — move selection to the nearest node in that direction
      if (
        !e.shiftKey &&
        (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        e.preventDefault();
        selectInDirection(
          e.key === "ArrowUp" ? "up"
            : e.key === "ArrowDown" ? "down"
              : e.key === "ArrowLeft" ? "left"
                : "right",
        );
        return;
      }

      // F2 — edit selected node
      if (e.key === "F2" && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        handleEditNode(selectedNodeId);
        return;
      }

      // Tab — create child node under the selected node
      if (e.key === "Tab" && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        handleCreateChild(selectedNodeId);
        return;
      }

      // Shift + Enter — create a sibling after the selected node
      if (e.key === "Enter" && e.shiftKey && !isMeta && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        handleCreateSibling(selectedNodeId);
        return;
      }

      // Enter — edit the selected node
      if (e.key === "Enter" && !e.shiftKey && !isMeta && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        handleEditNode(selectedNodeId);
        return;
      }

      // Delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
        return;
      }

      // Copy
      if (isMeta && e.key === "c" && selectedNodeId) {
        e.preventDefault();
        handleCopyNode(selectedNodeId);
        return;
      }

      // Cut
      if (isMeta && e.key === "x" && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        handleCutNode(selectedNodeId);
        return;
      }

      // Paste
      if (isMeta && e.key === "v" && selectedNodeId && clipboardRef.current && !readonlyProp) {
        e.preventDefault();
        handlePasteNode(selectedNodeId);
        return;
      }
    },
    [
      editingId, selectedNodeId, contextMenu, closeContextMenu, readonlyProp,
      zoomIn, zoomOut, handleAutoFit, handleDirectionChange,
      handleUndo, handleRedo,
      selectInDirection, handleEditNode, handleCreateChild, handleCreateSibling,
      handleDeleteNode, handleCopyNode, handleCutNode, handlePasteNode,
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
      getMarkdown() {
        return toMarkdownMultiRoot(mapData, plugins);
      },
      getData() {
        return mapData;
      },
      setData(d: MindMapData | MindMapData[]) {
        pushCurrentHistory();
        const next = normalizeData(d);
        replaceMapData(next);
      },
      setMarkdown(md: string) {
        pushCurrentHistory();
        const parsed = parseMindMapMarkdownInput(md, plugins);
        replaceMapData(parsed.roots, parsed);
      },
      importMarkdown(md: string) {
        const parsed = parseMindMapMarkdownInput(md, plugins);
        handleImportData(parsed.roots, 'markdown', parsed);
      },
      importData(d: MindMapData | MindMapData[]) {
        handleImportData(normalizeData(d), 'json');
      },
      selectNode(nodeId: string | null) {
        setSelectedNodeIdControlled(nodeId);
        emit({ type: 'nodeSelect', nodeId });
      },
      focusNode(nodeId: string) {
        handleFocusNode(nodeId);
      },
      expandNode(nodeId: string) {
        handleExpandNode(nodeId);
      },
      collapseNode(nodeId: string) {
        handleCollapseNode(nodeId);
      },
      undo() {
        handleUndo();
      },
      redo() {
        handleRedo();
      },
      canUndo() {
        return historyPastRef.current.length > 0;
      },
      canRedo() {
        return historyFutureRef.current.length > 0;
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
      pushCurrentHistory, handleImportData, setSelectedNodeIdControlled,
      emit, handleFocusNode, handleExpandNode, handleCollapseNode, handleUndo, handleRedo,
      replaceMapData,
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
    const parsed = parseMindMapMarkdownInput(md, plugins);
    setMapData(parsed.roots);
    mapDataRef.current = parsed.roots;
    applyParsedViewOptions(parsed, true);
    setSplitIndices({});
    splitIndicesRef.current = {};
  }, [applyParsedViewOptions, plugins]);

  const handleAIComplete = useCallback(() => {
    setTimeout(() => handleAutoFit(), 100);
  }, [handleAutoFit]);

  const handleAIError = useCallback(() => {}, []);

  // Serializing the full tree to markdown is only needed to seed the AI input,
  // so skip it entirely when AI is disabled and memoize it otherwise.
  const currentMarkdownForAI = useMemo(
    () => (ai ? toMarkdownMultiRoot(mapData, plugins) : ""),
    [ai, mapData, plugins],
  );

  // --- Render ---
  return (
    <div ref={containerRef} className="mindmap-container" style={generateCSSVariables(activeTheme) as React.CSSProperties}>
      {mode === 'text' && textEditor && (() => {
        const TextEditor = textEditor;
        return <TextEditor value={textContent} onChange={setTextContent} readOnly={readonlyProp} />;
      })()}
      <svg
        ref={svgRef}
        className={`mindmap-svg ${draggingCanvas ? "dragging-canvas" : ""} ${floatingNodeId ? "dragging-node" : ""}`}
        style={mode === 'text' ? { display: 'none' } : undefined}
        tabIndex={0}
        role="tree"
        aria-label="Mind map"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <MindMapCanvas
          nodes={nodes}
          edges={edges}
          nodeMap={nodeMap}
          theme={activeTheme}
          direction={direction}
          plugins={plugins}
          pan={pan}
          zoom={zoom}
          initialReady={initialReady}
          draggingCanvas={draggingCanvas}
          expandDelays={expandDelays}
          newNodeIds={newNodeIds}
          searchMatches={searchState.searchMatches}
          dimmedNodes={searchState.dimmedNodes}
          readonly={readonlyProp}
          latexRenderer={latexRenderer}
          selectedNodeId={selectedNodeId}
          editingId={editingId}
          pendingEditId={pendingEditId}
          editText={editText}
          activeMatchId={
            activeSearchIndexForMatches >= 0
              ? searchState.matchIds[activeSearchIndexForMatches] ?? null
              : null
          }
          floatingSubtreeIds={floatingSubtreeIds}
          onNodeMouseDown={handleNodeMouseDown}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={readonlyProp ? undefined : handleNodeDoubleClick}
          onNodeContextMenu={readonlyProp ? undefined : handleNodeContextMenu}
          onEditChange={setEditText}
          onEditCommit={commitEdit}
          onEditCancel={cancelEdit}
          onAddChild={handleAddChild}
          onRemarkHover={handleRemarkHover}
          onFoldToggle={plugins ? handleFoldToggle : undefined}
          floatingSlot={floatingNodeId && floatingPos && (() => {
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
                      latexRenderer={latexRenderer}
                    />
                  ))}
              </g>
              </>
            );
          })()}
        />
      </svg>

      <MindMapControls
        zoom={zoom}
        theme={activeTheme}
        messages={t}
        showZoom={toolbarConfig.zoom && mode !== 'text'}
        showHistory={toolbarConfig.history && mode !== 'text' && !readonlyProp}
        showSearch={toolbarConfig.search && mode !== 'text'}
        showTags={toolbarConfig.tags && mode !== 'text'}
        showModeToggle={!!textEditor}
        mode={mode}
        isFullscreen={isFullscreen}
        canUndo={canUndo}
        canRedo={canRedo}
        searchQuery={searchQuery}
        searchMatchCount={searchState.matchIds.length}
        activeSearchIndex={activeSearchIndexForMatches}
        availableTags={searchState.availableTags}
        activeTags={activeTags}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onAutoFit={handleAutoFit}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSearchChange={handleSearchChange}
        onSearchPrevious={() => handleSearchStep(-1)}
        onSearchNext={() => handleSearchStep(1)}
        onTagToggle={handleTagToggle}
        onClearTags={handleClearTags}
        onModeToggle={handleModeToggle}
        onFullscreenToggle={handleFullscreenToggle}
      />

      {/* Lazily-loaded edit-mode overlays — each chunk fetches on first use. */}
      <Suspense fallback={null}>
        {ai && (
          <MindMapAIInput
            config={ai}
            theme={activeTheme}
            messages={t}
            currentMarkdown={currentMarkdownForAI}
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
            nodeId={contextMenu.nodeId ?? null}
            canPaste={contextMenu.canPaste}
            onNewRootNode={handleNewRootNode}
            onImport={handleOpenImport}
            onExportSVG={handleExportSVG}
            onExportPNG={handleExportPNG}
            onExportMarkdown={handleExportMarkdown}
            onDirectionChange={handleDirectionChange}
            onAddChildNode={(e) => contextMenu.nodeId && handleAddChild(e, contextMenu.nodeId)}
            onEditNode={() => contextMenu.nodeId && handleEditNode(contextMenu.nodeId)}
            onDeleteNode={() => contextMenu.nodeId && handleDeleteNode(contextMenu.nodeId)}
            onCopyNode={() => contextMenu.nodeId && handleCopyNode(contextMenu.nodeId)}
            onCutNode={() => contextMenu.nodeId && handleCutNode(contextMenu.nodeId)}
            onPasteNode={() => contextMenu.nodeId && handlePasteNode(contextMenu.nodeId)}
            onClose={closeContextMenu}
          />
        )}

        {importDialogOpen && (
          <MindMapImportDialog
            messages={t}
            plugins={plugins}
            onImport={handleImportData}
            onClose={() => setImportDialogOpen(false)}
          />
        )}
      </Suspense>

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
