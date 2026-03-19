import type { MindMapPlugin } from './types'
import type { MindMapData } from '../types'
import { buildSvgTextLineString } from '../utils/inline-markdown'

export const multiLinePlugin: MindMapPlugin = {
  name: 'multi-line',

  collectFollowLines(lines, startIdx, node) {
    let consumed = 0
    const multiLines: string[] = []
    let j = startIdx
    while (j < lines.length) {
      const m = lines[j].match(/^(\s*)\|\s?(.*)$/)
      if (m) {
        multiLines.push(m[2])
        consumed++
        j++
      } else {
        break
      }
    }
    if (multiLines.length > 0) {
      ;(node as MindMapData).multiLineContent = multiLines
    }
    return consumed
  },

  serializeFollowLines(node, indent) {
    if (!node.multiLineContent || node.multiLineContent.length === 0) return []
    const prefix = indent === 0 ? '' : ''
    void prefix
    return node.multiLineContent.map(line => `| ${line}`)
  },

  adjustNodeSize(node, width, height, fontSize) {
    if (!node.multiLineContent || node.multiLineContent.length === 0) {
      return { width, height }
    }
    const lineHeight = fontSize * 1.4
    const extraHeight = node.multiLineContent.length * lineHeight
    return { width, height: height + extraHeight }
  },

  exportNodeDecoration(node, theme, plugins) {
    if (!node.multiLineContent || node.multiLineContent.length === 0) return ''

    const fontSize = node.depth === 0
      ? theme.root.fontSize
      : node.depth === 1 ? theme.level1.fontSize : theme.node.fontSize
    const fontFamily = node.depth === 0 ? theme.root.fontFamily : theme.node.fontFamily
    const textColor = node.depth === 0 ? theme.root.textColor : theme.node.textColor
    const mlFontSize = fontSize * 0.85
    const lineHeight = fontSize * 1.4
    const multiLineStartY = fontSize / 2 + 8

    const parts: string[] = []
    for (let i = 0; i < node.multiLineContent.length; i++) {
      const y = multiLineStartY + i * lineHeight
      parts.push(buildSvgTextLineString(
        node.multiLineContent[i], mlFontSize, 400, fontFamily, textColor, y,
        plugins, theme.highlight.textColor, theme.highlight.bgColor, 0.8,
      ))
    }
    return parts.join('')
  },
}
