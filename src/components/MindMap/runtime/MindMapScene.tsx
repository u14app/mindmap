import type { MindMapRemoteImagePolicy } from '../core/url'
import type { ReactNode } from 'react'
import type { RenderMindMapToSvgOptions } from '../core/svg'
import type { MindMapLayout, MindMapLayoutNode, MindMapThemeTokens } from '../core/types'
import { tokenizeMindMapInline } from '../core/inline'
import { InlineContent } from './InlineContent'
import type { MindMapMessages } from './messages'
import { measureMindMapNodeContent } from '../core/layout'

export interface MindMapSceneProps {
  remoteImagePolicy?: MindMapRemoteImagePolicy
  layout: MindMapLayout
  theme: MindMapThemeTokens
  selectedNodeId?: string | null
  selectable?: boolean
  matchingNodeIds?: ReadonlySet<string> | null
  messages?: MindMapMessages
  onNodeSelect?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
  onFoldToggle?: (nodeId: string) => void
  renderMath?: RenderMindMapToSvgOptions['renderMath']
  renderNodeOverlay?: (node: MindMapLayoutNode) => ReactNode
}

function taskGlyph(node: MindMapLayoutNode): string | null {
  const status = (node.attributes?.task as { status?: string } | undefined)?.status
  if (status === 'done') return '✓'
  if (status === 'doing') return '■'
  if (status === 'todo') return ''
  return null
}

