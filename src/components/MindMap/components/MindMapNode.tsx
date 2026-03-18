import type { LayoutNode, LayoutDirection } from '../types'
import type { ThemeColors } from '../utils/theme'

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
}

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
}: MindMapNodeProps) {
  const nx = node.x + (offset?.x ?? 0)
  const ny = node.y + (offset?.y ?? 0)
  const showInput = isEditing || isPendingEdit
  const displayEditText = isPendingEdit && !isEditing ? '' : editText
  const newClass = isNew ? 'mindmap-node-new' : ''

  if (node.depth === 0) {
    return (
      <g
        key={node.id}
        transform={`translate(${nx}, ${ny})`}
        className={`mindmap-node-g ${animClass} ${newClass}`}
        onMouseDown={(e) => onMouseDown(e, node.id)}
        onClick={(e) => onClick(e, node.id)}
        onDoubleClick={(e) => onDoubleClick(e, node.id, node.text)}
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
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill={theme.root.textColor}
            fontSize={theme.root.fontSize}
            fontWeight={theme.root.fontWeight}
            fontFamily={theme.root.fontFamily}
          >
            {node.text}
          </text>
        )}
        {/* + buttons based on direction */}
        {!readonlyProp && !isGhost && (direction === 'right' || direction === 'both') && (
          <g
            className="mindmap-add-btn"
            onClick={(e) => onAddChild(e, node.id, 'right')}
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
        {!readonlyProp && !isGhost && (direction === 'left' || direction === 'both') && (
          <g
            className="mindmap-add-btn"
            onClick={(e) => onAddChild(e, node.id, 'left')}
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
      </g>
    )
  }

  // Child node rendering
  const fontSize =
    node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize
  const fontWeight =
    node.depth === 1 ? theme.level1.fontWeight : theme.node.fontWeight
  const textW = node.width - theme.node.paddingH * 2
  const underlineY = fontSize / 2 + 4
  const addBtnOffset =
    node.side === 'left' ? -node.width / 2 - 18 : node.width / 2 + 18

  return (
    <g
      key={node.id}
      transform={`translate(${nx}, ${ny})`}
      className={`mindmap-node-g ${animClass} ${newClass}`}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={(e) => onClick(e, node.id)}
      onDoubleClick={(e) => onDoubleClick(e, node.id, node.text)}
      style={{ cursor: 'pointer', opacity: isGhost ? 0.3 : 1 }}
    >
      {/* Invisible hit area */}
      <rect
        x={-node.width / 2}
        y={-node.height / 2}
        width={node.width}
        height={node.height}
        fill={
          isSelected ? theme.selection.fillColor : 'transparent'
        }
        stroke={isSelected ? theme.selection.strokeColor : 'none'}
        strokeWidth={isSelected ? 1.5 : 0}
        rx={4}
      />
      {showInput ? (
        <foreignObject
          x={-node.width / 2}
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
              borderBottom: `2.5px solid ${node.color}`,
            }}
          />
        </foreignObject>
      ) : (
        <>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill={theme.node.textColor}
            fontSize={fontSize}
            fontWeight={fontWeight}
            fontFamily={theme.node.fontFamily}
          >
            {node.text}
          </text>
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
          onClick={(e) => onAddChild(e, node.id)}
        >
          <circle
            cx={addBtnOffset}
            cy={0}
            r={11}
            fill={theme.addBtn.fill}
          />
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
    </g>
  )
}
