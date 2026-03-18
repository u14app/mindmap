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
  LayoutDirection,
} from "./types";
import { layoutMultiRoot } from "./utils/layout";
import { buildExportSVG, exportToPNG } from "./utils/export";
import { parseMarkdownMultiRoot, toMarkdownMultiRoot } from "./utils/markdown";
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
import { usePanZoom } from "./hooks/usePanZoom";
import { useDrag } from "./hooks/useDrag";
import { useNodeEdit } from "./hooks/useNodeEdit";
import { useNewNodeAnimation } from "./hooks/useNewNodeAnimation";
import { MindMapNode } from "./components/MindMapNode";
import { MindMapControls } from "./components/MindMapControls";
import { MindMapContextMenu } from "./components/MindMapContextMenu";
import { MindMapImportDialog } from "./components/MindMapImportDialog";
import { MindMapHelpDialog } from "./components/MindMapHelpDialog";
import { MindMapShortcutsDialog } from "./components/MindMapShortcutsDialog";
import { IconHelp, IconKeyboard } from "./components/icons";
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
    onDataChange,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- Data state ---
  const [mapData, setMapData] = useState<MindMapData[]>(() =>
    normalizeData(data),
  );
  const [direction, setDirection] = useState<LayoutDirection>(defaultDirection);
  const [splitIndices, setSplitIndices] = useState<Record<string, number>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const clipboardRef = useRef<MindMapData | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Sync external data / markdown
  useEffect(() => {
    setMapData(normalizeData(data));
  }, [data]);

  useEffect(() => {
    if (markdown !== undefined) {
      setMapData(parseMarkdownMultiRoot(markdown));
    }
  }, [markdown]);

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

  // --- Theme ---
  const activeTheme = useTheme(themeProp);

  // --- i18n ---
  const t = useMemo(() => resolveMessages(locale ?? detectLocale(), messageOverrides), [locale, messageOverrides]);

  // --- Toolbar visibility ---
  const toolbarConfig = useMemo(() => {
    if (toolbar === false) return { zoom: false, direction: false, help: false, shortcuts: false };
    if (toolbar === true || toolbar === undefined) return { zoom: true, direction: true, help: true, shortcuts: true };
    return {
      zoom: toolbar.zoom ?? true,
      direction: toolbar.direction ?? true,
      help: toolbar.help ?? true,
      shortcuts: toolbar.shortcuts ?? true,
    };
  }, [toolbar]);

  // --- Layout ---
  const { nodes, edges } = useMemo(
    () => layoutMultiRoot(mapData, direction, colorMap, splitIndices),
    [mapData, direction, colorMap, splitIndices],
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

  // --- Pan / Zoom ---
  const {
    pan, setPan, zoom, setZoom,
    animateTo, autoFit, handleWheel, zoomIn, zoomOut,
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
  } = useNodeEdit({ nodeMap, updateData });

  // --- New Node Animation ---
  const newNodeIds = useNewNodeAnimation(nodes);

  // --- Auto-fit on data change (suppressed during drag and node creation) ---
  useEffect(() => {
    if (floatingNodeId) return;
    if (pendingEditId) return;
    const fit = autoFit();
    if (fit) {
      setZoom(fit.zoom);
      setPan({ x: fit.panX, y: fit.panY });
    }
  }, [nodes, autoFit, floatingNodeId, pendingEditId, setZoom, setPan]);

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
      }
    },
    [didDragRef],
  );

  const handleCanvasClick = useCallback(() => {
    if (!didDragRef.current) {
      setSelectedNodeId(null);
    }
  }, [didDragRef]);

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

      setPendingEditId(newId);
      setEditText("");
    },
    [updateData, mapData, direction, splitIndices, setPendingEditId, setEditText, t, readonlyProp],
  );

  // Context menu: new root node
  const handleNewRootNode = useCallback(() => {
    if (readonlyProp) return;
    const newId = generateId();
    updateData((prev) => [...prev, { id: newId, text: t.newNode }]);
    setPendingEditId(newId);
    setEditText("");
    closeContextMenu();
  }, [updateData, closeContextMenu, setPendingEditId, setEditText, t, readonlyProp]);

  const handleExportSVG = useCallback(() => {
    const svg = buildExportSVG(
      nodes, edges, {}, activeTheme,
    );
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, "mindmap.svg");
    closeContextMenu();
  }, [nodes, edges, activeTheme, closeContextMenu]);

  const handleExportPNG = useCallback(async () => {
    const svg = buildExportSVG(
      nodes, edges, {}, activeTheme,
    );
    const blob = await exportToPNG(svg);
    downloadBlob(blob, "mindmap.png");
    closeContextMenu();
  }, [nodes, edges, activeTheme, closeContextMenu]);

  const handleExportMarkdown = useCallback(() => {
    const md = toMarkdownMultiRoot(mapData);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, "mindmap.md");
    closeContextMenu();
  }, [mapData, closeContextMenu]);

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
  }, []);

  // Import data
  const handleImport = useCallback((data: MindMapData[]) => {
    if (readonlyProp) return;
    updateData(() => data);
    setSplitIndices({});
    setImportDialogOpen(false);
  }, [updateData, readonlyProp]);

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
        return;
      }

      // Delete
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId && !readonlyProp) {
        e.preventDefault();
        const isRoot = mapData.some((root) => root.id === selectedNodeId);
        if (isRoot && mapData.length <= 1) return;
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
        updateData((prev) => removeNodeMulti(prev, selectedNodeId));
        setSelectedNodeId(null);
        return;
      }

      // Paste
      if (isMeta && e.key === "v" && selectedNodeId && clipboardRef.current && !readonlyProp) {
        e.preventDefault();
        const pastedSubtree = regenerateIds(clipboardRef.current);
        updateData((prev) => addChildMulti(prev, selectedNodeId, pastedSubtree));
        return;
      }
    },
    [
      editingId, selectedNodeId, mapData, direction, splitIndices,
      updateData, contextMenu, closeContextMenu,
      setPendingEditId, setEditText, t,
      zoomIn, zoomOut, handleAutoFit, handleDirectionChange, readonlyProp,
    ],
  );

  // --- Imperative Handle ---
  useImperativeHandle(
    ref,
    () => ({
      exportToSVG() {
        return buildExportSVG(
          nodes, edges, {}, activeTheme,
        );
      },
      async exportToPNG() {
        const svg = buildExportSVG(
          nodes, edges, {}, activeTheme,
        );
        return exportToPNG(svg);
      },
      exportToOutline() {
        return toMarkdownMultiRoot(mapData);
      },
      getData() {
        return mapData;
      },
      setData(d: MindMapData | MindMapData[]) {
        setMapData(normalizeData(d));
        setSplitIndices({});
      },
      setMarkdown(md: string) {
        setMapData(parseMarkdownMultiRoot(md));
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
      nodes, edges, mapData,
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

  // --- Render ---
  return (
    <div ref={containerRef} className="mindmap-container">
      <svg
        ref={svgRef}
        className={`mindmap-svg ${draggingCanvas ? "dragging-canvas" : ""} ${floatingNodeId ? "dragging-node" : ""}`}
        style={{ background: activeTheme.canvas.bgColor }}
        tabIndex={0}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          <g className="mindmap-edges">
            {edges.map((edge) => (
              <path
                key={edge.key}
                d={edge.path}
                stroke={edge.color}
                strokeWidth={activeTheme.connection.strokeWidth}
                strokeLinecap="round"
                fill="none"
                className={
                  draggingCanvas ||
                  floatingSubtreeIds.has(edge.fromId) ||
                  floatingSubtreeIds.has(edge.toId)
                    ? ""
                    : "mindmap-edge-animated"
                }
              />
            ))}
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
                  readonly={readonlyProp}
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
            return (
              <g transform={`translate(${dx}, ${dy})`} style={{ pointerEvents: 'none' }}>
                {/* Floating edges within subtree */}
                {edges
                  .filter((e) => floatingSubtreeIds.has(e.fromId) && floatingSubtreeIds.has(e.toId))
                  .map((edge) => (
                    <path
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
            );
          })()}
        </g>
      </svg>

      <MindMapControls
        zoom={zoom}
        direction={direction}
        theme={activeTheme}
        messages={t}
        showZoom={toolbarConfig.zoom}
        showDirection={toolbarConfig.direction}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onAutoFit={handleAutoFit}
        onDirectionChange={handleDirectionChange}
      />

      {contextMenu && (
        <MindMapContextMenu
          position={contextMenu}
          theme={activeTheme}
          messages={t}
          direction={direction}
          readonly={readonlyProp}
          onNewRootNode={handleNewRootNode}
          onImport={() => { setImportDialogOpen(true); closeContextMenu(); }}
          onExportSVG={handleExportSVG}
          onExportPNG={handleExportPNG}
          onExportMarkdown={handleExportMarkdown}
          onDirectionChange={handleDirectionChange}
          onClose={closeContextMenu}
        />
      )}

      {importDialogOpen && (
        <MindMapImportDialog
          theme={activeTheme}
          messages={t}
          onImport={handleImport}
          onClose={() => setImportDialogOpen(false)}
        />
      )}

      {toolbarConfig.shortcuts && (
        <button
          className="mindmap-shortcuts-btn"
          style={{
            background: activeTheme.controls.bgColor,
            color: activeTheme.controls.textColor,
          }}
          onClick={() => setShortcutsDialogOpen(true)}
          title={t.shortcuts}
        >
          <IconKeyboard size={16} />
        </button>
      )}

      {toolbarConfig.help && (
        <button
          className="mindmap-help-btn"
          style={{
            background: activeTheme.controls.bgColor,
            color: activeTheme.controls.textColor,
          }}
          onClick={() => setHelpDialogOpen(true)}
          title={t.help}
        >
          <IconHelp size={16} />
        </button>
      )}

      {shortcutsDialogOpen && (
        <MindMapShortcutsDialog
          theme={activeTheme}
          messages={t}
          onClose={() => setShortcutsDialogOpen(false)}
        />
      )}

      {helpDialogOpen && (
        <MindMapHelpDialog
          theme={activeTheme}
          messages={t}
          onClose={() => setHelpDialogOpen(false)}
        />
      )}
    </div>
  );
});
