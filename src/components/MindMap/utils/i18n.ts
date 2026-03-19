export interface MindMapMessages {
  // Node defaults
  newNode: string

  // Controls
  zoomIn: string
  zoomOut: string
  resetView: string
  layoutLeft: string
  layoutBoth: string
  layoutRight: string
  textMode: string
  viewMode: string
  fullscreen: string
  exitFullscreen: string

  // Context menu
  newRootNode: string
  export: string
  exportSVG: string
  exportPNG: string
  exportMarkdown: string
  layout: string

  // Shared
  close: string
}

const zhCN: MindMapMessages = {
  newNode: '新节点',

  zoomIn: '放大',
  zoomOut: '缩小',
  resetView: '重置视图',
  layoutLeft: '向左排版',
  layoutBoth: '左右排版',
  layoutRight: '向右排版',
  textMode: '文本模式',
  viewMode: '视图模式',
  fullscreen: '全屏',
  exitFullscreen: '退出全屏',

  newRootNode: '新建主节点',
  export: '导出',
  exportSVG: '导出为 SVG',
  exportPNG: '导出为 PNG',
  exportMarkdown: '导出为 Markdown',
  layout: '布局',

  close: '关闭',
}

const enUS: MindMapMessages = {
  newNode: 'New Node',

  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  resetView: 'Reset View',
  layoutLeft: 'Left Layout',
  layoutBoth: 'Both Layout',
  layoutRight: 'Right Layout',
  textMode: 'Text Mode',
  viewMode: 'View Mode',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit Fullscreen',

  newRootNode: 'New Root Node',
  export: 'Export',
  exportSVG: 'Export as SVG',
  exportPNG: 'Export as PNG',
  exportMarkdown: 'Export as Markdown',
  layout: 'Layout',

  close: 'Close',
}

const LOCALE_MAP: Record<string, MindMapMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export function detectLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US'
  const lang = navigator.language || ''
  if (LOCALE_MAP[lang]) return lang
  if (lang.startsWith('zh')) return 'zh-CN'
  const prefix = lang.split('-')[0]
  for (const key of Object.keys(LOCALE_MAP)) {
    if (key.startsWith(prefix)) return key
  }
  return 'en-US'
}

export function resolveMessages(
  locale: string = 'zh-CN',
  overrides?: Partial<MindMapMessages>,
): MindMapMessages {
  const base = LOCALE_MAP[locale] ?? zhCN
  return overrides ? { ...base, ...overrides } : base
}
