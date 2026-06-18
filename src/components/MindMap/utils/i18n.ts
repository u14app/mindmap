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

  // Node context menu
  addChild: string
  editNode: string
  deleteNode: string
  copy: string
  cut: string
  paste: string

  // Import
  import: string
  importAuto: string
  importMarkdown: string
  importJSON: string
  importPlaceholder: string
  importConfirm: string
  importInvalidJSON: string
  importInvalidData: string
  importEmpty: string

  // History / search / tags
  undo: string
  redo: string
  search: string
  searchPlaceholder: string
  searchPrevious: string
  searchNext: string
  searchNoResults: string
  tagFilter: string
  clearFilters: string

  // AI
  aiPlaceholder: string
  aiGenerating: string
  aiError: string
  aiFileTooLarge: string
  aiUnsupportedFile: string

  // Shared
  close: string
  cancel: string
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

  addChild: '添加子节点',
  editNode: '编辑',
  deleteNode: '删除',
  copy: '复制',
  cut: '剪切',
  paste: '粘贴',

  import: '导入',
  importAuto: '自动',
  importMarkdown: 'Markdown',
  importJSON: 'JSON',
  importPlaceholder: '粘贴 Markdown 大纲或 MindMapData JSON...',
  importConfirm: '导入',
  importInvalidJSON: 'JSON 格式无效',
  importInvalidData: '数据必须是 MindMapData 或 MindMapData[]',
  importEmpty: '请输入要导入的内容',

  undo: '撤销',
  redo: '重做',
  search: '搜索',
  searchPlaceholder: '搜索节点...',
  searchPrevious: '上一个匹配',
  searchNext: '下一个匹配',
  searchNoResults: '无匹配结果',
  tagFilter: '标签筛选',
  clearFilters: '清除筛选',

  aiPlaceholder: '让 AI 生成思维导图...',
  aiGenerating: '生成中...',
  aiError: '生成失败',
  aiFileTooLarge: '文件过大',
  aiUnsupportedFile: '不支持的文件类型',

  close: '关闭',
  cancel: '取消',
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

  addChild: 'Add Child',
  editNode: 'Edit',
  deleteNode: 'Delete',
  copy: 'Copy',
  cut: 'Cut',
  paste: 'Paste',

  import: 'Import',
  importAuto: 'Auto',
  importMarkdown: 'Markdown',
  importJSON: 'JSON',
  importPlaceholder: 'Paste a Markdown outline or MindMapData JSON...',
  importConfirm: 'Import',
  importInvalidJSON: 'Invalid JSON',
  importInvalidData: 'Data must be MindMapData or MindMapData[]',
  importEmpty: 'Enter content to import',

  undo: 'Undo',
  redo: 'Redo',
  search: 'Search',
  searchPlaceholder: 'Search nodes...',
  searchPrevious: 'Previous match',
  searchNext: 'Next match',
  searchNoResults: 'No matches',
  tagFilter: 'Filter tags',
  clearFilters: 'Clear filters',

  aiPlaceholder: 'Ask AI to generate a mind map...',
  aiGenerating: 'Generating...',
  aiError: 'Generation failed',
  aiFileTooLarge: 'File is too large',
  aiUnsupportedFile: 'Unsupported file type',

  close: 'Close',
  cancel: 'Cancel',
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
