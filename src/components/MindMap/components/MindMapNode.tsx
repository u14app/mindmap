import { useMemo, useState, useEffect } from "react";
import type { LayoutNode, LayoutDirection } from "../types";
import type { ThemeColors } from "../utils/theme";
import type { MindMapPlugin } from "../plugins/types";
import type { TokenLayout } from "../utils/inline-markdown";
import {
  parseInlineMarkdown,
  computeTokenLayouts,
} from "../utils/inline-markdown";
import {
  runRenderNodeDecoration,
  runRenderInlineToken,
} from "../plugins/runner";
export interface LatexRenderer {
  getKatexSync: () => unknown;
  onKatexReady: (cb: () => void) => void;
  renderLatexToHtml: (tex: string, displayMode: boolean) => string | null;
  loadKatexStyle: () => void;
}

const MONO_FONT =
  "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

export interface MindMapNodeProps {
  node: LayoutNode;
  offset?: { x: number; y: number };
  isEditing: boolean;
  isPendingEdit: boolean;
  isSelected: boolean;
  isNew: boolean;
  isGhost?: boolean;
  animClass: string;
  editText: string;
  theme: ThemeColors;
  direction: LayoutDirection;
  readonly?: boolean;
  plugins?: MindMapPlugin[];
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (e: React.MouseEvent, nodeId: string) => void;
  onDoubleClick: (e: React.MouseEvent, nodeId: string, text: string) => void;
  onEditChange: (text: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onAddChild: (
    e: React.MouseEvent,
    parentId: string,
    side?: "left" | "right",
  ) => void;
  onRemarkHover?: (nodeId: string | null) => void;
  onFoldToggle?: (nodeId: string) => void;
  expandDelay?: number;
  latexRenderer?: LatexRenderer;
}

// --- SVG token rendering helpers ---

function renderTokenTspan(
  layout: TokenLayout,
  key: number,
  plugins?: MindMapPlugin[],
  highlightTextColor?: string,
) {
  const { token } = layout;

  // Try plugin rendering for custom token types
  if (
    token.type !== "text" &&
    token.type !== "bold" &&
    token.type !== "italic" &&
    token.type !== "strikethrough" &&
    token.type !== "code" &&
    token.type !== "highlight" &&
    token.type !== "link" &&
    token.type !== "image"
  ) {
    if (plugins && plugins.length > 0) {
      const el = runRenderInlineToken(plugins, layout, key);
      if (el) return el;
    }
  }

  switch (token.type) {
    case "bold":
      return (
        <tspan key={key} className="mindmap-text-bold" fontWeight={700}>
          {token.content}
        </tspan>
      );
    case "italic":
      return (
        <tspan key={key} className="mindmap-text-italic" fontStyle="italic">
          {token.content}
        </tspan>
      );
    case "strikethrough":
      return (
        <tspan
          key={key}
          className="mindmap-text-strikethrough"
          textDecoration="line-through"
          opacity={0.6}
        >
          {token.content}
        </tspan>
      );
    case "code":
      return (
        <tspan
          key={key}
          className="mindmap-text-code"
          fontFamily={MONO_FONT}
          fontSize="0.88em"
        >
          {token.content}
        </tspan>
      );
    case "highlight":
      return (
        <tspan
          key={key}
          className="mindmap-text-highlight"
          fill={highlightTextColor || "#FFEB3B"}
        >
          {token.content}
        </tspan>
      );
    case "link":
      return (
        <a
          key={key}
          className="mindmap-text-link"
          href={token.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <tspan fill="#2563EB" textDecoration="underline">
            {token.text}
          </tspan>
        </a>
      );
    case "image":
      return (
        <tspan key={key} className="mindmap-text-image" fontStyle="italic">
          [{token.alt || "image"}]
        </tspan>
      );
    case "latex-inline":
    case "latex-block":
      // Fallback: italic monospace
      return (
        <tspan
          key={key}
          className="mindmap-text-latex"
          fontFamily={MONO_FONT}
          fontStyle="italic"
          fontSize="0.9em"
        >
          {token.content}
        </tspan>
      );
    case "text":
    default:
      return (
        <tspan key={key} className="mindmap-text-plain">
          {token.content}
        </tspan>
      );
  }
}

function TaskStatusSvgIcon({ status, size }: { status: string; size: number }) {
  if (status === "done") {
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={size * 0.2}
          fill="#22C55E"
        />
        <path
          d={`M${size * 0.28} ${size * 0.5}L${size * 0.44} ${size * 0.66}L${size * 0.72} ${size * 0.34}`}
          stroke="white"
          strokeWidth={size * 0.13}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    );
  }
  if (status === "doing") {
    return (
      <g>
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={size * 0.2}
          fill="none"
          stroke="#FBBF24"
          strokeWidth={size * 0.1}
        />
        <rect
          x={size * 0.25}
          y={size * 0.25}
          width={size * 0.5}
          height={size * 0.5}
          rx={size * 0.1}
          fill="#FBBF24"
          opacity={0.6}
        />
      </g>
    );
  }
  // todo
  return (
    <rect
      x={0}
      y={0}
      width={size}
      height={size}
      rx={size * 0.2}
      fill="none"
      stroke="#999"
      strokeWidth={size * 0.1}
      opacity={0.4}
    />
  );
}

// --- SVG-native node text content ---

function SvgNodeContent({
  node,
  fontSize,
  fontWeight,
  fontFamily,
  textColor,
  onRemarkHover,
  plugins,
  highlightTextColor,
  highlightBgColor,
  latexRenderer,
}: {
  node: LayoutNode;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  textColor: string;
  onRemarkHover?: (id: string | null) => void;
  plugins?: MindMapPlugin[];
  highlightTextColor?: string;
  highlightBgColor?: string;
  latexRenderer?: LatexRenderer;
}) {
  // Re-render when KaTeX finishes loading
  const [katexReady, setKatexReady] = useState(() => !!latexRenderer?.getKatexSync());
  useEffect(() => {
    if (!katexReady && latexRenderer) {
      latexRenderer.onKatexReady(() => setKatexReady(true));
    }
  }, [katexReady, latexRenderer]);

  const { layouts, textContentWidth, taskIconWidth, totalWidth } =
    useMemo(() => {
      const tokens = parseInlineMarkdown(node.text, plugins);
      const layouts = computeTokenLayouts(
        tokens,
        fontSize,
        fontWeight,
        fontFamily,
      );
      const textContentWidth =
        layouts.length > 0
          ? layouts[layouts.length - 1].x + layouts[layouts.length - 1].width
          : 0;

      const iconSize = fontSize * 0.85;
      const iconGap = node.taskStatus ? 4 : 0;
      const taskIconWidth = node.taskStatus ? iconSize + iconGap : 0;

      const remarkFontSize = fontSize * 0.7;
      const remarkGap = node.remark ? 4 : 0;
      const remarkWidth = node.remark ? remarkFontSize + remarkGap : 0;

      const totalWidth = taskIconWidth + textContentWidth + remarkWidth;

      return { layouts, textContentWidth, taskIconWidth, totalWidth };
    }, [
      node.text,
      node.taskStatus,
      node.remark,
      fontSize,
      fontWeight,
      fontFamily,
      plugins,
    ]);

  const startX = -totalWidth / 2;
  const textStartX = startX + taskIconWidth;
  const iconSize = fontSize * 0.85;
  const bgRectY = -fontSize / 2 - 2;
  const bgRectH = fontSize + 4;
  const remarkFontSize = fontSize * 0.7;
  const remarkGap = 4;

  // Multi-line content offset
  const multiLineContent = node.multiLineContent;
  const lineHeight = fontSize * 1.4;
  const multiLineStartY = fontSize / 2 + 8;

  return (
    <g className="mindmap-node-content">
      {/* Task status icon */}
      {node.taskStatus && (
        <g
          className={`mindmap-task-icon mindmap-task-${node.taskStatus}`}
          transform={`translate(${startX}, ${-iconSize / 2})`}
        >
          <TaskStatusSvgIcon status={node.taskStatus} size={iconSize} />
        </g>
      )}

      {/* Background rects for code/highlight tokens */}
      {layouts.map((layout, i) => {
        if (layout.token.type === "code") {
          return (
            <rect
              className="mindmap-code-bg"
              key={`bg-${i}`}
              x={textStartX + layout.x - 2}
              y={bgRectY}
              width={layout.width + 4}
              height={bgRectH}
              rx={3}
              fill="rgba(128,128,128,0.12)"
            />
          );
        }
        if (layout.token.type === "highlight") {
          return (
            <rect
              className="mindmap-highlight-bg"
              key={`bg-${i}`}
              x={textStartX + layout.x - 1}
              y={bgRectY}
              width={layout.width + 2}
              height={bgRectH}
              rx={2}
              fill={highlightBgColor || "rgba(255,213,79,0.3)"}
            />
          );
        }
        return null;
      })}

      {/* Text element with tspan segments */}
      <text
        className="mindmap-node-text"
        textAnchor="start"
        dominantBaseline="central"
        x={textStartX}
        fill={textColor}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
      >
        {layouts.map((layout, i) =>
          renderTokenTspan(layout, i, plugins, highlightTextColor),
        )}
      </text>

      {/* LaTeX foreignObject overlays (rendered outside <text> since SVG text can't contain foreignObject) */}
      {katexReady && latexRenderer &&
        layouts.map((layout, i) => {
          const { token } = layout;
          if (token.type !== "latex-inline" && token.type !== "latex-block")
            return null;
          const html = latexRenderer.renderLatexToHtml(
            token.content,
            token.type === "latex-block",
          );
          if (!html) return null;
          latexRenderer.loadKatexStyle();
          // Center the foreignObject on the token's center point
          const tokenCenterX = textStartX + layout.x + layout.width / 2;
          const foWidth = Math.max(layout.width * 2.5, 120);
          const foHeight = fontSize * 2;
          return (
            <foreignObject
              className="mindmap-latex"
              key={`latex-fo-${i}`}
              x={tokenCenterX - foWidth / 2}
              y={-foHeight / 2}
              width={foWidth}
              height={foHeight}
            >
              <div
                className="mindmap-latex-content"
                style={{
                  fontSize: fontSize * 0.75,
                  lineHeight: `${foHeight}px`,
                  color: textColor,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </foreignObject>
          );
        })}

      {/* Multi-line content (from | lines) with inline markdown support */}
      {multiLineContent &&
        multiLineContent.length > 0 &&
        multiLineContent.map((line, i) => {
          const mlFontSize = fontSize * 0.85;
          const mlTokens = parseInlineMarkdown(line, plugins);
          const mlLayouts = computeTokenLayouts(
            mlTokens,
            mlFontSize,
            400,
            fontFamily,
          );
          const mlWidth =
            mlLayouts.length > 0
              ? mlLayouts[mlLayouts.length - 1].x +
                mlLayouts[mlLayouts.length - 1].width
              : 0;
          const mlStartX = -mlWidth / 2;
          const mlY = multiLineStartY + i * lineHeight;
          const mlBgRectY = mlY - mlFontSize / 2 - 2;
          const mlBgRectH = mlFontSize + 4;
          return (
            <g className="mindmap-multiline" key={`ml-${i}`}>
              {/* Background rects for code/highlight tokens in multi-line */}
              {mlLayouts.map((layout, j) => {
                if (layout.token.type === "code") {
                  return (
                    <rect
                      className="mindmap-code-bg"
                      key={`ml-bg-${j}`}
                      x={mlStartX + layout.x - 2}
                      y={mlBgRectY}
                      width={layout.width + 4}
                      height={mlBgRectH}
                      rx={3}
                      fill="rgba(128,128,128,0.12)"
                    />
                  );
                }
                if (layout.token.type === "highlight") {
                  return (
                    <rect
                      className="mindmap-highlight-bg"
                      key={`ml-bg-${j}`}
                      x={mlStartX + layout.x - 1}
                      y={mlBgRectY}
                      width={layout.width + 2}
                      height={mlBgRectH}
                      rx={2}
                      fill={highlightBgColor || "rgba(255,213,79,0.3)"}
                    />
                  );
                }
                return null;
              })}
              <text
                className="mindmap-multiline-text"
                x={mlStartX}
                y={mlY}
                textAnchor="start"
                dominantBaseline="central"
                fill={textColor}
                fontSize={mlFontSize}
                fontWeight={400}
                fontFamily={fontFamily}
                opacity={0.8}
              >
                {mlLayouts.map((layout, j) =>
                  renderTokenTspan(layout, j, plugins, highlightTextColor),
                )}
              </text>
              {/* LaTeX foreignObject overlays for multi-line content */}
              {katexReady && latexRenderer &&
                mlLayouts.map((layout, j) => {
                  const { token } = layout;
                  if (
                    token.type !== "latex-inline" &&
                    token.type !== "latex-block"
                  )
                    return null;
                  const html = latexRenderer.renderLatexToHtml(
                    token.content,
                    token.type === "latex-block",
                  );
                  if (!html) return null;
                  latexRenderer.loadKatexStyle();
                  const mlTokenCenterX = mlStartX + layout.x + layout.width / 2;
                  const mlFoWidth = Math.max(layout.width * 2.5, 120);
                  const mlFoHeight = mlFontSize * 2;
                  return (
                    <foreignObject
                      className="mindmap-latex"
                      key={`ml-latex-fo-${i}-${j}`}
                      x={mlTokenCenterX - mlFoWidth / 2}
                      y={mlY - mlFoHeight / 2}
                      width={mlFoWidth}
                      height={mlFoHeight}
                    >
                      <div
                        className="mindmap-latex-content"
                        style={{
                          fontSize: mlFontSize * 0.75,
                          lineHeight: `${mlFoHeight}px`,
                          color: textColor,
                          opacity: 0.8,
                        }}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </foreignObject>
                  );
                })}
            </g>
          );
        })}

      {/* Tags badges */}
      {node.tags &&
        node.tags.length > 0 &&
        (() => {
          const tagFontSize = fontSize * 0.65;
          const tagY =
            fontSize / 2 +
            6 +
            (multiLineContent ? multiLineContent.length * lineHeight : 0);
          let tagX = -totalWidth / 2;
          return node.tags!.map((tag, i) => {
            const tagWidth = tag.length * tagFontSize * 0.65 + 10;
            const x = tagX;
            tagX += tagWidth + 4;
            const colors = [
              "#3B82F6",
              "#8B5CF6",
              "#EC4899",
              "#F59E0B",
              "#10B981",
              "#6366F1",
            ];
            const color = colors[i % colors.length];
            return (
              <g className="mindmap-tag" key={`tag-${i}`}>
                <rect
                  className="mindmap-tag-bg"
                  x={x}
                  y={tagY}
                  width={tagWidth}
                  height={tagFontSize + 6}
                  rx={3}
                  fill={color}
                  opacity={0.15}
                />
                <text
                  className="mindmap-tag-text"
                  x={x + tagWidth / 2}
                  y={tagY + (tagFontSize + 6) / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={tagFontSize}
                  fill={color}
                  fontFamily={fontFamily}
                >
                  {tag}
                </text>
              </g>
            );
          });
        })()}

      {/* Remark indicator */}
      {node.remark && (
        <text
          className="mindmap-remark-indicator"
          x={textStartX + textContentWidth + remarkGap}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={remarkFontSize}
          opacity={0.5}
          onMouseEnter={() => onRemarkHover?.(node.id)}
          onMouseLeave={() => onRemarkHover?.(null)}
        >
          <title>{node.remark}</title>
          💬
        </text>
      )}
    </g>
  );
}

// --- Main node component ---

export function MindMapNode({
  node,
  offset,
  isEditing,
  isPendingEdit,
  isSelected,
  isNew,
  isGhost,
  animClass,
  editText,
  theme,
  direction,
  readonly: readonlyProp,
  plugins,
  onMouseDown,
  onClick,
  onDoubleClick,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onAddChild,
  onRemarkHover,
  onFoldToggle,
  expandDelay,
  latexRenderer,
}: MindMapNodeProps) {
  const nx = node.x + (offset?.x ?? 0);
  const ny = node.y + (offset?.y ?? 0);
  const showInput = isEditing || isPendingEdit;
  const displayEditText = isPendingEdit && !isEditing ? "" : editText;
  const newClass = isNew ? "mindmap-node-new" : "";
  const placeholderClass = node.placeholder ? "mindmap-node-placeholder" : "";
  const expandClass = expandDelay !== undefined ? "mindmap-node-expanding" : "";
  const expandStyle =
    expandDelay !== undefined
      ? { animationDelay: `${expandDelay}ms` }
      : undefined;

  const taskPrefix =
    node.taskStatus === "done"
      ? "[x] "
      : node.taskStatus === "doing"
        ? "[-] "
        : node.taskStatus === "todo"
          ? "[ ] "
          : "";
  const rawEditText = taskPrefix + node.text;

  // Plugin decorations
  const pluginDecorations =
    plugins && plugins.length > 0
      ? runRenderNodeDecoration(plugins, node, theme)
      : null;

  if (node.depth === 0) {
    const bgColor = theme.root.bgColor;
    return (
      <g
        key={node.id}
        transform={`translate(${nx}, ${ny})`}
        className={`mindmap-node-g mindmap-node-root ${animClass} ${newClass} ${placeholderClass} ${expandClass}${isGhost ? ' mindmap-node-ghost' : ''}`}
        data-branch-index={node.branchIndex}
        onMouseDown={(e) => onMouseDown(e, node.id)}
        onClick={(e) => onClick(e, node.id)}
        onDoubleClick={(e) => onDoubleClick(e, node.id, rawEditText)}
        style={expandStyle}
      >
        <rect
          className="mindmap-node-bg"
          x={-node.width / 2}
          y={-node.height / 2}
          width={node.width}
          height={node.height}
          rx={node.height / 2}
          ry={node.height / 2}
          fill={bgColor}
          stroke={isSelected ? theme.selection.strokeColor : "none"}
          strokeWidth={isSelected ? 2.5 : 0}
        />
        {showInput ? (
          <foreignObject
            x={-node.width / 2}
            y={-node.height / 2}
            width={node.width}
            height={node.height}
          >
            <input
              className="mindmap-edit-input mindmap-edit-root"
              value={displayEditText}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditCommit();
              }}
              onBlur={onEditCommit}
              autoFocus
              style={{
                fontSize: theme.root.fontSize,
                fontWeight: theme.root.fontWeight,
                fontFamily: theme.root.fontFamily,
              }}
            />
          </foreignObject>
        ) : (
          <SvgNodeContent
            node={node}
            fontSize={theme.root.fontSize}
            fontWeight={theme.root.fontWeight}
            fontFamily={theme.root.fontFamily}
            textColor={theme.root.textColor}
            onRemarkHover={onRemarkHover}
            plugins={plugins}
            highlightTextColor={theme.highlight.textColor}
            highlightBgColor={theme.highlight.bgColor}
            latexRenderer={latexRenderer}
          />
        )}
        {/* Plugin decorations */}
        {pluginDecorations}
        {/* + buttons based on direction */}
        {!readonlyProp &&
          !isGhost &&
          (direction === "right" || direction === "both") && (
            <g
              className="mindmap-add-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => onAddChild(e, node.id, "right")}
            >
              <circle
                cx={node.width / 2 + 18}
                cy={0}
                r={11}
                fill={theme.addBtn.fill}
              />
              <line
                x1={node.width / 2 + 14}
                y1={0}
                x2={node.width / 2 + 22}
                y2={0}
                stroke={theme.addBtn.iconColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1={node.width / 2 + 18}
                y1={-4}
                x2={node.width / 2 + 18}
                y2={4}
                stroke={theme.addBtn.iconColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          )}
        {!readonlyProp &&
          !isGhost &&
          (direction === "left" || direction === "both") && (
            <g
              className="mindmap-add-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => onAddChild(e, node.id, "left")}
            >
              <circle
                cx={-(node.width / 2 + 18)}
                cy={0}
                r={11}
                fill={theme.addBtn.fill}
              />
              <line
                x1={-(node.width / 2 + 22)}
                y1={0}
                x2={-(node.width / 2 + 14)}
                y2={0}
                stroke={theme.addBtn.iconColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1={-(node.width / 2 + 18)}
                y1={-4}
                x2={-(node.width / 2 + 18)}
                y2={4}
                stroke={theme.addBtn.iconColor}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          )}
        {/* Fold toggle for collapsed nodes */}
        {node.collapsed !== undefined && readonlyProp && onFoldToggle && (
          <g
            className="mindmap-fold-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onFoldToggle(node.id);
            }}
          >
            <circle cx={node.width / 2 + 14} cy={0} r={6} fill={node.color} />
          </g>
        )}
      </g>
    );
  }

  // Child node rendering
  const fontSize =
    node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize;
  const fontWeight =
    node.depth === 1 ? theme.level1.fontWeight : theme.node.fontWeight;
  const textW = node.width - theme.node.paddingH * 2;
  const underlineY = fontSize / 2 + 4;
  const addBtnOffset =
    node.side === "left" ? -node.width / 2 - 18 : node.width / 2 + 18;

  return (
    <g
      key={node.id}
      transform={`translate(${nx}, ${ny})`}
      className={`mindmap-node-g mindmap-node-child ${animClass} ${newClass} ${placeholderClass}${isGhost ? ' mindmap-node-ghost' : ''}`}
      data-branch-index={node.branchIndex}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={(e) => onClick(e, node.id)}
      onDoubleClick={(e) => onDoubleClick(e, node.id, rawEditText)}
    >
      {/* Invisible hit area */}
      <rect
        className="mindmap-node-bg"
        x={-node.width / 2}
        y={-node.height / 2}
        width={node.width}
        height={node.height}
        fill={isSelected ? theme.selection.fillColor : "transparent"}
        stroke={isSelected ? theme.selection.strokeColor : "none"}
        strokeWidth={isSelected ? 1.5 : 0}
        rx={4}
      />
      {showInput ? (
        <foreignObject
          x={-Math.max(node.width, 80) / 2}
          y={-node.height / 2}
          width={Math.max(node.width, 80)}
          height={node.height}
        >
          <input
            className="mindmap-edit-input mindmap-edit-child"
            value={displayEditText}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditCommit();
              if (e.key === "Escape") onEditCancel();
            }}
            onBlur={onEditCommit}
            autoFocus
            style={{
              fontSize,
              fontWeight,
              fontFamily: theme.node.fontFamily,
              color: theme.node.textColor,
              textAlign: "center",
              borderBottom: `2.5px solid ${node.color}`,
            }}
          />
        </foreignObject>
      ) : (
        <>
          <SvgNodeContent
            node={node}
            fontSize={fontSize}
            fontWeight={fontWeight}
            fontFamily={theme.node.fontFamily}
            textColor={theme.node.textColor}
            onRemarkHover={onRemarkHover}
            plugins={plugins}
            highlightTextColor={theme.highlight.textColor}
            highlightBgColor={theme.highlight.bgColor}
            latexRenderer={latexRenderer}
          />
          <line
            className="mindmap-node-underline"
            x1={-textW / 2}
            y1={underlineY}
            x2={textW / 2}
            y2={underlineY}
            stroke={node.color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      )}
      {/* Plugin decorations */}
      {pluginDecorations}
      {/* + button */}
      {!readonlyProp && !isGhost && (
        <g
          className="mindmap-add-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => onAddChild(e, node.id)}
        >
          <circle cx={addBtnOffset} cy={0} r={11} fill={theme.addBtn.fill} />
          <line
            x1={addBtnOffset - 4}
            y1={0}
            x2={addBtnOffset + 4}
            y2={0}
            stroke={theme.addBtn.iconColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line
            x1={addBtnOffset}
            y1={-4}
            x2={addBtnOffset}
            y2={4}
            stroke={theme.addBtn.iconColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}
      {/* Fold toggle for collapsed nodes */}
      {node.collapsed !== undefined && readonlyProp && onFoldToggle && (
        <g
          className="mindmap-fold-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onFoldToggle(node.id);
          }}
        >
          <circle cx={addBtnOffset} cy={0} r={6} fill={node.color} />
        </g>
      )}
    </g>
  );
}
