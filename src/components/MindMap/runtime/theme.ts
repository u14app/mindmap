import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { DEFAULT_THEME } from '../core/layout'
import type { MindMapThemeMode, MindMapThemeTokens } from '../core/types'

export const LIGHT_RUNTIME_THEME: MindMapThemeTokens = { ...DEFAULT_THEME }
export const DARK_RUNTIME_THEME: MindMapThemeTokens = {
  ...DEFAULT_THEME,
  background: '#1a1a2e',
  text: '#E0E0E0',
  mutedText: '#ccc',
  rootFill: '#4A6FA5',
  rootText: '#FFFFFF',
  selection: '#5B9BD5',
}

export function initialRuntimeTheme(mode: MindMapThemeMode | undefined, input: { document?: { theme?: MindMapThemeMode }; markdown?: string; defaultMarkdown?: string; controller?: { getSnapshot(): { document: { theme?: MindMapThemeMode } } } }, override?: Partial<MindMapThemeTokens>): MindMapThemeTokens {
  const source = input.markdown ?? input.defaultMarkdown ?? ''
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1]
  const sourceTheme = /^theme:\s*(dark|light|auto)\s*$/m.exec(frontmatter ?? '')?.[1]
  const resolved = mode ?? input.document?.theme ?? input.controller?.getSnapshot().document.theme ?? sourceTheme
  // Auto starts with a deterministic light projection on both server and client.
  return { ...(resolved === 'dark' ? DARK_RUNTIME_THEME : LIGHT_RUNTIME_THEME), ...override }
}

export function useRuntimeTheme(mode: MindMapThemeMode = 'auto', override?: Partial<MindMapThemeTokens>): MindMapThemeTokens {
  const [systemDark, setSystemDark] = useState(false)
  useEffect(() => {
    if (mode !== 'auto' || typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const change = () => setSystemDark(query.matches)
    change()
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [mode])
  return useMemo(() => ({ ...(mode === 'dark' || (mode === 'auto' && systemDark) ? DARK_RUNTIME_THEME : LIGHT_RUNTIME_THEME), ...(override ?? {}) }), [mode, systemDark, override])
}

export function themeVariables(theme: MindMapThemeTokens): CSSProperties {
  return {
    '--mm-background': theme.background,
    '--mm-text': theme.text,
    '--mm-muted': theme.mutedText,
    '--mm-root': theme.rootFill,
    '--mm-selection': theme.selection,
    '--mm-font': theme.fontFamily,
  } as CSSProperties
}
