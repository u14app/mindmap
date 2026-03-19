import { useMemo } from 'react'
import type { LayoutNode, LayoutDirection } from '../types'
import type { ThemeColors } from '../utils/theme'
import type { TokenLayout } from '../utils/inline-markdown'
import { parseInlineMarkdown, computeTokenLayouts } from '../utils/inline-markdown'

const MONO_FONT = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace"

export interface MindMapNodeProps {
  node: LayoutNode
  offset?: { x: number; y: number }
  isEditing: boolean
  isPendingEdit: boolean
  isSelected: boolean
  isNew: boolean
  isGhost?: boolean
  animClass: string
  editText: string
  theme: ThemeColors
  direction: LayoutDirection
  readonly?: boolean
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void
  onClick: (e: React.MouseEvent, nodeId: string) => void
  onDoubleClick: (e: React.MouseEvent, nodeId: string, text: string) => void
  onEditChange: (text: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
  onAddChild: (e: React.MouseEvent, parentId: string, side?: 'left' | 'right') => void
  onRemarkHover?: (nodeId: string | null) => void
}

// --- SVG token rendering helpers ---

function renderTokenTspan(layout: TokenLayout, key: number) {
  const { token } = layout
  switch (token.type) {
    case 'bold':
      return <tspan key={key} fontWeight={700}>{token.content}</tspan>
    case 'italic':
      return <tspan key={key} fontStyle="italic">{token.content}</tspan>
    case 'strikethrough':
      return <tspan key={key} textDecoration="line-through" opacity={0.6}>{token.content}</tspan>
    case 'code':
      return <tspan key={key} fontFamily={MONO_FONT} fontSize="0.88em">{token.content}</tspan>
    case 'highlight':
      return <tspan key={key} fill="#B8860B">{token.content}</tspan>
    case 'link':
      return (
        <a key={key} href={token.url} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <tspan fill="#2563EB" textDecoration="underline">{token.text}</tspan>
        </a>
      )
    case 'image':
      return <tspan key={key} fontStyle="italic">[{token.alt || 'image'}]</tspan>
    case 'text':
    default:
      return <tspan key={key}>{token.content}</tspan>
  }
}

function TaskStatusSvgIcon({ status, size }: { status: string; size: number }) {
  if (status === 'done') {
    return (
      <g>
        <rect x={0} y={0} width={size} height={size} rx={size * 0.2} fill="#22C55E" />
        <path
          d={`M${size * 0.28} ${size * 0.5}L${size * 0.44} ${size * 0.66}L${size * 0.72} ${size * 0.34}`}
          stroke="white" strokeWidth={size * 0.13} strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </g>
    )
  }
  if (status === 'doing') {
    return (
      <g>
        <rect x={0} y={0} width={size} height={size} rx={size * 0.2} fill="none" stroke="#F59E0B" strokeWidth={size * 0.1} />
        <rect x={size * 0.25} y={size * 0.25} width={size * 0.5} height={size * 0.5} rx={size * 0.1} fill="#F59E0B" opacity={0.6} />
      </g>
    )
  }
  // todo
  return (
    <rect x={0} y={0} width={size} height={size} rx={size * 0.2} fill="none" stroke="#999" strokeWidth={size * 0.1} opacity={0.4} />
  )
}

// --- SVG-native node text content ---

function SvgNodeContent({
  node, fontSize, fontWeight, fontFamily, textColor, onRemarkHover,
}: {
  node: LayoutNode
  fontSize: number
  fontWeight: number
  fontFamily: string
  textColor: string
  onRemarkHover?: (id: string | null) => void
}) {
  const { layouts, textContentWidth, taskIconWidth, totalWidth } = useMemo(() => {
    const tokens = parseInlineMarkdown(node.text)
    const layouts = computeTokenLayouts(tokens, fontSize, fontWeight, fontFamily)
    const textContentWidth = layouts.length > 0 ? layouts[layouts.length - 1].x + layouts[layouts.length - 1].width : 0

    const iconSize = fontSize * 0.85
    const iconGap = node.taskStatus ? 4 : 0
    const taskIconWidth = node.taskStatus ? iconSize + iconGap : 0

    const remarkFontSize = fontSize * 0.7
    const remarkGap = node.remark ? 4 : 0
    const remarkWidth = node.remark ? remarkFontSize + remarkGap : 0

    const totalWidth = taskIconWidth + textContentWidth + remarkWidth

    return { layouts, textContentWidth, taskIconWidth, totalWidth }
  }, [node.text, node.taskStatus, node.remark, fontSize, fontWeight, fontFamily])

  const startX = -totalWidth / 2
  const textStartX = startX + taskIconWidth
  const iconSize = fontSize * 0.85
  const bgRectY = -fontSize / 2 - 2
  const bgRectH = fontSize + 4
  const remarkFontSize = fontSize * 0.7
  const remarkGap = 4

  return (
    <g>
      {/* Task status icon */}
      {node.taskStatus && (
        <g transform={`translate(${startX}, ${-iconSize / 2})`}>
          <TaskStatusSvgIcon status={node.taskStatus} size={iconSize} />
        </g>
      )}

      {/* Background rects for code/highlight tokens */}
      {layouts.map((layout, i) => {
        if (layout.token.type === 'code') {
          return <rect key={`bg-${i}`} x={textStartX + layout.x - 2} y={bgRectY} width={layout.width + 4} height={bgRectH} rx={3} fill="rgba(128,128,128,0.12)" />
        }
        if (layout.token.type === 'highlight') {
          return <rect key={`bg-${i}`} x={textStartX + layout.x - 1} y={bgRectY} width={layout.width + 2} height={bgRectH} rx={2} fill="rgba(255,213,79,0.3)" />
        }
        return null
      })}

      {/* Text element with tspan segments */}
      <text
        textAnchor="start"
        dominantBaseline="central"
        x={textStartX}
        fill={textColor}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={fontFamily}
      >
        {layouts.map((layout, i) => renderTokenTspan(layout, i))}
      </text>

      {/* Remark indicator */}
      {node.remark && (
        <text
          x={textStartX + textContentWidth + remarkGap}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={remarkFontSize}
          opacity={0.5}
          style={{ cursor: 'help' }}
          onMouseEnter={() => onRemarkHover?.(node.id)}
          onMouseLeave={() => onRemarkHover?.(null)}
        >
          <title>{node.remark}</title>
          💬
        </text>
      )}
    </g>
  )
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
  onMouseDown,
  onClick,
  onDoubleClick,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onAddChild,
  onRemarkHover,
}: MindMapNodeProps) {
  const nx = node.x + (offset?.x ?? 0)
  const ny = node.y + (offset?.y ?? 0)
  const showInput = isEditing || isPendingEdit
  const displayEditText = isPendingEdit && !isEditing ? '' : editText
  const newClass = isNew ? 'mindmap-node-new' : ''

  const taskPrefix = node.taskStatus === 'done' ? '[x] ' : node.taskStatus === 'doing' ? '[-] ' : node.taskStatus === 'todo' ? '[ ] ' : ''
  const rawEditText = taskPrefix + node.text

  if (node.depth === 0) {
    return (
      <g
        key={node.id}
        transform={`translate(${nx}, ${ny})`}
        className={`mindmap-node-g ${animClass} ${newClass}`}
        onMouseDown={(e) => onMouseDown(e, node.id)}
        onClick={(e) => onClick(e, node.id)}
        onDoubleClick={(e) => onDoubleClick(e, node.id, rawEditText)}
        style={{ cursor: 'pointer', opacity: isGhost ? 0.3 : 1 }}
      >
        <rect
          x={-node.width / 2}
          y={-node.height / 2}
          width={node.width}
          height={node.height}
          rx={node.height / 2}
          ry={node.height / 2}
          fill={theme.root.bgColor}
          stroke={isSelected ? theme.selection.strokeColor : 'none'}
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
                if (e.key === 'Enter') onEditCommit()
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
          />
        )}
        {/* + buttons based on direction */}
        {!readonlyProp && !isGhost && (direction === 'right' || direction === 'both') && (
          <g
            className="mindmap-add-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => onAddChild(e, node.id, 'right')}
          >
            <circle cx={node.width / 2 + 18} cy={0} r={11} fill={theme.addBtn.fill} />
            <line x1={node.width / 2 + 14} y1={0} x2={node.width / 2 + 22} y2={0} stroke={theme.addBtn.iconColor} strokeWidth={2} strokeLinecap="round" />
            <line x1={node.width / 2 + 18} y1={-4} x2={node.width / 2 + 18} y2={4} stroke={theme.addBtn.iconColor} strokeWidth={2} strokeLinecap="round" />
          </g>
        )}
        {!readonlyProp && !isGhost && (direction === 'left' || direction === 'both') && (
          <g
            className="mindmap-add-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => onAddChild(e, node.id, 'left')}
          >
            <circle cx={-(node.width / 2 + 18)} cy={0} r={11} fill={theme.addBtn.fill} />
            <line x1={-(node.width / 2 + 22)} y1={0} x2={-(node.width / 2 + 14)} y2={0} stroke={theme.addBtn.iconColor} strokeWidth={2} strokeLinecap="round" />
            <line x1={-(node.width / 2 + 18)} y1={-4} x2={-(node.width / 2 + 18)} y2={4} stroke={theme.addBtn.iconColor} strokeWidth={2} strokeLinecap="round" />
          </g>
        )}
      </g>
    )
  }

  // Child node rendering
  const fontSize = node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize
  const fontWeight = node.depth === 1 ? theme.level1.fontWeight : theme.node.fontWeight
  const textW = node.width - theme.node.paddingH * 2
  const underlineY = fontSize / 2 + 4
  const addBtnOffset = node.side === 'left' ? -node.width / 2 - 18 : node.width / 2 + 18

  return (
    <g
      key={node.id}
      transform={`translate(${nx}, ${ny})`}
      className={`mindmap-node-g ${animClass} ${newClass}`}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={(e) => onClick(e, node.id)}
      onDoubleClick={(e) => onDoubleClick(e, node.id, rawEditText)}
      style={{ cursor: 'pointer', opacity: isGhost ? 0.3 : 1 }}
    >
      {/* Invisible hit area */}
      <rect
        x={-node.width / 2}
        y={-node.height / 2}
        width={node.width}
        height={node.height}
        fill={isSelected ? theme.selection.fillColor : 'transparent'}
        stroke={isSelected ? theme.selection.strokeColor : 'none'}
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
              if (e.key === 'Enter') onEditCommit()
              if (e.key === 'Escape') onEditCancel()
            }}
            onBlur={onEditCommit}
            autoFocus
            style={{
              fontSize,
              fontWeight,
              fontFamily: theme.node.fontFamily,
              color: theme.node.textColor,
              textAlign: 'center',
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
          />
          <line
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
      {/* + button */}
      {!readonlyProp && !isGhost && (
        <g
          className="mindmap-add-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => onAddChild(e, node.id)}
        >
          <circle cx={addBtnOffset} cy={0} r={11} fill={theme.addBtn.fill} />
          <line x1={addBtnOffset - 4} y1={0} x2={addBtnOffset + 4} y2={0} stroke={theme.addBtn.iconColor} strokeWidth={2} strokeLinecap="round" />
          <line x1={addBtnOffset} y1={-4} x2={addBtnOffset} y2={4} stroke={theme.addBtn.iconColor} strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}
