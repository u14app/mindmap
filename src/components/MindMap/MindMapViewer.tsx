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
  MindMapViewerProps,
  MindMapViewerRef,
  MindMapEvent,
  LayoutDirection,
  ThemeMode,
} from "./types";
import { layoutMultiRoot } from "./utils/layout";
import { parseMarkdownMultiRoot, parseMarkdownWithFrontMatter } from "./utils/markdown";
import { resolveMessages, detectLocale } from "./utils/i18n";
import { normalizeData } from "./utils/tree-ops";
import { useTheme } from "./hooks/useTheme";
import { generateCSSVariables } from "./utils/theme";
import { usePanZoom } from "./hooks/usePanZoom";
import { useCanvasPan } from "./hooks/useCanvasPan";
import { useNewNodeAnimation } from "./hooks/useNewNodeAnimation";
import { MindMapNode } from "./components/MindMapNode";
import { runRenderOverlay } from "./plugins/runner";
import "./MindMap.css";

const noop = () => {};

export const MindMapViewer = forwardRef<MindMapViewerRef, MindMapViewerProps>(function MindMapViewer(
  {
    data,
    markdown,
    defaultDirection = "both",
    theme: themeProp = "auto",
    locale,
    messages: messageOverrides,
    toolbar = true,
    plugins: pluginsProp,
    onEvent,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const plugins = pluginsProp && pluginsProp.length > 0 ? pluginsProp : undefined;

  // --- Eagerly parse markdown on init ---
  const initParsed = useMemo(() => {
    if (data) return null;
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
  }, []);

  // --- Data state ---
  const [mapData, setMapData] = useState<MindMapData[]>(() => {
    if (data) return normalizeData(data);
    if (initParsed) return initParsed.roots;
    return [{ id: 'md-0', text: 'Root' }];
  });
  const [direction, setDirection] = useState<LayoutDirection>(() => initParsed?.direction ?? defaultDirection);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [foldOverrides, setFoldOverrides] = useState<Record<string, boolean>>({});
  const [expandingFromId, setExpandingFromId] = useState<string | null>(null);
  const [remarkTooltip, setRemarkTooltip] = useState<{ nodeId: string; text: string; x: number; y: number } | null>(null);
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
        if (frontMatter.direction) {
          const dir = frontMatter.direction as LayoutDirection;
          if (dir === 'left' || dir === 'right' || dir === 'both') setDirection(dir);
        }
        if (frontMatter.theme) {
          const t = frontMatter.theme as ThemeMode;
          if (t === 'light' || t === 'dark' || t === 'auto') setFmTheme(t);
        }
      } else {
        setMapData(parseMarkdownMultiRoot(markdown));
      }
    }
  }, [markdown, plugins]);

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
    return { zoom: toolbar.zoom ?? true };
  }, [toolbar]);

  // --- Layout ---
  const { nodes, edges } = useMemo(
    () => layoutMultiRoot(mapData, direction, colorMap, {}, plugins, true, foldOverrides),
    [mapData, direction, colorMap, plugins, foldOverrides],
  );

  // Persist colors for level-1 nodes
  useEffect(() => {
    const updates: Record<string, string> = {};
    let hasNew = false;
    for (const node of nodes) {
      if (node.depth === 1 && !colorMap[node.id]) {
        updates[node.id] = node.color;
        hasNew = true;
      }
    }
    if (hasNew) setColorMap((prev) => ({ ...prev, ...updates }));
  }, [nodes, colorMap]);

  const nodeMap = useMemo(() => {
    const map: Record<string, (typeof nodes)[0]> = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  // --- Expand animation delays ---
  const expandDelays = useMemo(() => {
    if (!expandingFromId) return {};
    const delays: Record<string, number> = {};
    const queue: { id: string; depth: number }[] = [];
    for (const n of nodes) {
      if (n.parentId === expandingFromId) queue.push({ id: n.id, depth: 1 });
    }
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      delays[id] = depth * 100;
      for (const n of nodes) {
        if (n.parentId === id) queue.push({ id: n.id, depth: depth + 1 });
      }
    }
    return delays;
  }, [expandingFromId, nodes]);

  // --- Pan / Zoom ---
  const {
    pan, setPan, zoom, setZoom,
    animateTo, autoFit, zoomIn, zoomOut,
  } = usePanZoom(svgRef, nodes);

  // --- Canvas panning (no node drag) ---
  const {
    draggingCanvas,
    didDragRef,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasPan({ svgRef, pan, setPan });

  // --- New Node Animation ---
  const newNodeIds = useNewNodeAnimation(nodes);

  // --- Initial entrance ---
  const [initialReady, setInitialReady] = useState(false);

  useEffect(() => {
    const fit = autoFit();
    if (fit) {
      if (!initialReady) {
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
  }, [nodes, autoFit, setZoom, setPan, initialReady, animateTo]);

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

  const handleAutoFit = useCallback(() => {
    const fit = autoFit();
    if (fit) animateTo(fit.zoom, fit.panX, fit.panY);
  }, [autoFit, animateTo]);

  const handleDirectionChange = useCallback((dir: LayoutDirection) => {
    setDirection(dir);
    emit({ type: 'directionChange', direction: dir });
  }, [emit]);

  const handleCanvasClick = useCallback(() => {
    if (!didDragRef.current) {
      emit({ type: 'nodeSelect', nodeId: null });
    }
  }, [didDragRef, emit]);

  // Emit zoom changes
  const prevZoomRef = useRef(zoom);
  useEffect(() => {
    if (zoom !== prevZoomRef.current) {
      prevZoomRef.current = zoom;
      emit({ type: 'zoomChange', zoom });
    }
  }, [zoom, emit]);

  // Keyboard shortcuts (zoom + layout only)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey) return;
      if (e.code === "Equal") { e.preventDefault(); zoomIn(); }
      else if (e.code === "Minus") { e.preventDefault(); zoomOut(); }
      else if (e.code === "Digit0") { e.preventDefault(); handleAutoFit(); }
      else if (e.code === "KeyL") { e.preventDefault(); handleDirectionChange("left"); }
      else if (e.code === "KeyR") { e.preventDefault(); handleDirectionChange("right"); }
      else if (e.code === "KeyM") { e.preventDefault(); handleDirectionChange("both"); }
    },
    [zoomIn, zoomOut, handleAutoFit, handleDirectionChange],
  );

  // --- Imperative Handle ---
  useImperativeHandle(
    ref,
    () => ({
      getData() { return mapData; },
      fitView() { handleAutoFit(); },
      setDirection(dir: LayoutDirection) { handleDirectionChange(dir); },
    }),
    [mapData, handleAutoFit, handleDirectionChange],
  );

  // --- Render ---
  return (
    <div ref={containerRef} className="mindmap-container" style={generateCSSVariables(activeTheme) as React.CSSProperties}>
      <svg
        ref={svgRef}
        className={`mindmap-svg ${draggingCanvas ? "dragging-canvas" : ""}`}
        tabIndex={0}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
      >
        <g
          className={`mindmap-canvas${initialReady ? ' mindmap-canvas-ready' : ''}`}
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          opacity={initialReady ? 1 : 0}
        >
          {/* Edges */}
          <g className="mindmap-edges">
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
                      : draggingCanvas ? "" : "mindmap-edge-animated",
                  ].filter(Boolean).join(" ")}
                  style={isExpandingEdge ? { animationDelay: `${edgeExpandDelay}ms` } : undefined}
                />
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
              const animClass = draggingCanvas ? "" : "mindmap-node-animated";
              return (
                <MindMapNode
                  key={node.id}
                  node={node}
                  isEditing={false}
                  isPendingEdit={false}
                  isSelected={false}
                  isNew={newNodeIds.has(node.id)}
                  animClass={animClass}
                  editText=""
                  theme={activeTheme}
                  direction={direction}
                  onMouseDown={noop}
                  onClick={noop}
                  onDoubleClick={noop}
                  onEditChange={noop}
                  onEditCommit={noop}
                  onEditCancel={noop}
                  onAddChild={noop}
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
                  readonly
                  plugins={plugins}
                />
              );
            })}
          </g>

          {/* Plugin overlay layer */}
          {plugins && runRenderOverlay(plugins, nodes, edges, activeTheme).map((el, i) => (
            <g className="mindmap-plugin-overlay" key={`plugin-overlay-${i}`}>{el}</g>
          ))}
        </g>
      </svg>

      {/* Zoom controls */}
      {toolbarConfig.zoom && (
        <div className="mindmap-controls">
          <button className="mindmap-control-btn" onClick={zoomIn} title={t.zoomIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="mindmap-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="mindmap-control-btn" onClick={zoomOut} title={t.zoomOut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button className="mindmap-control-btn" onClick={handleAutoFit} title={t.resetView}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>
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
