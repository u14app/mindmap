import type { LayoutDirection, MindMapData, ThemeMode } from '../types'
import type { MindMapPlugin } from '../plugins/types'
import { parseMarkdownMultiRoot, parseMarkdownWithFrontMatter } from './markdown'

export interface ParsedMindMapInput {
  roots: MindMapData[]
  direction?: LayoutDirection
  theme?: ThemeMode
}

function parseDirection(value: unknown): LayoutDirection | undefined {
  return value === 'left' || value === 'right' || value === 'both'
    ? value
    : undefined
}

function parseTheme(value: unknown): ThemeMode | undefined {
  return value === 'light' || value === 'dark' || value === 'auto'
    ? value
    : undefined
}

export function parseMindMapMarkdownInput(
  markdown: string,
  plugins?: MindMapPlugin[],
): ParsedMindMapInput {
  if (plugins) {
    const { roots, frontMatter } = parseMarkdownWithFrontMatter(markdown, plugins)
    return {
      roots,
      direction: parseDirection(frontMatter.direction),
      theme: parseTheme(frontMatter.theme),
    }
  }

  return {
    roots: parseMarkdownMultiRoot(markdown),
  }
}

export function parseInitialMindMapInput(
  data: MindMapData | MindMapData[] | undefined,
  markdown: string | undefined,
  plugins?: MindMapPlugin[],
): ParsedMindMapInput | null {
  if (data) return null
  if (markdown === undefined) return null
  return parseMindMapMarkdownInput(markdown, plugins)
}
