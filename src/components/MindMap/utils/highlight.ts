// ================================================================
//  Mindmap syntax highlighter — outputs HTML strings for contentEditable
//  Ported from DocsPage.tsx highlightMindmap/highlightMindmapInline
// ================================================================

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function span(cls: string, text: string): string {
  return `<span class="${cls}">${esc(text)}</span>`
}

function highlightInline(text: string): string {
  const re =
    /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|==[^=]+==#[a-zA-Z][\w-]*|\$\$[^$]+\$\$|\$[^$\n]+\$|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|->\.?\s*\{#[\w-]+\}(?:\s*"[^"]*")?\{#[\w-]+\}|\*(?!\*)[^*]+\*(?!\*))/g
  let html = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      html += esc(text.slice(last, m.index))
    }
    const t = m[0]
    if (t.startsWith('**')) {
      html += `<span class="hl-root">${esc(t)}</span>`
    } else if (t.startsWith('~~')) {
      html += `<span class="hl-cmt" style="text-decoration:line-through">${esc(t)}</span>`
    } else if (t.startsWith('`')) {
      html += span('hl-tag', t)
    } else if (t.startsWith('==')) {
      html += span('hl-num', t)
    } else if (t.startsWith('$$') || (t.startsWith('$') && !t.startsWith('${'))) {
      html += span('hl-num', t)
    } else if (t.startsWith('![')) {
      html += span('hl-fn', t)
    } else if (t.startsWith('[')) {
      html += span('hl-fn', t)
    } else if (t.startsWith('->')) {
      html += span('hl-fn', t)
    } else if (t.startsWith('{#')) {
      html += span('hl-attr', t)
    } else if (t.startsWith('#')) {
      html += span('hl-kw', t)
    } else if (t.startsWith('*')) {
      html += `<span class="hl-italic" style="font-style:italic">${esc(t)}</span>`
    }
    last = re.lastIndex
  }
  if (last < text.length) {
    html += esc(text.slice(last))
  }
  return html
}

/**
 * Highlight mindmap markdown source into an HTML string.
 * Each line becomes a `<div>` so that contentEditable preserves line structure.
 */
export function highlightMindmapHTML(code: string): string {
  const lines = code.split('\n')
  let inFrontmatter = false

  return lines
    .map((line) => {
      // Truly empty line — BR keeps it cursor-selectable
      if (line.length === 0) return '<div><br></div>'
      // Whitespace-only line — preserve spaces (no syntax class)
      if (!line.trim()) return `<div>${esc(line)}</div>`

      // Frontmatter delimiter
      if (line.trim() === '---') {
        inFrontmatter = !inFrontmatter
        return `<div>${span('hl-op', line)}</div>`
      }

      // Inside frontmatter: key: value
      if (inFrontmatter) {
        const fm = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.*)/)
        if (fm) {
          return `<div>${esc(fm[1])}${span('hl-attr', fm[2])}${span('hl-op', fm[3])}${span('hl-str', fm[4])}</div>`
        }
        return `<div>${esc(line)}</div>`
      }

      // Remark lines (> ...)
      const remarkMatch = line.match(/^(\s*)(>.*)/)
      if (remarkMatch) {
        return `<div>${esc(remarkMatch[1])}${span('hl-cmt', remarkMatch[2])}</div>`
      }

      // Multi-line content (| ...)
      const pipeMatch = line.match(/^(\s*)(\|)(.*)/)
      if (pipeMatch) {
        return `<div>${esc(pipeMatch[1])}${span('hl-op', pipeMatch[2])}${highlightInline(pipeMatch[3])}</div>`
      }

      // Lines with list markers (- / + / -.)
      const listMatch = line.match(/^(\s*)([-+]\.?\s)(.*)/)
      if (listMatch) {
        const [, indent, marker, text] = listMatch
        let html = `${esc(indent)}${span('hl-op', marker)}`

        // Task markers
        const taskMatch = text.match(/^\[([ x-])\]\s*/)
        if (taskMatch) {
          const status = taskMatch[1]
          const cls = status === 'x' ? 'hl-str' : status === '-' ? 'hl-num' : 'hl-task-pending'
          html += `${span(cls, `[${status}] `)}`
          html += highlightInline(text.slice(taskMatch[0].length))
        } else {
          html += highlightInline(text)
        }

        return `<div>${html}</div>`
      }

      // Root node (no indent, no marker)
      return `<div><span class="hl-root">${esc(line)}</span></div>`
    })
    .join('')
}
