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

  // Context menu
  newRootNode: string
  export: string
  exportSVG: string
  exportPNG: string
  exportMarkdown: string
  import: string
  layout: string

  // Import dialog
  importTitle: string
  importPlaceholder: string
  importConfirm: string
  importCancel: string

  // Shared
  close: string

  // Shortcuts dialog
  shortcuts: string
  shortcutsTitle: string

  // Help dialog
  help: string
  helpTitle: string
  helpDescription: string
  helpOpenSource: string
  helpShortcut: string
  helpAction: string
  helpCreateChild: string
  helpDeleteNode: string
  helpEditNode: string
  helpCopySubtree: string
  helpCutSubtree: string
  helpPasteSubtree: string
  helpCloseMenu: string
  helpZoomInOut: string
  helpPan: string
  helpReorderSiblings: string
  helpContextMenu: string
  helpShortcutZoomIn: string
  helpShortcutZoomOut: string
  helpShortcutResetView: string
  helpShortcutLayoutLeft: string
  helpShortcutLayoutRight: string
  helpShortcutLayoutBoth: string
}

const zhCN: MindMapMessages = {
  newNode: '新节点',

  zoomIn: '放大',
  zoomOut: '缩小',
  resetView: '重置视图',
  layoutLeft: '向左排版',
  layoutBoth: '左右排版',
  layoutRight: '向右排版',

  newRootNode: '新建主节点',
  export: '导出',
  exportSVG: '导出为 SVG',
  exportPNG: '导出为 PNG',
  exportMarkdown: '导出为 Markdown',
  import: '导入',
  layout: '布局',

  importTitle: '导入数据',
  importPlaceholder: '粘贴 JSON 数据或 Markdown 列表...',
  importConfirm: '确认',
  importCancel: '取消',

  close: '关闭',

  shortcuts: '快捷键',
  shortcutsTitle: '键盘快捷键',

  help: '帮助',
  helpTitle: 'Open MindMap',
  helpDescription: '一个美观、交互式的 React 思维导图组件。原生支持 AI stream 输出，采用类似 Markdown list 的语法，拥有 iOS 风格的 UI 设计。零依赖，纯 SVG 渲染，支持暗色模式。',
  helpOpenSource: '开源地址',
  helpShortcut: '快捷键',
  helpAction: '操作',
  helpCreateChild: '创建子节点',
  helpDeleteNode: '删除选中节点',
  helpEditNode: '编辑节点文本',
  helpCopySubtree: '复制子树',
  helpCutSubtree: '剪切子树',
  helpPasteSubtree: '粘贴子树',
  helpCloseMenu: '关闭菜单',
  helpZoomInOut: '缩放',
  helpPan: '平移画布',
  helpReorderSiblings: '拖动排序',
  helpContextMenu: '右键菜单',
  helpShortcutZoomIn: '放大',
  helpShortcutZoomOut: '缩小',
  helpShortcutResetView: '重置视图',
  helpShortcutLayoutLeft: '向左排版',
  helpShortcutLayoutRight: '向右排版',
  helpShortcutLayoutBoth: '左右排版',
}

const enUS: MindMapMessages = {
  newNode: 'New Node',

  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  resetView: 'Reset View',
  layoutLeft: 'Left Layout',
  layoutBoth: 'Both Layout',
  layoutRight: 'Right Layout',

  newRootNode: 'New Root Node',
  export: 'Export',
  exportSVG: 'Export as SVG',
  exportPNG: 'Export as PNG',
  exportMarkdown: 'Export as Markdown',
  import: 'Import',
  layout: 'Layout',

  importTitle: 'Import Data',
  importPlaceholder: 'Paste JSON data or Markdown list...',
  importConfirm: 'Confirm',
  importCancel: 'Cancel',

  close: 'Close',

  shortcuts: 'Shortcuts',
  shortcutsTitle: 'Keyboard Shortcuts',

  help: 'Help',
  helpTitle: 'Open MindMap',
  helpDescription: 'A beautiful, interactive mind map component for React. Natively supports AI stream output with Markdown list syntax and iOS-style UI. Zero dependencies, pure SVG rendering, dark mode ready.',
  helpOpenSource: 'Open Source',
  helpShortcut: 'Shortcut',
  helpAction: 'Action',
  helpCreateChild: 'Create child node',
  helpDeleteNode: 'Delete selected node',
  helpEditNode: 'Edit node text',
  helpCopySubtree: 'Copy subtree',
  helpCutSubtree: 'Cut subtree',
  helpPasteSubtree: 'Paste subtree',
  helpCloseMenu: 'Close menu',
  helpZoomInOut: 'Zoom in / out',
  helpPan: 'Pan canvas',
  helpReorderSiblings: 'Reorder siblings',
  helpContextMenu: 'Context menu',
  helpShortcutZoomIn: 'Zoom in',
  helpShortcutZoomOut: 'Zoom out',
  helpShortcutResetView: 'Reset view',
  helpShortcutLayoutLeft: 'Left layout',
  helpShortcutLayoutRight: 'Right layout',
  helpShortcutLayoutBoth: 'Both layout',
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
