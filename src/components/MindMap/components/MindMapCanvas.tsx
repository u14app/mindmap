import type { ReactNode } from "react";
import type { Edge, LayoutDirection, LayoutNode } from "../types";
import type { ThemeColors } from "../utils/theme";
import type { MindMapPlugin } from "../plugins/types";
import { MindMapNode } from "./MindMapNode";
import type { LatexRenderer } from "./MindMapNode";
import { runRenderOverlay } from "../plugins/runner";

const noop = () => {};
const EMPTY_SET: ReadonlySet<string> = new Set();

export interface MindMapCanvasProps {
  nodes: LayoutNode[];
  edges: Edge[];
  nodeMap: Record<string, LayoutNode>;
  theme: ThemeColors;
  direction: LayoutDirection;
  plugins?: MindMapPlugin[];
  /** Transformed-group transform + entrance fade. */
  pan: { x: number; y: number };
  zoom: number;
  initialReady: boolean;
  draggingCanvas: boolean;
  expandDelays: Record<string, number>;
  newNodeIds: Set<string>;
  searchMatches: Set<string>;
  dimmedNodes: Set<string>;
  // --- Editor-only extras (omitted by the read-only viewer) ---
  readonly?: boolean;
  latexRenderer?: LatexRenderer;
  selectedNodeId?: string | null;
  editingId?: string | null;
  pendingEditId?: string | null;
  editText?: string;
  activeMatchId?: string | null;
  /** Ids of the subtree currently being dragged (rendered as ghosts in place). */
  floatingSubtreeIds?: ReadonlySet<string>;
  /** Extra layer (e.g. the editor's floating drag copy) drawn above the nodes. */
  floatingSlot?: ReactNode;
  // --- Node interaction handlers (default to no-op for the viewer) ---
  onNodeMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  onNodeClick?: (e: React.MouseEvent, nodeId: string) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, nodeId: string, text: string) => void;
  onNodeContextMenu?: (e: React.MouseEvent, nodeId: string) => void;
  onEditChange?: (text: string) => void;
  onEditCommit?: () => void;
  onEditCancel?: () => void;
  onAddChild?: (e: React.MouseEvent, parentId: string, side?: "left" | "right") => void;
  onRemarkHover?: (nodeId: string | null) => void;
  onFoldToggle?: (nodeId: string) => void;
}

/**
 * The transformed `<g>` that paints the mind map: edges, nodes, an optional
 * floating drag layer, and the plugin overlay. Shared by {@link MindMap} (full
 * editor) and {@link MindMapViewer} (read-only); editor-only behaviour is opt-in
 * via the selection/editing props and `floatingSubtreeIds` / `floatingSlot`.
 */
export function MindMapCanvas({
  nodes,
  edges,
  nodeMap,
  theme,
  direction,
  plugins,
  pan,
  zoom,
  initialReady,
  draggingCanvas,
  expandDelays,
  newNodeIds,
  searchMatches,
  dimmedNodes,
  readonly,
  latexRenderer,
  selectedNodeId,
  editingId,
  pendingEditId,
  editText,
  activeMatchId,
  floatingSubtreeIds,
  floatingSlot,
  onNodeMouseDown,
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onAddChild,
  onRemarkHover,
  onFoldToggle,
}: MindMapCanvasProps) {
  const floating = floatingSubtreeIds ?? EMPTY_SET;

  return (
    <g
      className={`mindmap-canvas${initialReady ? ' mindmap-canvas-ready' : ''}`}
      transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
      opacity={initialReady ? 1 : 0}
    >
      {/* Edges */}
      <g className="mindmap-edges">
        {/* Arrow marker for cross-links */}
        {edges.some((e) => e.isCrossLink) && (
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
                strokeWidth={theme.connection.strokeWidth}
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
                      floating.has(edge.fromId) ||
                      floating.has(edge.toId)
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
                    fontFamily={theme.node.fontFamily}
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
          const isInFloatingSubtree = floating.has(node.id);
          const animClass =
            isInFloatingSubtree || draggingCanvas ? "" : "mindmap-node-animated";
          return (
            <MindMapNode
              key={node.id}
              node={node}
              isEditing={editingId === node.id}
              isPendingEdit={pendingEditId === node.id}
              isSelected={selectedNodeId === node.id}
              isNew={newNodeIds.has(node.id)}
              isGhost={isInFloatingSubtree}
              isSearchMatch={searchMatches.has(node.id)}
              isActiveMatch={activeMatchId === node.id}
              isFilterDimmed={dimmedNodes.has(node.id)}
              animClass={animClass}
              editText={editText ?? ""}
              theme={theme}
              direction={direction}
              onMouseDown={onNodeMouseDown ?? noop}
              onClick={onNodeClick ?? noop}
              onDoubleClick={onNodeDoubleClick ?? noop}
              onContextMenu={onNodeContextMenu}
              onEditChange={onEditChange ?? noop}
              onEditCommit={onEditCommit ?? noop}
              onEditCancel={onEditCancel ?? noop}
              onAddChild={onAddChild ?? noop}
              onRemarkHover={onRemarkHover}
              onFoldToggle={onFoldToggle}
              expandDelay={expandDelays[node.id]}
              readonly={readonly}
              plugins={plugins}
              latexRenderer={latexRenderer}
            />
          );
        })}
      </g>

      {/* Floating drag layer (editor only) */}
      {floatingSlot}

      {/* Plugin overlay layer (cross-link arrows, etc.) */}
      {plugins && runRenderOverlay(plugins, nodes, edges, theme).map((el, i) => (
        <g className="mindmap-plugin-overlay" key={`plugin-overlay-${i}`}>{el}</g>
      ))}
    </g>
  );
}
