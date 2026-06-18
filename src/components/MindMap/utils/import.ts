import type { MindMapData } from '../types'
import type { ParsedMindMapInput } from './input'
import type { MindMapPlugin } from '../plugins/types'
import { normalizeData } from './tree-ops'
import { parseMindMapMarkdownInput } from './input'

export type MindMapImportSource = 'markdown' | 'json'
export type MindMapImportOptions = Pick<ParsedMindMapInput, 'direction' | 'theme'>

export type MindMapImportResult =
  | ({ ok: true; source: MindMapImportSource; data: MindMapData[] } & MindMapImportOptions)
  | { ok: false; reason: 'empty' | 'invalid-json' | 'invalid-data' }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isMindMapData(value: unknown): value is MindMapData {
  if (!isObject(value)) return false
  if (typeof value.id !== 'string' || typeof value.text !== 'string') {
    return false
  }
  if ('children' in value && value.children !== undefined) {
    if (!Array.isArray(value.children)) return false
    if (!value.children.every(isMindMapData)) return false
  }
  return true
}

export function validateMindMapData(value: unknown): MindMapData[] | null {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every(isMindMapData)
      ? value
      : null
  }
  return isMindMapData(value) ? normalizeData(value) : null
}

export function parseImportText(
  input: string,
  source: MindMapImportSource | 'auto',
  plugins?: MindMapPlugin[],
): MindMapImportResult {
  const text = input.trim()
  if (!text) return { ok: false, reason: 'empty' }

  const shouldParseJSON =
    source === 'json' ||
    (source === 'auto' && (text.startsWith('{') || text.startsWith('[')))

  if (shouldParseJSON) {
    try {
      const parsed = JSON.parse(text) as unknown
      const data = validateMindMapData(parsed)
      if (!data) return { ok: false, reason: 'invalid-data' }
      return { ok: true, source: 'json', data }
    } catch {
      return { ok: false, reason: 'invalid-json' }
    }
  }

  const parsed = parseMindMapMarkdownInput(text, plugins)
  return {
    ok: true,
    source: 'markdown',
    data: parsed.roots,
    direction: parsed.direction,
    theme: parsed.theme,
  }
}
