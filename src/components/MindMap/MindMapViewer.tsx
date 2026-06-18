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
import { parseInitialMindMapInput, parseMindMapMarkdownInput } from "./utils/input";
import { resolveMessages, detectLocale } from "./utils/i18n";
import { normalizeData } from "./utils/tree-ops";
import { useTheme } from "./hooks/useTheme";
import { generateCSSVariables } from "./utils/theme";
import { useMindMapView } from "./hooks/useMindMapView";
import { useCanvasPan } from "./hooks/useCanvasPan";
import { MindMapCanvas } from "./components/MindMapCanvas";
import { IconPlus, IconMinus } from "./components/icons";
import "./MindMap.css";

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
    searchQuery = '',
    activeTags = [],
    onEvent,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const plugins = pluginsProp && pluginsProp.length > 0 ? pluginsProp : undefined;

  // --- Eagerly parse markdown on init ---
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
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [foldOverrides, setFoldOverrides] = useState<Record<string, boolean>>({});
  const [fmTheme, setFmTheme] = useState<ThemeMode | undefined>(() => initParsed?.theme);

  // --- Event emission ---
  const emit = useCallback((event: MindMapEvent) => {
    onEvent?.(event);
  }, [onEvent]);

  // Sync external data / markdown
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled data prop must replace the viewer tree
    if (data) setMapData(normalizeData(data));
  }, [data]);

  useEffect(() => {
    if (markdown !== undefined) {
      const parsed = parseMindMapMarkdownInput(markdown, plugins);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled markdown prop must replace the viewer tree
      setMapData(parsed.roots);
      if (parsed.direction) setDirection(parsed.direction);
      if (parsed.theme) setFmTheme(parsed.theme);
    }
  }, [markdown, plugins]);

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

  // --- Shared view layer ---
  const {
    nodes, edges, nodeMap, searchState, expandDelays,
    pan, setPan, zoom, setZoom, animateTo, autoFit, zoomIn, zoomOut,
    newNodeIds, remarkTooltip, handleRemarkHover,
    handleAutoFit, triggerExpandAnimation,
  } = useMindMapView({
    svgRef, mapData, direction, colorMap, setColorMap, foldOverrides,
    plugins, readonly: true, searchQuery, activeTags,
    onZoomChange: (z) => emit({ type: 'zoomChange', zoom: z }),
  });

  // --- Canvas panning + two-finger pinch-to-zoom (no node drag) ---
  const {
    draggingCanvas,
    didDragRef,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasPan({ svgRef, pan, setPan, zoom, setZoom });

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

  const handleDirectionChange = useCallback((dir: LayoutDirection) => {
    setDirection(dir);
    emit({ type: 'directionChange', direction: dir });
  }, [emit]);

  const handleCanvasClick = useCallback(() => {
    if (!didDragRef.current) {
      emit({ type: 'nodeSelect', nodeId: null });
    }
  }, [didDragRef, emit]);

  const handleFoldToggle = useCallback((nodeId: string) => {
    if (!foldOverrides[nodeId]) triggerExpandAnimation(nodeId);
    setFoldOverrides((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, [foldOverrides, triggerExpandAnimation]);

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
    <div className="mindmap-container" style={generateCSSVariables(activeTheme) as React.CSSProperties}>
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
          readonly
          onRemarkHover={handleRemarkHover}
          onFoldToggle={plugins ? handleFoldToggle : undefined}
        />
      </svg>

      {/* Zoom controls */}
      {toolbarConfig.zoom && (
        <div className="mindmap-zoom-controls">
          <button
            className="mindmap-ctrl-btn mindmap-ctrl-zoom-out"
            onClick={zoomOut}
            title={t.zoomOut}
            aria-label={t.zoomOut}
          >
            <IconMinus size={16} />
          </button>
          <button
            className="mindmap-ctrl-pct"
            onClick={handleAutoFit}
            title={t.resetView}
            aria-label={t.resetView}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="mindmap-ctrl-btn mindmap-ctrl-zoom-in"
            onClick={zoomIn}
            title={t.zoomIn}
            aria-label={t.zoomIn}
          >
            <IconPlus size={16} />
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