function MindMapNodeContent({ node, theme, renderMath, remoteImagePolicy }: { remoteImagePolicy?: MindMapRemoteImagePolicy; node: MindMapLayoutNode; theme: MindMapThemeTokens; renderMath?: RenderMindMapToSvgOptions['renderMath'] }) {
  const root = node.depth === 0
  const metrics = measureMindMapNodeContent(node, node.depth, theme, remoteImagePolicy)
  const fontSize = metrics.fontSize
  const fontWeight = root ? 600 : node.depth === 1 ? 500 : 400
  const paddingX = root ? theme.rootPaddingX : theme.nodePaddingX
  const task = taskGlyph(node)
  const taskWidth = task !== null ? fontSize * 0.9 + 4 : 0
  const taskSize = fontSize * 0.85
  const tagHeight = metrics.tagFontSize + 6
  const firstY = metrics.labelY
  const formatted = tokenizeMindMapInline(node.text).some((token) => token.type !== 'text')
  return (
    <g className="mm-node-content" pointerEvents="none">
      {task !== null && (
        <g transform={`translate(${-node.width / 2 + paddingX}, ${firstY - taskSize / 2})`} className={`mm-task mm-task--${(node.attributes?.task as { status?: string }).status}`}>
          <rect width={taskSize} height={taskSize} rx={taskSize * 0.2} />
          {task && <text x={taskSize / 2} y={taskSize / 2} textAnchor="middle" dominantBaseline="central">{task}</text>}
        </g>
      )}
      {!formatted && <text
        className="mm-node-label"
        x={taskWidth / 2}
        y={firstY}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={theme.fontFamily}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={root ? theme.rootText : theme.text}
      >
        {node.text || 'Untitled'}
      </text>}
      {formatted && <foreignObject x={-node.width / 2 + paddingX + taskWidth} y={metrics.labelTop} width={Math.max(1, node.width - paddingX * 2 - taskWidth)} height={metrics.labelHeight} pointerEvents="auto">
        <div className="mm-inline-content" style={{ color: root ? theme.rootText : theme.text, fontFamily: theme.fontFamily, fontSize, fontWeight }}><InlineContent text={node.text} math={Boolean(node.attributes?.latex)} images={false} renderMath={renderMath} remoteImagePolicy={remoteImagePolicy} /></div>
      </foreignObject>}
      {metrics.multiline.map((line, index) => tokenizeMindMapInline(line.text).some((token) => token.type !== 'text') ? (
        <foreignObject className="mm-node-detail" key={`${node.id}-line-${index}`} x={-node.width / 2 + paddingX} y={line.top} width={Math.max(1, node.width - paddingX * 2)} height={line.height} pointerEvents="auto"><div className="mm-inline-content" style={{ color: root ? theme.rootText : theme.text, fontFamily: theme.fontFamily, fontSize: line.fontSize, fontWeight: 400 }}><InlineContent text={line.text} math={Boolean(node.attributes?.latex)} images={false} renderMath={renderMath} remoteImagePolicy={remoteImagePolicy} /></div></foreignObject>
      ) : (
        <text
          key={`${node.id}-line-${index}`}
          className="mm-node-detail"
          x="0"
          y={line.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={theme.fontFamily}
          fontSize={line.fontSize}
          fontWeight={400}
          fill={root ? theme.rootText : theme.text}
        >{line.text}</text>
      ))}
      {metrics.images.map((image, index) => <image key={`${node.id}-image-${index}`} href={image.url} crossOrigin="anonymous" {...{ referrerPolicy: "no-referrer" }} x={image.x} y={image.y} width={image.width} height={image.height} preserveAspectRatio="xMidYMid meet" aria-label={image.alt}><title>{image.alt}</title></image>)}
      {metrics.tags.length > 0 && (
        <g className="mm-node-tags" transform={`translate(0 ${(metrics.tagY ?? 0) - tagHeight / 2})`}>
          {metrics.tags.map((tag, index) => (
            <g key={index} transform={`translate(${tag.x} 0)`}>
              <rect width={tag.width} height={tagHeight} rx="3" fill={tag.color} opacity=".15" />
              <text x={tag.width / 2} y={tagHeight / 2} textAnchor="middle" dominantBaseline="central" fontFamily={theme.fontFamily} fontSize={metrics.tagFontSize} fill={tag.color}>{tag.text}</text>
            </g>
          ))}
        </g>
      )}
    </g>
  )
}

export function MindMapScene({
  layout,
  theme,
  selectedNodeId,
  selectable = false,
  matchingNodeIds,
  messages,
  onNodeSelect,
  onNodeDoubleClick,
  onFoldToggle,
  renderNodeOverlay,
  renderMath,
  remoteImagePolicy,
}: MindMapSceneProps) {
  return (
    <g className="mm-scene">
      <g className="mm-edges" aria-hidden="true">
        {layout.edges.map((edge) => (
          <path
            key={edge.id}
            className="mm-edge"
            d={edge.path}
            fill="none"
            stroke={edge.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={edge.dotted ? '6 4' : undefined}
          />
        ))}
        {layout.edges.filter((edge) => edge.label).map((edge) => {
          const from = layout.nodeById.get(edge.fromId), to = layout.nodeById.get(edge.toId)
          return from && to ? <text key={`${edge.id}-label`} x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} textAnchor="middle" fill={edge.color} fontSize={11} fontFamily={theme.fontFamily} opacity=".8">{edge.label}</text> : null
        })}
      </g>
      <g className="mm-nodes">
        {layout.nodes.map((node) => {
          const root = node.depth === 0
          const selected = selectedNodeId === node.id
          const collapsed = node.childCount > 0 && !(layout.childrenByParent.get(node.id)?.length)
          const foldX = node.side === 'left' ? -node.width / 2 - 13 : node.width / 2 + 13
          return (
            <g
              key={node.id}
              className={`mm-node mm-node--${root ? 'root' : 'child'}${selected ? ' is-selected' : ''}${matchingNodeIds && !matchingNodeIds.has(node.id) ? ' is-dimmed' : ''}`}
              transform={`translate(${node.x} ${node.y})`}
              data-mm-node={node.id}
              role={selectable ? 'treeitem' : undefined}
              aria-label={node.text || 'Untitled'}
              aria-level={node.depth + 1}
              aria-selected={selected || undefined}
              aria-expanded={node.childCount > 0 ? !collapsed : undefined}
              tabIndex={selectable ? selected || (!selectedNodeId && node === layout.nodes[0]) ? 0 : -1 : undefined}
              onFocus={() => { if (selectable) onNodeSelect?.(node.id) }}
              onClick={(event) => {
                event.stopPropagation()
                const alreadyFocused = document.activeElement === event.currentTarget
                event.currentTarget.focus()
                // Focus owns initial selection; click handles an already focused node
                // or an environment that cannot focus SVG elements.
                if (selectable && (alreadyFocused || document.activeElement !== event.currentTarget)) onNodeSelect?.(node.id)
              }}
              onDoubleClick={(event) => {
                event.stopPropagation()
                onNodeDoubleClick?.(node.id)
              }}
            >
              {root ? (
                <rect className="mm-node-shape" x={-node.width / 2} y={-node.height / 2} width={node.width} height={node.height} rx={node.height / 2} fill={node.color} />
              ) : (
                <>
                  <rect className="mm-node-shape" x={-node.width / 2} y={-node.height / 2} width={node.width} height={node.height} rx="4" fill={selected ? theme.selection : 'transparent'} fillOpacity={selected ? .08 : 0} stroke={selected ? theme.selection : 'none'} strokeOpacity={selected ? 1 : 0} strokeWidth={selected ? 1.5 : 0} />
                  <line className="mm-node-accent" x1={-node.width / 2 + theme.nodePaddingX} y1={node.height / 2 - theme.nodePaddingY + 4} x2={node.width / 2 - theme.nodePaddingX} y2={node.height / 2 - theme.nodePaddingY + 4} stroke={node.color} strokeWidth="2.5" strokeLinecap="round" />
                </>
              )}
              {selected && root && <rect className="mm-node-selection" x={-node.width / 2} y={-node.height / 2} width={node.width} height={node.height} rx={node.height / 2} fill="none" stroke={theme.selection} strokeWidth="2.5" />}
              <MindMapNodeContent node={node} theme={theme} renderMath={renderMath} remoteImagePolicy={remoteImagePolicy} />
              {node.attributes?.remark && <title>{(node.attributes.remark as { text: string }).text}</title>}
              {node.childCount > 0 && onFoldToggle && (
                <g
                  className="mm-fold-control"
                  transform={`translate(${foldX} 0)`}
                  role="button"
                  tabIndex={-1}
                  aria-label={collapsed ? messages?.expandNode ?? 'Expand node' : messages?.collapseNode ?? 'Collapse node'}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onFoldToggle(node.id) } }}
                  onClick={(event) => { event.stopPropagation(); onFoldToggle(node.id) }}
                >
                  <circle className="mm-hit-target" r="16" fill="transparent" />
                  <circle r="7" fill={theme.background} stroke={node.color} strokeWidth="1.5" />
                  <path d={collapsed ? 'M-3 0H3M0-3V3' : 'M-3 0H3'} stroke={node.color} strokeWidth="1.4" strokeLinecap="round" />
                </g>
              )}
              {renderNodeOverlay?.(node)}
            </g>
          )
        })}
      </g>
    </g>
  )
}
