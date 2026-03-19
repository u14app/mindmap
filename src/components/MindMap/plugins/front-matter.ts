import type { MindMapPlugin } from './types'

export const frontMatterPlugin: MindMapPlugin = {
  name: 'front-matter',

  preParseMarkdown(md, ctx) {
    const match = md.match(/^---\n([\s\S]*?)\n---\n?/)
    if (!match) return md

    const body = match[1]
    for (const line of body.split('\n')) {
      const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+)/)
      if (kv) {
        ctx.frontMatter[kv[1].trim()] = kv[2].trim()
      }
    }
    return md.slice(match[0].length)
  },

  serializePreamble(roots) {
    // Check if any root has frontmatter metadata stored
    // For now, we don't persist frontmatter on the data model
    // so this is a no-op. FrontMatter is applied on parse only.
    void roots
    return ''
  },
}
