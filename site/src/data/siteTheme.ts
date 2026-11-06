import type { MindMapThemeTokens } from '@xiangfa/mindmap/core'
import { DEFAULT_THEME } from '@xiangfa/mindmap/core'

// Use literal colors: editor export embeds these values in standalone SVG/PNG.
// CSS variables would depend on the website stylesheet after downloading.
export const SITE_MAP_THEMES: Record<'light' | 'dark', Partial<MindMapThemeTokens>> = {
  light: {
    ...DEFAULT_THEME,
  },
  dark: {
    ...DEFAULT_THEME,
    background: '#1a1a2e', text: '#E0E0E0', mutedText: '#ccc',
    rootFill: '#4A6FA5', rootText: '#FFFFFF', selection: '#5B9BD5',
  },
}
